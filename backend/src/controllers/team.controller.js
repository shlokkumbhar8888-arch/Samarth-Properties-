// ============================================================
// SAMARTH PROPERTIES — Team Controller
// File: backend/src/controllers/team.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { DEFAULT_PAGE_SIZE } = require('../config/constants');

// ── GET /api/public/team ──────────────────────────────────────
async function listTeam(req, res) {
    try {
        const { department } = req.query;

        let query = supabase
            .from('team')
            .select('id, name, designation, photo_url, bio, linkedin_url, department, sort_order')
            .eq('is_visible', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (department) query = query.eq('department', department);

        const { data, error } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Team fetched');
    } catch (err) {
        console.error('[List Team Error]', err);
        sendError(res, 'Failed to fetch team', 500);
    }
}

// ── GET /api/admin/team ───────────────────────────────────────
async function adminListTeam(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);

        const { data, error, count } = await supabase
            .from('team')
            .select('*', { count: 'exact' })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        sendSuccess(res, data, 'Team fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[Admin List Team Error]', err);
        sendError(res, 'Failed to fetch team', 500);
    }
}

// ── POST /api/admin/team ──────────────────────────────────────
async function createTeamMember(req, res) {
    try {
        const { name, designation, photo_url, bio, email, phone, linkedin_url, department, is_visible, sort_order } = req.body;

        const { data, error } = await supabase
            .from('team')
            .insert({
                name: name.trim(),
                designation: designation.trim(),
                photo_url: photo_url || null,
                bio: bio?.trim() || null,
                email: email?.trim().toLowerCase() || null,
                phone: phone?.trim() || null,
                linkedin_url: linkedin_url || null,
                department: department?.trim() || null,
                is_visible: is_visible !== undefined ? is_visible : true,
                sort_order: sort_order || 0,
                created_by: req.admin.id,
            })
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Team member created', 201);
    } catch (err) {
        console.error('[Create Team Member Error]', err);
        sendError(res, 'Failed to create team member', 500);
    }
}

// ── PUT /api/admin/team/:id ───────────────────────────────────
async function updateTeamMember(req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('team')
            .update(req.body)
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) return sendError(res, 'Team member not found', 404);

        sendSuccess(res, data, 'Team member updated');
    } catch (err) {
        console.error('[Update Team Member Error]', err);
        sendError(res, 'Failed to update team member', 500);
    }
}

// ── DELETE /api/admin/team/:id ────────────────────────────────
async function deleteTeamMember(req, res) {
    try {
        const { error } = await supabase.from('team').delete().eq('id', req.params.id);
        if (error) throw error;
        sendSuccess(res, null, 'Team member deleted');
    } catch (err) {
        console.error('[Delete Team Member Error]', err);
        sendError(res, 'Failed to delete team member', 500);
    }
}

module.exports = {
    listTeam,
    adminListTeam,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
};
