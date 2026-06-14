// ============================================================
// SAMARTH PROPERTIES — Admin Media Library
// File: frontend/admin/assets/js/media-admin.js
// ============================================================

(function mediaPage() {
  'use strict';

  initAdminShell('Media Library', [{ label: 'Media Library' }]);

  // ── State ─────────────────────────────────────────────────
  let currentPage  = 1;
  let totalPages   = 1;
  let activeType   = '';
  let activeFolder = '';
  let searchTimer  = null;
  let activeItem   = null;   // item open in drawer
  let pendingDeleteId = null;

  const PAGE_SIZE = 24;

  // ── Element refs ──────────────────────────────────────────
  const grid          = document.getElementById('ml-grid');
  const countEl       = document.getElementById('ml-count');
  const loadMoreWrap  = document.getElementById('ml-load-more');
  const loadMoreBtn   = document.getElementById('ml-load-more-btn');
  const uploadSection = document.getElementById('ml-upload-section');
  const uploadToggle  = document.getElementById('ml-upload-toggle');
  const dropzone      = document.getElementById('ml-dropzone');
  const fileInput     = document.getElementById('ml-file-input');
  const browseBtn     = document.getElementById('ml-browse-btn');
  const progressList  = document.getElementById('ml-progress-list');
  const searchInput   = document.getElementById('ml-search');
  const folderFilter  = document.getElementById('ml-folder-filter');
  const typeFilter    = document.getElementById('ml-type-filter');

  // drawer
  const backdrop      = document.getElementById('ml-drawer-backdrop');
  const drawer        = document.getElementById('ml-drawer');
  const drawerBody    = document.getElementById('ml-drawer-body');
  const drawerClose   = document.getElementById('ml-drawer-close');
  const saveAltBtn    = document.getElementById('ml-save-alt');
  const deleteBtn     = document.getElementById('ml-delete-btn');

  // confirm dialog
  const confirmBackdrop = document.getElementById('ml-confirm-backdrop');
  const confirmDialog   = document.getElementById('ml-confirm-dialog');
  const confirmCancel   = document.getElementById('ml-confirm-cancel');
  const confirmDelete   = document.getElementById('ml-confirm-delete');

  // ── Upload toggle ─────────────────────────────────────────
  uploadToggle.addEventListener('click', () => {
    const open = uploadSection.style.display !== 'none';
    uploadSection.style.display = open ? 'none' : 'block';
    uploadToggle.innerHTML = open
      ? '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Upload Files'
      : '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Hide Upload';
  });

  // ── Drag & drop ───────────────────────────────────────────
  browseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => { if (e.target === dropzone || e.target.closest('.ml-dropzone__icon, .ml-dropzone__title, .ml-dropzone__sub')) fileInput.click(); });

  ['dragenter','dragover'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragging'); });
  });
  ['dragleave','drop'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragging'); });
  });
  dropzone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length) uploadFiles(files);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) uploadFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });

  // ── Upload files ──────────────────────────────────────────
  async function uploadFiles(files) {
    progressList.style.display = 'flex';
    progressList.style.flexDirection = 'column';

    const folder  = document.getElementById('ml-folder').value;
    const altText = document.getElementById('ml-alt-text').value.trim();

    for (const file of files) {
      const itemEl = createProgressItem(file.name);
      progressList.appendChild(itemEl);
      const bar    = itemEl.querySelector('.ml-progress-item__bar');
      const status = itemEl.querySelector('.ml-progress-item__status');

      try {
        bar.style.width = '30%';

        const fd = new FormData();
        fd.append('file',     file);
        fd.append('bucket',   folder === 'general' ? 'media' : folder);
        fd.append('folder',   folder);
        if (altText) fd.append('alt_text', altText);

        const token = Auth.getToken();
        const res = await fetch(APP_CONFIG.API_BASE + '/media/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd,
        });

        bar.style.width = '80%';

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);

        bar.style.width = '100%';
        status.textContent = 'Done';
        status.classList.add('done');

        setTimeout(() => itemEl.remove(), 2000);

      } catch (err) {
        bar.style.width = '100%';
        bar.style.background = '#ef4444';
        status.textContent = 'Failed';
        status.classList.add('error');
        status.title = err.message;
        setTimeout(() => itemEl.remove(), 3000);
      }
    }

    // Reload grid after all uploads
    setTimeout(() => {
      currentPage = 1;
      loadMedia(true);
      if (!progressList.children.length) progressList.style.display = 'none';
    }, 800);
  }

  function createProgressItem(name) {
    const el = document.createElement('div');
    el.className = 'ml-progress-item';
    el.innerHTML = `
      <span class="ml-progress-item__name" title="${escHtml(name)}">${escHtml(truncate(name, 30))}</span>
      <div class="ml-progress-item__bar-wrap"><div class="ml-progress-item__bar" style="width:5%;"></div></div>
      <span class="ml-progress-item__status">0%</span>`;
    return el;
  }

  // ── Load / render grid ────────────────────────────────────
  async function loadMedia(replace = false) {
    if (replace) {
      grid.innerHTML = renderSkeletons(12);
      currentPage = 1;
    }

    try {
      const params = {
        page:     currentPage,
        pageSize: PAGE_SIZE,
      };
      if (activeType)   params.file_type = activeType;
      if (activeFolder) params.folder    = activeFolder;
      const search = searchInput.value.trim();
      if (search)       params.search    = search;

      const res = await AdminAPI.media.list(params);
      const items = res.data || [];
      const meta  = res.pagination || {};

      totalPages = meta.totalPages || 1;
      const total = meta.total ?? items.length;

      countEl.textContent = `${total} file${total !== 1 ? 's' : ''}`;

      if (replace) grid.innerHTML = '';

      if (!items.length && replace) {
        grid.innerHTML = `<div class="ml-empty" style="grid-column:1/-1;">
          <div class="ml-empty__icon">🖼️</div>
          <p class="ml-empty__title">No files found</p>
          <p style="font-size:.82rem;">Upload your first file using the button above.</p>
        </div>`;
        loadMoreWrap.style.display = 'none';
        return;
      }

      items.forEach(item => grid.appendChild(renderCard(item)));

      loadMoreWrap.style.display = currentPage < totalPages ? 'flex' : 'none';

    } catch (err) {
      grid.innerHTML = `<div class="ml-empty" style="grid-column:1/-1;">
        <div class="ml-empty__icon">⚠️</div>
        <p class="ml-empty__title">Failed to load media</p>
        <p style="font-size:.82rem;">${escHtml(err.message)}</p>
      </div>`;
    }
  }

  function renderSkeletons(n) {
    return Array(n).fill(`<div class="adm-skeleton" style="height:220px;border-radius:10px;"></div>`).join('');
  }

  function renderCard(item) {
    const card = document.createElement('div');
    card.className = 'ml-card';
    card.dataset.id = item.id;

    const typeClass = item.file_type === 'image' ? 'image' : item.file_type === 'pdf' ? 'pdf' : 'video';
    const typeLabel = item.file_type === 'image' ? 'IMG' : item.file_type === 'pdf' ? 'PDF' : 'VID';
    const sizeStr   = formatBytes(item.file_size || 0);

    const thumb = item.thumbnail_url || item.file_url;
    const thumbHtml = item.file_type === 'image' && thumb
      ? `<img class="ml-card__thumb" src="${escHtml(thumb)}" alt="${escHtml(item.alt_text || item.original_filename || '')}" loading="lazy">`
      : `<div class="ml-card__placeholder">${item.file_type === 'pdf' ? '📄' : '🎬'}</div>`;

    card.innerHTML = `
      ${thumbHtml}
      <span class="ml-card__type-badge ml-card__type-badge--${typeClass}">${typeLabel}</span>
      <div class="ml-card__actions">
        <button class="ml-card__action-btn" data-action="copy" title="Copy URL">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="ml-card__action-btn" data-action="edit" title="Edit details">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="ml-card__action-btn danger" data-action="delete" title="Delete">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <div class="ml-card__info">
        <p class="ml-card__name" title="${escHtml(item.original_filename || item.filename || '')}">${escHtml(truncate(item.original_filename || item.filename || 'file', 22))}</p>
        <p class="ml-card__meta">${sizeStr} · ${item.folder || 'general'}</p>
      </div>`;

    card.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'copy')   copyUrl(item);
      else if (action === 'edit')   openDrawer(item);
      else if (action === 'delete') showConfirm(item.id);
      else openDrawer(item);
    });

    return card;
  }

  // ── Copy URL ──────────────────────────────────────────────
  function copyUrl(item) {
    const url = item.file_url || '';
    navigator.clipboard.writeText(url).then(() => {
      adminToast('success', 'URL Copied', 'File URL copied to clipboard.');
    }).catch(() => {
      adminToast('error', 'Copy failed', 'Could not copy to clipboard.');
    });
  }

  // ── Drawer ────────────────────────────────────────────────
  function openDrawer(item) {
    activeItem = item;

    const isImage = item.file_type === 'image';
    const thumb   = item.thumbnail_url || item.file_url || '';
    const date    = item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    drawerBody.innerHTML = `
      ${isImage ? `<img class="ml-preview-img" src="${escHtml(thumb)}" alt="${escHtml(item.alt_text || '')}">` : `<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:40px;text-align:center;font-size:3rem;margin-bottom:16px;">${item.file_type === 'pdf' ? '📄' : '🎬'}</div>`}
      <div class="ml-url-row">
        <span class="ml-url-input" title="${escHtml(item.file_url || '')}">${escHtml(item.file_url || '')}</span>
        <button class="adm-btn adm-btn--secondary adm-btn--sm" onclick="navigator.clipboard.writeText('${escHtml(item.file_url || '')}').then(()=>adminToast('success','Copied!',''))">Copy</button>
      </div>
      <div class="adm-field" style="margin-bottom:12px;">
        <label class="adm-label">Alt Text</label>
        <input type="text" id="ml-edit-alt" class="adm-input" value="${escHtml(item.alt_text || '')}" placeholder="Describe this image…">
      </div>
      <div style="font-size:.78rem;color:var(--adm-text-muted);line-height:1.8;">
        <div><strong>Filename:</strong> ${escHtml(item.original_filename || item.filename || '—')}</div>
        <div><strong>Type:</strong> ${escHtml(item.file_type || '—')} · ${escHtml(item.mime_type || '—')}</div>
        <div><strong>Size:</strong> ${formatBytes(item.file_size || 0)}</div>
        <div><strong>Folder:</strong> ${escHtml(item.folder || 'general')}</div>
        <div><strong>Uploaded:</strong> ${date}</div>
        ${item.webp_url ? `<div style="margin-top:8px;"><strong>WebP URL:</strong><br><span style="word-break:break-all;font-size:.72rem;">${escHtml(item.webp_url)}</span></div>` : ''}
      </div>`;

    drawer.classList.add('open');
    backdrop.classList.add('open');
    backdrop.style.display = 'block';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    setTimeout(() => { backdrop.style.display = 'none'; }, 280);
    activeItem = null;
  }

  drawerClose.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  saveAltBtn.addEventListener('click', async () => {
    if (!activeItem) return;
    const altText = document.getElementById('ml-edit-alt')?.value.trim() || '';
    saveAltBtn.disabled = true;
    saveAltBtn.textContent = 'Saving…';
    try {
      await AdminAPI.media.update(activeItem.id, { alt_text: altText });
      adminToast('success', 'Saved', 'Alt text updated.');
      activeItem.alt_text = altText;
      const card = grid.querySelector(`[data-id="${activeItem.id}"] .ml-card__thumb`);
      if (card) card.alt = altText;
      closeDrawer();
    } catch (err) {
      adminToast('error', 'Save failed', err.message);
    } finally {
      saveAltBtn.disabled = false;
      saveAltBtn.textContent = 'Save Alt Text';
    }
  });

  deleteBtn.addEventListener('click', () => {
    if (activeItem) showConfirm(activeItem.id);
  });

  // ── Delete confirm ────────────────────────────────────────
  function showConfirm(id) {
    pendingDeleteId = id;
    confirmBackdrop.style.display = 'block';
    confirmDialog.style.display   = 'block';
  }

  function hideConfirm() {
    confirmBackdrop.style.display = 'none';
    confirmDialog.style.display   = 'none';
    pendingDeleteId = null;
  }

  confirmCancel.addEventListener('click', hideConfirm);
  confirmBackdrop.addEventListener('click', hideConfirm);

  confirmDelete.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    confirmDelete.disabled = true;
    confirmDelete.textContent = 'Deleting…';
    try {
      await AdminAPI.media.delete(pendingDeleteId);
      adminToast('success', 'Deleted', 'File removed from storage.');
      const card = grid.querySelector(`[data-id="${pendingDeleteId}"]`);
      if (card) card.remove();
      closeDrawer();
      hideConfirm();
      // Update count
      const current = parseInt(countEl.textContent) || 1;
      countEl.textContent = `${Math.max(0, current - 1)} files`;
    } catch (err) {
      adminToast('error', 'Delete failed', err.message);
    } finally {
      confirmDelete.disabled = false;
      confirmDelete.textContent = 'Yes, Delete';
    }
  });

  // ── Type filter pills ─────────────────────────────────────
  typeFilter.addEventListener('click', (e) => {
    const pill = e.target.closest('.ml-pill');
    if (!pill) return;
    typeFilter.querySelectorAll('.ml-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeType = pill.dataset.type;
    currentPage = 1;
    loadMedia(true);
  });

  // ── Folder filter & search ────────────────────────────────
  folderFilter.addEventListener('change', () => {
    activeFolder = folderFilter.value;
    currentPage  = 1;
    loadMedia(true);
  });

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { currentPage = 1; loadMedia(true); }, 400);
  });

  // ── Load more ─────────────────────────────────────────────
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    loadMedia(false);
  });

  // ── Helpers ───────────────────────────────────────────────
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function truncate(str, n) {
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  // ── Init ──────────────────────────────────────────────────
  loadMedia(true);
})();
