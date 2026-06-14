// ============================================================
// SAMARTH PROPERTIES — Enquiries Controller
// File: backend/src/controllers/enquiries.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { notifyEnquiry } = require('../utils/email');
const { DEFAULT_PAGE_SIZE } = require('../config/constants');

// ── POST /api/public/enquiries ────────────────────────────────
async function submitEnquiry(req, res) {
    try {
        const {
            name, phone, email, city, project_id, project_name,
            interested_in, message, source, utm_source, utm_medium, utm_campaign
        } = req.body;

        const { data, error } = await supabase
            .from('enquiries')
            .insert({
                name: name.trim(),
                phone: phone.trim(),
                email: email?.trim().toLowerCase() || null,
                city: city?.trim() || null,
                project_id: project_id || null,
                project_name: project_name?.trim() || null,
                interested_in: interested_in?.trim() || null,
                message: message?.trim() || null,
                source: source || 'contact-form',
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null,
            })
            .select('id')
            .single();

        if (error) throw error;

        // Notify admin asynchronously
        notifyEnquiry({ name, phone, email, city, project_name, message, source }).catch(() => {});

        sendSuccess(res, { id: data.id }, 'Thank you for your enquiry. Our team will contact you within 24 hours.', 201);
    } catch (err) {
        console.error('[Submit Enquiry Error]', err);
        sendError(res, 'Failed to submit enquiry', 500);
    }
}

// ── POST /api/public/brochure-download ───────────────────────
async function brochureDownload(req, res) {
    try {
        const { name, phone, email, project_id, project_name } = req.body;

        const { data, error } = await supabase
            .from('brochure_downloads')
            .insert({
                name: name.trim(),
                phone: phone.trim(),
                email: email?.trim().toLowerCase() || null,
                project_id: project_id || null,
                project_name: project_name?.trim() || null,
                ip_address: req.ip,
            })
            .select('id')
            .single();

        if (error) throw error;

        // Get brochure URL if project_id provided
        let brochureUrl = null;
        if (project_id) {
            const { data: project } = await supabase
                .from('projects')
                .select('brochure_url')
                .eq('id', project_id)
                .single();
            brochureUrl = project?.brochure_url || null;
        }

        const { notifyBrochureLead } = require('../utils/email');
        notifyBrochureLead({ name, phone, email, project_name }).catch(() => {});

        sendSuccess(res, { id: data.id, brochureUrl }, 'Thank you! Your brochure download link is ready.', 201);
    } catch (err) {
        console.error('[Brochure Download Error]', err);
        sendError(res, 'Failed to process request', 500);
    }
}

// ── GET /api/admin/enquiries ──────────────────────────────────
async function listEnquiries(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { status, source, search } = req.query;

        let query = supabase
            .from('enquiries')
            .select('*, projects(name, slug)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);
        if (source) query = query.eq('source', source);
        if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Enquiries fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[List Enquiries Error]', err);
        sendError(res, 'Failed to fetch enquiries', 500);
    }
}

// ── GET /api/admin/enquiries/:id ─────────────────────────────
async function getEnquiry(req, res) {
    try {
        const { data, error } = await supabase
            .from('enquiries')
            .select('*, projects(name, slug)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return sendError(res, 'Enquiry not found', 404);

        // Auto mark as read when fetched individually
        if (!data.is_read) {
            await supabase.from('enquiries').update({ is_read: true }).eq('id', req.params.id);
            data.is_read = true;
        }

        sendSuccess(res, data, 'Enquiry fetched');
    } catch (err) {
        console.error('[Get Enquiry Error]', err);
        sendError(res, 'Failed to fetch enquiry', 500);
    }
}

// ── PATCH /api/admin/enquiries/:id ───────────────────────────
async function updateEnquiry(req, res) {
    try {
        const { id } = req.params;
        const { status, admin_notes, is_read } = req.body;

        const updateData = { handled_by: req.admin.id };
        if (status !== undefined) updateData.status = status;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
        if (is_read !== undefined) updateData.is_read = is_read;

        const { data, error } = await supabase
            .from('enquiries')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) return sendError(res, 'Enquiry not found', 404);

        sendSuccess(res, data, 'Enquiry updated');
    } catch (err) {
        console.error('[Update Enquiry Error]', err);
        sendError(res, 'Failed to update enquiry', 500);
    }
}

// ── PATCH /api/admin/enquiries/mark-read ─────────────────────
async function markAllRead(req, res) {
    try {
        const { error } = await supabase
            .from('enquiries')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) throw error;

        sendSuccess(res, null, 'All enquiries marked as read');
    } catch (err) {
        console.error('[Enquiry Mark Read Error]', err);
        sendError(res, 'Failed to mark enquiries as read', 500);
    }
}

// ── DELETE /api/admin/enquiries/:id ──────────────────────────
async function deleteEnquiry(req, res) {
    try {
        const { error } = await supabase.from('enquiries').delete().eq('id', req.params.id);
        if (error) throw error;
        sendSuccess(res, null, 'Enquiry deleted');
    } catch (err) {
        console.error('[Delete Enquiry Error]', err);
        sendError(res, 'Failed to delete enquiry', 500);
    }
}

module.exports = {
    submitEnquiry,
    brochureDownload,
    listEnquiries,
    getEnquiry,
    updateEnquiry,
    markAllRead,
    deleteEnquiry,
};
