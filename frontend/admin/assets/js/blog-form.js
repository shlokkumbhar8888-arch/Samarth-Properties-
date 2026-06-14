// ============================================================
// SAMARTH PROPERTIES — Admin Blog Form (Create / Edit)
// File: frontend/admin/assets/js/blog-form.js
// ============================================================

(function blogFormPage() {
  'use strict';

  const postId = new URLSearchParams(location.search).get('id');
  const isEdit = Boolean(postId);

  initAdminShell(
    isEdit ? 'Edit Post' : 'New Post',
    [{ href: 'blog.html', label: 'Blog Posts' }, { label: isEdit ? 'Edit' : 'New' }]
  );

  const titleEl = document.getElementById('form-page-title');
  if (titleEl) titleEl.textContent = isEdit ? 'Edit Blog Post' : 'New Blog Post';

  // ── Field refs ────────────────────────────────────────────
  const bfTitle      = document.getElementById('bf-title');
  const bfSlug       = document.getElementById('bf-slug');
  const bfSlugPrev   = document.getElementById('bf-slug-preview');
  const bfCategory   = document.getElementById('bf-category');
  const bfExcerpt    = document.getElementById('bf-excerpt');
  const bfContent    = document.getElementById('bf-content');
  const bfMetaTitle  = document.getElementById('bf-meta-title');
  const bfMetaDesc   = document.getElementById('bf-meta-desc');
  const bfTags       = document.getElementById('bf-tags');
  const bfAuthor     = document.getElementById('bf-author');
  const bfAuthorBio  = document.getElementById('bf-author-bio');
  const bfReadTime   = document.getElementById('bf-read-time');
  const bfPublishedAt= document.getElementById('bf-published-at');
  const bfFeatured   = document.getElementById('bf-featured');
  const bfCover      = document.getElementById('bf-cover');
  const bfCoverPrev  = document.getElementById('bf-cover-preview');
  const bfCoverImg   = document.getElementById('bf-cover-img');

  const publishBtn      = document.getElementById('publish-btn');
  const publishBtnSide  = document.getElementById('publish-btn-side');
  const draftBtn        = document.getElementById('save-draft-btn');
  const draftBtnSide    = document.getElementById('save-draft-btn-side');

  // ── Slug auto-generate ────────────────────────────────────
  bfTitle?.addEventListener('input', () => {
    if (!isEdit || !bfSlug.value) {
      bfSlug.value = generateSlug(bfTitle.value);
    }
    if (bfSlugPrev) bfSlugPrev.textContent = bfSlug.value ? `URL: /blog/${bfSlug.value}` : '';
  });

  bfSlug?.addEventListener('input', () => {
    if (bfSlugPrev) bfSlugPrev.textContent = bfSlug.value ? `URL: /blog/${bfSlug.value}` : '';
  });

  // ── Cover preview ─────────────────────────────────────────
  bfCover?.addEventListener('input', () => {
    const url = bfCover.value.trim();
    if (url) { bfCoverImg.src = url; bfCoverPrev.style.display = ''; }
    else      { bfCoverPrev.style.display = 'none'; }
  });

  // ── Load existing post (edit mode) ────────────────────────
  async function loadPost() {
    if (!isEdit) return;
    try {
      const res = await AdminAPI.blogs.get(postId);
      const p   = res.data || res;

      bfTitle.value       = p.title        || '';
      bfSlug.value        = p.slug         || '';
      bfCategory.value    = p.category     || '';
      bfExcerpt.value     = p.excerpt      || '';
      bfContent.value     = p.content      || '';
      bfMetaTitle.value   = p.meta_title   || '';
      bfMetaDesc.value    = p.meta_description || '';
      bfTags.value        = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
      bfAuthor.value      = p.author_name  || 'Samarth Properties';
      bfAuthorBio.value   = p.author_bio   || '';
      bfReadTime.value    = p.read_time_mins || '';
      bfFeatured.checked  = Boolean(p.is_featured);
      bfCover.value       = p.cover_image_url || '';

      if (p.published_at) {
        const d = new Date(p.published_at);
        bfPublishedAt.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }

      if (p.cover_image_url) { bfCoverImg.src = p.cover_image_url; bfCoverPrev.style.display = ''; }
      if (bfSlugPrev) bfSlugPrev.textContent = `URL: /blog/${p.slug}`;

    } catch (err) {
      adminToast('error', 'Failed to load post', err.message);
    }
  }

  // ── Validate ──────────────────────────────────────────────
  function validate() {
    let valid = true;
    document.querySelectorAll('.adm-field-error-msg').forEach(e => e.remove());
    document.querySelectorAll('.adm-input.error,.adm-textarea.error').forEach(e => e.classList.remove('error'));

    function err(el, msg) {
      el.classList.add('error');
      const p = document.createElement('p');
      p.className = 'adm-field-error adm-field-error-msg';
      p.textContent = msg;
      el.after(p);
      valid = false;
    }

    if (!bfTitle.value.trim())   err(bfTitle,   'Title is required');
    if (!bfSlug.value.trim())    err(bfSlug,    'Slug is required');
    if (!bfExcerpt.value.trim()) err(bfExcerpt, 'Excerpt is required');
    if (!bfContent.value.trim()) err(bfContent, 'Content is required');
    return valid;
  }

  // ── Build payload ─────────────────────────────────────────
  function buildPayload(status) {
    const tags = bfTags.value.split(',').map(t => t.trim()).filter(Boolean);
    return {
      title:            bfTitle.value.trim(),
      slug:             bfSlug.value.trim(),
      category:         bfCategory.value.trim() || undefined,
      excerpt:          bfExcerpt.value.trim(),
      content:          bfContent.value.trim(),
      meta_title:       bfMetaTitle.value.trim() || undefined,
      meta_description: bfMetaDesc.value.trim() || undefined,
      tags,
      author_name:      bfAuthor.value.trim() || 'Samarth Properties',
      author_bio:       bfAuthorBio.value.trim() || undefined,
      read_time_mins:   bfReadTime.value ? Number(bfReadTime.value) : undefined,
      published_at:     status === 'published'
                          ? (bfPublishedAt.value ? new Date(bfPublishedAt.value).toISOString() : new Date().toISOString())
                          : null,
      is_featured:      bfFeatured.checked,
      cover_image_url:  bfCover.value.trim() || undefined,
      status,
    };
  }

  // ── Save ──────────────────────────────────────────────────
  async function save(status) {
    if (!validate()) {
      adminToast('warning', 'Validation errors', 'Please fix the highlighted fields.');
      return;
    }

    const btns   = [publishBtn, publishBtnSide, draftBtn, draftBtnSide].filter(Boolean);
    const orig   = btns.map(b => b.innerHTML);
    btns.forEach(b => { b.disabled = true; b.innerHTML = '<span class="adm-spinner"></span>'; });

    try {
      const payload = buildPayload(status);
      if (isEdit) {
        await AdminAPI.blogs.update(postId, payload);
        adminToast('success', `Post ${status === 'published' ? 'published' : 'saved as draft'}`, '');
      } else {
        await AdminAPI.blogs.create(payload);
        adminToast('success', `Post ${status === 'published' ? 'published' : 'saved as draft'}!`, '');
        setTimeout(() => { location.href = 'blog.html'; }, 1000);
        return;
      }
    } catch (err) {
      adminToast('error', 'Save failed', err.message || 'Please try again.');
    } finally {
      btns.forEach((b, i) => { b.disabled = false; b.innerHTML = orig[i]; });
    }
  }

  publishBtn?.addEventListener('click',     () => save('published'));
  publishBtnSide?.addEventListener('click', () => save('published'));
  draftBtn?.addEventListener('click',       () => save('draft'));
  draftBtnSide?.addEventListener('click',   () => save('draft'));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPost);
  } else {
    loadPost();
  }
})();
