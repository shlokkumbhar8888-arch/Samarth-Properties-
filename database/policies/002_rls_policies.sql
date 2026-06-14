-- ============================================================
-- SAMARTH PROPERTIES — ROW LEVEL SECURITY POLICIES
-- File: 002_rls_policies.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROJECTS — Public can read visible projects only
--            Service role (backend) can do everything
-- ============================================================
CREATE POLICY "projects_public_read"
    ON projects FOR SELECT
    TO anon
    USING (is_visible = true);

CREATE POLICY "projects_service_all"
    ON projects FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- SITE CONTENT — Public can read, only service role can write
-- ============================================================
CREATE POLICY "site_content_public_read"
    ON site_content FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "site_content_service_all"
    ON site_content FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- TESTIMONIALS — Public can read visible ones only
-- ============================================================
CREATE POLICY "testimonials_public_read"
    ON testimonials FOR SELECT
    TO anon
    USING (is_visible = true);

CREATE POLICY "testimonials_service_all"
    ON testimonials FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- BLOGS — Public can read published ones only
-- ============================================================
CREATE POLICY "blogs_public_read"
    ON blogs FOR SELECT
    TO anon
    USING (status = 'published');

CREATE POLICY "blogs_service_all"
    ON blogs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- TEAM — Public can read visible members
-- ============================================================
CREATE POLICY "team_public_read"
    ON team FOR SELECT
    TO anon
    USING (is_visible = true);

CREATE POLICY "team_service_all"
    ON team FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- APPOINTMENTS — Public can INSERT only (submit booking)
--               Service role can read/update/delete
-- ============================================================
CREATE POLICY "appointments_public_insert"
    ON appointments FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "appointments_service_all"
    ON appointments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- ENQUIRIES — Public can INSERT only (submit enquiry)
--             Service role can read/update/delete
-- ============================================================
CREATE POLICY "enquiries_public_insert"
    ON enquiries FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "enquiries_service_all"
    ON enquiries FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- VISITOR ANALYTICS — Public can INSERT (page view tracking)
--                     Service role can read all
-- ============================================================
CREATE POLICY "analytics_public_insert"
    ON visitor_analytics FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "analytics_service_all"
    ON visitor_analytics FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- ADMIN USERS — Service role only (never expose to public)
-- ============================================================
CREATE POLICY "admin_users_service_all"
    ON admin_users FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- CONFIG SETTINGS — Service role only
-- ============================================================
CREATE POLICY "config_service_all"
    ON config_settings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- AUDIT LOGS — Service role only
-- ============================================================
CREATE POLICY "audit_logs_service_all"
    ON audit_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- LOGIN ATTEMPTS — Service role only
-- ============================================================
CREATE POLICY "login_attempts_service_all"
    ON login_attempts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- MEDIA LIBRARY — Public can read, service role manages all
-- ============================================================
CREATE POLICY "media_public_read"
    ON media_library FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "media_service_all"
    ON media_library FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- BROCHURE DOWNLOADS — Public can INSERT, service role manages
-- ============================================================
ALTER TABLE brochure_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brochure_downloads_public_insert"
    ON brochure_downloads FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "brochure_downloads_service_all"
    ON brochure_downloads FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
