// ============================================================
// SAMARTH PROPERTIES — Rate Limiting Middleware
// File: backend/src/middleware/rateLimit.middleware.js
// ============================================================

const rateLimit = require('express-rate-limit');
const { RATE_WINDOW_MS, RATE_MAX_REQUESTS, LOGIN_RATE_MAX } = require('../config/constants');

/**
 * Default rate limiter — applied to all public API routes.
 */
const generalLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
    skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Strict limiter for login endpoints — prevents brute force attacks.
 */
const loginLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: LOGIN_RATE_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
    skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Form submission limiter — prevents spam on enquiry / appointment forms.
 */
const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many form submissions. Please try again after 1 hour.',
    },
    skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Upload limiter — applied to media upload endpoints.
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many uploads. Please wait before uploading more files.',
    },
    skip: () => process.env.NODE_ENV === 'test',
});

module.exports = { generalLimiter, loginLimiter, formLimiter, uploadLimiter };
