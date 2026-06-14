-- ============================================================
-- SAMARTH PROPERTIES — SUPABASE STORAGE BUCKET SETUP
-- File: 004_storage.sql
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- CREATE STORAGE BUCKETS
-- ============================================================

-- Main projects bucket (project images, videos, brochures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'projects',
    'projects',
    true,
    209715200, -- 200MB limit (videos can be large)
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml',
          'video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/mpeg',
          'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    file_size_limit    = EXCLUDED.file_size_limit;

-- Team photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team',
    'team',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Blog images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blogs',
    'blogs',
    true,
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Testimonials photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'testimonials',
    'testimonials',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- General media bucket (logos, banners, misc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/svg+xml',
          'video/mp4','video/webm','video/ogg','video/quicktime','video/x-msvideo','video/mpeg',
          'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    file_size_limit    = EXCLUDED.file_size_limit;

-- ============================================================
-- STORAGE RLS POLICIES
-- Public can READ all files (buckets are public)
-- Only service_role can UPLOAD / DELETE
-- ============================================================

-- Projects bucket policies
CREATE POLICY "projects_public_read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'projects');

CREATE POLICY "projects_service_upload"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'projects');

CREATE POLICY "projects_service_update"
    ON storage.objects FOR UPDATE
    TO service_role
    USING (bucket_id = 'projects');

CREATE POLICY "projects_service_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'projects');

-- Team bucket policies
CREATE POLICY "team_public_read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'team');

CREATE POLICY "team_service_upload"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'team');

CREATE POLICY "team_service_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'team');

-- Blogs bucket policies
CREATE POLICY "blogs_public_read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'blogs');

CREATE POLICY "blogs_service_upload"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'blogs');

CREATE POLICY "blogs_service_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'blogs');

-- Testimonials bucket policies
CREATE POLICY "testimonials_public_read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'testimonials');

CREATE POLICY "testimonials_service_upload"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "testimonials_service_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'testimonials');

-- Media bucket policies
CREATE POLICY "media_public_read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'media');

CREATE POLICY "media_service_upload"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'media');

CREATE POLICY "media_service_delete"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'media');
