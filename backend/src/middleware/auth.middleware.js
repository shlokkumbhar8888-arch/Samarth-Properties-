// ============================================================
// SAMARTH PROPERTIES — JWT Authentication Middleware
// File: backend/src/middleware/auth.middleware.js
// ============================================================

const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { sendError } = require('../utils/response');

/**
 * Verify JWT from Authorization: Bearer <token>.
 * Attaches decoded user payload to req.admin.
 * Checks that the admin account is still active in the database.
 */
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Authorization token required', 401);
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return sendError(res, 'Token has expired, please log in again', 401);
            }
            return sendError(res, 'Invalid token', 401);
        }

        // Verify admin still exists and is active
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('id, username, email, role, is_active, locked_until')
            .eq('id', decoded.id)
            .single();

        if (error || !admin) {
            return sendError(res, 'Admin account not found', 401);
        }

        if (!admin.is_active) {
            return sendError(res, 'Admin account is deactivated', 403);
        }

        if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
            return sendError(res, 'Admin account is temporarily locked', 403);
        }

        req.admin = {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
        };

        next();
    } catch (err) {
        console.error('[Auth Middleware Error]', err);
        sendError(res, 'Authentication error', 500);
    }
}

/**
 * Optional auth — attaches req.admin if token present but does NOT block unauthenticated requests.
 * Use on public routes that have optional admin-enriched responses.
 */
async function optionalToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: admin } = await supabase
            .from('admin_users')
            .select('id, username, role, is_active')
            .eq('id', decoded.id)
            .single();

        if (admin && admin.is_active) {
            req.admin = { id: admin.id, username: admin.username, role: admin.role };
        }
    } catch {
        // Silently ignore invalid tokens for optional routes
    }

    next();
}

module.exports = { verifyToken, optionalToken };
