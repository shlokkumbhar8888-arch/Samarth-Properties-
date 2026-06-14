// ============================================================
// SAMARTH PROPERTIES — Admin Testimonials
// File: frontend/admin/assets/js/testimonials-admin.js
// ============================================================

(function testimonialsAdmin() {
  'use strict';

  initAdminShell('Testimonials', [{ label: 'Testimonials' }]);

  const state = { page: 1, pageSize: 20, total: 0 };

  const tbody       = document.getElementById('test-tbody');
  const countEl     = document.getElementById('test-count');
  const addBtn      = document.getElementById('add-test-btn');
  const drawerTitle = document.getElementById('test-drawer-title');
  const drawerClose = document.getElementById('test-drawer-close');
  const drawerCancel= document.getElementById('test-drawer-cancel');
  const backdrop    = document.getElementById('test-drawer-backdrop');
  const saveBtn     = document.getElementById('test-save-btn');
  const form        = document.getElementById('test-form');

  drawerClose?.addEventListener('click',  () => closeDrawer('test-drawer', 'test-drawer-backdrop'));
  drawerCancel?.addEventListener('click', () => closeDrawer('test-drawer', 'test-drawer-backdrop'));
  backdrop?.addEventListener('click',     () => closeDrawer('test-drawer', 'test-drawer-backdrop'));

  // ── Load ──────────────────────────────────────────────────
  async function loadTestimonials() {
    renderAdmSkeletonRows(tbody, 7, 5);
    try {
      const res   = await AdminAPI.testimonials.list({ page: state.page, pageSize: state.pageSize });
      const items = res.data       || [];
      const pag   = res.pagination;

      state.total = pag?.total ?? items.length;
      if (countEl) countEl.textContent = `${state.total} testimonial${state.total !== 1 ? 's' : ''}`;

      if (!items.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="7">
          <div class="adm-empty"><div class="adm-empty__icon">⭐</div>
          <p class="adm-empty__title">No testimonials yet</p>
          <p class="adm-empty__desc">Add client reviews to display on the homepage and about page.</p>
          <button class="adm-btn adm-btn--primary" onclick="document.getElementById('add-test-btn').click()">Add First Review</button></div>
        </td></tr>`;
        document.getElementById('test-pagination').innerHTML = '';
        return;
      }

      const stars = n => '⭐'.repeat(Math.max(1, Math.min(5, n || 5)));
      tbody.innerHTML = items.map(t => {
        const review = t.review ? (t.review.length > 80 ? t.review.slice(0, 80) + '…' : t.review) : '—';
        return `<tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              ${t.photo_url
                ? `<img src="${t.photo_url}" alt="${t.client_name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
                : `<div style="width:36px;height:36px;border-radius:50%;background:var(--adm-bg);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600;color:var(--adm-text-sm);flex-shrink:0;">${(t.client_name||'?').slice(0,2).toUpperCase()}</div>`}
              <p class="adm-table__primary">${t.client_name}</p>
            </div>
          </td>
          <td style="font-size:.82rem;color:var(--adm-text-sm);">${t.client_designation || '—'}</td>
          <td style="font-size:.82rem;color:var(--adm-text-sm);">${t.project_name || '—'}</td>
          <td>${stars(t.rating)}</td>
          <td style="font-size:.82rem;color:var(--adm-text-sm);max-width:220px;">${review}</td>
          <td style="text-align:center;">${t.is_featured ? '⭐' : '—'}</td>
          <td>
            <div class="adm-row-actions">
              <button class="adm-btn adm-btn--ghost adm-btn--sm" onclick="window._tests.editTest('${t.id}')" title="Edit">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" onclick="window._tests.deleteTest('${t.id}','${t.client_name.replace(/'/g,"\\'")}')">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');

      renderAdmPagination(pag, 'test-pagination', 'window._tests.goPage');

    } catch (err) {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="7">
        <div class="adm-empty"><div class="adm-empty__icon">⚠️</div>
        <p class="adm-empty__title">Failed to load</p>
        <p class="adm-empty__desc">${err.message}</p></div>
      </td></tr>`;
    }
  }

  // ── Drawer ────────────────────────────────────────────────
  let editingId = null;

  function openAddDrawer() {
    editingId = null;
    form.reset();
    document.getElementById('ts-rating').value = '5';
    if (drawerTitle) drawerTitle.textContent = 'Add Testimonial';
    openDrawer('test-drawer', 'test-drawer-backdrop');
  }

  async function editTest(id) {
    editingId = id;
    form.reset();
    if (drawerTitle) drawerTitle.textContent = 'Edit Testimonial';
    openDrawer('test-drawer', 'test-drawer-backdrop');

    try {
      const res  = await AdminAPI.testimonials.list({ pageSize: 100 });
      const t    = (res.data || []).find(x => x.id === id);
      if (!t) return;

      document.getElementById('ts-id').value          = t.id;
      document.getElementById('ts-name').value        = t.client_name || '';
      document.getElementById('ts-designation').value = t.client_designation || '';
      document.getElementById('ts-project').value     = t.project_name || '';
      document.getElementById('ts-review').value      = t.review || '';
      document.getElementById('ts-rating').value      = String(t.rating || 5);
      document.getElementById('ts-photo').value       = t.photo_url || '';
      document.getElementById('ts-featured').checked  = Boolean(t.is_featured);
    } catch (err) { adminToast('error', 'Load failed', err.message); }
  }

  // ── Save ──────────────────────────────────────────────────
  saveBtn?.addEventListener('click', async () => {
    const nameVal   = document.getElementById('ts-name').value.trim();
    const reviewVal = document.getElementById('ts-review').value.trim();
    if (!nameVal)   { adminToast('warning', 'Client name required', ''); return; }
    if (!reviewVal) { adminToast('warning', 'Review text required', ''); return; }

    const orig = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="adm-spinner"></span> Saving…';

    const payload = {
      client_name:        nameVal,
      client_designation: document.getElementById('ts-designation').value.trim() || undefined,
      project_name:       document.getElementById('ts-project').value.trim() || undefined,
      review:             reviewVal,
      rating:             Number(document.getElementById('ts-rating').value) || 5,
      photo_url:          document.getElementById('ts-photo').value.trim() || undefined,
      is_featured:        document.getElementById('ts-featured').checked,
    };

    try {
      if (editingId) {
        await AdminAPI.testimonials.update(editingId, payload);
        adminToast('success', 'Testimonial updated', '');
      } else {
        await AdminAPI.testimonials.create(payload);
        adminToast('success', 'Testimonial added', `Review from ${nameVal} has been saved.`);
      }
      closeDrawer('test-drawer', 'test-drawer-backdrop');
      loadTestimonials();
    } catch (err) {
      adminToast('error', 'Save failed', err.message);
    } finally {
      saveBtn.disabled  = false;
      saveBtn.innerHTML = orig;
    }
  });

  // ── Delete ────────────────────────────────────────────────
  async function deleteTest(id, name) {
    const ok = await adminConfirm({ title: 'Delete Testimonial', desc: `Delete review from "${name}"?`, icon: '⭐', type: 'danger' });
    if (!ok) return;
    try {
      await AdminAPI.testimonials.delete(id);
      adminToast('success', 'Testimonial deleted', '');
      loadTestimonials();
    } catch (err) { adminToast('error', 'Delete failed', err.message); }
  }

  addBtn?.addEventListener('click', openAddDrawer);

  window._tests = {
    goPage:     (p) => { state.page = p; loadTestimonials(); window.scrollTo(0,0); },
    editTest,
    deleteTest,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTestimonials);
  } else {
    loadTestimonials();
  }
})();
