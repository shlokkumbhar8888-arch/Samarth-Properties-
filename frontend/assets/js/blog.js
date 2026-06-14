// ============================================================
// SAMARTH PROPERTIES — Blog Listing Page
// File: frontend/assets/js/blog.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function blogPage() {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  const state = {
    category: 'all',
    search:   '',
    sort:     '',
    page:     1,
    total:    0,
    pageSize: 9,
    loading:  false,
    featuredId: null, // skip featured post in grid
  };

  // ── DOM refs ──────────────────────────────────────────────
  const grid          = document.getElementById('blog-grid');
  const pagination    = document.getElementById('blog-pagination');
  const resultsCount  = document.getElementById('blog-results-count');
  const resetBtn      = document.getElementById('blog-reset-filters');
  const searchInput   = document.getElementById('blog-search-input');
  const searchClear   = document.getElementById('blog-search-clear');
  const sortSelect    = document.getElementById('blog-sort-select');
  const featuredWrap  = document.getElementById('blog-featured-wrap');
  const featuredEl    = document.getElementById('blog-featured');

  // ── Debounce ──────────────────────────────────────────────
  let searchTimer = null;
  function debounce(fn, ms) {
    return (...args) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => fn(...args), ms); };
  }

  // ── Featured post ─────────────────────────────────────────
  async function loadFeatured() {
    try {
      const res   = await API.blogs.list({ limit: 1, featured: true });
      const posts = res.data || [];
      if (!posts.length) return;

      const p = posts[0];
      state.featuredId = p.id;

      const imgSrc = p.cover_image_url || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=80';

      featuredEl.innerHTML = `
        <div class="blog-featured__img-wrap">
          <img class="blog-featured__img" src="${imgSrc}" alt="${p.title}" loading="lazy">
          ${p.category ? `<span class="blog-card__category blog-featured__category-badge">${p.category}</span>` : ''}
        </div>
        <div class="blog-featured__body">
          <p class="blog-featured__eyebrow">Featured Article</p>
          <h2 class="blog-featured__title">
            <a href="blog-detail.html?slug=${p.slug}">${p.title}</a>
          </h2>
          ${p.excerpt ? `<p class="blog-featured__excerpt">${p.excerpt}</p>` : ''}
          <div class="blog-featured__meta">
            <span class="blog-featured__meta-item">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${formatDate(p.published_at)}
            </span>
            ${p.read_time_mins ? `
            <span class="blog-featured__meta-item">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${p.read_time_mins} min read
            </span>` : ''}
          </div>
          <a href="blog-detail.html?slug=${p.slug}" class="btn btn--primary btn--round">Read Article</a>
        </div>
      `;
      featuredWrap.hidden = false;
    } catch {
      // Featured stays hidden
    }
  }

  // ── Load posts ────────────────────────────────────────────
  async function loadPosts() {
    if (state.loading) return;
    state.loading = true;

    showSkeletons();

    const params = { page: state.page, pageSize: state.pageSize };
    if (state.category !== 'all') params.category = state.category;
    if (state.search)             params.search   = state.search;
    if (state.sort)               params.sort     = state.sort;

    try {
      const res   = await API.blogs.list(params);
      const posts = res.data       || [];
      const pag   = res.pagination;

      state.total = pag ? pag.total : posts.length;

      renderPosts(posts);
      renderPagination(pag);
      renderMeta();
      syncUrl();

      if (window.SP && window.SP.initReveal) window.SP.initReveal();

    } catch (err) {
      console.error('Blog load error:', err.message);
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state__icon">⚠️</div>
        <p class="empty-state__title">Could not load articles</p>
        <p class="empty-state__desc">Please refresh the page or try again later.</p>
      </div>`;
      pagination.hidden = true;
    } finally {
      state.loading = false;
    }
  }

  function showSkeletons() {
    grid.innerHTML = Array(6).fill(skeletonBlogCard()).join('');
    pagination.hidden = true;
  }

  function renderPosts(posts) {
    if (!posts.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state__icon">📰</div>
        <p class="empty-state__title">No articles found</p>
        <p class="empty-state__desc">Try adjusting your search or category filter.</p>
        <button class="btn btn--secondary btn--sm btn--round" onclick="window.SP_Blog.reset()">Clear Filters</button>
      </div>`;
      return;
    }
    grid.innerHTML = posts.map(renderBlogCard).join('');
  }

  function renderMeta() {
    if (resultsCount) {
      resultsCount.textContent = state.total === 0
        ? 'No articles found'
        : `${state.total} article${state.total !== 1 ? 's' : ''}`;
    }
    const hasFilters = state.category !== 'all' || state.search || state.sort;
    if (resetBtn) resetBtn.hidden = !hasFilters;
  }

  // ── Pagination ────────────────────────────────────────────
  function renderPagination(pag) {
    if (!pag || pag.totalPages <= 1) { pagination.hidden = true; return; }
    pagination.hidden = false;
    const { page, totalPages } = pag;
    const pages = buildPageRange(page, totalPages);

    pagination.innerHTML = [
      `<button class="pagination__btn" ${page <= 1 ? 'disabled' : ''} onclick="window.SP_Blog.goPage(${page - 1})" aria-label="Previous">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
       </button>`,
      ...pages.map(p => p === '…'
        ? `<span class="pagination__btn" aria-hidden="true">…</span>`
        : `<button class="pagination__btn${p === page ? ' active' : ''}" onclick="window.SP_Blog.goPage(${p})" aria-label="Page ${p}" ${p === page ? 'aria-current="page"' : ''}>${p}</button>`
      ),
      `<button class="pagination__btn" ${page >= totalPages ? 'disabled' : ''} onclick="window.SP_Blog.goPage(${page + 1})" aria-label="Next">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
       </button>`,
    ].join('');
  }

  function buildPageRange(cur, tot) {
    if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
    if (cur <= 4)        return [1, 2, 3, 4, 5, '…', tot];
    if (cur >= tot - 3)  return [1, '…', tot-4, tot-3, tot-2, tot-1, tot];
    return [1, '…', cur-1, cur, cur+1, '…', tot];
  }

  // ── URL sync ──────────────────────────────────────────────
  function syncUrl() {
    const p = new URLSearchParams();
    if (state.category !== 'all') p.set('category', state.category);
    if (state.search)             p.set('q', state.search);
    if (state.sort)               p.set('sort', state.sort);
    if (state.page > 1)           p.set('page', state.page);
    history.replaceState({}, '', p.toString() ? `${location.pathname}?${p}` : location.pathname);
  }

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (p.has('category')) state.category = p.get('category');
    if (p.has('q'))        state.search   = p.get('q');
    if (p.has('sort'))     state.sort     = p.get('sort');
    if (p.has('page'))     state.page     = Math.max(1, parseInt(p.get('page')) || 1);
  }

  // ── Filters ───────────────────────────────────────────────
  function setCategoryFilter(cat) {
    state.category = cat;
    state.page     = 1;
    document.querySelectorAll('#category-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', (p.dataset.category || 'all') === cat);
    });
    loadPosts();
  }

  function resetFilters() {
    state.category = 'all';
    state.search   = '';
    state.sort     = '';
    state.page     = 1;
    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.hidden = true;
    if (sortSelect)  sortSelect.value  = '';
    document.querySelectorAll('#category-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.category === 'all');
    });
    loadPosts();
  }

  // ── Newsletter form ───────────────────────────────────────
  function initNewsletter() {
    const form   = document.getElementById('newsletter-form');
    const submit = document.getElementById('nl-submit-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(form);

      const nameEl  = form.querySelector('[name="name"]');
      const phoneEl = form.querySelector('[name="phone"]');
      let valid = true;

      if (!nameEl.value.trim())              { showFieldError(nameEl, 'Name is required');            valid = false; }
      if (!phoneEl.value.trim())             { showFieldError(phoneEl, 'Phone is required');           valid = false; }
      else if (!validatePhone(phoneEl.value)){ showFieldError(phoneEl, 'Enter a valid 10-digit number'); valid = false; }
      if (!valid) return;

      const orig = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="btn-spinner"></span> Subscribing…';

      try {
        await API.enquiry.submit({
          name:    nameEl.value.trim(),
          phone:   phoneEl.value.trim(),
          message: 'Newsletter subscription request from blog page.',
          source:  'newsletter',
        });
        form.innerHTML = `<div class="cta-success">
          <div class="cta-success__icon">🎉</div>
          <h4 class="cta-success__title" style="color:var(--white);">You're subscribed!</h4>
          <p class="cta-success__msg" style="color:rgba(255,255,255,.65);">We'll send you market insights and property tips every week.</p>
        </div>`;
      } catch (err) {
        window.SP?.toast('error', 'Subscription Failed', err.message || 'Please try again.');
        submit.disabled  = false;
        submit.innerHTML = orig;
      }
    });
  }

  // ── Event listeners ───────────────────────────────────────
  function initEvents() {
    document.querySelectorAll('#category-filters .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => setCategoryFilter(pill.dataset.category || 'all'));
    });

    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        state.search = searchInput.value.trim();
        state.page   = 1;
        if (searchClear) searchClear.hidden = !state.search;
        loadPosts();
      }, 400));
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') { searchInput.value = ''; state.search = ''; state.page = 1; if (searchClear) searchClear.hidden = true; loadPosts(); }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = ''; state.search = ''; state.page = 1;
        searchClear.hidden = true; searchInput.focus(); loadPosts();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; loadPosts(); });
    }

    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  }

  // ── Public API for inline onclick ─────────────────────────
  window.SP_Blog = {
    goPage: (p) => { state.page = p; loadPosts(); document.querySelector('.blog-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    reset:  resetFilters,
  };

  // ── Sync UI from URL ──────────────────────────────────────
  function syncUiToState() {
    if (searchInput && state.search) { searchInput.value = state.search; if (searchClear) searchClear.hidden = false; }
    if (sortSelect && state.sort)    { sortSelect.value = state.sort; }
    document.querySelectorAll('#category-filters .filter-pill').forEach(p => {
      p.classList.toggle('active', (p.dataset.category || 'all') === state.category);
    });
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    readUrl();
    syncUiToState();
    initEvents();
    initNewsletter();
    loadFeatured();
    loadPosts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
