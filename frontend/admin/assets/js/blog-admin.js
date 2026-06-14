// ============================================================
// SAMARTH PROPERTIES — Admin Blog Listing
// File: frontend/admin/assets/js/blog-admin.js
// ============================================================

(function blogAdmin() {
  'use strict';

  initAdminShell('Blog Posts', [{ label: 'Blog Posts' }]);

  const state = { page: 1, pageSize: 15, search: '', status: '', sort: 'created_at:desc', total: 0, loading: false };

  const tbody     = document.getElementById('blog-tbody');
  const countEl   = document.getElementById('blog-count');
  const resultsEl = document.getElementById('blog-results-count');
  const searchEl  = document.getElementById('blog-search');
  const statusSel = document.getElementById('blog-status-filter');
  const sortSel   = document.getElementById('blog-sort');
  const resetBtn  = document.getElementById('blog-reset');

  async function loadPosts() {
    if (state.loading) return;
    state.loading = true;
    renderAdmSkeletonRows(tbody, 8, 8);

    const [sortField, sortOrder] = state.sort.split(':');
    const params = { page: state.page, pageSize: state.pageSize, sortBy: sortField, sortOrder };
    if (state.search) params.search = state.search;
    if (state.status) params.status = state.status;

    try {
      const res   = await AdminAPI.blogs.list(params);
      const posts = res.data       || [];
      const pag   = res.pagination;

      state.total = pag?.total ?? posts.length;
      if (countEl)   countEl.textContent = `${state.total} post${state.total !== 1 ? 's' : ''}`;
      if (resultsEl) resultsEl.textContent = `${state.total} result${state.total !== 1 ? 's' : ''}`;

      if (!posts.length) {
        tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="8">
          <div class="adm-empty"><div class="adm-empty__icon">📝</div>
          <p class="adm-empty__title">No posts yet</p>
          <p class="adm-empty__desc"><a href="blog-form.html" style="color:var(--adm-gold);">Write the first blog post</a></p></div>
        </td></tr>`;
        document.getElementById('blog-pagination').innerHTML = '';
        return;
      }

      tbody.innerHTML = posts.map(p => {
        const statusVal = p.published_at && p.status !== 'draft' ? 'published' : 'draft';
        return `<tr>
          <td>
            ${p.cover_image_url
              ? `<img class="adm-table__img" src="${p.cover_image_url}" alt="${p.title}" loading="lazy" style="object-fit:cover;">`
              : `<div class="adm-table__img-placeholder">📰</div>`}
          </td>
          <td>
            <p class="adm-table__primary">${p.title}</p>
            <p class="adm-table__secondary">${p.slug}</p>
          </td>
          <td>${p.category || '—'}</td>
          <td>${p.author_name || '—'}</td>
          <td><span class="adm-badge adm-badge--${statusVal}">${statusVal}</span></td>
          <td style="text-align:center;">${p.is_featured ? '⭐' : '—'}</td>
          <td style="white-space:nowrap;">${p.published_at ? admFormatDate(p.published_at) : '—'}</td>
          <td>
            <div class="adm-row-actions">
              <a href="blog-form.html?id=${p.id}" class="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="Edit">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <a href="../../pages/blog-detail.html?slug=${p.slug}" target="_blank" class="adm-btn adm-btn--ghost adm-btn--sm adm-btn--icon" title="View on site">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button class="adm-btn adm-btn--${statusVal === 'published' ? 'secondary' : 'success'} adm-btn--sm" onclick="window._blogAdmin.togglePublish('${p.id}','${statusVal}')" title="${statusVal === 'published' ? 'Unpublish' : 'Publish'}">
                ${statusVal === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button class="adm-btn adm-btn--danger adm-btn--sm adm-btn--icon" title="Delete" onclick="window._blogAdmin.deletePost('${p.id}','${p.title.replace(/'/g,"\\'")}')">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');

      renderAdmPagination(pag, 'blog-pagination', 'window._blogAdmin.goPage');

    } catch (err) {
      tbody.innerHTML = `<tr class="adm-table__empty"><td colspan="8">
        <div class="adm-empty"><div class="adm-empty__icon">⚠️</div>
        <p class="adm-empty__title">Failed to load posts</p>
        <p class="adm-empty__desc">${err.message}</p></div>
      </td></tr>`;
    } finally {
      state.loading = false;
    }
  }

  async function togglePublish(id, currentStatus) {
    const isPublished = currentStatus === 'published';
    const newStatus   = isPublished ? 'draft' : 'published';
    try {
      await AdminAPI.blogs.update(id, {
        status:       newStatus,
        published_at: newStatus === 'published' ? new Date().toISOString() : null,
      });
      adminToast('success', isPublished ? 'Post unpublished' : 'Post published', '');
      loadPosts();
    } catch (err) { adminToast('error', 'Update failed', err.message); }
  }

  async function deletePost(id, title) {
    const ok = await adminConfirm({ title: 'Delete Post', desc: `Delete "${title}"? This cannot be undone.`, icon: '🗑️', type: 'danger' });
    if (!ok) return;
    try {
      await AdminAPI.blogs.delete(id);
      adminToast('success', 'Post deleted', '');
      loadPosts();
    } catch (err) { adminToast('error', 'Delete failed', err.message); }
  }

  let searchTimer;
  searchEl?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.search = searchEl.value.trim(); state.page = 1; resetBtn.style.display = ''; loadPosts(); }, 380);
  });
  statusSel?.addEventListener('change', () => { state.status = statusSel.value; state.page = 1; resetBtn.style.display = ''; loadPosts(); });
  sortSel?.addEventListener('change', () => { state.sort = sortSel.value; state.page = 1; loadPosts(); });
  resetBtn?.addEventListener('click', () => {
    state.search = ''; state.status = ''; state.page = 1;
    if (searchEl) searchEl.value = ''; if (statusSel) statusSel.value = '';
    resetBtn.style.display = 'none'; loadPosts();
  });

  window._blogAdmin = {
    goPage: (p) => { state.page = p; loadPosts(); window.scrollTo(0,0); },
    togglePublish, deletePost,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPosts);
  } else {
    loadPosts();
  }
})();
