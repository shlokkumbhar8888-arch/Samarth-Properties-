// ============================================================
// SAMARTH PROPERTIES — Site Content (CMS) Controller
// File: backend/src/controllers/content.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// ── GET /api/public/content ───────────────────────────────────
// Returns all published site content, optionally filtered by section.
async function getContent(req, res) {
    try {
        const { section } = req.query;

        let query = supabase
            .from('site_content')
            .select('section, key, value, value_type, label');

        if (section) query = query.eq('section', section);

        const { data, error } = await query;

        if (error) throw error;

        // Transform flat array into nested section → key → value map for easy frontend consumption
        const grouped = {};
        for (const row of data) {
            if (!grouped[row.section]) grouped[row.section] = {};
            grouped[row.section][row.key] = {
                value: row.value,
                type: row.value_type,
                label: row.label,
            };
        }

        sendSuccess(res, grouped, 'Content fetched');
    } catch (err) {
        console.error('[Get Content Error]', err);
        sendError(res, 'Failed to fetch content', 500);
    }
}

// ── GET /api/public/content/:section/:key ─────────────────────
async function getContentValue(req, res) {
    try {
        const { section, key } = req.params;

        const { data, error } = await supabase
            .from('site_content')
            .select('value, value_type')
            .eq('section', section)
            .eq('key', key)
            .single();

        if (error || !data) return sendError(res, 'Content not found', 404);

        sendSuccess(res, data, 'Content fetched');
    } catch (err) {
        console.error('[Get Content Value Error]', err);
        sendError(res, 'Failed to fetch content', 500);
    }
}

// ── GET /api/admin/content ────────────────────────────────────
async function adminGetContent(req, res) {
    try {
        const { section } = req.query;

        let query = supabase
            .from('site_content')
            .select('*')
            .order('section')
            .order('key');

        if (section) query = query.eq('section', section);

        const { data, error } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Content fetched');
    } catch (err) {
        console.error('[Admin Get Content Error]', err);
        sendError(res, 'Failed to fetch content', 500);
    }
}

// ── PUT /api/admin/content/:section/:key ─────────────────────
async function updateContentValue(req, res) {
    try {
        const { section, key } = req.params;
        const { value, value_type, label, description } = req.body;

        // Upsert — create if doesn't exist, update if it does
        const { data, error } = await supabase
            .from('site_content')
            .upsert({
                section,
                key,
                value,
                value_type: value_type || 'text',
                label: label || null,
                description: description || null,
                updated_by: req.admin.id,
            }, { onConflict: 'section,key' })
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Content updated');
    } catch (err) {
        console.error('[Update Content Error]', err);
        sendError(res, 'Failed to update content', 500);
    }
}

// ── POST /api/admin/content/bulk ─────────────────────────────
// Bulk update multiple content entries at once
async function bulkUpdateContent(req, res) {
    try {
        const { updates } = req.body; // Array of { section, key, value, value_type, label }

        if (!Array.isArray(updates) || updates.length === 0) {
            return sendError(res, 'Updates array is required', 400);
        }

        const rows = updates.map((u) => ({
            section: u.section,
            key: u.key,
            value: u.value,
            value_type: u.value_type || 'text',
            label: u.label || null,
            description: u.description || null,
            updated_by: req.admin.id,
        }));

        const { data, error } = await supabase
            .from('site_content')
            .upsert(rows, { onConflict: 'section,key' })
            .select('section, key, value');

        if (error) throw error;

        sendSuccess(res, data, `${data.length} content entries updated`);
    } catch (err) {
        console.error('[Bulk Update Content Error]', err);
        sendError(res, 'Failed to bulk update content', 500);
    }
}

module.exports = {
    getContent,
    getContentValue,
    adminGetContent,
    updateContentValue,
    bulkUpdateContent,
};
