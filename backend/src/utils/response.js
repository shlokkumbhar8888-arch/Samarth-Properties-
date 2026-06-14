// ============================================================
// SAMARTH PROPERTIES — Standardized API Response Helpers
// File: backend/src/utils/response.js
// ============================================================

/**
 * Send a successful API response.
 * @param {object} res - Express response object
 * @param {any} data - Response payload
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {object|null} pagination - Optional pagination metadata
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200, pagination = null) {
    const body = { success: true, message, data };
    if (pagination) body.pagination = pagination;
    return res.status(statusCode).json(body);
}

/**
 * Send an error API response.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {any} errors - Optional validation errors or details
 */
function sendError(res, message = 'An error occurred', statusCode = 400, errors = null) {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
}

/**
 * Build pagination metadata from Supabase count + query params.
 */
function buildPagination(total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    return {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

/**
 * Parse page and pageSize from request query, applying limits.
 */
function parsePagination(query, defaultSize = 12) {
    const { MAX_PAGE_SIZE } = require('../config/constants');
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit || query.pageSize) || defaultSize));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { page, pageSize, from, to };
}

module.exports = { sendSuccess, sendError, buildPagination, parsePagination };
