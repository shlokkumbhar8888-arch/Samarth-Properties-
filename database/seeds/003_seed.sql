-- ============================================================
-- SAMARTH PROPERTIES — SEED DATA
-- File: 003_seed.sql
-- Run AFTER schema and policies
-- ============================================================

-- ============================================================
-- DEFAULT SITE CONTENT (all editable from admin panel)
-- ============================================================
INSERT INTO site_content (section, key, value, value_type, label, description) VALUES

-- Hero Section
('hero', 'headline', 'Building Dreams,<br>Delivering Trust', 'html', 'Hero Headline', 'Main headline on homepage hero'),
('hero', 'subheadline', 'Premium land and residential developments across Maharashtra', 'text', 'Hero Subheadline', 'Subtitle under the main headline'),
('hero', 'cta_primary_text', 'Explore Projects', 'text', 'Primary Button Text', 'Text on the main CTA button'),
('hero', 'cta_primary_link', '/pages/projects.html', 'url', 'Primary Button Link', 'URL for the main CTA button'),
('hero', 'cta_secondary_text', 'Book Site Visit', 'text', 'Secondary Button Text', 'Text on the secondary button'),
('hero', 'cta_secondary_link', '/pages/contact.html', 'url', 'Secondary Button Link', 'URL for the secondary button'),

-- Stats Section
('stats', 'years_experience', '15', 'number', 'Years of Experience', 'Number of years in business'),
('stats', 'projects_completed', '45', 'number', 'Projects Completed', 'Total number of completed projects'),
('stats', 'happy_clients', '2000', 'number', 'Happy Clients', 'Number of satisfied customers'),
('stats', 'acres_developed', '500', 'number', 'Acres Developed', 'Total land area developed'),

-- About Section (Homepage)
('about', 'title', 'About Samarth Properties', 'text', 'About Title', 'Heading for about section'),
('about', 'description', 'Samarth Properties has been a trusted name in Maharashtra real estate for over 15 years. We specialize in premium land development and residential projects, delivering quality and transparency at every step.', 'text', 'About Description', 'Short description for about section'),
('about', 'vision', 'To be Maharashtra''s most trusted real estate developer, creating communities where families thrive.', 'text', 'Vision Statement', 'Company vision statement'),
('about', 'mission', 'To deliver premium, transparent, and affordable real estate solutions backed by integrity and innovation.', 'text', 'Mission Statement', 'Company mission statement'),

-- Why Choose Us
('why_us', 'card_1_icon', '🏆', 'text', 'Card 1 Icon', 'Emoji or icon for first card'),
('why_us', 'card_1_title', 'Trusted Since 2009', 'text', 'Card 1 Title', 'Title for first why-choose-us card'),
('why_us', 'card_1_desc', '15+ years of delivering quality projects on time with complete transparency.', 'text', 'Card 1 Description', 'Description for first card'),
('why_us', 'card_2_icon', '📋', 'text', 'Card 2 Icon', 'Emoji or icon for second card'),
('why_us', 'card_2_title', 'RERA Registered', 'text', 'Card 2 Title', 'Title for second card'),
('why_us', 'card_2_desc', 'All our projects are RERA registered ensuring legal compliance and buyer protection.', 'text', 'Card 2 Description', 'Description for second card'),
('why_us', 'card_3_icon', '📍', 'text', 'Card 3 Icon', 'Emoji or icon for third card'),
('why_us', 'card_3_title', 'Prime Locations', 'text', 'Card 3 Title', 'Title for third card'),
('why_us', 'card_3_desc', 'Strategically located projects with excellent connectivity and infrastructure.', 'text', 'Card 3 Description', 'Description for third card'),
('why_us', 'card_4_icon', '🤝', 'text', 'Card 4 Icon', 'Emoji or icon for fourth card'),
('why_us', 'card_4_title', 'Customer First', 'text', 'Card 4 Title', 'Title for fourth card'),
('why_us', 'card_4_desc', 'Dedicated support from site visit to registration and beyond.', 'text', 'Card 4 Description', 'Description for fourth card'),

-- Company Info
('company', 'name', 'Samarth Properties', 'text', 'Company Name', 'Official company name'),
('company', 'tagline', 'Building Dreams, Delivering Trust', 'text', 'Company Tagline', 'Company tagline/slogan'),
('company', 'phone', '+91 72765 83404', 'text', 'Phone Number', 'Primary contact number'),
('company', 'whatsapp', '917276583404', 'text', 'WhatsApp Number', 'WhatsApp number without + or spaces'),
('company', 'email', 'info@samarthproperties.co.in', 'text', 'Email Address', 'Primary email address'),
('company', 'address_line1', 'Sunrise City, Talegaon Dhamdhare', 'text', 'Address Line 1', 'Street address'),
('company', 'address_line2', 'Ta. Shirur, Ji. Pune, Maharashtra', 'text', 'Address Line 2', 'City, PIN code'),
('company', 'state', 'Maharashtra, India', 'text', 'State & Country', 'State and country'),
('company', 'working_hours', 'Mon - Sun: 9:00 AM - 7:00 PM', 'text', 'Working Hours', 'Office working hours'),
('company', 'maps_embed_url', '', 'url', 'Google Maps Embed URL', 'Paste Google Maps embed URL here'),

-- Social Media
('social', 'facebook', 'https://facebook.com/samarthproperties', 'url', 'Facebook URL', 'Facebook page URL'),
('social', 'instagram', 'https://instagram.com/samarthproperties', 'url', 'Instagram URL', 'Instagram profile URL'),
('social', 'youtube', '', 'url', 'YouTube URL', 'YouTube channel URL'),
('social', 'linkedin', '', 'url', 'LinkedIn URL', 'LinkedIn company page URL'),

-- SEO
('seo', 'meta_title', 'Samarth Properties | Premium Real Estate Developer in Maharashtra', 'text', 'Meta Title', 'Browser tab title and Google title'),
('seo', 'meta_description', 'Samarth Properties offers premium land plots, residential apartments and villas across Maharashtra. RERA registered. 15+ years of trust.', 'text', 'Meta Description', 'Google search result description'),
('seo', 'meta_keywords', 'land plots Maharashtra, real estate Pune, residential projects, land developer', 'text', 'Meta Keywords', 'SEO keywords'),
('seo', 'og_image', '', 'url', 'OG Share Image', 'Image shown when sharing on WhatsApp/social media')

ON CONFLICT (section, key) DO NOTHING;

-- ============================================================
-- DEFAULT CONFIG SETTINGS
-- ============================================================
INSERT INTO config_settings (category, key, value, value_type, label, description, is_sensitive) VALUES

-- Analytics
('analytics', 'google_analytics_id', '', 'text', 'Google Analytics ID', 'GA4 Measurement ID (G-XXXXXXXXXX)', false),
('analytics', 'google_analytics_enabled', 'false', 'boolean', 'Enable Google Analytics', 'Toggle GA4 tracking on/off', false),
('analytics', 'facebook_pixel_id', '', 'text', 'Facebook Pixel ID', 'Meta/Facebook Pixel ID for ads', false),
('analytics', 'internal_analytics_enabled', 'true', 'boolean', 'Enable Internal Analytics', 'Track visitors in own database', false),

-- Email
('email', 'smtp_host', '', 'text', 'SMTP Host', 'Email server host (e.g. smtp.gmail.com)', false),
('email', 'smtp_port', '587', 'number', 'SMTP Port', 'Email server port', false),
('email', 'smtp_user', '', 'text', 'SMTP Username', 'Email address used for sending', false),
('email', 'smtp_pass', '', 'secret', 'SMTP Password', 'Email password or app password', true),
('email', 'admin_email', '', 'text', 'Admin Email', 'Where to send new enquiry/booking alerts', false),
('email', 'email_notifications_enabled', 'false', 'boolean', 'Enable Email Notifications', 'Send email to admin on new leads', false),

-- WhatsApp
('whatsapp', 'enabled', 'true', 'boolean', 'Show WhatsApp Button', 'Show floating WhatsApp button on website', false),
('whatsapp', 'welcome_message', 'Hello! I am interested in your properties. Please share more details.', 'text', 'Default WhatsApp Message', 'Pre-filled message when user clicks WhatsApp', false),

-- Security
('security', 'admin_secret_path', 'manage-sp-2024', 'secret', 'Admin Panel Path', 'Secret URL path for admin panel', true),
('security', 'config_secret_path', 'config-sp-2024', 'secret', 'Config Panel Path', 'Secret URL path for config panel', true),
('security', 'max_login_attempts', '5', 'number', 'Max Login Attempts', 'Lock account after this many failed attempts', false),
('security', 'lockout_duration_minutes', '30', 'number', 'Lockout Duration (minutes)', 'How long to lock account after failed attempts', false),
('security', 'jwt_expiry_hours', '8', 'number', 'JWT Expiry Hours', 'How long admin session stays active', false),

-- General
('general', 'maintenance_mode', 'false', 'boolean', 'Maintenance Mode', 'Show maintenance page to users', false),
('general', 'appointment_advance_days', '2', 'number', 'Appointment Advance Days', 'Minimum days in advance to book appointment', false),
('general', 'max_images_per_project', '20', 'number', 'Max Images Per Project', 'Maximum number of images per project', false)

ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- DEFAULT SUPERADMIN USER
-- Password: Admin@Samarth2024 (CHANGE IMMEDIATELY AFTER SETUP)
-- Hash generated with bcrypt rounds=12
-- ============================================================
INSERT INTO admin_users (username, email, password_hash, role) VALUES (
    'superadmin',
    'admin@samarthproperties.co.in',
    '$2b$12$placeholder_change_this_immediately_after_first_login',
    'superadmin'
) ON CONFLICT (username) DO NOTHING;

-- NOTE: The actual password hash is generated by the backend setup script.
-- Run: node backend/src/utils/create-admin.js after backend setup.

-- ============================================================
-- SAMARTH PARK-4 PROJECT (Real project data from ads)
-- ============================================================
INSERT INTO projects (
    name, slug, type, status,
    short_description, description,
    city, location, state,
    address,
    price_range_min, price_unit,
    area_min, area_max, area_unit,
    highlights, amenities,
    is_featured, is_published
) VALUES (
    'Samarth Park-4',
    'samarth-park-4',
    'plots',
    'available',
    'PMRDA approved R Zone plots at Karade, near Ranjangaon MIDC. Starting ₹6,51,000/Guntha.',
    'Samarth Park-4 is a premium PMRDA approved residential plotting scheme located at Karade, near Ranjangaon MIDC. Situated in a peaceful, nature-rich environment away from the city noise, this project offers you the perfect opportunity to own your weekend home or build your dream residence. With wide 20-foot concrete roads, 24-hour water supply, compound walls, and street lighting already in place — your plot is ready to build.',
    'Karade, Ranjangaon',
    'Karade, Ranjangaon MIDC',
    'Maharashtra',
    'Karade Village, Ranjangaon MIDC, Ta. Shirur, Ji. Pune',
    651000,
    'per_guntha',
    NULL, NULL, 'guntha',
    ARRAY[
        'PMRDA approved layout',
        'R Zone plots',
        '20 ft concrete internal roads',
        '24-hour water supply',
        'Street lights throughout',
        'Compound wall on all sides',
        'Plot boundary markers',
        'Near Ranjangaon MIDC industrial zone'
    ],
    ARRAY[
        '20 ft Concrete Roads',
        '24-Hour Water',
        'Street Lights',
        'Compound Wall',
        'PMRDA Approved',
        'R Zone'
    ],
    true,
    true
) ON CONFLICT (slug) DO NOTHING;
