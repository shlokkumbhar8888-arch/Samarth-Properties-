// ============================================================
// SAMARTH PROPERTIES — Projects Listing Page
// File: frontend/assets/js/projects.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function projectsPage() {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  const state = {
    type:   'all',
    status: 'all',
    search: '',
    sort:   '',
    page:   1,
    total:  0,
    pageSize: 9,
    viewMode: 'grid', // 'grid' | 'list'
    loading: false,
  };

  // ── DOM refs ──────────────────────────────────────────────
  const grid          = document.getElementById('projects-grid');
  const paginationEl  = document.getElementById('pagination');
  const resultsCount  = document.getElementById('results-count');
  const activeFilters = document.getElementById('active-filters');
  const resetBtn      = document.getElementById('reset-filters');
  const searchInput   = document.getElementById('project-search');
  const searchClear   = document.getElementById('search-clear');
  const sortSelect    = document.getElementById('sort-select');
  const statTotal     = document.getElementById('stat-total');
  const viewGridBtn   = document.getElementById('view-grid');
  const viewListBtn   = document.getElementById('view-list');

  // ── Search debounce ───────────────────────────────────────
  let searchTimer = null;
  function debounce(fn, ms) {
    return (...args) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => fn(...args), ms);
    };
  }

  // ── Load projects ─────────────────────────────────────────
  async function loadProjects() {
    if (state.loading) return;
    state.loading = true;

    showSkeletons();

    const params = {
      page:     state.page,
      pageSize: state.pageSize,
    };
    if (state.type   !== 'all') params.type   = state.type;
    if (state.status !== 'all') params.status = state.status;
    if (state.search)           params.search = state.search;
    if (state.sort)             params.sort   = state.sort;

    try {
      const res     = await API.projects.list(params);
      const projects = res.data   || [];
      const pag      = res.pagination;

      state.total    = pag ? pag.total : projects.length;

      renderProjects(projects);
      renderPagination(pag);
      renderMeta();

      // Update hero stat once
      if (statTotal && statTotal.textContent === '—') {
        statTotal.textContent = state.total + '+';
      }

      // Sync URL params so filters are bookmarkable
      syncUrl();

      // Trigger scroll-reveal for freshly inserted cards
      if (window.SP && window.SP.initReveal) window.SP.initReveal();
      if (window.SP && window.SP.initCompareButtons) window.SP.initCompareButtons();

    } catch (err) {
      console.error('Projects load error:', err.message);
      grid.innerHTML = renderError('Unable to load projects. Please try again.');
      paginationEl.hidden = true;
    } finally {
      state.loading = false;
    }
  }

  // ── Render helpers ────────────────────────────────────────
  function showSkeletons() {
    const count = state.viewMode === 'list' ? 4 : 9;
    grid.innerHTML = Array(count).fill(skeletonCard()).join('');
    paginationEl.hidden = true;
  }

  function renderProjects(projects) {
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state__icon">🏗️</div>
        <p class="empty-state__title">No projects found</p>
        <p class="empty-state__desc">Try adjusting your filters or search term.</p>
        <button class="btn btn--secondary btn--sm btn--round" onclick="window.SP_Projects.reset()">Clear Filters</button>
      </div>`;
      return;
    }
    grid.innerHTML = projects.map(p => renderProjectCard(p)).join('');
  }

  function renderError(msg) {
    return `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-state__icon">⚠️</div>
      <p class="empty-state__title">Something went wrong</p>
      <p class="empty-state__desc">${msg}</p>
      <button class="btn btn--primary btn--sm btn--round" onclick="window.SP_Projects.reload()">Try Again</button>
    </div>`;
  }

  // ── Results metadata ──────────────────────────────────────
  function renderMeta() {
    // Count text
    if (resultsCount) {
      resultsCount.textContent = state.total === 0
        ? 'No projects found'
        : `${state.total} project${state.total !== 1 ? 's' : ''} found`;
    }

    // Active filter tags
    const tags = [];
    if (state.type   !== 'all') tags.push({ label: `Type: ${capitalize(state.type)}`,     key: 'type' });
    if (state.status !== 'all') tags.push({ label: `Status: ${capitalize(state.status)}`, key: 'status' });
    if (state.search)           tags.push({ label: `"${state.search}"`,                   key: 'search' });

    if (activeFilters) {
      activeFilters.innerHTML = tags.map(t => `
        <span class="active-filter-tag">
          ${t.label}
          <button class="active-filter-tag__remove"
            onclick="window.SP_Projects.removeFilter('${t.key}')"
            aria-label="Remove ${t.label} filter"
            title="Remove filter">×</button>
        </span>
      `).join('');
    }

    if (resetBtn) {
      const hasFilters = state.type !== 'all' || state.status !== 'all' || state.search || state.sort;
      resetBtn.hidden = !hasFilters;
    }
  }

  // ── Pagination ────────────────────────────────────────────
  function renderPagination(pag) {
    if (!pag || pag.totalPages <= 1) {
      paginationEl.hidden = true;
      return;
    }

    paginationEl.hidden = false;
    const { page, totalPages } = pag;
    const buttons = [];

    // Prev
    buttons.push(`<button class="pagination__btn" ${page <= 1 ? 'disabled' : ''} onclick="window.SP_Projects.goPage(${page - 1})" aria-label="Previous page">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`);

    // Page numbers (show max 7 with ellipsis)
    const pages = buildPageRange(page, totalPages);
    pages.forEach(p => {
      if (p === '…') {
        buttons.push(`<span class="pagination__btn" aria-hidden="true">…</span>`);
      } else {
        buttons.push(`<button class="pagination__btn${p === page ? ' active' : ''}"
          onclick="window.SP_Projects.goPage(${p})"
          aria-label="Page ${p}"
          ${p === page ? 'aria-current="page"' : ''}>${p}</button>`);
      }
    });

    // Next
    buttons.push(`<button class="pagination__btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.SP_Projects.goPage(${page + 1})" aria-label="Next page">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`);

    paginationEl.innerHTML = buttons.join('');

    // Scroll to top of listing on page change
    document.querySelector('.projects-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function buildPageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (current >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
    return [1, '…', current-1, current, current+1, '…', total];
  }

  // ── URL sync ──────────────────────────────────────────────
  function syncUrl() {
    const params = new URLSearchParams();
    if (state.type   !== 'all') params.set('type',   state.type);
    if (state.status !== 'all') params.set('status', state.status);
    if (state.search)           params.set('q',      state.search);
    if (state.sort)             params.set('sort',   state.sort);
    if (state.page > 1)         params.set('page',   state.page);

    const url = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;

    history.replaceState({ ...state }, '', url);
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('type'))   state.type   = params.get('type');
    if (params.has('status')) state.status = params.get('status');
    if (params.has('q'))      state.search = params.get('q');
    if (params.has('sort'))   state.sort   = params.get('sort');
    if (params.has('page'))   state.page   = Math.max(1, parseInt(params.get('page')) || 1);
  }

  // ── Filter helpers ────────────────────────────────────────
  function setTypeFilter(type) {
    state.type = type;
    state.page = 1;
    // Update pill UI
    document.querySelectorAll('#type-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', (p.dataset.type || 'all') === type);
    });
    loadProjects();
  }

  function setStatusFilter(status) {
    state.status = status;
    state.page   = 1;
    document.querySelectorAll('#status-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', (p.dataset.status || 'all') === status);
    });
    loadProjects();
  }

  function resetFilters() {
    state.type   = 'all';
    state.status = 'all';
    state.search = '';
    state.sort   = '';
    state.page   = 1;

    if (searchInput) { searchInput.value = ''; }
    if (searchClear) { searchClear.hidden = true; }
    if (sortSelect)  { sortSelect.value = ''; }

    document.querySelectorAll('#type-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.type === 'all');
    });
    document.querySelectorAll('#status-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.status === 'all');
    });

    loadProjects();
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    grid.classList.toggle('list-view', mode === 'list');
    grid.classList.toggle('grid--3',   mode === 'grid');

    if (viewGridBtn) {
      viewGridBtn.classList.toggle('view-toggle-btn--active', mode === 'grid');
      viewGridBtn.setAttribute('aria-pressed', String(mode === 'grid'));
    }
    if (viewListBtn) {
      viewListBtn.classList.toggle('view-toggle-btn--active', mode === 'list');
      viewListBtn.setAttribute('aria-pressed', String(mode === 'list'));
    }

    localStorage.setItem('sp_view_mode', mode);
  }

  // ── Event listeners ───────────────────────────────────────
  function initEventListeners() {
    // Type filter pills
    document.querySelectorAll('#type-filters .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => setTypeFilter(pill.dataset.type || 'all'));
    });

    // Status filter pills
    document.querySelectorAll('#status-filters .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => setStatusFilter(pill.dataset.status || 'all'));
    });

    // Search
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        state.search = searchInput.value.trim();
        state.page   = 1;
        if (searchClear) searchClear.hidden = !state.search;
        loadProjects();
      }, 400));

      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') { searchInput.value = ''; state.search = ''; state.page = 1; if (searchClear) searchClear.hidden = true; loadProjects(); }
      });
    }

    // Search clear
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.search = '';
        state.page   = 1;
        searchClear.hidden = true;
        searchInput.focus();
        loadProjects();
      });
    }

    // Sort
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        state.page = 1;
        loadProjects();
      });
    }

    // View toggle
    if (viewGridBtn) viewGridBtn.addEventListener('click', () => setViewMode('grid'));
    if (viewListBtn) viewListBtn.addEventListener('click', () => setViewMode('list'));

    // Reset button
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  }

  // ── Public API (for inline onclick in renderPagination/renderError) ──
  window.SP_Projects = {
    goPage: (p) => { state.page = p; loadProjects(); },
    reset:  resetFilters,
    reload: loadProjects,
    removeFilter: (key) => {
      if (key === 'type')   setTypeFilter('all');
      else if (key === 'status') setStatusFilter('all');
      else if (key === 'search') { state.search = ''; if (searchInput) { searchInput.value = ''; } if (searchClear) searchClear.hidden = true; state.page = 1; loadProjects(); }
    },
  };

  // ── Restore view mode preference ──────────────────────────
  function restoreViewMode() {
    const saved = localStorage.getItem('sp_view_mode') || 'grid';
    setViewMode(saved);
  }

  // ── Sync UI state to state object (from URL) ──────────────
  function syncUiToState() {
    if (searchInput && state.search) { searchInput.value = state.search; if (searchClear) searchClear.hidden = false; }
    if (sortSelect && state.sort)    { sortSelect.value = state.sort; }
    document.querySelectorAll('#type-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', (p.dataset.type || 'all') === state.type);
    });
    document.querySelectorAll('#status-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', (p.dataset.status || 'all') === state.status);
    });
  }

  // ── Util ──────────────────────────────────────────────────
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Dynamic filter pills (show only types/statuses with data) ─
  async function syncFilterPills() {
    try {
      const res  = await fetch(APP_CONFIG.API_BASE + '/public/projects/types');
      if (!res.ok) return;
      const json = await res.json();
      const { types = [], statuses = [] } = json.data || {};

      document.querySelectorAll('#type-filters .filter-pill[data-type]').forEach(pill => {
        const t = pill.dataset.type;
        if (t === 'all') return;
        pill.hidden = !types.includes(t);
      });

      document.querySelectorAll('#status-filters .filter-pill[data-status]').forEach(pill => {
        const s = pill.dataset.status;
        if (s === 'all') return;
        pill.hidden = !statuses.includes(s);
      });
    } catch (_) {}
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    readUrl();
    restoreViewMode();
    syncUiToState();
    initEventListeners();
    loadProjects();
    syncFilterPills();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
