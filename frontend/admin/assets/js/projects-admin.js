// ============================================================
// SAMARTH PROPERTIES — Admin Projects
// File: frontend/admin/assets/js/projects-admin.js
// ============================================================

(function projectsAdmin() {
  'use strict';

  initAdminShell('Projects', [{ label: 'Projects' }]);

  const state = { page: 1, pageSize: 15, search: '', type: '', status: '', sort: 'created_at:desc', total: 0, loading: false };

  const tbody       = document.getElementById('projects-tbody');
  const countEl     = document.getElementById('projects-count');
  const resultsEl   = document.getElementById('proj-results-count');
  const searchEl    = document.getElementById('proj-search');
  const typeEl      = document.getElementById('proj-type');
  const statusEl    = document.getElementById('proj-status');
  const sortEl      = document.getElementById('proj-sort');
  const resetBtn    = document.getElementById('proj-reset');

  function formatPrice(min, max, unit) {
    const suffix = { sqft: '/sqft', per_plot: '/plot', total: '' }[unit] || '';
    const fmt = n => n >= 10000000 ? (n/10000000).toFixed(1) + 'Cr' : n >= 100000 ? (n/100000).toFixed(1) + 'L' : n;
    if (min && max) return `₹${fmt(min)}–${fmt(max)}${suffix}`;
    if (min) return `₹${fmt(min)}+${suffix}`;
    return '—';
  }

  async function loadProjects() {
    if (state.loading) return;
    state.loading = true;
    renderAdmSkeletonRows(tbody, 9, 8);

    const [sortField, sortOrder] = state.sort.split(':');
    const params = { page: state.page, pageSize: state.pageSize, sortBy: sortField, sortOrder };
    if (state.search) params.search = state.search;
    if (state.type)   params.type   = state.type;
    if (state.status) params.status = state.status;

    try {
      const res     = await AdminAPI.projects.list(params);
      const projects = res.data || [];
      const pag      = res.pagination;

      state.total = pag?.total ?? projects.length;
      if (countEl) countEl.textContent = `${state.total} project${state.total !== 1 ? 's' : ''}`;
      if (resultsEl) resultsEl.textContent = state.total ? `${state.total} result${state.total !== 1 ? 's' : ''}` : '';

      if (!projects.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="9">
          <div class="adm-empty"><div class="adm-empty__icon">🏗️</div>
          <p class="adm-empty__title">No projects found</p>
          <p class="adm-empty__desc">Try adjusting your filters or <a href="project-form.html" style="color:var(--adm-gold);">add the first project</a>.</p></div>
        </td></tr>`;
        document.getElementById('proj-pagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = projects.map(p => `
        <tr>
          <td>
            ${p.cover_image_url
              ? `<img class="adm-table__img" src="${p.cover_image_url}" alt="${p.name}" loading="lazy">`
              : `<div class="adm-table__img-placeholder">🏠</div>`}
          </td>
          <td>
            <p class="adm-table__primary">${p.name}</p>
            <p class="adm-table__secondary">${p.slug}</p>
          </td>
          <td><span class="adm-badge adm-badge--${p.type}">${p.type}</span></td>
          <td><span class="adm-badge adm-badge--${p.status}">${p.status}</span></td>
          <td>${p.city || '—'}</td>
          <td style="white-space:nowrap;">${formatPrice(p.price_range_min, p.price_range_max, p.price_unit)}</td>
          <td style="text-align:center;">${p.is_featured ? '⭐' : '—'}</td>
          <td style="white-space:nowrap;">${admFormatDate(p.created_at)}</td>
          <td>
            <div class="adm-row-actions">
              <a href="project-form.html?id=${p.id}" class="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="Edit">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <a href="../../pages/project-detail.html?slug=${p.slug}" target="_blank" class="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="View on site">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button class="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete" onclick="window._adminProjects.deleteProject('${p.id}','${p.name}')">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`).join('');

      renderAdmPagination(pag, 'proj-pagination', 'window._adminProjects.goPage');

    } catch (err) {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="9">
        <div class="adm-empty"><div class="adm-empty__icon">⚠️</div>
        <p class="adm-empty__title">Failed to load projects</p>
        <p class="adm-empty__desc">${err.message}</p></div>
      </td></tr>`;
    } finally {
      state.loading = false;
    }
  }

  async function deleteProject(id, name) {
    const confirmed = await adminConfirm({
      title: 'Delete Project',
      desc:  `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      icon:  '🗑️',
      type:  'danger',
    });
    if (!confirmed) return;

    try {
      await AdminAPI.projects.delete(id);
      adminToast('success', 'Project deleted', `"${name}" has been removed.`);
      loadProjects();
    } catch (err) {
      adminToast('error', 'Delete failed', err.message);
    }
  }

  function resetFilters() {
    state.search = ''; state.type = ''; state.status = ''; state.page = 1;
    if (searchEl) searchEl.value = '';
    if (typeEl)   typeEl.value   = '';
    if (statusEl) statusEl.value = '';
    resetBtn.style.display = 'none';
    loadProjects();
  }

  // Public API for inline handlers
  window._adminProjects = {
    goPage:        (p) => { state.page = p; loadProjects(); window.scrollTo(0, 0); },
    deleteProject: deleteProject,
  };

  // Events
  let searchTimer;
  searchEl?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchEl.value.trim();
      state.page   = 1;
      resetBtn.style.display = state.search || state.type || state.status ? '' : 'none';
      loadProjects();
    }, 380);
  });

  typeEl?.addEventListener('change', () => { state.type = typeEl.value; state.page = 1; resetBtn.style.display = ''; loadProjects(); });
  statusEl?.addEventListener('change', () => { state.status = statusEl.value; state.page = 1; resetBtn.style.display = ''; loadProjects(); });
  sortEl?.addEventListener('change', () => { state.sort = sortEl.value; state.page = 1; loadProjects(); });
  resetBtn?.addEventListener('click', resetFilters);

  // Handle ?status filter from dashboard quick links
  const urlStatus = new URLSearchParams(location.search).get('status');
  if (urlStatus && statusEl) { statusEl.value = urlStatus; state.status = urlStatus; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
  } else {
    loadProjects();
  }
})();
