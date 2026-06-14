// ============================================================
// SAMARTH PROPERTIES — Authentication Controller
// File: backend/src/controllers/auth.controller.js
// ============================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');
const { writeAuditLog } = require('../middleware/audit.middleware');
const { JWT_ADMIN_EXPIRY, JWT_CONFIG_EXPIRY } = require('../config/constants');

/**
 * Sign a JWT for an admin user.
 */
function signToken(admin, panel = 'admin') {
    const expiry = panel === 'config' ? JWT_CONFIG_EXPIRY : JWT_ADMIN_EXPIRY;
    return jwt.sign(
        { id: admin.id, username: admin.username, role: admin.role, panel },
        process.env.JWT_SECRET,
        { expiresIn: expiry }
    );
}

/**
 * Record a login attempt in login_attempts table.
 */
async function recordLoginAttempt(username, ip, success, panel) {
    await supabase.from('login_attempts').insert({ username, ip_address: ip, success, panel });
}

// ── POST /api/admin/auth/login ────────────────────────────────
async function adminLogin(req, res) {
    const { username, password } = req.body;
    const ip = req.ip;

    try {
        // Fetch admin by username or email
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('id, username, email, password_hash, role, is_active, login_attempts, locked_until, display_name')
            .or(`username.eq.${username},email.eq.${username}`)
            .single();

        if (error || !admin) {
            await recordLoginAttempt(username, ip, false, 'admin');
            return sendError(res, 'Invalid credentials', 401);
        }

        // Check lockout
        if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
            await recordLoginAttempt(username, ip, false, 'admin');
            return sendError(res, 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', 403);
        }

        if (!admin.is_active) {
            return sendError(res, 'Account is deactivated. Contact superadmin.', 403);
        }

        // Config-role users cannot log into the admin panel
        if (admin.role === 'config') {
            return sendError(res, 'Use the config panel to log in.', 403);
        }

        const passwordValid = await bcrypt.compare(password, admin.password_hash);

        if (!passwordValid) {
            const newAttempts = (admin.login_attempts || 0) + 1;
            const updateData = { login_attempts: newAttempts };

            // Lock after 5 failed attempts for 15 minutes
            if (newAttempts >= 5) {
                updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                updateData.login_attempts = 0;
            }

            await supabase.from('admin_users').update(updateData).eq('id', admin.id);
            await recordLoginAttempt(username, ip, false, 'admin');
            return sendError(res, 'Invalid credentials', 401);
        }

        // Reset counters on successful login
        await supabase.from('admin_users').update({
            login_attempts: 0,
            locked_until: null,
            last_login: new Date().toISOString(),
        }).eq('id', admin.id);

        await recordLoginAttempt(username, ip, true, 'admin');

        await writeAuditLog({
            adminId: admin.id,
            adminUsername: admin.username,
            action: 'LOGIN',
            entityType: 'admin_panel',
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
        });

        const token = signToken(admin, 'admin');

        return sendSuccess(res, {
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                displayName: admin.display_name || admin.username,
            },
        }, 'Login successful');
    } catch (err) {
        console.error('[Auth Login Error]', err);
        sendError(res, 'Login failed', 500);
    }
}

// ── POST /api/config/auth/login ───────────────────────────────
async function configLogin(req, res) {
    const { username, password } = req.body;
    const ip = req.ip;

    try {
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('id, username, email, password_hash, role, is_active, login_attempts, locked_until, display_name')
            .or(`username.eq.${username},email.eq.${username}`)
            .single();

        if (error || !admin) {
            await recordLoginAttempt(username, ip, false, 'config');
            return sendError(res, 'Invalid credentials', 401);
        }

        if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
            await recordLoginAttempt(username, ip, false, 'config');
            return sendError(res, 'Account temporarily locked. Try again in 15 minutes.', 403);
        }

        if (!admin.is_active) {
            return sendError(res, 'Account is deactivated.', 403);
        }

        // Only config and superadmin can access config panel
        if (!['config', 'superadmin'].includes(admin.role)) {
            return sendError(res, 'Access denied. Config panel requires config or superadmin role.', 403);
        }

        const passwordValid = await bcrypt.compare(password, admin.password_hash);

        if (!passwordValid) {
            const newAttempts = (admin.login_attempts || 0) + 1;
            const updateData = { login_attempts: newAttempts };
            if (newAttempts >= 5) {
                updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                updateData.login_attempts = 0;
            }
            await supabase.from('admin_users').update(updateData).eq('id', admin.id);
            await recordLoginAttempt(username, ip, false, 'config');
            return sendError(res, 'Invalid credentials', 401);
        }

        await supabase.from('admin_users').update({
            login_attempts: 0,
            locked_until: null,
            last_login: new Date().toISOString(),
        }).eq('id', admin.id);

        await recordLoginAttempt(username, ip, true, 'config');

        await writeAuditLog({
            adminId: admin.id,
            adminUsername: admin.username,
            action: 'LOGIN',
            entityType: 'config_panel',
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
        });

        const token = signToken(admin, 'config');

        return sendSuccess(res, {
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                displayName: admin.display_name || admin.username,
            },
        }, 'Login successful');
    } catch (err) {
        console.error('[Config Login Error]', err);
        sendError(res, 'Login failed', 500);
    }
}

// ── GET /api/admin/auth/me ────────────────────────────────────
async function getMe(req, res) {
    try {
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('id, username, email, role, is_active, last_login, avatar_url, display_name, created_at')
            .eq('id', req.admin.id)
            .single();

        if (error || !admin) return sendError(res, 'Admin not found', 404);

        sendSuccess(res, admin, 'Profile fetched');
    } catch (err) {
        console.error('[Auth Me Error]', err);
        sendError(res, 'Failed to fetch profile', 500);
    }
}

// ── POST /api/admin/auth/change-password ─────────────────────
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    try {
        const { data: admin, error } = await supabase
            .from('admin_users')
            .select('id, password_hash')
            .eq('id', req.admin.id)
            .single();

        if (error || !admin) return sendError(res, 'Admin not found', 404);

        const valid = await bcrypt.compare(currentPassword, admin.password_hash);
        if (!valid) return sendError(res, 'Current password is incorrect', 400);

        const newHash = await bcrypt.hash(newPassword, 12);
        await supabase.from('admin_users').update({ password_hash: newHash }).eq('id', req.admin.id);

        await writeAuditLog({
            adminId: req.admin.id,
            adminUsername: req.admin.username,
            action: 'PASSWORD_CHANGE',
            entityType: 'admin_users',
            entityId: req.admin.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
        console.error('[Change Password Error]', err);
        sendError(res, 'Failed to change password', 500);
    }
}

// ── GET /api/admin/auth/dashboard-stats ──────────────────────
async function getDashboardStats(req, res) {
    try {
        const { data, error } = await supabase
            .from('dashboard_stats')
            .select('*')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Dashboard stats fetched');
    } catch (err) {
        console.error('[Dashboard Stats Error]', err);
        sendError(res, 'Failed to fetch dashboard stats', 500);
    }
}

module.exports = {
    adminLogin,
    configLogin,
    getMe,
    changePassword,
    getDashboardStats,
};
