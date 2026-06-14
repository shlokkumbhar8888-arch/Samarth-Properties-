// ============================================================
// SAMARTH PROPERTIES — Admin Dashboard
// File: frontend/admin/assets/js/dashboard.js
// ============================================================

(function dashboardPage() {
  'use strict';

  initAdminShell('Dashboard', [{ label: 'Dashboard' }]);

  async function loadStats() {
    try {
      const res   = await AdminAPI.stats.get();
      const stats = res.data || res;

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? '—';
      };

      set('stat-projects',      stats.total_projects       ?? '—');
      set('stat-enquiries',     stats.total_enquiries      ?? '—');
      set('stat-appts',         stats.total_appointments   ?? '—');
      set('stat-blogs',         stats.total_blogs          ?? '—');
      set('stat-team',          stats.total_team           ?? '—');
      set('stat-testimonials',  stats.total_testimonials   ?? '—');
      set('stat-open-leads',    stats.open_enquiries       ?? '—');
      set('stat-pending-visits',stats.pending_appointments ?? '—');

      const openEl = document.getElementById('stat-enquiries-open');
      if (openEl && stats.open_enquiries != null) {
        openEl.textContent = `${stats.open_enquiries} unread`;
      }

      const pendEl = document.getElementById('stat-appts-pending');
      if (pendEl && stats.pending_appointments != null) {
        pendEl.textContent = `${stats.pending_appointments} pending`;
      }

      const pubEl = document.getElementById('stat-blogs-published');
      if (pubEl && stats.published_blogs != null) {
        pubEl.textContent = `${stats.published_blogs} published`;
      }

      // Update sidebar nav badges
      const enquiriesBadge = document.getElementById('nav-badge-enquiries');
      if (enquiriesBadge && stats.open_enquiries > 0) {
        enquiriesBadge.textContent   = stats.open_enquiries;
        enquiriesBadge.style.display = '';
      }

      const apptsBadge = document.getElementById('nav-badge-appts');
      if (apptsBadge && stats.pending_appointments > 0) {
        apptsBadge.textContent   = stats.pending_appointments;
        apptsBadge.style.display = '';
      }

    } catch (err) {
      console.error('Stats error:', err.message);
      ['stat-projects','stat-enquiries','stat-appts','stat-blogs',
       'stat-team','stat-testimonials','stat-open-leads','stat-pending-visits']
        .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '—'; });
    }
  }

  async function loadRecentEnquiries() {
    const tbody = document.getElementById('recent-enquiries-tbody');
    renderAdmSkeletonRows(tbody, 4, 5);
    try {
      const res  = await AdminAPI.enquiries.list({ page: 1, pageSize: 8 });
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="4">No enquiries yet</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.slice(0, 8).map(e => `
        <tr>
          <td>
            <p class="adm-table__primary">${e.name}</p>
            <p class="adm-table__secondary">${e.phone}</p>
          </td>
          <td>${e.phone}</td>
          <td><span class="adm-badge adm-badge--${e.status || 'open'}">${e.status || 'open'}</span></td>
          <td>${admRelative(e.created_at)}</td>
        </tr>`).join('');
    } catch {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="4">Failed to load</td></tr>`;
    }
  }

  async function loadRecentAppointments() {
    const tbody = document.getElementById('recent-appts-tbody');
    renderAdmSkeletonRows(tbody, 3, 5);
    try {
      const res  = await AdminAPI.appointments.list({ page: 1, pageSize: 8 });
      const rows = res.data || [];
      if (!rows.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="3">No appointments yet</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.slice(0, 8).map(a => `
        <tr>
          <td>
            <p class="adm-table__primary">${a.name}</p>
            <p class="adm-table__secondary">${a.phone}</p>
          </td>
          <td>${admFormatDate(a.preferred_date)}</td>
          <td><span class="adm-badge adm-badge--${a.status || 'pending'}">${a.status || 'pending'}</span></td>
        </tr>`).join('');
    } catch {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="3">Failed to load</td></tr>`;
    }
  }

  function init() {
    loadStats();
    loadRecentEnquiries();
    loadRecentAppointments();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
