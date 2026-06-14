// ============================================================
// SAMARTH PROPERTIES — Config Panel Routes (JWT + Config Role)
// File: backend/src/routes/config.js
// ============================================================

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditMiddleware } = require('../middleware/audit.middleware');

const {
    configLogin,
} = require('../controllers/auth.controller');

const {
    getSettings,
    getSettingsByCategory,
    updateSetting,
    bulkUpdateSettings,
    getAuditLogs,
    getLoginAttempts,
    listAdmins,
    createAdmin,
    updateAdmin,
} = require('../controllers/config.controller');

// ── Config Login (no JWT needed) ─────────────────────────────
router.post('/auth/login', loginLimiter, [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
], configLogin);

// ════════════════════════════════════════════════════════════
// PROTECTED CONFIG ROUTES
// Only 'config' and 'superadmin' roles allowed
// ════════════════════════════════════════════════════════════

router.use(verifyToken);
router.use(requireRole('config', 'admin', 'superadmin'));

// ── Settings ──────────────────────────────────────────────────
router.get('/settings', getSettings);
router.get('/settings/:category', [
    param('category').trim().notEmpty(), validate,
], getSettingsByCategory);

router.put('/settings/:category/:key', auditMiddleware('UPDATE', 'config_settings'), [
    param('category').trim().notEmpty(),
    param('key').trim().notEmpty(),
    body('value').exists(),
    validate,
], updateSetting);

router.post('/settings/bulk', auditMiddleware('UPDATE', 'config_settings'), [
    body('settings').isArray({ min: 1 }).withMessage('Settings array is required'),
    validate,
], bulkUpdateSettings);

// ── Audit & Security ──────────────────────────────────────────
router.get('/audit-logs', getAuditLogs);
router.get('/login-attempts', getLoginAttempts);

// ── Admin User Management (superadmin only for create/update) ─
router.get('/admins', listAdmins);

router.post('/admins', requireRole('superadmin'), auditMiddleware('CREATE', 'admin_users'), [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3, max: 50 }),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'config', 'superadmin']).withMessage('Invalid role'),
    validate,
], createAdmin);

router.patch('/admins/:id', requireRole('superadmin'), auditMiddleware('UPDATE', 'admin_users'), [
    param('id').isUUID().withMessage('Invalid admin ID'),
    validate,
], updateAdmin);

module.exports = router;
