// ============================================================
// SAMARTH PROPERTIES — Appointments Controller
// File: backend/src/controllers/appointments.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { notifyAppointment } = require('../utils/email');
const { DEFAULT_PAGE_SIZE } = require('../config/constants');

// ── POST /api/public/appointments ─────────────────────────────
async function bookAppointment(req, res) {
    try {
        const { name, phone, email, city, project_id, project_name, preferred_date, preferred_time, message } = req.body;

        // Prevent past date bookings
        const today = new Date().toISOString().split('T')[0];
        if (preferred_date < today) {
            return sendError(res, 'Preferred date cannot be in the past', 400);
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                name: name.trim(),
                phone: phone.trim(),
                email: email?.trim().toLowerCase() || null,
                city: city?.trim() || null,
                project_id: project_id || null,
                project_name: project_name?.trim() || null,
                preferred_date,
                preferred_time,
                message: message?.trim() || null,
                source: 'website',
            })
            .select('id, name, preferred_date, preferred_time')
            .single();

        if (error) throw error;

        // Notify admin asynchronously — don't await
        notifyAppointment({ name, phone, email, project_name, preferred_date, preferred_time, message }).catch(() => {});

        sendSuccess(res, data, 'Your site visit has been booked. Our team will confirm shortly.', 201);
    } catch (err) {
        console.error('[Book Appointment Error]', err);
        sendError(res, 'Failed to book appointment', 500);
    }
}

// ── GET /api/admin/appointments ───────────────────────────────
async function listAppointments(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { status, search, date } = req.query;

        let query = supabase
            .from('appointments')
            .select('*, projects(name, slug)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);
        if (date) query = query.eq('preferred_date', date);
        if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Appointments fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[List Appointments Error]', err);
        sendError(res, 'Failed to fetch appointments', 500);
    }
}

// ── GET /api/admin/appointments/:id ──────────────────────────
async function getAppointment(req, res) {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*, projects(name, slug)')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return sendError(res, 'Appointment not found', 404);

        sendSuccess(res, data, 'Appointment fetched');
    } catch (err) {
        console.error('[Get Appointment Error]', err);
        sendError(res, 'Failed to fetch appointment', 500);
    }
}

// ── PATCH /api/admin/appointments/:id ────────────────────────
async function updateAppointment(req, res) {
    try {
        const { id } = req.params;
        const { status, admin_notes, is_read } = req.body;

        const updateData = { handled_by: req.admin.id };
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
            if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();
        }
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
        if (is_read !== undefined) updateData.is_read = is_read;

        const { data, error } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) return sendError(res, 'Appointment not found', 404);

        sendSuccess(res, data, 'Appointment updated');
    } catch (err) {
        console.error('[Update Appointment Error]', err);
        sendError(res, 'Failed to update appointment', 500);
    }
}

// ── PATCH /api/admin/appointments/mark-read ──────────────────
async function markAllRead(req, res) {
    try {
        const { error } = await supabase
            .from('appointments')
            .update({ is_read: true })
            .eq('is_read', false);

        if (error) throw error;

        sendSuccess(res, null, 'All appointments marked as read');
    } catch (err) {
        console.error('[Mark Read Error]', err);
        sendError(res, 'Failed to mark appointments as read', 500);
    }
}

// ── DELETE /api/admin/appointments/:id ───────────────────────
async function deleteAppointment(req, res) {
    try {
        const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
        if (error) throw error;
        sendSuccess(res, null, 'Appointment deleted');
    } catch (err) {
        console.error('[Delete Appointment Error]', err);
        sendError(res, 'Failed to delete appointment', 500);
    }
}

module.exports = {
    bookAppointment,
    listAppointments,
    getAppointment,
    updateAppointment,
    markAllRead,
    deleteAppointment,
};
