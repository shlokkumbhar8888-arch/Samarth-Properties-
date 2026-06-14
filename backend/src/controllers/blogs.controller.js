// ============================================================
// SAMARTH PROPERTIES — Blogs Controller
// File: backend/src/controllers/blogs.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { uniqueSlug } = require('../utils/slug');
const { DEFAULT_PAGE_SIZE } = require('../config/constants');

// ── GET /api/public/blogs ─────────────────────────────────────
async function listBlogs(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { category, tag, featured } = req.query;

        let query = supabase
            .from('blogs')
            .select('id, title, slug, excerpt, cover_image_url, tags, category, is_featured, view_count, read_time_mins, published_at, author_id', { count: 'exact' })
            .eq('status', 'published')
            .order('is_featured', { ascending: false })
            .order('published_at', { ascending: false })
            .range(from, to);

        if (category) query = query.eq('category', category);
        if (featured === 'true') query = query.eq('is_featured', true);
        if (tag) query = query.contains('tags', [tag]);

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Blogs fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[List Blogs Error]', err);
        sendError(res, 'Failed to fetch blogs', 500);
    }
}

// ── GET /api/public/blogs/:slug ───────────────────────────────
async function getBlogBySlug(req, res) {
    try {
        const { slug } = req.params;

        const { data, error } = await supabase
            .from('blogs')
            .select('*, admin_users(display_name, username, avatar_url)')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !data) return sendError(res, 'Blog post not found', 404);

        // Increment view count asynchronously
        supabase.from('blogs')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', data.id)
            .then(() => {});

        sendSuccess(res, data, 'Blog fetched');
    } catch (err) {
        console.error('[Get Blog Error]', err);
        sendError(res, 'Failed to fetch blog', 500);
    }
}

// ── GET /api/admin/blogs ──────────────────────────────────────
async function adminListBlogs(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { status, search } = req.query;

        let query = supabase
            .from('blogs')
            .select('id, title, slug, status, category, is_featured, view_count, published_at, created_at, author_id', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Blogs fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[Admin List Blogs Error]', err);
        sendError(res, 'Failed to fetch blogs', 500);
    }
}

// ── GET /api/admin/blogs/:id ──────────────────────────────────
async function adminGetBlog(req, res) {
    try {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return sendError(res, 'Blog not found', 404);

        sendSuccess(res, data, 'Blog fetched');
    } catch (err) {
        console.error('[Admin Get Blog Error]', err);
        sendError(res, 'Failed to fetch blog', 500);
    }
}

// ── POST /api/admin/blogs ─────────────────────────────────────
async function createBlog(req, res) {
    try {
        const body = req.body;
        const slug = await uniqueSlug(body.title, 'blogs');

        // Estimate read time from content (~200 words/min)
        const wordCount = (body.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
        const readTimeMins = Math.max(1, Math.ceil(wordCount / 200));

        const publishedAt = body.status === 'published' ? new Date().toISOString() : null;

        const { data, error } = await supabase
            .from('blogs')
            .insert({
                title: body.title.trim(),
                slug,
                excerpt: body.excerpt?.trim() || null,
                content: body.content || null,
                cover_image_url: body.cover_image_url || null,
                tags: body.tags || [],
                category: body.category?.trim() || null,
                status: body.status || 'draft',
                is_featured: body.is_featured || false,
                read_time_mins: readTimeMins,
                seo_title: body.seo_title || null,
                seo_description: body.seo_description || null,
                seo_keywords: body.seo_keywords || null,
                author_id: req.admin.id,
                published_at: publishedAt,
            })
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Blog created', 201);
    } catch (err) {
        console.error('[Create Blog Error]', err);
        sendError(res, err.message || 'Failed to create blog', 500);
    }
}

// ── PUT /api/admin/blogs/:id ──────────────────────────────────
async function updateBlog(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;

        const { data: existing, error: fetchErr } = await supabase
            .from('blogs')
            .select('id, slug, title, status, published_at')
            .eq('id', id)
            .single();

        if (fetchErr || !existing) return sendError(res, 'Blog not found', 404);

        let slug = existing.slug;
        if (body.title && body.title !== existing.title) {
            slug = await uniqueSlug(body.title, 'blogs', id);
        }

        // Set published_at when transitioning to published
        let publishedAt = existing.published_at;
        if (body.status === 'published' && existing.status !== 'published') {
            publishedAt = new Date().toISOString();
        }

        const wordCount = (body.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
        const readTimeMins = body.content ? Math.max(1, Math.ceil(wordCount / 200)) : undefined;

        const { data, error } = await supabase
            .from('blogs')
            .update({ ...body, slug, published_at: publishedAt, read_time_mins: readTimeMins })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Blog updated');
    } catch (err) {
        console.error('[Update Blog Error]', err);
        sendError(res, err.message || 'Failed to update blog', 500);
    }
}

// ── DELETE /api/admin/blogs/:id ───────────────────────────────
async function deleteBlog(req, res) {
    try {
        const { error } = await supabase.from('blogs').delete().eq('id', req.params.id);
        if (error) throw error;
        sendSuccess(res, null, 'Blog deleted');
    } catch (err) {
        console.error('[Delete Blog Error]', err);
        sendError(res, 'Failed to delete blog', 500);
    }
}

module.exports = {
    listBlogs,
    getBlogBySlug,
    adminListBlogs,
    adminGetBlog,
    createBlog,
    updateBlog,
    deleteBlog,
};
