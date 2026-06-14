// ============================================================
// SAMARTH PROPERTIES — Admin Enquiries
// File: frontend/admin/assets/js/enquiries-admin.js
// ============================================================

(function enquiriesAdmin() {
  'use strict';

  initAdminShell('Enquiries', [{ label: 'Enquiries' }]);

  const state = { page: 1, pageSize: 20, search: '', status: '', sort: 'created_at:desc', total: 0, loading: false, currentId: null };

  const tbody      = document.getElementById('enq-tbody');
  const countEl    = document.getElementById('enq-count');
  const resultsEl  = document.getElementById('enq-results-count');
  const searchEl   = document.getElementById('enq-search');
  const statusSel  = document.getElementById('enq-status');
  const sortSel    = document.getElementById('enq-sort');
  const resetBtn   = document.getElementById('enq-reset');
  const exportBtn  = document.getElementById('enq-export-btn');

  // Drawer
  const drawer         = document.getElementById('enq-drawer');
  const backdrop       = document.getElementById('enq-drawer-backdrop');
  const drawerClose    = document.getElementById('enq-drawer-close');
  const drawerCancel   = document.getElementById('enq-drawer-cancel');
  const drawerBody     = document.getElementById('enq-drawer-body');
  const statusChange   = document.getElementById('enq-status-change');
  const saveStatusBtn  = document.getElementById('enq-save-status');

  drawerClose?.addEventListener('click',  () => closeDrawer('enq-drawer', 'enq-drawer-backdrop'));
  drawerCancel?.addEventListener('click', () => closeDrawer('enq-drawer', 'enq-drawer-backdrop'));
  backdrop?.addEventListener('click',     () => closeDrawer('enq-drawer', 'enq-drawer-backdrop'));

  // ── Load enquiries ────────────────────────────────────────
  async function loadEnquiries() {
    if (state.loading) return;
    state.loading = true;
    renderAdmSkeletonRows(tbody, 8, 8);

    const [sortField, sortOrder] = state.sort.split(':');
    const params = { page: state.page, pageSize: state.pageSize, sortBy: sortField, sortOrder };
    if (state.search) params.search = state.search;
    if (state.status) params.status = state.status;

    try {
      const res  = await AdminAPI.enquiries.list(params);
      const rows = res.data       || [];
      const pag  = res.pagination;

      state.total = pag?.total ?? rows.length;
      if (countEl)   countEl.textContent = `${state.total} enquir${state.total !== 1 ? 'ies' : 'y'}`;
      if (resultsEl) resultsEl.textContent = `${state.total} result${state.total !== 1 ? 's' : ''}`;

      if (!rows.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="8">
          <div class="adm-empty"><div class="adm-empty__icon">✉️</div>
          <p class="adm-empty__title">No enquiries found</p>
          <p class="adm-empty__desc">Enquiries from your contact and project pages appear here.</p></div>
        </td></tr>`;
        document.getElementById('enq-pagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = rows.map(e => {
        const msg = e.message ? (e.message.length > 60 ? e.message.slice(0, 60) + '…' : e.message) : '—';
        return `<tr style="cursor:pointer;" onclick="window._enquiries.openDetail('${e.id}')">
          <td>
            <p class="adm-table__primary">${e.name}</p>
          </td>
          <td>
            <a href="tel:${e.phone}" onclick="event.stopPropagation()" style="color:var(--adm-text);text-decoration:none;">${e.phone}</a>
          </td>
          <td>${e.email ? `<a href="mailto:${e.email}" onclick="event.stopPropagation()" style="color:var(--adm-text);text-decoration:none;">${e.email}</a>` : '—'}</td>
          <td style="max-width:200px;color:var(--adm-text-sm);font-size:.82rem;">${msg}</td>
          <td><span style="font-size:.78rem;color:var(--adm-muted);">${e.source || '—'}</span></td>
          <td><span class="adm-badge adm-badge--${e.status || 'open'}">${e.status || 'open'}</span></td>
          <td style="white-space:nowrap;">${admRelative(e.created_at)}</td>
          <td onclick="event.stopPropagation()">
            <div class="adm-row-actions">
              <button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="window._enquiries.openDetail('${e.id}')" title="View details">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <a href="tel:${e.phone}" class="adm-btn adm-btn--success adm-btn--sm adm-btn--icon" title="Call">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
              <button class="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete" onclick="window._enquiries.deleteEnq('${e.id}','${e.name}')">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');

      renderAdmPagination(pag, 'enq-pagination', 'window._enquiries.goPage');

    } catch (err) {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="8">
        <div class="adm-empty"><div class="adm-empty__icon">⚠️</div>
        <p class="adm-empty__title">Failed to load enquiries</p>
        <p class="adm-empty__desc">${err.message}</p></div>
      </td></tr>`;
    } finally {
      state.loading = false;
    }
  }

  // ── Detail drawer ─────────────────────────────────────────
  let _currentEnquiry = null;

  function openDetail(id) {
    state.currentId = id;
    const rows = document.querySelectorAll(`#enq-tbody tr[onclick*="${id}"]`);
    // Find from last loaded data via API
    AdminAPI.enquiries.list({ page: 1, pageSize: 1 }).catch(() => {});

    // Immediately render with table row data as fallback, then fetch proper detail
    fetchAndShowDetail(id);
  }

  async function fetchAndShowDetail(id) {
    openDrawer('enq-drawer', 'enq-drawer-backdrop');
    drawerBody.innerHTML = '<div style="padding:20px 0;display:flex;justify-content:center;"><span class="adm-skeleton" style="width:100%;height:200px;border-radius:8px;display:block;"></span></div>';

    try {
      // Try to load from list (no single-enquiry endpoint required)
      const res = await AdminAPI.enquiries.list({ id });
      const e   = (res.data || []).find(x => x.id === id) || res.data?.[0] || {};
      _currentEnquiry = e;

      if (statusChange) statusChange.value = e.status || 'open';

      drawerBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:2px;">
          <div class="adm-detail-row"><span class="adm-detail-row__label">Name</span><span class="adm-detail-row__val">${e.name || '—'}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Phone</span><span class="adm-detail-row__val"><a href="tel:${e.phone}" style="color:var(--adm-gold);">${e.phone || '—'}</a></span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Email</span><span class="adm-detail-row__val">${e.email ? `<a href="mailto:${e.email}" style="color:var(--adm-gold);">${e.email}</a>` : '—'}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Source</span><span class="adm-detail-row__val">${e.source || '—'}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Status</span><span class="adm-detail-row__val"><span class="adm-badge adm-badge--${e.status || 'open'}">${e.status || 'open'}</span></span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Received</span><span class="adm-detail-row__val">${admFormatDateTime(e.created_at)}</span></div>
          <div class="adm-detail-row" style="flex-direction:column;align-items:flex-start;gap:6px;">
            <span class="adm-detail-row__label">Message</span>
            <p style="font-size:.875rem;line-height:1.65;color:var(--adm-text);white-space:pre-wrap;background:var(--adm-bg);border-radius:8px;padding:14px 16px;width:100%;">${e.message || '—'}</p>
          </div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;">
          <a href="tel:${e.phone}" class="adm-btn adm-btn--success">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call ${e.name?.split(' ')[0] || 'Now'}
          </a>
          ${e.email ? `<a href="mailto:${e.email}" class="adm-btn adm-btn--secondary">Email</a>` : ''}
          <a href="https://wa.me/${(e.phone||'').replace(/\D/g,'')}" target="_blank" class="adm-btn adm-btn--secondary" rel="noopener noreferrer">WhatsApp</a>
        </div>`;
    } catch {
      drawerBody.innerHTML = '<p style="color:var(--adm-error);padding:20px 0;">Failed to load enquiry details.</p>';
    }
  }

  // ── Update status ─────────────────────────────────────────
  saveStatusBtn?.addEventListener('click', async () => {
    if (!state.currentId) return;
    const newStatus = statusChange.value;
    const orig = saveStatusBtn.innerHTML;
    saveStatusBtn.disabled = true;
    saveStatusBtn.innerHTML = '<span class="adm-spinner"></span>';

    try {
      await AdminAPI.enquiries.update(state.currentId, { status: newStatus });
      adminToast('success', 'Status updated', `Enquiry marked as ${newStatus}.`);
      closeDrawer('enq-drawer', 'enq-drawer-backdrop');
      loadEnquiries();
    } catch (err) {
      adminToast('error', 'Update failed', err.message);
    } finally {
      saveStatusBtn.disabled = false;
      saveStatusBtn.innerHTML = orig;
    }
  });

  // ── Delete ────────────────────────────────────────────────
  async function deleteEnq(id, name) {
    const confirmed = await adminConfirm({
      title: 'Delete Enquiry',
      desc:  `Permanently delete enquiry from "${name}"? This cannot be undone.`,
      icon:  '🗑️', type: 'danger',
    });
    if (!confirmed) return;
    try {
      await AdminAPI.enquiries.delete(id);
      adminToast('success', 'Enquiry deleted', '');
      loadEnquiries();
    } catch (err) { adminToast('error', 'Delete failed', err.message); }
  }

  // ── Export CSV ────────────────────────────────────────────
  exportBtn?.addEventListener('click', async () => {
    try {
      const res  = await AdminAPI.enquiries.list({ pageSize: 1000 });
      const rows = res.data || [];
      const cols = ['name','phone','email','source','status','message','created_at'];
      const csv  = [cols.join(','), ...rows.map(r =>
        cols.map(c => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(',')
      )].join('\n');
      const a    = document.createElement('a');
      a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      a.download = `enquiries-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } catch (err) { adminToast('error', 'Export failed', err.message); }
  });

  // ── Reset filters ─────────────────────────────────────────
  function resetFilters() {
    state.search = ''; state.status = ''; state.page = 1;
    if (searchEl) searchEl.value = '';
    if (statusSel) statusSel.value = '';
    resetBtn.style.display = 'none';
    loadEnquiries();
  }

  // ── Events ────────────────────────────────────────────────
  let searchTimer;
  searchEl?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchEl.value.trim();
      state.page   = 1;
      resetBtn.style.display = state.search || state.status ? '' : 'none';
      loadEnquiries();
    }, 380);
  });

  statusSel?.addEventListener('change', () => { state.status = statusSel.value; state.page = 1; resetBtn.style.display = ''; loadEnquiries(); });
  sortSel?.addEventListener('change',   () => { state.sort = sortSel.value; state.page = 1; loadEnquiries(); });
  resetBtn?.addEventListener('click', resetFilters);

  // Handle ?status= from dashboard quick link
  const urlStatus = new URLSearchParams(location.search).get('status');
  if (urlStatus && statusSel) { statusSel.value = urlStatus; state.status = urlStatus; }

  window._enquiries = {
    goPage:     (p) => { state.page = p; loadEnquiries(); window.scrollTo(0,0); },
    openDetail: openDetail,
    deleteEnq:  deleteEnq,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEnquiries);
  } else {
    loadEnquiries();
  }
})();
