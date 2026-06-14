// ============================================================
// SAMARTH PROPERTIES — Admin Routes (JWT Required)
// File: backend/src/routes/admin.js
// ============================================================

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { adminOrAbove, superadminOnly } = require('../middleware/role.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const { validate, isValidPhone } = require('../middleware/validate.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

// ── Auth ──────────────────────────────────────────────────────
const {
    adminLogin,
    getMe,
    changePassword,
    getDashboardStats,
} = require('../controllers/auth.controller');

// ── Projects ──────────────────────────────────────────────────
const {
    adminListProjects,
    adminGetProject,
    createProject,
    updateProject,
    toggleVisibility,
    deleteProject,
} = require('../controllers/projects.controller');

// ── Appointments ──────────────────────────────────────────────
const {
    listAppointments,
    getAppointment,
    updateAppointment,
    markAllRead: markAppointmentsRead,
    deleteAppointment,
} = require('../controllers/appointments.controller');

// ── Enquiries ─────────────────────────────────────────────────
const {
    listEnquiries,
    getEnquiry,
    updateEnquiry,
    markAllRead: markEnquiriesRead,
    deleteEnquiry,
} = require('../controllers/enquiries.controller');

// ── Testimonials ──────────────────────────────────────────────
const {
    adminListTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
} = require('../controllers/testimonials.controller');

// ── Blogs ─────────────────────────────────────────────────────
const {
    adminListBlogs,
    adminGetBlog,
    createBlog,
    updateBlog,
    deleteBlog,
} = require('../controllers/blogs.controller');

// ── Team ─────────────────────────────────────────────────────
const {
    adminListTeam,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
} = require('../controllers/team.controller');

// ── Content ───────────────────────────────────────────────────
const {
    adminGetContent,
    updateContentValue,
    bulkUpdateContent,
} = require('../controllers/content.controller');

// ── Analytics ─────────────────────────────────────────────────
const {
    getAnalyticsOverview,
    getRecentVisits,
    getLeadsStats,
} = require('../controllers/analytics.controller');

// ════════════════════════════════════════════════════════════
// AUTH ROUTES (public — no JWT)
// ════════════════════════════════════════════════════════════

router.post('/auth/login', loginLimiter, [
    body('username').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
], adminLogin);

// ════════════════════════════════════════════════════════════
// PROTECTED ROUTES (JWT required from here down)
// ════════════════════════════════════════════════════════════

router.use(verifyToken);
router.use(adminOrAbove);

// ── Auth — Protected ──────────────────────────────────────────
router.get('/auth/me', getMe);
router.get('/auth/dashboard-stats', getDashboardStats);
router.post('/auth/change-password', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    validate,
], changePassword);

// ── Projects ──────────────────────────────────────────────────
router.get('/projects', adminListProjects);
router.get('/projects/:id', [
    param('id').isUUID().withMessage('Invalid project ID'), validate,
], adminGetProject);

router.post('/projects', auditMiddleware('CREATE', 'project'), [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 255 }),
    body('type').isIn(['plots', 'residential', 'commercial', 'villa', 'apartment']).withMessage('Invalid project type'),
    body('status').optional().isIn(['available', 'ongoing', 'completed', 'upcoming']),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    validate,
], createProject);

router.put('/projects/:id', auditMiddleware('UPDATE', 'project'), [
    param('id').isUUID().withMessage('Invalid project ID'),
    body('name').optional().trim().notEmpty().isLength({ max: 255 }),
    body('type').optional().isIn(['plots', 'residential', 'commercial', 'villa', 'apartment']),
    validate,
], updateProject);

router.patch('/projects/:id/visibility', auditMiddleware('STATUS_CHANGE', 'project'), [
    param('id').isUUID().withMessage('Invalid project ID'),
    body('is_visible').isBoolean().withMessage('is_visible must be a boolean'),
    validate,
], toggleVisibility);

router.delete('/projects/:id', superadminOnly, auditMiddleware('DELETE', 'project'), [
    param('id').isUUID().withMessage('Invalid project ID'), validate,
], deleteProject);

// ── Appointments ──────────────────────────────────────────────
router.get('/appointments', listAppointments);
router.get('/appointments/:id', [param('id').isUUID(), validate], getAppointment);
router.patch('/appointments/mark-read', markAppointmentsRead);
router.patch('/appointments/:id', auditMiddleware('UPDATE', 'appointment'), [
    param('id').isUUID(), validate,
], updateAppointment);
router.delete('/appointments/:id', [param('id').isUUID(), validate], deleteAppointment);

// ── Enquiries ─────────────────────────────────────────────────
router.get('/enquiries', listEnquiries);
router.get('/enquiries/:id', [param('id').isUUID(), validate], getEnquiry);
router.patch('/enquiries/mark-read', markEnquiriesRead);
router.patch('/enquiries/:id', auditMiddleware('UPDATE', 'enquiry'), [
    param('id').isUUID(), validate,
], updateEnquiry);
router.delete('/enquiries/:id', [param('id').isUUID(), validate], deleteEnquiry);

// ── Testimonials ──────────────────────────────────────────────
router.get('/testimonials', adminListTestimonials);
router.post('/testimonials', auditMiddleware('CREATE', 'testimonial'), [
    body('client_name').trim().notEmpty().withMessage('Client name is required'),
    body('review').trim().notEmpty().withMessage('Review is required'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    validate,
], createTestimonial);
router.put('/testimonials/:id', auditMiddleware('UPDATE', 'testimonial'), [
    param('id').isUUID(), validate,
], updateTestimonial);
router.delete('/testimonials/:id', [param('id').isUUID(), validate], deleteTestimonial);

// ── Blogs ─────────────────────────────────────────────────────
router.get('/blogs', adminListBlogs);
router.get('/blogs/:id', [param('id').isUUID(), validate], adminGetBlog);
router.post('/blogs', auditMiddleware('CREATE', 'blog'), [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 500 }),
    body('status').optional().isIn(['draft', 'published', 'archived']),
    validate,
], createBlog);
router.put('/blogs/:id', auditMiddleware('UPDATE', 'blog'), [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty().isLength({ max: 500 }),
    validate,
], updateBlog);
router.delete('/blogs/:id', [param('id').isUUID(), validate], deleteBlog);

// ── Team ─────────────────────────────────────────────────────
router.get('/team', adminListTeam);
router.post('/team', auditMiddleware('CREATE', 'team'), [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('designation').trim().notEmpty().withMessage('Designation is required'),
    validate,
], createTeamMember);
router.put('/team/:id', auditMiddleware('UPDATE', 'team'), [
    param('id').isUUID(), validate,
], updateTeamMember);
router.delete('/team/:id', [param('id').isUUID(), validate], deleteTeamMember);

// ── Content (CMS) ─────────────────────────────────────────────
router.get('/content', adminGetContent);
router.put('/content/:section/:key', auditMiddleware('UPDATE', 'site_content'), [
    param('section').trim().notEmpty(),
    param('key').trim().notEmpty(),
    body('value').exists(),
    validate,
], updateContentValue);
router.post('/content/bulk', auditMiddleware('UPDATE', 'site_content'), [
    body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
    validate,
], bulkUpdateContent);

// ── Analytics ─────────────────────────────────────────────────
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/recent', getRecentVisits);
router.get('/analytics/leads', getLeadsStats);

module.exports = router;
