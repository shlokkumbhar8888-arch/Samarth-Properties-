-- ============================================================
-- SAMARTH PROPERTIES — COMPLETE DATABASE SCHEMA
-- Migration: 001_schema.sql
-- Database: Supabase PostgreSQL
-- Version: 2.0 (Enhanced)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text fuzzy search

-- ============================================================
-- 1. ADMIN USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'admin'
                    CHECK (role IN ('superadmin', 'admin', 'config')),
    is_active       BOOLEAN      DEFAULT true,
    last_login      TIMESTAMPTZ,
    login_attempts  INTEGER      DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    avatar_url      TEXT,                          -- Profile picture
    display_name    VARCHAR(100),                  -- Friendly name for audit logs
    created_at      TIMESTAMPTZ  DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 2. SITE CONTENT TABLE (CMS — all editable text/values)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_content (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section     VARCHAR(100) NOT NULL,
    key         VARCHAR(100) NOT NULL,
    value       TEXT,
    value_type  VARCHAR(20)  DEFAULT 'text'
                CHECK (value_type IN ('text', 'number', 'json', 'html', 'url')),
    label       VARCHAR(200),
    description TEXT,
    updated_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section, key)
);

-- ============================================================
-- 3. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255)  NOT NULL,
    slug                VARCHAR(255)  UNIQUE NOT NULL,
    type                VARCHAR(50)   NOT NULL
                        CHECK (type IN ('plots', 'residential', 'commercial', 'villa', 'apartment')),
    status              VARCHAR(50)   NOT NULL DEFAULT 'ongoing'
                        CHECK (status IN ('available', 'ongoing', 'completed', 'upcoming')),
    location            VARCHAR(255)  NOT NULL,
    city                VARCHAR(100)  NOT NULL,
    state               VARCHAR(100)  DEFAULT 'Maharashtra',
    maps_link           TEXT,
    maps_embed          TEXT,
    description         TEXT,
    short_description   VARCHAR(500),
    price_range_min     BIGINT,
    price_range_max     BIGINT,
    price_unit          VARCHAR(20)   DEFAULT 'total'
                        CHECK (price_unit IN ('total', 'per_sqft', 'per_sqm')),
    area_min            DECIMAL(10,2),
    area_max            DECIMAL(10,2),
    area_unit           VARCHAR(10)   DEFAULT 'sqft'
                        CHECK (area_unit IN ('sqft', 'sqm', 'acres', 'cents')),
    total_units         INTEGER,
    available_units     INTEGER,
    amenities           JSONB         DEFAULT '[]',
    highlights          JSONB         DEFAULT '[]',
    specifications      JSONB         DEFAULT '{}',
    nearby_landmarks    JSONB         DEFAULT '[]',  -- {name, distance, type}
    floor_plans         JSONB         DEFAULT '[]',  -- {title, image_url}
    cover_image_url     TEXT,
    images              JSONB         DEFAULT '[]',  -- {url, caption, is_cover}
    virtual_tour_url    TEXT,                        -- Matterport / 360 tour URL
    brochure_url        TEXT,
    video_url           TEXT,
    is_featured         BOOLEAN       DEFAULT false,
    is_visible          BOOLEAN       DEFAULT true,
    sort_order          INTEGER       DEFAULT 0,
    seo_title           VARCHAR(255),
    seo_description     TEXT,
    seo_keywords        TEXT,
    rera_number         VARCHAR(100),
    possession_date     DATE,
    -- Full-text search vector (auto-maintained by trigger)
    search_vector       TSVECTOR,
    created_by          UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_by          UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ   DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 4. APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)  NOT NULL,
    phone           VARCHAR(20)   NOT NULL,
    email           VARCHAR(255),
    city            VARCHAR(100),
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name    VARCHAR(255),
    preferred_date  DATE          NOT NULL,
    preferred_time  VARCHAR(20)   NOT NULL,
    message         TEXT,
    status          VARCHAR(20)   DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    admin_notes     TEXT,
    source          VARCHAR(50)   DEFAULT 'website'
                    CHECK (source IN ('website', 'phone', 'walk-in', 'referral')),
    is_read         BOOLEAN       DEFAULT false,
    confirmed_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    handled_by      UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 5. ENQUIRIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS enquiries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)  NOT NULL,
    phone           VARCHAR(20)   NOT NULL,
    email           VARCHAR(255),
    city            VARCHAR(100),
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name    VARCHAR(255),
    interested_in   VARCHAR(100),
    message         TEXT,
    status          VARCHAR(20)   DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'converted')),
    admin_notes     TEXT,
    source          VARCHAR(50)   DEFAULT 'contact-form',
    utm_source      VARCHAR(100), -- Track traffic source for marketing
    utm_medium      VARCHAR(100),
    utm_campaign    VARCHAR(100),
    is_read         BOOLEAN       DEFAULT false,
    handled_by      UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 6. TESTIMONIALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name         VARCHAR(255)  NOT NULL,
    client_designation  VARCHAR(255),
    photo_url           TEXT,
    project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name        VARCHAR(255),
    rating              INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    review              TEXT NOT NULL,
    video_url           TEXT,        -- Optional video testimonial
    is_visible          BOOLEAN DEFAULT true,
    is_featured         BOOLEAN DEFAULT false,
    sort_order          INTEGER DEFAULT 0,
    created_by          UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. BLOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS blogs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500)  NOT NULL,
    slug            VARCHAR(500)  UNIQUE NOT NULL,
    excerpt         TEXT,
    content         TEXT,                    -- Rich HTML content
    cover_image_url TEXT,
    tags            JSONB         DEFAULT '[]',
    category        VARCHAR(100),
    status          VARCHAR(20)   DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
    is_featured     BOOLEAN       DEFAULT false,
    view_count      INTEGER       DEFAULT 0,
    read_time_mins  INTEGER,                 -- Estimated read time
    seo_title       VARCHAR(255),
    seo_description TEXT,
    seo_keywords    TEXT,
    author_id       UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 8. TEAM TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS team (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)  NOT NULL,
    designation     VARCHAR(255)  NOT NULL,
    photo_url       TEXT,
    bio             TEXT,
    email           VARCHAR(255),
    phone           VARCHAR(20),
    linkedin_url    TEXT,
    department      VARCHAR(100), -- e.g., Sales, Management, Technical
    is_visible      BOOLEAN       DEFAULT true,
    sort_order      INTEGER       DEFAULT 0,
    created_by      UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 9. MEDIA LIBRARY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS media_library (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename            VARCHAR(500)  NOT NULL,
    original_filename   VARCHAR(500)  NOT NULL,
    file_url            TEXT          NOT NULL,
    thumbnail_url       TEXT,
    large_url           TEXT,        -- Resized large version
    webp_url            TEXT,        -- WebP converted version
    file_type           VARCHAR(50)   NOT NULL
                        CHECK (file_type IN ('image', 'video', 'pdf', 'document')),
    mime_type           VARCHAR(100),
    file_size           BIGINT,      -- bytes
    width               INTEGER,
    height              INTEGER,
    alt_text            VARCHAR(500),
    folder              VARCHAR(255)  DEFAULT 'general',
    tags                JSONB         DEFAULT '[]',
    uploaded_by         UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 10. VISITOR ANALYTICS TABLE (internal tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS visitor_analytics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      VARCHAR(255),
    page_path       VARCHAR(500)  NOT NULL,
    page_title      VARCHAR(500),
    referrer        TEXT,
    user_agent      TEXT,
    ip_address      INET,
    country         VARCHAR(100),
    city            VARCHAR(100),
    device_type     VARCHAR(20)
                    CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
    browser         VARCHAR(100),
    os              VARCHAR(100),
    duration_seconds INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. CONFIG SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS config_settings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category    VARCHAR(100)  NOT NULL,
    key         VARCHAR(100)  NOT NULL,
    value       TEXT,
    value_type  VARCHAR(20)   DEFAULT 'text'
                CHECK (value_type IN ('text', 'number', 'boolean', 'json', 'secret')),
    label       VARCHAR(200),
    description TEXT,
    is_sensitive BOOLEAN      DEFAULT false,
    updated_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ   DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE(category, key)
);

-- ============================================================
-- 12. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id        UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_username  VARCHAR(100),
    action          VARCHAR(100)  NOT NULL,  -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    entity_type     VARCHAR(100),            -- e.g., 'project', 'blog'
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 13. LOGIN ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(255),
    ip_address  INET,
    success     BOOLEAN       DEFAULT false,
    panel       VARCHAR(20)   CHECK (panel IN ('admin', 'config')),
    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- 14. BROCHURE DOWNLOADS TABLE (lead capture before download)
-- ============================================================
CREATE TABLE IF NOT EXISTS brochure_downloads (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255)  NOT NULL,
    phone       VARCHAR(20)   NOT NULL,
    email       VARCHAR(255),
    project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(255),
    ip_address  INET,
    created_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- Projects
CREATE INDEX idx_projects_slug        ON projects(slug);
CREATE INDEX idx_projects_type        ON projects(type);
CREATE INDEX idx_projects_status      ON projects(status);
CREATE INDEX idx_projects_city        ON projects(city);
CREATE INDEX idx_projects_featured    ON projects(is_featured) WHERE is_featured = true;
CREATE INDEX idx_projects_visible     ON projects(is_visible)  WHERE is_visible  = true;
CREATE INDEX idx_projects_created_at  ON projects(created_at DESC);
CREATE INDEX idx_projects_search      ON projects USING GIN(search_vector);
CREATE INDEX idx_projects_name_trgm   ON projects USING GIN(name gin_trgm_ops);

-- Appointments
CREATE INDEX idx_appt_status       ON appointments(status);
CREATE INDEX idx_appt_project      ON appointments(project_id);
CREATE INDEX idx_appt_date         ON appointments(preferred_date);
CREATE INDEX idx_appt_unread       ON appointments(is_read) WHERE is_read = false;
CREATE INDEX idx_appt_created_at   ON appointments(created_at DESC);

-- Enquiries
CREATE INDEX idx_enq_status        ON enquiries(status);
CREATE INDEX idx_enq_project       ON enquiries(project_id);
CREATE INDEX idx_enq_unread        ON enquiries(is_read) WHERE is_read = false;
CREATE INDEX idx_enq_created_at    ON enquiries(created_at DESC);

-- Testimonials
CREATE INDEX idx_test_visible      ON testimonials(is_visible) WHERE is_visible = true;
CREATE INDEX idx_test_sort         ON testimonials(sort_order);

-- Blogs
CREATE INDEX idx_blogs_slug        ON blogs(slug);
CREATE INDEX idx_blogs_status      ON blogs(status);
CREATE INDEX idx_blogs_published   ON blogs(published_at DESC);
CREATE INDEX idx_blogs_featured    ON blogs(is_featured) WHERE is_featured = true;

-- Analytics
CREATE INDEX idx_analytics_created ON visitor_analytics(created_at DESC);
CREATE INDEX idx_analytics_path    ON visitor_analytics(page_path);
CREATE INDEX idx_analytics_session ON visitor_analytics(session_id);

-- Site content
CREATE INDEX idx_content_section   ON site_content(section);
CREATE INDEX idx_content_sec_key   ON site_content(section, key);

-- Config
CREATE INDEX idx_config_category   ON config_settings(category);

-- Media
CREATE INDEX idx_media_type        ON media_library(file_type);
CREATE INDEX idx_media_folder      ON media_library(folder);

-- Audit logs
CREATE INDEX idx_audit_admin       ON audit_logs(admin_id);
CREATE INDEX idx_audit_created_at  ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity      ON audit_logs(entity_type, entity_id);

-- Login attempts
CREATE INDEX idx_login_ip          ON login_attempts(ip_address);
CREATE INDEX idx_login_created_at  ON login_attempts(created_at DESC);

-- Brochure downloads
CREATE INDEX idx_brochure_project  ON brochure_downloads(project_id);
CREATE INDEX idx_brochure_created  ON brochure_downloads(created_at DESC);

-- ============================================================
-- TRIGGER: Auto-update updated_at on every UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_site_content_updated_at
    BEFORE UPDATE ON site_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_enquiries_updated_at
    BEFORE UPDATE ON enquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_team_updated_at
    BEFORE UPDATE ON team
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_config_settings_updated_at
    BEFORE UPDATE ON config_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-maintain projects full-text search vector
-- ============================================================
CREATE OR REPLACE FUNCTION update_project_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_search_vector
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_project_search_vector();

-- ============================================================
-- UTILITY: Slug generation helper
-- ============================================================
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                TRIM(title),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEW: Dashboard summary (admin panel quick stats)
-- ============================================================
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM projects WHERE is_visible = true)::INT       AS total_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'ongoing')::INT      AS ongoing_projects,
    (SELECT COUNT(*) FROM enquiries WHERE status = 'new')::INT         AS new_enquiries,
    (SELECT COUNT(*) FROM appointments WHERE status = 'pending')::INT  AS pending_appointments,
    (SELECT COUNT(*) FROM enquiries WHERE is_read = false)::INT        AS unread_enquiries,
    (SELECT COUNT(*) FROM appointments WHERE is_read = false)::INT     AS unread_appointments,
    (SELECT COUNT(*) FROM blogs WHERE status = 'published')::INT       AS published_blogs,
    (SELECT COUNT(*) FROM testimonials WHERE is_visible = true)::INT   AS active_testimonials,
    (SELECT COUNT(*) FROM enquiries
     WHERE created_at >= NOW() - INTERVAL '30 days')::INT              AS enquiries_30d,
    (SELECT COUNT(*) FROM appointments
     WHERE created_at >= NOW() - INTERVAL '30 days')::INT              AS appointments_30d;
