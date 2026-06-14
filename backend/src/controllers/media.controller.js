// ============================================================
// SAMARTH PROPERTIES — Media Library Controller
// File: backend/src/controllers/media.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError, buildPagination, parsePagination } = require('../utils/response');
const { processAndUpload, uploadToStorage, deleteFromStorage, extractStoragePath } = require('../utils/media');
const { DEFAULT_PAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES, ALLOWED_VIDEO_TYPES } = require('../config/constants');

// ── POST /api/media/upload ────────────────────────────────────
async function uploadMedia(req, res) {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);

        const { bucket = 'media', folder = 'general', alt_text } = req.body;
        const { mimetype, buffer, originalname, size } = req.file;

        const validBuckets = ['projects', 'team', 'blogs', 'testimonials', 'media'];
        if (!validBuckets.includes(bucket)) {
            return sendError(res, 'Invalid storage bucket', 400);
        }

        let fileUrl, thumbnailUrl, largeUrl, webpUrl, filename;
        let fileType = 'document';
        let width = null, height = null;

        if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
            fileType = 'image';
            const result = await processAndUpload(buffer, bucket, folder);
            fileUrl = result.largeUrl;
            thumbnailUrl = result.thumbnailUrl;
            largeUrl = result.largeUrl;
            webpUrl = result.webpUrl;
            filename = result.filename;
        } else if (ALLOWED_DOC_TYPES.includes(mimetype)) {
            fileType = 'pdf';
            const { v4: uuidv4 } = require('uuid');
            const id = uuidv4();
            filename = `${id}.pdf`;
            const path = folder ? `${folder}/${filename}` : filename;
            fileUrl = await uploadToStorage(buffer, bucket, path, 'application/pdf');
        } else if (ALLOWED_VIDEO_TYPES.includes(mimetype)) {
            fileType = 'video';
            const { v4: uuidv4 } = require('uuid');
            const id = uuidv4();
            const ext = originalname.split('.').pop();
            filename = `${id}.${ext}`;
            const path = folder ? `${folder}/${filename}` : filename;
            fileUrl = await uploadToStorage(buffer, bucket, path, mimetype);
        } else {
            return sendError(res, 'File type not supported', 415);
        }

        const { data, error } = await supabase
            .from('media_library')
            .insert({
                filename: filename || originalname,
                original_filename: originalname,
                file_url: fileUrl,
                thumbnail_url: thumbnailUrl || null,
                large_url: largeUrl || null,
                webp_url: webpUrl || null,
                file_type: fileType,
                mime_type: mimetype,
                file_size: size,
                width,
                height,
                alt_text: alt_text?.trim() || null,
                folder,
                uploaded_by: req.admin.id,
            })
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'File uploaded successfully', 201);
    } catch (err) {
        console.error('[Upload Media Error]', err);
        sendError(res, err.message || 'Failed to upload file', 500);
    }
}

// ── GET /api/media ────────────────────────────────────────────
async function listMedia(req, res) {
    try {
        const { page, pageSize, from, to } = parsePagination(req.query, DEFAULT_PAGE_SIZE);
        const { file_type, folder, search } = req.query;

        let query = supabase
            .from('media_library')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (file_type) query = query.eq('file_type', file_type);
        if (folder) query = query.eq('folder', folder);
        if (search) query = query.ilike('original_filename', `%${search}%`);

        const { data, error, count } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Media fetched', 200, buildPagination(count, page, pageSize));
    } catch (err) {
        console.error('[List Media Error]', err);
        sendError(res, 'Failed to fetch media', 500);
    }
}

// ── PATCH /api/media/:id ──────────────────────────────────────
async function updateMedia(req, res) {
    try {
        const { alt_text, tags } = req.body;

        const { data, error } = await supabase
            .from('media_library')
            .update({ alt_text: alt_text?.trim() || null, tags: tags || [] })
            .eq('id', req.params.id)
            .select('*')
            .single();

        if (error || !data) return sendError(res, 'Media not found', 404);

        sendSuccess(res, data, 'Media updated');
    } catch (err) {
        console.error('[Update Media Error]', err);
        sendError(res, 'Failed to update media', 500);
    }
}

// ── DELETE /api/media/:id ─────────────────────────────────────
async function deleteMedia(req, res) {
    try {
        const { data: media, error: fetchErr } = await supabase
            .from('media_library')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchErr || !media) return sendError(res, 'Media not found', 404);

        // Delete all variants from storage
        const urlsToDelete = [media.file_url, media.thumbnail_url, media.large_url, media.webp_url].filter(Boolean);

        for (const url of urlsToDelete) {
            const storagePath = extractStoragePath(url);
            if (storagePath) {
                const bucket = url.includes('/projects/') ? 'projects'
                    : url.includes('/team/') ? 'team'
                    : url.includes('/blogs/') ? 'blogs'
                    : url.includes('/testimonials/') ? 'testimonials'
                    : 'media';
                await deleteFromStorage(bucket, storagePath);
            }
        }

        const { error } = await supabase.from('media_library').delete().eq('id', req.params.id);
        if (error) throw error;

        sendSuccess(res, null, 'Media deleted');
    } catch (err) {
        console.error('[Delete Media Error]', err);
        sendError(res, 'Failed to delete media', 500);
    }
}

module.exports = { uploadMedia, listMedia, updateMedia, deleteMedia };
