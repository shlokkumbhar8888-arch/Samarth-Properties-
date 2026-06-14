// ============================================================
// SAMARTH PROPERTIES — Public Routes (No Auth Required)
// File: backend/src/routes/public.js
// ============================================================

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const { generalLimiter, formLimiter } = require('../middleware/rateLimit.middleware');
const { validate, isValidPhone } = require('../middleware/validate.middleware');

const {
    listProjects,
    getProjectBySlug,
    getFeaturedProjects,
} = require('../controllers/projects.controller');

const {
    bookAppointment,
} = require('../controllers/appointments.controller');

const {
    submitEnquiry,
    brochureDownload,
} = require('../controllers/enquiries.controller');

const {
    listTestimonials,
} = require('../controllers/testimonials.controller');

const {
    listBlogs,
    getBlogBySlug,
} = require('../controllers/blogs.controller');

const {
    listTeam,
} = require('../controllers/team.controller');

const {
    getContent,
    getContentValue,
} = require('../controllers/content.controller');

const {
    trackPageView,
} = require('../controllers/analytics.controller');

// Apply general rate limiter to all public routes
router.use(generalLimiter);

// ── Projects ──────────────────────────────────────────────────
const { getProjectTypes } = require('../controllers/projects.controller');
router.get('/projects/types', getProjectTypes);
router.get('/projects', listProjects);
router.get('/projects/featured', getFeaturedProjects);
router.get('/projects/:slug', [
    param('slug').trim().isSlug().withMessage('Invalid project slug'),
    validate,
], getProjectBySlug);

// ── Testimonials ──────────────────────────────────────────────
router.get('/testimonials', listTestimonials);

// ── Blogs ─────────────────────────────────────────────────────
router.get('/blogs', listBlogs);
router.get('/blogs/:slug', [
    param('slug').trim().notEmpty().withMessage('Slug is required'),
    validate,
], getBlogBySlug);

// ── Team ─────────────────────────────────────────────────────
router.get('/team', listTeam);

// ── Public Site Settings (homepage content, brand, etc) ──────
const { getPublicSettings } = require('../controllers/config.controller');
router.get('/settings', getPublicSettings);

// ── Site Content (CMS) ────────────────────────────────────────
router.get('/content', getContent);
router.get('/content/:section/:key', [
    param('section').trim().notEmpty(),
    param('key').trim().notEmpty(),
    validate,
], getContentValue);

// ── Enquiry Form ─────────────────────────────────────────────
router.post('/enquiries', formLimiter, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
        .custom((val) => {
            if (!isValidPhone(val)) throw new Error('Invalid Indian phone number');
            return true;
        }),
    body('email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Invalid email address'),
    body('message').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 2000 }),
    body('project_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid project ID'),
    validate,
], submitEnquiry);

// ── Appointment / Site Visit Booking ─────────────────────────
router.post('/appointments', formLimiter, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
        .custom((val) => {
            if (!isValidPhone(val)) throw new Error('Invalid Indian phone number');
            return true;
        }),
    body('email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Invalid email'),
    body('preferred_date').notEmpty().withMessage('Preferred date is required').isDate().withMessage('Invalid date format'),
    body('preferred_time').trim().notEmpty().withMessage('Preferred time is required'),
    body('project_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid project ID'),
    validate,
], bookAppointment);

// ── Brochure Download (Lead Capture) ─────────────────────────
router.post('/brochure-download', formLimiter, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
        .custom((val) => {
            if (!isValidPhone(val)) throw new Error('Invalid Indian phone number');
            return true;
        }),
    body('email').optional({ nullable: true, checkFalsy: true }).trim().isEmail().withMessage('Invalid email'),
    body('project_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid project ID'),
    validate,
], brochureDownload);

// ── Analytics Page View Tracking ─────────────────────────────
router.post('/analytics/track', [
    body('page_path').trim().notEmpty().withMessage('page_path is required').isLength({ max: 500 }),
    body('session_id').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 255 }),
    validate,
], trackPageView);

module.exports = router;
