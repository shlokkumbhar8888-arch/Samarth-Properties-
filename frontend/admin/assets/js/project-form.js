// ============================================================
// SAMARTH PROPERTIES — Admin Project Form (Create / Edit)
// File: frontend/admin/assets/js/project-form.js
// ============================================================

(function projectFormPage() {
  'use strict';

  const projectId = new URLSearchParams(location.search).get('id');
  const isEdit    = Boolean(projectId);

  initAdminShell(
    isEdit ? 'Edit Project' : 'Add Project',
    [{ href: 'projects.html', label: 'Projects' }, { label: isEdit ? 'Edit' : 'Add' }]
  );

  const titleEl    = document.getElementById('form-page-title');
  if (titleEl) titleEl.textContent = isEdit ? 'Edit Project' : 'Add Project';

  // ── Field refs ────────────────────────────────────────────
  const nameEl         = document.getElementById('pf-name');
  const slugEl         = document.getElementById('pf-slug');
  const slugPreview    = document.getElementById('slug-preview');
  const typeEl         = document.getElementById('pf-type');
  const statusEl       = document.getElementById('pf-status');
  const shortDescEl    = document.getElementById('pf-short-desc');
  const descEl         = document.getElementById('pf-description');
  const highlightsEl   = document.getElementById('pf-highlights');
  const cityEl         = document.getElementById('pf-city');
  const stateEl        = document.getElementById('pf-state');
  const addressEl      = document.getElementById('pf-address');
  const mapUrlEl       = document.getElementById('pf-map-url');
  const priceMinEl     = document.getElementById('pf-price-min');
  const priceMaxEl     = document.getElementById('pf-price-max');
  const priceUnitEl    = document.getElementById('pf-price-unit');
  const areaMinEl      = document.getElementById('pf-area-min');
  const areaMaxEl      = document.getElementById('pf-area-max');
  const areaUnitEl     = document.getElementById('pf-area-unit');
  const totalUnitsEl   = document.getElementById('pf-total-units');
  const availUnitsEl   = document.getElementById('pf-available-units');
  const amenitiesEl    = document.getElementById('pf-amenities');
  const reraEl         = document.getElementById('pf-rera');
  const possessionEl   = document.getElementById('pf-possession');
  const builderEl      = document.getElementById('pf-builder');
  const featuredEl     = document.getElementById('pf-featured');
  const videoUrlEl     = document.getElementById('pf-video-url');
  const coverEl        = document.getElementById('pf-cover');
  const coverPreviewEl = document.getElementById('pf-cover-preview');
  const coverImgEl     = document.getElementById('pf-cover-img');
  const galleryEl      = document.getElementById('pf-gallery');
  const galleryPreview = document.getElementById('pf-gallery-preview');
  const form           = document.getElementById('project-form');
  const saveBtn        = document.getElementById('save-btn');
  const saveBtnSide    = document.getElementById('save-btn-side');

  // ── Slug generation ───────────────────────────────────────
  nameEl?.addEventListener('input', () => {
    if (!isEdit || !slugEl.value) {
      slugEl.value = generateSlug(nameEl.value);
    }
    if (slugPreview) slugPreview.textContent = `URL: /projects/${slugEl.value}`;
  });

  slugEl?.addEventListener('input', () => {
    if (slugPreview) slugPreview.textContent = slugEl.value ? `URL: /projects/${slugEl.value}` : '';
  });

  // ── Gallery preview with delete buttons ──────────────────
  function renderGalleryPreview() {
    if (!galleryPreview) return;
    const urls = galleryEl.value.split('\n').map(s => s.trim()).filter(Boolean);
    if (!urls.length) { galleryPreview.innerHTML = ''; return; }

    galleryPreview.innerHTML = urls.map((url, i) => `
      <div class="gp-thumb" data-index="${i}">
        <img src="${url}" alt="Gallery image ${i + 1}" loading="lazy" onerror="this.style.opacity='.3'">
        <button type="button" class="gp-remove" data-index="${i}" title="Remove image">✕</button>
      </div>`).join('');

    galleryPreview.querySelectorAll('.gp-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const lines = galleryEl.value.split('\n').map(s => s.trim()).filter(Boolean);
        lines.splice(idx, 1);
        galleryEl.value = lines.join('\n');
        renderGalleryPreview();
      });
    });
  }

  galleryEl?.addEventListener('input', renderGalleryPreview);

  // ── Cover image preview ───────────────────────────────────
  coverEl?.addEventListener('input', () => {
    const url = coverEl.value.trim();
    if (url) {
      coverImgEl.src = url;
      coverPreviewEl.style.display = '';
    } else {
      coverPreviewEl.style.display = 'none';
    }
  });

  // ── Load existing data (edit mode) ────────────────────────
  async function loadProject() {
    if (!isEdit) return;
    try {
      const res = await AdminAPI.projects.get(projectId);
      const p   = res.data || res;

      nameEl.value       = p.name         || '';
      slugEl.value       = p.slug         || '';
      typeEl.value       = p.type         || '';
      statusEl.value     = p.status       || '';
      shortDescEl.value  = p.short_description || '';
      descEl.value       = p.description  || '';
      highlightsEl.value = Array.isArray(p.highlights) ? p.highlights.join('\n') : (p.highlights || '');
      cityEl.value       = p.city         || '';
      stateEl.value      = p.state        || 'Maharashtra';
      addressEl.value    = p.location     || '';
      mapUrlEl.value     = p.maps_embed   || '';
      priceMinEl.value   = p.price_range_min || '';
      priceMaxEl.value   = p.price_range_max || '';
      priceUnitEl.value  = p.price_unit   || 'total';
      areaMinEl.value    = p.area_min     || '';
      areaMaxEl.value    = p.area_max     || '';
      areaUnitEl.value   = p.area_unit    || 'sqft';
      totalUnitsEl.value = p.total_units  || '';
      availUnitsEl.value = p.available_units || '';
      amenitiesEl.value  = Array.isArray(p.amenities) ? p.amenities.join('\n') : (p.amenities || '');
      reraEl.value       = p.rera_number  || '';
      possessionEl.value = p.possession_date ? p.possession_date.split('T')[0] : '';
      builderEl.value    = p.builder_name || '';
      videoUrlEl.value   = p.video_url    || '';
      if (p.video_url) videoUrlEl.dispatchEvent(new Event('input'));
      featuredEl.checked = Boolean(p.is_featured);
      coverEl.value      = p.cover_image_url || '';

      if (p.cover_image_url) {
        coverImgEl.src = p.cover_image_url;
        coverPreviewEl.style.display = '';
      }

      if (Array.isArray(p.images)) {
        galleryEl.value = p.images.join('\n');
        renderGalleryPreview();
      }

      if (slugPreview) slugPreview.textContent = `URL: /projects/${p.slug}`;

    } catch (err) {
      adminToast('error', 'Failed to load project', err.message);
    }
  }

  // ── Validation ────────────────────────────────────────────
  function validate() {
    let valid = true;
    document.querySelectorAll('.adm-field-error-msg').forEach(e => e.remove());
    document.querySelectorAll('.adm-input.error,.adm-select-input.error,.adm-textarea.error')
      .forEach(e => e.classList.remove('error'));

    function err(el, msg) {
      el.classList.add('error');
      const p = document.createElement('p');
      p.className = 'adm-field-error adm-field-error-msg';
      p.textContent = msg;
      el.after(p);
      valid = false;
    }

    if (nameEl && !nameEl.value.trim())   err(nameEl,   'Project name is required');
    if (slugEl && !slugEl.value.trim())   err(slugEl,   'Slug is required');
    if (typeEl && !typeEl.value)          err(typeEl,   'Project type is required');
    if (statusEl && !statusEl.value)      err(statusEl, 'Status is required');
    if (cityEl && !cityEl.value.trim())   err(cityEl,   'City is required');
    return valid;
  }

  // ── Build payload ─────────────────────────────────────────
  function v(el) { return el ? el.value : ''; } // null-safe value read

  function buildPayload() {
    const highlights = v(highlightsEl).split('\n').map(s => s.trim()).filter(Boolean);
    const amenities  = v(amenitiesEl).split('\n').map(s => s.trim()).filter(Boolean);
    const images     = v(galleryEl).split('\n').map(s => s.trim()).filter(Boolean);

    return {
      name:              v(nameEl).trim(),
      slug:              v(slugEl).trim(),
      type:              v(typeEl),
      status:            v(statusEl),
      short_description: v(shortDescEl).trim() || undefined,
      description:       v(descEl).trim() || undefined,
      highlights,
      city:              v(cityEl).trim(),
      location:          v(addressEl).trim() || v(cityEl).trim(),
      state:             v(stateEl).trim() || 'Maharashtra',
      maps_embed:        v(mapUrlEl).trim() || undefined,
      price_range_min:   v(priceMinEl) ? Number(v(priceMinEl)) : undefined,
      price_range_max:   v(priceMaxEl) ? Number(v(priceMaxEl)) : undefined,
      price_unit:        v(priceUnitEl) || 'total',
      area_min:          v(areaMinEl) ? Number(v(areaMinEl)) : undefined,
      area_max:          v(areaMaxEl) ? Number(v(areaMaxEl)) : undefined,
      area_unit:         v(areaUnitEl) || 'sqft',
      total_units:       v(totalUnitsEl) ? Number(v(totalUnitsEl)) : undefined,
      available_units:   v(availUnitsEl) ? Number(v(availUnitsEl)) : undefined,
      amenities,
      rera_number:       v(reraEl).trim() || undefined,
      possession_date:   v(possessionEl) || undefined,
      builder_name:      v(builderEl).trim() || undefined,
      video_url:         v(videoUrlEl).trim() || undefined,
      is_featured:       featuredEl ? featuredEl.checked : false,
      cover_image_url:   v(coverEl).trim() || undefined,
      images,
    };
  }

  // ── Submit ────────────────────────────────────────────────
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      adminToast('warning', 'Validation errors', 'Please fix the highlighted fields.');
      return;
    }

    const origHtml = saveBtn.innerHTML;
    [saveBtn, saveBtnSide].forEach(b => { if (b) { b.disabled = true; b.innerHTML = '<span class="adm-spinner"></span> Saving…'; } });

    try {
      const payload = buildPayload();
      if (isEdit) {
        await AdminAPI.projects.update(projectId, payload);
        adminToast('success', 'Project updated', 'Changes saved successfully.');
      } else {
        await AdminAPI.projects.create(payload);
        adminToast('success', 'Project created', `"${payload.name}" has been added.`);
        setTimeout(() => { location.href = 'projects.html'; }, 1200);
        return;
      }
    } catch (err) {
      console.error('[Project Save Error]', err);
      let msg = err.message || 'Please try again.';
      if (err.details && err.details.length) {
        msg = err.details.map(e => e.message || e.field).join(' · ');
      }
      adminToast('error', 'Save failed', msg);
    } finally {
      [saveBtn, saveBtnSide].forEach(b => { if (b) { b.disabled = false; b.innerHTML = origHtml; } });
    }
  });

  // ── Init ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProject);
  } else {
    loadProject();
  }
})();
