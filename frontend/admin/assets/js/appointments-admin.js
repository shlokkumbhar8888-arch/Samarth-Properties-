// ============================================================
// SAMARTH PROPERTIES — Admin Appointments
// File: frontend/admin/assets/js/appointments-admin.js
// ============================================================

(function appointmentsAdmin() {
  'use strict';

  initAdminShell('Appointments', [{ label: 'Appointments' }]);

  const state = { page: 1, pageSize: 20, search: '', status: '', sort: 'created_at:desc', total: 0, loading: false, currentId: null };

  const tbody     = document.getElementById('appt-tbody');
  const countEl   = document.getElementById('appt-count');
  const resultsEl = document.getElementById('appt-results-count');
  const searchEl  = document.getElementById('appt-search');
  const statusSel = document.getElementById('appt-status');
  const sortSel   = document.getElementById('appt-sort');
  const resetBtn  = document.getElementById('appt-reset');
  const exportBtn = document.getElementById('appt-export-btn');

  const drawerClose   = document.getElementById('appt-drawer-close');
  const drawerCancel  = document.getElementById('appt-drawer-cancel');
  const drawerBackdrop= document.getElementById('appt-drawer-backdrop');
  const drawerBody    = document.getElementById('appt-drawer-body');
  const statusChange  = document.getElementById('appt-status-change');
  const saveStatusBtn = document.getElementById('appt-save-status');

  drawerClose?.addEventListener('click',  () => closeDrawer('appt-drawer', 'appt-drawer-backdrop'));
  drawerCancel?.addEventListener('click', () => closeDrawer('appt-drawer', 'appt-drawer-backdrop'));
  drawerBackdrop?.addEventListener('click',() => closeDrawer('appt-drawer', 'appt-drawer-backdrop'));

  // ── Load ──────────────────────────────────────────────────
  async function loadAppts() {
    if (state.loading) return;
    state.loading = true;
    renderAdmSkeletonRows(tbody, 8, 8);

    const [sortField, sortOrder] = state.sort.split(':');
    const params = { page: state.page, pageSize: state.pageSize, sortBy: sortField, sortOrder };
    if (state.search) params.search = state.search;
    if (state.status) params.status = state.status;

    try {
      const res  = await AdminAPI.appointments.list(params);
      const rows = res.data       || [];
      const pag  = res.pagination;

      state.total = pag?.total ?? rows.length;
      if (countEl)   countEl.textContent = `${state.total} appointment${state.total !== 1 ? 's' : ''}`;
      if (resultsEl) resultsEl.textContent = `${state.total} result${state.total !== 1 ? 's' : ''}`;

      if (!rows.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="8">
          <div class="adm-empty"><div class="adm-empty__icon">📅</div>
          <p class="adm-empty__title">No appointments found</p>
          <p class="adm-empty__desc">Site visit bookings appear here.</p></div>
        </td></tr>`;
        document.getElementById('appt-pagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = rows.map(a => {
        const dateStr = a.preferred_date ? admFormatDate(a.preferred_date) : '—';
        const note    = a.message ? (a.message.length > 50 ? a.message.slice(0, 50) + '…' : a.message) : '—';
        const isPast  = a.preferred_date && new Date(a.preferred_date) < new Date();
        return `<tr style="cursor:pointer;" onclick="window._appts.openDetail('${a.id}')">
          <td>
            <p class="adm-table__primary">${a.name}</p>
          </td>
          <td>
            <a href="tel:${a.phone}" onclick="event.stopPropagation()" style="color:var(--adm-text);text-decoration:none;">${a.phone}</a>
          </td>
          <td style="white-space:nowrap;${isPast && a.status === 'pending' ? 'color:var(--adm-error);' : ''}">
            ${dateStr}
            ${isPast && a.status === 'pending' ? '<span style="font-size:.7rem;display:block;color:var(--adm-error);">Overdue</span>' : ''}
          </td>
          <td style="font-size:.82rem;color:var(--adm-text-sm);max-width:180px;">${note}</td>
          <td><span style="font-size:.78rem;color:var(--adm-muted);">${a.source || '—'}</span></td>
          <td><span class="adm-badge adm-badge--${a.status || 'pending'}">${a.status || 'pending'}</span></td>
          <td style="white-space:nowrap;">${admRelative(a.created_at)}</td>
          <td onclick="event.stopPropagation()">
            <div class="adm-row-actions">
              <button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="window._appts.openDetail('${a.id}')" title="View">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              ${a.status === 'pending' ? `
              <button class="adm-btn adm-btn--success adm-btn--sm" onclick="window._appts.quickStatus('${a.id}','confirmed')" title="Confirm">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                Confirm
              </button>` : ''}
              <button class="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete" onclick="window._appts.deleteAppt('${a.id}','${a.name}')">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');

      renderAdmPagination(pag, 'appt-pagination', 'window._appts.goPage');

    } catch (err) {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="8">
        <div class="adm-empty"><div class="adm-empty__icon">⚠️</div>
        <p class="adm-empty__title">Failed to load appointments</p>
        <p class="adm-empty__desc">${err.message}</p></div>
      </td></tr>`;
    } finally {
      state.loading = false;
    }
  }

  // ── Detail drawer ─────────────────────────────────────────
  async function openDetail(id) {
    state.currentId = id;
    openDrawer('appt-drawer', 'appt-drawer-backdrop');
    drawerBody.innerHTML = `<div style="padding:24px 0;"><span class="adm-skeleton" style="width:100%;height:180px;border-radius:8px;display:block;"></span></div>`;

    try {
      const res = await AdminAPI.appointments.list({ id });
      const a   = (res.data || []).find(x => x.id === id) || res.data?.[0] || {};
      if (statusChange) statusChange.value = a.status || 'pending';

      drawerBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:2px;">
          <div class="adm-detail-row"><span class="adm-detail-row__label">Name</span><span class="adm-detail-row__val">${a.name || '—'}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Phone</span><span class="adm-detail-row__val"><a href="tel:${a.phone}" style="color:var(--adm-gold);">${a.phone || '—'}</a></span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Email</span><span class="adm-detail-row__val">${a.email ? `<a href="mailto:${a.email}" style="color:var(--adm-gold);">${a.email}</a>` : '—'}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Visit Date</span><span class="adm-detail-row__val">${admFormatDate(a.preferred_date)}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Source</span><span class="adm-detail-row__val">${a.source || '—'}</span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Status</span><span class="adm-detail-row__val"><span class="adm-badge adm-badge--${a.status || 'pending'}">${a.status || 'pending'}</span></span></div>
          <div class="adm-detail-row"><span class="adm-detail-row__label">Booked</span><span class="adm-detail-row__val">${admFormatDateTime(a.created_at)}</span></div>
          ${a.message ? `<div class="adm-detail-row" style="flex-direction:column;align-items:flex-start;gap:6px;">
            <span class="adm-detail-row__label">Notes</span>
            <p style="font-size:.875rem;line-height:1.65;white-space:pre-wrap;background:var(--adm-bg);border-radius:8px;padding:12px 14px;width:100%;">${a.message}</p>
          </div>` : ''}
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
          <a href="tel:${a.phone}" class="adm-btn adm-btn--success">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </a>
          <a href="https://wa.me/${(a.phone||'').replace(/\D/g,'')}" target="_blank" rel="noopener noreferrer" class="adm-btn adm-btn--secondary">WhatsApp</a>
        </div>`;
    } catch {
      drawerBody.innerHTML = '<p style="color:var(--adm-error);padding:20px 0;">Failed to load details.</p>';
    }
  }

  // ── Quick status update ───────────────────────────────────
  async function quickStatus(id, newStatus) {
    try {
      await AdminAPI.appointments.update(id, { status: newStatus });
      adminToast('success', `Marked as ${newStatus}`, '');
      loadAppts();
    } catch (err) { adminToast('error', 'Update failed', err.message); }
  }

  saveStatusBtn?.addEventListener('click', async () => {
    if (!state.currentId) return;
    const orig = saveStatusBtn.innerHTML;
    saveStatusBtn.disabled = true;
    saveStatusBtn.innerHTML = '<span class="adm-spinner"></span>';
    try {
      await AdminAPI.appointments.update(state.currentId, { status: statusChange.value });
      adminToast('success', 'Status updated', `Appointment marked as ${statusChange.value}.`);
      closeDrawer('appt-drawer', 'appt-drawer-backdrop');
      loadAppts();
    } catch (err) {
      adminToast('error', 'Update failed', err.message);
    } finally {
      saveStatusBtn.disabled = false;
      saveStatusBtn.innerHTML = orig;
    }
  });

  // ── Delete ────────────────────────────────────────────────
  async function deleteAppt(id, name) {
    const ok = await adminConfirm({ title: 'Delete Appointment', desc: `Delete appointment for "${name}"?`, icon: '🗑️', type: 'danger' });
    if (!ok) return;
    try {
      await AdminAPI.appointments.delete(id);
      adminToast('success', 'Deleted', '');
      loadAppts();
    } catch (err) { adminToast('error', 'Delete failed', err.message); }
  }

  // ── Export CSV ────────────────────────────────────────────
  exportBtn?.addEventListener('click', async () => {
    try {
      const res  = await AdminAPI.appointments.list({ pageSize: 1000 });
      const rows = res.data || [];
      const cols = ['name','phone','email','preferred_date','status','source','message','created_at'];
      const csv  = [cols.join(','), ...rows.map(r =>
        cols.map(c => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(',')
      )].join('\n');
      const a    = document.createElement('a');
      a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      a.download = `appointments-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } catch (err) { adminToast('error', 'Export failed', err.message); }
  });

  // ── Events ────────────────────────────────────────────────
  let searchTimer;
  searchEl?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = searchEl.value.trim(); state.page = 1; resetBtn.style.display = ''; loadAppts(); }, 380);
  });
  statusSel?.addEventListener('change', () => { state.status = statusSel.value; state.page = 1; resetBtn.style.display = ''; loadAppts(); });
  sortSel?.addEventListener('change', () => { state.sort = sortSel.value; state.page = 1; loadAppts(); });
  resetBtn?.addEventListener('click', () => {
    state.search = ''; state.status = ''; state.page = 1;
    if (searchEl) searchEl.value = ''; if (statusSel) statusSel.value = '';
    resetBtn.style.display = 'none'; loadAppts();
  });

  const urlStatus = new URLSearchParams(location.search).get('status');
  if (urlStatus && statusSel) { statusSel.value = urlStatus; state.status = urlStatus; }

  window._appts = { goPage: (p) => { state.page = p; loadAppts(); window.scrollTo(0,0); }, openDetail, deleteAppt, quickStatus };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAppts);
  } else {
    loadAppts();
  }
})();
