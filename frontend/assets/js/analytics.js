// ============================================================
// SAMARTH PROPERTIES — Internal Analytics Tracker
// File: frontend/assets/js/analytics.js
// Tracks page views + session duration → backend /api/public/analytics/track
// ============================================================

(function initAnalytics() {
  if (!APP_CONFIG.ENABLE_ANALYTICS_TRACKING) return;

  const sessionId = getSessionId();
  const pageStartTime = Date.now();
  const pagePath = window.location.pathname + window.location.search;
  const pageTitle = document.title;
  const referrer = document.referrer || null;
  let tracked = false;

  async function track(durationSeconds = null) {
    if (tracked) return;
    tracked = true;

    try {
      await API.analytics.track({
        session_id: sessionId,
        page_path: pagePath,
        page_title: pageTitle,
        referrer,
        duration_seconds: durationSeconds,
      });
    } catch {
      // Silently fail — analytics should never break the user experience
    }
  }

  // Track on first meaningful interaction (3s timer or beforeunload)
  const initialTimer = setTimeout(() => track(), 3000);

  // Track with duration on unload
  window.addEventListener('beforeunload', () => {
    clearTimeout(initialTimer);
    const duration = Math.round((Date.now() - pageStartTime) / 1000);
    // Use sendBeacon for reliable unload tracking
    const payload = JSON.stringify({
      session_id: sessionId,
      page_path: pagePath,
      page_title: pageTitle,
      referrer,
      duration_seconds: duration,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${APP_CONFIG.API_BASE}/public/analytics/track`,
        new Blob([payload], { type: 'application/json' })
      );
    }
  });

  // Track immediately if page is not loaded fresh (e.g. back-nav)
  if (document.readyState === 'complete') {
    setTimeout(() => track(), 1500);
  } else {
    window.addEventListener('load', () => setTimeout(() => track(), 1500));
  }
})();
