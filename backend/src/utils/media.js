// ============================================================
// SAMARTH PROPERTIES — Image Processing & Storage Utility
// File: backend/src/utils/media.js
// ============================================================

const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabase');
const {
    IMAGE_QUALITY,
    THUMBNAIL_WIDTH,
    THUMBNAIL_HEIGHT,
    LARGE_IMAGE_WIDTH,
    LARGE_IMAGE_HEIGHT,
    WEBP_QUALITY,
} = require('../config/constants');

/**
 * Process an image buffer into three variants: original/large, thumbnail, webp.
 * Returns { large, thumbnail, webp } as Buffers.
 */
async function processImage(buffer) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const [large, thumbnail, webp] = await Promise.all([
        // Large — resize only if wider than LARGE_IMAGE_WIDTH to avoid upscaling
        sharp(buffer)
            .resize(LARGE_IMAGE_WIDTH, LARGE_IMAGE_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .jpeg({ quality: IMAGE_QUALITY })
            .toBuffer(),

        // Thumbnail — cover crop to exact dimensions
        sharp(buffer)
            .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: 'cover' })
            .jpeg({ quality: IMAGE_QUALITY })
            .toBuffer(),

        // WebP — full-size converted, best compression
        sharp(buffer)
            .resize(LARGE_IMAGE_WIDTH, LARGE_IMAGE_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer(),
    ]);

    return { large, thumbnail, webp, width: metadata.width, height: metadata.height };
}

/**
 * Upload a buffer to Supabase Storage.
 * @returns {string} Public URL of the uploaded file
 */
async function uploadToStorage(buffer, bucket, path, mimeType = 'image/jpeg') {
    const { error } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
async function deleteFromStorage(bucket, path) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.error('[Storage Delete Error]', error.message);
}

/**
 * Extract the storage path from a full public URL.
 * URL format: .../storage/v1/object/public/<bucket>/<path>
 */
function extractStoragePath(url) {
    try {
        const marker = '/object/public/';
        const idx = url.indexOf(marker);
        if (idx === -1) return null;
        const after = url.slice(idx + marker.length);
        const slashIdx = after.indexOf('/');
        return slashIdx === -1 ? null : after.slice(slashIdx + 1);
    } catch {
        return null;
    }
}

/**
 * Process image and upload all variants to Supabase Storage.
 * Returns { originalUrl, thumbnailUrl, largeUrl, webpUrl }
 */
async function processAndUpload(buffer, bucket, folder = '') {
    const id = uuidv4();
    const basePath = folder ? `${folder}/${id}` : id;

    const { large, thumbnail, webp } = await processImage(buffer);

    const [largeUrl, thumbnailUrl, webpUrl] = await Promise.all([
        uploadToStorage(large, bucket, `${basePath}.jpg`, 'image/jpeg'),
        uploadToStorage(thumbnail, bucket, `${basePath}_thumb.jpg`, 'image/jpeg'),
        uploadToStorage(webp, bucket, `${basePath}.webp`, 'image/webp'),
    ]);

    return { largeUrl, thumbnailUrl, webpUrl, filename: `${id}.jpg` };
}

module.exports = {
    processImage,
    uploadToStorage,
    deleteFromStorage,
    extractStoragePath,
    processAndUpload,
};
