// ============================================================
// SAMARTH PROPERTIES — Projects Controller
// File: backend/src/controllers/projects.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { uniqueSlug } = require('../utils/slug');
const { DEFAULT_PAGE_SIZE } = require('../config/constants');

// ── GET /api/public/projects ──────────────────────────────────
async function listProjects(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { type, status, city, featured, search } = req.query;

        let query = supabase
            .from('projects')
            .select('id, name, slug, type, status, location, city, price_range_min, price_range_max, price_unit, area_min, area_max, area_unit, cover_image_url, images, is_featured, short_description, amenities, total_units, available_units, rera_number, possession_date', { count: 'exact' })
            .eq('is_visible', true)
            .order('is_featured', { ascending: false })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (type) query = query.eq('type', type);
        if (status) query = query.eq('status', status);
        if (city) query = query.ilike('city', `%${city}%`);
        if (featured === 'true') query = query.eq('is_featured', true);
        if (search) query = query.textSearch('search_vector', search, { type: 'websearch' });

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Projects fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[Projects List Error]', err);
        sendError(res, 'Failed to fetch projects', 500);
    }
}

// ── GET /api/public/projects/:slug ────────────────────────────
async function getProjectBySlug(req, res) {
    try {
        const { slug } = req.params;

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('slug', slug)
            .eq('is_visible', true)
            .single();

        if (error || !data) return sendError(res, 'Project not found', 404);

        sendSuccess(res, data, 'Project fetched');
    } catch (err) {
        console.error('[Project Detail Error]', err);
        sendError(res, 'Failed to fetch project', 500);
    }
}

// ── GET /api/public/projects/featured ─────────────────────────
async function getFeaturedProjects(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 20);

        const { data, error } = await supabase
            .from('projects')
            .select('id, name, slug, type, status, location, city, price_range_min, price_range_max, price_unit, area_min, area_max, area_unit, cover_image_url, short_description, is_featured')
            .eq('is_visible', true)
            .eq('is_featured', true)
            .order('sort_order', { ascending: true })
            .limit(limit);

        if (error) throw error;

        sendSuccess(res, data, 'Featured projects fetched');
    } catch (err) {
        console.error('[Featured Projects Error]', err);
        sendError(res, 'Failed to fetch featured projects', 500);
    }
}

// ── GET /api/admin/projects ───────────────────────────────────
async function adminListProjects(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { type, status, search, visibility } = req.query;

        let query = supabase
            .from('projects')
            .select('id, name, slug, type, status, city, is_featured, is_visible, sort_order, cover_image_url, available_units, total_units, created_at, updated_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (type) query = query.eq('type', type);
        if (status) query = query.eq('status', status);
        if (visibility === 'true') query = query.eq('is_visible', true);
        if (visibility === 'false') query = query.eq('is_visible', false);
        if (search) query = query.ilike('name', `%${search}%`);

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Projects fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[Admin Projects List Error]', err);
        sendError(res, 'Failed to fetch projects', 500);
    }
}

// ── GET /api/admin/projects/:id ───────────────────────────────
async function adminGetProject(req, res) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return sendError(res, 'Project not found', 404);

        sendSuccess(res, data, 'Project fetched');
    } catch (err) {
        console.error('[Admin Get Project Error]', err);
        sendError(res, 'Failed to fetch project', 500);
    }
}

// ── POST /api/admin/projects ──────────────────────────────────
async function createProject(req, res) {
    try {
        const body = req.body;
        const slug = await uniqueSlug(body.name, 'projects');

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name: body.name,
                slug,
                type: body.type,
                status: body.status || 'ongoing',
                location: body.location,
                city: body.city,
                state: body.state || 'Maharashtra',
                maps_link: body.maps_link,
                maps_embed: body.maps_embed,
                description: body.description,
                short_description: body.short_description,
                price_range_min: body.price_range_min || null,
                price_range_max: body.price_range_max || null,
                price_unit: body.price_unit || 'total',
                area_min: body.area_min || null,
                area_max: body.area_max || null,
                area_unit: body.area_unit || 'sqft',
                total_units: body.total_units || null,
                available_units: body.available_units || null,
                amenities: body.amenities || [],
                highlights: body.highlights || [],
                specifications: body.specifications || {},
                nearby_landmarks: body.nearby_landmarks || [],
                floor_plans: body.floor_plans || [],
                cover_image_url: body.cover_image_url,
                images: body.images || [],
                virtual_tour_url: body.virtual_tour_url,
                brochure_url: body.brochure_url,
                video_url: body.video_url,
                is_featured: body.is_featured || false,
                is_visible: body.is_visible !== undefined ? body.is_visible : true,
                sort_order: body.sort_order || 0,
                seo_title: body.seo_title,
                seo_description: body.seo_description,
                seo_keywords: body.seo_keywords,
                rera_number: body.rera_number,
                possession_date: body.possession_date || null,
                created_by: req.admin.id,
                updated_by: req.admin.id,
            })
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Project created successfully', 201);
    } catch (err) {
        console.error('[Create Project Error]', err);
        sendError(res, err.message || 'Failed to create project', 500);
    }
}

// ── PUT /api/admin/projects/:id ───────────────────────────────
async function updateProject(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;

        // Check project exists
        const { data: existing, error: fetchErr } = await supabase
            .from('projects')
            .select('id, slug, name')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) return sendError(res, 'Project not found', 404);

        // Regenerate slug only if name changed
        let slug = existing.slug;
        if (body.name && body.name !== existing.name) {
            slug = await uniqueSlug(body.name, 'projects', id);
        }

        const { data, error } = await supabase
            .from('projects')
            .update({
                name:              body.name,
                slug,
                type:              body.type,
                status:            body.status,
                location:          body.location,
                city:              body.city,
                state:             body.state,
                maps_link:         body.maps_link,
                maps_embed:        body.maps_embed,
                description:       body.description,
                short_description: body.short_description,
                price_range_min:   body.price_range_min ?? null,
                price_range_max:   body.price_range_max ?? null,
                price_unit:        body.price_unit,
                area_min:          body.area_min ?? null,
                area_max:          body.area_max ?? null,
                area_unit:         body.area_unit,
                total_units:       body.total_units ?? null,
                available_units:   body.available_units ?? null,
                amenities:         body.amenities,
                highlights:        body.highlights,
                specifications:    body.specifications,
                nearby_landmarks:  body.nearby_landmarks,
                floor_plans:       body.floor_plans,
                cover_image_url:   body.cover_image_url,
                images:            body.images,
                virtual_tour_url:  body.virtual_tour_url,
                brochure_url:      body.brochure_url,
                video_url:         body.video_url,
                is_featured:       body.is_featured,
                is_visible:        body.is_visible,
                sort_order:        body.sort_order,
                seo_title:         body.seo_title,
                seo_description:   body.seo_description,
                seo_keywords:      body.seo_keywords,
                rera_number:       body.rera_number,
                possession_date:   body.possession_date ?? null,
                updated_by:        req.admin.id,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Project updated successfully');
    } catch (err) {
        console.error('[Update Project Error]', err);
        sendError(res, err.message || 'Failed to update project', 500);
    }
}

// ── PATCH /api/admin/projects/:id/visibility ──────────────────
async function toggleVisibility(req, res) {
    try {
        const { id } = req.params;
        const { is_visible } = req.body;

        const { data, error } = await supabase
            .from('projects')
            .update({ is_visible, updated_by: req.admin.id })
            .eq('id', id)
            .select('id, name, is_visible')
            .single();

        if (error || !data) return sendError(res, 'Project not found', 404);

        sendSuccess(res, data, `Project ${is_visible ? 'shown' : 'hidden'} successfully`);
    } catch (err) {
        console.error('[Toggle Visibility Error]', err);
        sendError(res, 'Failed to update visibility', 500);
    }
}

// ── DELETE /api/admin/projects/:id ───────────────────────────
async function deleteProject(req, res) {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('projects').delete().eq('id', id);

        if (error) throw error;

        sendSuccess(res, null, 'Project deleted successfully');
    } catch (err) {
        console.error('[Delete Project Error]', err);
        sendError(res, 'Failed to delete project', 500);
    }
}

// ── GET /api/public/projects/types ───────────────────────────
async function getProjectTypes(req, res) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('type, status')
            .eq('is_visible', true)
            .neq('status', 'upcoming');

        if (error) throw error;

        const types    = [...new Set(data.map(r => r.type).filter(Boolean))].sort();
        const statuses = [...new Set(data.map(r => r.status).filter(Boolean))].sort();

        sendSuccess(res, { types, statuses }, 'Project types fetched');
    } catch (err) {
        console.error('[Project Types Error]', err);
        sendError(res, 'Failed to fetch project types', 500);
    }
}

module.exports = {
    listProjects,
    getProjectBySlug,
    getFeaturedProjects,
    getProjectTypes,
    adminListProjects,
    adminGetProject,
    createProject,
    updateProject,
    toggleVisibility,
    deleteProject,
};
