// ============================================================
// SAMARTH PROPERTIES — Testimonials Controller
// File: backend/src/controllers/testimonials.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { DEFAULT_PAGE_SIZE } = require('../config/constants');

// ── GET /api/public/testimonials ──────────────────────────────
async function listTestimonials(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 12, 50);
        const featured = req.query.featured === 'true';

        let query = supabase
            .from('testimonials')
            .select('id, client_name, client_designation, photo_url, project_name, rating, review, video_url, is_featured, sort_order')
            .eq('is_visible', true)
            .order('is_featured', { ascending: false })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (featured) query = query.eq('is_featured', true);

        const { data, error } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Testimonials fetched');
    } catch (err) {
        console.error('[List Testimonials Error]', err);
        sendError(res, 'Failed to fetch testimonials', 500);
    }
}

// ── GET /api/admin/testimonials ───────────────────────────────
async function adminListTestimonials(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);

        const { data, error, count } = await supabase
            .from('testimonials')
            .select('*', { count: 'exact' })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        sendSuccess(res, data, 'Testimonials fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[Admin List Testimonials Error]', err);
        sendError(res, 'Failed to fetch testimonials', 500);
    }
}

// ── POST /api/admin/testimonials ──────────────────────────────
async function createTestimonial(req, res) {
    try {
        const { client_name, client_designation, photo_url, project_id, project_name, rating, review, video_url, is_visible, is_featured, sort_order } = req.body;

        const { data, error } = await supabase
            .from('testimonials')
            .insert({
                client_name: client_name.trim(),
                client_designation: client_designation?.trim() || null,
                photo_url: photo_url || null,
                project_id: project_id || null,
                project_name: project_name?.trim() || null,
                rating: rating || 5,
                review: review.trim(),
                video_url: video_url || null,
                is_visible: is_visible !== undefined ? is_visible : true,
                is_featured: is_featured || false,
                sort_order: sort_order || 0,
                created_by: req.admin.id,
            })
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Testimonial created', 201);
    } catch (err) {
        console.error('[Create Testimonial Error]', err);
        sendError(res, 'Failed to create testimonial', 500);
    }
}

// ── PUT /api/admin/testimonials/:id ──────────────────────────
async function updateTestimonial(req, res) {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('testimonials')
            .update(req.body)
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) return sendError(res, 'Testimonial not found', 404);

        sendSuccess(res, data, 'Testimonial updated');
    } catch (err) {
        console.error('[Update Testimonial Error]', err);
        sendError(res, 'Failed to update testimonial', 500);
    }
}

// ── DELETE /api/admin/testimonials/:id ───────────────────────
async function deleteTestimonial(req, res) {
    try {
        const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
        if (error) throw error;
        sendSuccess(res, null, 'Testimonial deleted');
    } catch (err) {
        console.error('[Delete Testimonial Error]', err);
        sendError(res, 'Failed to delete testimonial', 500);
    }
}

module.exports = {
    listTestimonials,
    adminListTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
};
