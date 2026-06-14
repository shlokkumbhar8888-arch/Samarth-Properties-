// ============================================================
// SAMARTH PROPERTIES — Input Validation Middleware
// File: backend/src/middleware/validate.middleware.js
// ============================================================

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Run after express-validator chains. Collects errors and returns 422 if any exist.
 * Usage: router.post('/path', [validationChain...], validate, handler)
 */
function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formatted = errors.array().map((e) => ({
            field: e.path || e.param,
            message: e.msg,
        }));
        return sendError(res, 'Validation failed', 422, formatted);
    }

    next();
}

/**
 * Sanitize string — strip HTML tags from a value.
 * Used as a custom sanitizer in express-validator chains.
 */
function stripHtml(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate phone number — Indian format with optional country code.
 */
function isValidPhone(phone) {
    return /^(\+91|91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

module.exports = { validate, stripHtml, isValidPhone };
