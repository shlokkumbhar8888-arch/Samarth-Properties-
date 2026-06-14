-- ============================================================
-- FIX: Add video MIME types to storage buckets
-- Run this in Supabase SQL Editor → New Query
-- ============================================================

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml',
    'video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/mpeg',
    'application/pdf'
  ],
  file_size_limit = 209715200   -- 200 MB
WHERE id = 'projects';

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml',
    'video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/mpeg',
    'application/pdf'
  ],
  file_size_limit = 209715200   -- 200 MB
WHERE id = 'media';

-- Verify
SELECT id, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id IN ('projects','media');
