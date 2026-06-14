// ============================================================
// SAMARTH PROPERTIES — Role-Based Access Middleware
// File: backend/src/middleware/role.middleware.js
// ============================================================

const { sendError } = require('../utils/response');
const { ROLES } = require('../config/constants');

// Role hierarchy — higher index = more privilege
const ROLE_HIERARCHY = [ROLES.CONFIG, ROLES.ADMIN, ROLES.SUPERADMIN];

/**
 * Require the authenticated admin to have one of the specified roles.
 * Usage: requireRole('superadmin') or requireRole('admin', 'superadmin')
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.admin) {
            return sendError(res, 'Authentication required', 401);
        }

        if (!allowedRoles.includes(req.admin.role)) {
            return sendError(
                res,
                `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                403
            );
        }

        next();
    };
}

/**
 * Require the authenticated admin to have AT LEAST the specified minimum role level.
 * E.g. requireMinRole('admin') allows both admin and superadmin.
 */
function requireMinRole(minRole) {
    return (req, res, next) => {
        if (!req.admin) {
            return sendError(res, 'Authentication required', 401);
        }

        const minIdx = ROLE_HIERARCHY.indexOf(minRole);
        const userIdx = ROLE_HIERARCHY.indexOf(req.admin.role);

        if (userIdx < minIdx) {
            return sendError(res, `Access denied. Minimum required role: ${minRole}`, 403);
        }

        next();
    };
}

/**
 * Require superadmin role only.
 */
const superadminOnly = requireRole(ROLES.SUPERADMIN);

/**
 * Require admin or superadmin role.
 */
const adminOrAbove = requireMinRole(ROLES.ADMIN);

/**
 * Allow any authenticated role (config, admin, superadmin).
 */
const anyRole = requireMinRole(ROLES.CONFIG);

module.exports = { requireRole, requireMinRole, superadminOnly, adminOrAbove, anyRole };
