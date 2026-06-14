// ============================================================
// SAMARTH PROPERTIES — Application Constants
// File: backend/src/config/constants.js
// ============================================================

module.exports = {
    // ── Roles ─────────────────────────────────────────────────
    ROLES: {
        SUPERADMIN: 'superadmin',
        ADMIN: 'admin',
        CONFIG: 'config',
    },

    // ── Project ────────────────────────────────────────────────
    PROJECT_TYPES: ['plots', 'residential', 'commercial', 'villa', 'apartment'],
    PROJECT_STATUSES: ['ongoing', 'completed', 'upcoming'],

    // ── Enquiry ────────────────────────────────────────────────
    ENQUIRY_STATUSES: ['new', 'contacted', 'qualified', 'lost', 'converted'],
    ENQUIRY_SOURCES: ['contact-form', 'project-page', 'popup', 'exit-intent', 'brochure', 'whatsapp'],

    // ── Appointment ────────────────────────────────────────────
    APPOINTMENT_STATUSES: ['pending', 'confirmed', 'cancelled', 'completed'],
    APPOINTMENT_SOURCES: ['website', 'phone', 'walk-in', 'referral'],
    APPOINTMENT_TIME_SLOTS: [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
        '06:00 PM',
    ],

    // ── Blog ──────────────────────────────────────────────────
    BLOG_STATUSES: ['draft', 'published', 'archived'],

    // ── Media ─────────────────────────────────────────────────
    STORAGE_BUCKETS: ['projects', 'team', 'blogs', 'testimonials', 'media'],
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_DOC_TYPES: ['application/pdf'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024,

    // ── Pagination ────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 100,

    // ── JWT ───────────────────────────────────────────────────
    JWT_ADMIN_EXPIRY: process.env.JWT_ADMIN_EXPIRY || '8h',
    JWT_CONFIG_EXPIRY: process.env.JWT_CONFIG_EXPIRY || '4h',

    // ── Rate Limiting ─────────────────────────────────────────
    RATE_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    RATE_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    LOGIN_RATE_MAX: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),

    // ── Image Processing ──────────────────────────────────────
    IMAGE_QUALITY: parseInt(process.env.IMAGE_QUALITY || '85'),
    THUMBNAIL_WIDTH: parseInt(process.env.THUMBNAIL_WIDTH || '400'),
    THUMBNAIL_HEIGHT: parseInt(process.env.THUMBNAIL_HEIGHT || '300'),
    LARGE_IMAGE_WIDTH: parseInt(process.env.LARGE_IMAGE_WIDTH || '1920'),
    LARGE_IMAGE_HEIGHT: parseInt(process.env.LARGE_IMAGE_HEIGHT || '1080'),
    WEBP_QUALITY: parseInt(process.env.WEBP_QUALITY || '80'),

    // ── Audit Actions ─────────────────────────────────────────
    AUDIT_ACTIONS: {
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        CREATE: 'CREATE',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        UPLOAD: 'UPLOAD',
        PASSWORD_CHANGE: 'PASSWORD_CHANGE',
        STATUS_CHANGE: 'STATUS_CHANGE',
    },
};
