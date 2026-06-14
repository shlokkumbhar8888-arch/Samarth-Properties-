// ============================================================
// SAMARTH PROPERTIES — Config Settings Controller
// File: backend/src/controllers/config.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// ── GET /api/config/settings ──────────────────────────────────
async function getSettings(req, res) {
    try {
        const { category } = req.query;

        let query = supabase
            .from('config_settings')
            .select('id, category, key, value, value_type, label, description, is_sensitive, updated_at')
            .order('category')
            .order('key');

        if (category) query = query.eq('category', category);

        const { data, error } = await query;

        if (error) throw error;

        // Mask sensitive values
        const masked = data.map((row) => ({
            ...row,
            value: row.is_sensitive && row.value ? '••••••••' : row.value,
        }));

        sendSuccess(res, masked, 'Settings fetched');
    } catch (err) {
        console.error('[Get Settings Error]', err);
        sendError(res, 'Failed to fetch settings', 500);
    }
}

// ── GET /api/config/settings/:category ───────────────────────
async function getSettingsByCategory(req, res) {
    try {
        const { category } = req.params;

        const { data, error } = await supabase
            .from('config_settings')
            .select('key, value, value_type, label, description, is_sensitive')
            .eq('category', category)
            .order('key');

        if (error) throw error;

        const result = {};
        for (const row of data) {
            result[row.key] = {
                value: row.is_sensitive && row.value ? '••••••••' : row.value,
                type: row.value_type,
                label: row.label,
                description: row.description,
            };
        }

        sendSuccess(res, result, `${category} settings fetched`);
    } catch (err) {
        console.error('[Get Category Settings Error]', err);
        sendError(res, 'Failed to fetch settings', 500);
    }
}

// ── PUT /api/config/settings/:category/:key ──────────────────
async function updateSetting(req, res) {
    try {
        const { category, key } = req.params;
        const { value, value_type, label, description, is_sensitive } = req.body;

        const { data, error } = await supabase
            .from('config_settings')
            .upsert({
                category,
                key,
                value,
                value_type: value_type || 'text',
                label: label || null,
                description: description || null,
                is_sensitive: is_sensitive || false,
                updated_by: req.admin.id,
            }, { onConflict: 'category,key' })
            .select('id, category, key, value_type, label, is_sensitive')
            .single();

        if (error) throw error;

        sendSuccess(res, data, 'Setting updated');
    } catch (err) {
        console.error('[Update Setting Error]', err);
        sendError(res, 'Failed to update setting', 500);
    }
}

// ── POST /api/config/settings/bulk ───────────────────────────
async function bulkUpdateSettings(req, res) {
    try {
        const { settings } = req.body; // Array of { category, key, value, value_type, is_sensitive }

        if (!Array.isArray(settings) || settings.length === 0) {
            return sendError(res, 'Settings array is required', 400);
        }

        const rows = settings.map((s) => ({
            category: s.category,
            key: s.key,
            value: s.value,
            value_type: s.value_type || 'text',
            label: s.label || null,
            description: s.description || null,
            is_sensitive: s.is_sensitive || false,
            updated_by: req.admin.id,
        }));

        const { data, error } = await supabase
            .from('config_settings')
            .upsert(rows, { onConflict: 'category,key' })
            .select('category, key');

        if (error) throw error;

        sendSuccess(res, data, `${data.length} settings updated`);
    } catch (err) {
        console.error('[Bulk Update Settings Error]', err);
        sendError(res, 'Failed to bulk update settings', 500);
    }
}

// ── GET /api/config/audit-logs ────────────────────────────────
async function getAuditLogs(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const { action, admin_id } = req.query;

        let query = supabase
            .from('audit_logs')
            .select('id, admin_username, action, entity_type, entity_id, ip_address, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (action) query = query.eq('action', action);
        if (admin_id) query = query.eq('admin_id', admin_id);

        const { data, error } = await query;

        if (error) throw error;

        sendSuccess(res, data, 'Audit logs fetched');
    } catch (err) {
        console.error('[Audit Logs Error]', err);
        sendError(res, 'Failed to fetch audit logs', 500);
    }
}

// ── GET /api/config/login-attempts ───────────────────────────
async function getLoginAttempts(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

        const { data, error } = await supabase
            .from('login_attempts')
            .select('id, username, ip_address, success, panel, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        sendSuccess(res, data, 'Login attempts fetched');
    } catch (err) {
        console.error('[Login Attempts Error]', err);
        sendError(res, 'Failed to fetch login attempts', 500);
    }
}

// ── GET /api/config/admins ────────────────────────────────────
async function listAdmins(req, res) {
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, username, email, role, is_active, last_login, display_name, created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;

        sendSuccess(res, data, 'Admin users fetched');
    } catch (err) {
        console.error('[List Admins Error]', err);
        sendError(res, 'Failed to fetch admin users', 500);
    }
}

// ── POST /api/config/admins ───────────────────────────────────
async function createAdmin(req, res) {
    try {
        const bcrypt = require('bcryptjs');
        const { username, email, password, role, display_name } = req.body;

        if (!['admin', 'config', 'superadmin'].includes(role)) {
            return sendError(res, 'Invalid role', 400);
        }

        const hash = await bcrypt.hash(password, 12);

        const { data, error } = await supabase
            .from('admin_users')
            .insert({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password_hash: hash,
                role,
                display_name: display_name?.trim() || null,
            })
            .select('id, username, email, role, created_at')
            .single();

        if (error) {
            if (error.code === '23505') return sendError(res, 'Username or email already exists', 409);
            throw error;
        }

        sendSuccess(res, data, 'Admin created', 201);
    } catch (err) {
        console.error('[Create Admin Error]', err);
        sendError(res, 'Failed to create admin', 500);
    }
}

// ── PATCH /api/config/admins/:id ─────────────────────────────
async function updateAdmin(req, res) {
    try {
        const { id } = req.params;
        const { is_active, role, display_name } = req.body;

        const updateData = {};
        if (is_active !== undefined) updateData.is_active = is_active;
        if (role) updateData.role = role;
        if (display_name) updateData.display_name = display_name.trim();

        const { data, error } = await supabase
            .from('admin_users')
            .update(updateData)
            .eq('id', id)
            .select('id, username, email, role, is_active, display_name')
            .single();

        if (error || !data) return sendError(res, 'Admin not found', 404);

        sendSuccess(res, data, 'Admin updated');
    } catch (err) {
        console.error('[Update Admin Error]', err);
        sendError(res, 'Failed to update admin', 500);
    }
}

// ── GET /api/public/settings (no auth — non-sensitive only) ──
async function getPublicSettings(req, res) {
    try {
        const { data, error } = await supabase
            .from('config_settings')
            .select('category, key, value')
            .eq('is_sensitive', false)
            .order('category')
            .order('key');

        if (error) throw error;

        const grouped = {};
        for (const row of data) {
            if (!grouped[row.category]) grouped[row.category] = {};
            grouped[row.category][row.key] = row.value;
        }

        sendSuccess(res, grouped, 'Settings fetched');
    } catch (err) {
        console.error('[Public Settings Error]', err);
        sendError(res, 'Failed to fetch settings', 500);
    }
}

module.exports = {
    getSettings,
    getSettingsByCategory,
    updateSetting,
    bulkUpdateSettings,
    getAuditLogs,
    getLoginAttempts,
    listAdmins,
    createAdmin,
    updateAdmin,
    getPublicSettings,
};
