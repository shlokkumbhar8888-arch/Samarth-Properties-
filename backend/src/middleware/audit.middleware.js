// ============================================================
// SAMARTH PROPERTIES — Audit Log Middleware
// File: backend/src/middleware/audit.middleware.js
// ============================================================

const { supabase } = require('../config/supabase');

/**
 * Write an audit log entry to the audit_logs table.
 * Called after a successful admin action.
 */
async function writeAuditLog({
    adminId,
    adminUsername,
    action,
    entityType = null,
    entityId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
}) {
    try {
        await supabase.from('audit_logs').insert({
            admin_id: adminId,
            admin_username: adminUsername,
            action,
            entity_type: entityType,
            entity_id: entityId || null,
            old_values: oldValues,
            new_values: newValues,
            ip_address: ipAddress,
            user_agent: userAgent,
        });
    } catch (err) {
        // Audit failures must not break the main request
        console.error('[Audit Log Error]', err.message);
    }
}

/**
 * Express middleware factory — use as a response finish hook.
 * Automatically logs successful mutating requests (POST/PUT/PATCH/DELETE).
 *
 * Usage: router.post('/resource', verifyToken, auditMiddleware('CREATE', 'project'), handler)
 */
function auditMiddleware(action, entityType) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            if (body && body.success && req.admin) {
                const entityId = body.data?.id || req.params?.id || null;

                writeAuditLog({
                    adminId: req.admin.id,
                    adminUsername: req.admin.username,
                    action,
                    entityType,
                    entityId,
                    newValues: req.method !== 'DELETE' ? req.body : null,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                });
            }
            return originalJson(body);
        };

        next();
    };
}

module.exports = { writeAuditLog, auditMiddleware };
