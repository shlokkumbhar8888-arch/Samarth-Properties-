// ============================================================
// SAMARTH PROPERTIES — Analytics Controller
// File: backend/src/controllers/analytics.controller.js
// ============================================================

const { supabase } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

// ── POST /api/public/analytics/track ─────────────────────────
async function trackPageView(req, res) {
    try {
        const { session_id, page_path, page_title, referrer, duration_seconds } = req.body;

        if (!page_path) return sendError(res, 'page_path is required', 400);

        const userAgent = req.headers['user-agent'] || '';
        const deviceType = detectDevice(userAgent);
        const browser = detectBrowser(userAgent);
        const os = detectOS(userAgent);

        await supabase.from('visitor_analytics').insert({
            session_id: session_id || null,
            page_path: page_path.trim(),
            page_title: page_title?.trim() || null,
            referrer: referrer?.trim() || null,
            user_agent: userAgent,
            ip_address: req.ip,
            device_type: deviceType,
            browser,
            os,
            duration_seconds: duration_seconds || null,
        });

        sendSuccess(res, null, 'Tracked');
    } catch (err) {
        console.error('[Track Page View Error]', err);
        sendError(res, 'Tracking failed', 500);
    }
}

// ── GET /api/admin/analytics/overview ────────────────────────
async function getAnalyticsOverview(req, res) {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const [pageViews, topPages, deviceBreakdown, browsers] = await Promise.all([
            // Total page views in period
            supabase
                .from('visitor_analytics')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', since),

            // Top pages by view count
            supabase.rpc('get_top_pages', { p_since: since, p_limit: 10 }).catch(() => ({ data: [] })),

            // Device type breakdown
            supabase
                .from('visitor_analytics')
                .select('device_type')
                .gte('created_at', since),

            // Browser breakdown
            supabase
                .from('visitor_analytics')
                .select('browser')
                .gte('created_at', since),
        ]);

        // Calculate device breakdown manually from raw data
        const deviceCounts = {};
        for (const row of (deviceBreakdown.data || [])) {
            const key = row.device_type || 'unknown';
            deviceCounts[key] = (deviceCounts[key] || 0) + 1;
        }

        const browserCounts = {};
        for (const row of (browsers.data || [])) {
            const key = row.browser || 'Unknown';
            browserCounts[key] = (browserCounts[key] || 0) + 1;
        }

        sendSuccess(res, {
            period_days: days,
            total_page_views: pageViews.count || 0,
            top_pages: topPages.data || [],
            device_breakdown: deviceCounts,
            browser_breakdown: browserCounts,
        }, 'Analytics overview fetched');
    } catch (err) {
        console.error('[Analytics Overview Error]', err);
        sendError(res, 'Failed to fetch analytics', 500);
    }
}

// ── GET /api/admin/analytics/recent ──────────────────────────
async function getRecentVisits(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

        const { data, error } = await supabase
            .from('visitor_analytics')
            .select('page_path, page_title, device_type, browser, country, city, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        sendSuccess(res, data, 'Recent visits fetched');
    } catch (err) {
        console.error('[Recent Visits Error]', err);
        sendError(res, 'Failed to fetch recent visits', 500);
    }
}

// ── GET /api/admin/analytics/leads ───────────────────────────
async function getLeadsStats(req, res) {
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const [enquiries, appointments, brochures] = await Promise.all([
            supabase.from('enquiries').select('id, source, created_at', { count: 'exact' }).gte('created_at', since),
            supabase.from('appointments').select('id, created_at', { count: 'exact' }).gte('created_at', since),
            supabase.from('brochure_downloads').select('id, created_at', { count: 'exact' }).gte('created_at', since),
        ]);

        // Source breakdown for enquiries
        const sourceCounts = {};
        for (const row of (enquiries.data || [])) {
            const src = row.source || 'unknown';
            sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        }

        sendSuccess(res, {
            period_days: days,
            total_enquiries: enquiries.count || 0,
            total_appointments: appointments.count || 0,
            total_brochure_downloads: brochures.count || 0,
            enquiry_sources: sourceCounts,
        }, 'Lead stats fetched');
    } catch (err) {
        console.error('[Leads Stats Error]', err);
        sendError(res, 'Failed to fetch lead stats', 500);
    }
}

// ── Helpers ───────────────────────────────────────────────────

function detectDevice(ua) {
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/bot|crawler|spider/i.test(ua)) return 'unknown';
    return 'desktop';
}

function detectBrowser(ua) {
    if (/edg/i.test(ua)) return 'Edge';
    if (/chrome/i.test(ua) && !/chromium/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    if (/opera|opr/i.test(ua)) return 'Opera';
    return 'Other';
}

function detectOS(ua) {
    if (/windows/i.test(ua)) return 'Windows';
    if (/macintosh|mac os x/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    return 'Other';
}

module.exports = {
    trackPageView,
    getAnalyticsOverview,
    getRecentVisits,
    getLeadsStats,
};
