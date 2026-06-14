// ============================================================
// SAMARTH PROPERTIES — Project Detail Page
// File: frontend/assets/js/project-detail.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function projectDetailPage() {
  'use strict';

  // ── State ─────────────────────────────────────────────────
  let project     = null;
  let gallery     = [];   // all images in order for lightbox
  let lbIndex     = 0;    // current lightbox index
  let activeTab   = 'overview';
  let brochureUrl = null; // set once project loads

  // ── Get slug from URL ─────────────────────────────────────
  const slug = new URLSearchParams(window.location.search).get('slug');

  // ── DOM refs ──────────────────────────────────────────────
  const heroSkeleton   = document.getElementById('hero-skeleton');
  const heroImgWrap    = document.getElementById('pd-hero-img');
  const heroInfo       = document.getElementById('pd-hero-info');
  const heroImg        = document.getElementById('hero-img');
  const thumbStrip     = document.getElementById('thumb-strip');
  const galleryOpenBtn = document.getElementById('gallery-open-btn');
  const galleryCount   = document.getElementById('gallery-count');
  const pdLayout       = document.getElementById('pd-layout');
  const pdNotFound     = document.getElementById('pd-not-found');
  const pdRelated      = document.getElementById('pd-related');
  const relatedGrid    = document.getElementById('related-grid');

  // Hero info
  const pdTitle      = document.getElementById('pd-title');
  const pdBadges     = document.getElementById('pd-badges');
  const pdLocation   = document.querySelector('#pd-location span');
  const pdQuickStats = document.getElementById('pd-quick-stats');
  const bcName       = document.getElementById('bc-name');

  // Sidebar
  const sidebarPrice   = document.getElementById('pd-sidebar-price');
  const enquiryTrigger = document.getElementById('enquiry-trigger-btn');
  const brochureBtn    = document.getElementById('brochure-btn');
  const pdCompareBtn   = document.getElementById('pd-compare-btn');
  const shareBtn       = document.getElementById('share-btn');

  // Overview
  const pdDetailsGrid    = document.getElementById('pd-details-grid');
  const pdDescription    = document.getElementById('pd-description');
  const pdHighlightsWrap = document.getElementById('pd-highlights-wrap');
  const pdHighlights     = document.getElementById('pd-highlights');
  const pdReraBox        = document.getElementById('pd-rera-box');
  const pdReraNumber     = document.getElementById('pd-rera-number');

  // Other tabs
  const pdFloorplansGrid = document.getElementById('pd-floorplans-grid');
  const pdGalleryGrid    = document.getElementById('pd-gallery-grid');
  const pdAmenitiesGrid  = document.getElementById('pd-amenities-grid');
  const pdMapEmbed       = document.getElementById('pd-map-embed');
  const pdNearby         = document.getElementById('pd-nearby');
  const pdNearbyList     = document.getElementById('pd-nearby-list');

  // Lightbox
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lb-img');
  const lbCaption = document.getElementById('lb-caption');
  const lbCounter = document.getElementById('lb-counter');
  const lbClose   = document.getElementById('lb-close');
  const lbPrev    = document.getElementById('lb-prev');
  const lbNext    = document.getElementById('lb-next');

  // Brochure modal
  const brochureModal  = document.getElementById('brochure-modal');
  const brochureOverlay= document.getElementById('brochure-overlay');
  const brochureClose  = document.getElementById('brochure-close');
  const brochureForm   = document.getElementById('brochure-form');
  const brochureSubmit = document.getElementById('brochure-submit-btn');
  const brochureSuccess= document.getElementById('brochure-success');
  const brochureDone   = document.getElementById('brochure-done-btn');

  // ── Helpers ───────────────────────────────────────────────
  function setMeta(p) {
    document.title = `${p.name} — Samarth Properties`;
    const desc = p.short_description || `Premium ${p.type} project in ${p.city} by Samarth Properties.`;
    document.querySelector('meta[name="description"]').content = desc;
    const ogTitle = document.getElementById('og-title');
    const ogDesc  = document.getElementById('og-desc');
    const ogImage = document.getElementById('og-image');
    if (ogTitle) ogTitle.content = `${p.name} — Samarth Properties`;
    if (ogDesc)  ogDesc.content  = desc;
    if (ogImage && p.cover_image_url) ogImage.content = p.cover_image_url;
  }

  function statusLabel(s) { return { ongoing:'Ongoing', completed:'Completed', upcoming:'Upcoming' }[s] || s; }
  function typeLabel(t)   { return { plots:'Plots', residential:'Residential', commercial:'Commercial', villa:'Villa', apartment:'Apartment' }[t] || t; }

  function setLoading(btn, loading, orig) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="btn-spinner"></span> Please wait…`
      : orig;
  }

  // ── Load project ──────────────────────────────────────────
  async function loadProject() {
    if (!slug) { showNotFound(); return; }

    try {
      const res = await API.projects.bySlug(slug);
      project = res.data;
      if (!project) { showNotFound(); return; }

      setMeta(project);
      renderHero(project);
      renderOverview(project);
      renderGalleryTab(project);
      renderFloorplans(project);
      renderAmenities(project);
      renderLocation(project);
      renderSidebar(project);

      // Reveal layout
      heroSkeleton.hidden = true;
      heroImgWrap.hidden  = false;
      heroInfo.hidden     = false;
      pdLayout.hidden     = false;

      if (window.SP && window.SP.initReveal) window.SP.initReveal();

      // Load related projects (same type, exclude self)
      loadRelated(project);

    } catch (err) {
      console.error('Project load error:', err.message);
      showNotFound();
    }
  }

  function showNotFound() {
    heroSkeleton.hidden = true;
    if (pdNotFound) pdNotFound.hidden = false;
  }

  // ── Render: Hero ──────────────────────────────────────────
  function renderHero(p) {
    const cover = p.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85';
    heroImg.src = cover;
    heroImg.alt = p.name;

    // Breadcrumb
    if (bcName)     bcName.textContent     = p.name;

    // Badges
    if (pdBadges) {
      pdBadges.innerHTML = `
        <span class="badge badge--${p.status}">${statusLabel(p.status)}</span>
        <span class="badge badge--${p.type}">${typeLabel(p.type)}</span>
        ${p.is_featured ? '<span class="badge badge--featured">Featured</span>' : ''}
        ${p.rera_number ? '<span class="badge" style="background:rgba(201,169,110,.15);color:var(--gold-dark);">RERA Registered</span>' : ''}
      `;
    }

    // Title & location
    if (pdTitle)    pdTitle.textContent    = p.name;
    if (pdLocation) pdLocation.textContent = [p.city, p.state].filter(Boolean).join(', ');

    // Quick stats
    if (pdQuickStats) {
      const stats = [];
      if (p.price_range_min || p.price_range_max) {
        stats.push({ label: 'Price', value: formatPriceRange(p.price_range_min, p.price_range_max, p.price_unit) });
      }
      if (p.area_min || p.area_max) {
        stats.push({ label: 'Area', value: formatArea(p.area_min, p.area_max, p.area_unit) });
      }
      if (p.total_units) {
        stats.push({ label: 'Units', value: `${p.available_units ?? p.total_units} / ${p.total_units}` });
      }
      if (p.possession_date) {
        stats.push({ label: 'Possession', value: formatDate(p.possession_date) });
      }
      pdQuickStats.innerHTML = stats.map(s => `
        <div class="pd-quick-stat">
          <span class="pd-quick-stat__label">${s.label}</span>
          <span class="pd-quick-stat__value">${s.value}</span>
        </div>
      `).join('');
    }

    // Compare button
    if (pdCompareBtn) {
      pdCompareBtn.dataset.id   = p.id;
      pdCompareBtn.dataset.name = p.name;
    }

    // Build gallery array: cover first, then additional media images
    gallery = [];
    if (p.cover_image_url) gallery.push({ url: p.cover_image_url, caption: `${p.name} — Cover` });
    if (Array.isArray(p.images)) {
      p.images.forEach((img, i) => {
        const url = typeof img === 'string' ? img : (img.file_url || img.large_url || img.url || img);
        const caption = (typeof img === 'object' && img.caption) ? img.caption : `${p.name} — Photo ${i + 1}`;
        if (url && url !== p.cover_image_url) {
          gallery.push({ url, caption });
        }
      });
    }

    // Thumbnail strip (up to 4)
    if (thumbStrip && gallery.length > 1) {
      thumbStrip.innerHTML = gallery.slice(0, 4).map((g, i) => `
        <img class="pd-thumb${i === 0 ? ' active' : ''}" src="${g.url}" alt="${g.caption}" data-index="${i}" loading="lazy">
      `).join('');
      thumbStrip.querySelectorAll('.pd-thumb').forEach(t => {
        t.addEventListener('click', () => switchHeroImage(parseInt(t.dataset.index)));
      });
    }

    // Gallery button
    if (galleryOpenBtn && gallery.length > 1) {
      galleryCount.textContent = `${gallery.length} Photos`;
      galleryOpenBtn.hidden = false;
      galleryOpenBtn.addEventListener('click', () => openLightbox(0));
    }
  }

  function switchHeroImage(index) {
    heroImg.src = gallery[index].url;
    thumbStrip.querySelectorAll('.pd-thumb').forEach((t, i) => t.classList.toggle('active', i === index));
  }

  // ── Render: Overview ──────────────────────────────────────
  function renderOverview(p) {
    // Details grid
    if (pdDetailsGrid) {
      const items = [];
      if (p.price_range_min || p.price_range_max) {
        items.push({ label: 'Price', value: formatPriceRange(p.price_range_min, p.price_range_max, p.price_unit), sub: p.price_unit === 'per_sqft' ? 'per sq.ft.' : '' });
      }
      if (p.area_min || p.area_max) {
        items.push({ label: 'Area', value: formatArea(p.area_min, p.area_max, p.area_unit) });
      }
      if (p.total_units) {
        items.push({ label: 'Total Units', value: p.total_units, sub: p.available_units != null ? `${p.available_units} available` : '' });
      }
      items.push({ label: 'Status', value: statusLabel(p.status) });
      items.push({ label: 'Type', value: typeLabel(p.type) });
      if (p.possession_date) {
        items.push({ label: 'Possession', value: formatDate(p.possession_date) });
      }
      if (p.city) {
        items.push({ label: 'City', value: p.city, sub: p.state || '' });
      }
      pdDetailsGrid.innerHTML = items.map(it => `
        <div class="pd-detail-item">
          <p class="pd-detail-item__label">${it.label}</p>
          <p class="pd-detail-item__value">${it.value}</p>
          ${it.sub ? `<p class="pd-detail-item__sub">${it.sub}</p>` : ''}
        </div>
      `).join('');
    }

    // Description
    if (pdDescription) {
      if (p.description) {
        pdDescription.innerHTML = p.description.split('\n\n').map(para => `<p>${para}</p>`).join('');
      } else if (p.short_description) {
        pdDescription.innerHTML = `<p>${p.short_description}</p>`;
      } else {
        pdDescription.innerHTML = `<p>A premium ${typeLabel(p.type).toLowerCase()} project by Samarth Properties located in ${p.city}. Contact us for more details.</p>`;
      }
    }

    // Highlights
    if (pdHighlights && Array.isArray(p.highlights) && p.highlights.length) {
      pdHighlights.innerHTML = p.highlights.map(h => `<li>${h}</li>`).join('');
      if (pdHighlightsWrap) pdHighlightsWrap.hidden = false;
    }

    // RERA
    if (p.rera_number && pdReraBox && pdReraNumber) {
      pdReraNumber.textContent = p.rera_number;
      pdReraBox.hidden = false;
    }
  }

  // ── Render: Gallery tab ───────────────────────────────────
  function renderGalleryTab(p) {
    if (!pdGalleryGrid || !gallery.length) return;

    if (gallery.length === 0) return; // keep default empty state

    pdGalleryGrid.innerHTML = gallery.map((g, i) => `
      <div class="gallery-item" data-index="${i}" role="button" tabindex="0" aria-label="Open photo ${i + 1}">
        <img class="gallery-item__img" src="${g.url}" alt="${g.caption}" loading="lazy">
        <div class="gallery-item__overlay" aria-hidden="true">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
        </div>
      </div>
    `).join('');

    pdGalleryGrid.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => openLightbox(parseInt(item.dataset.index)));
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(parseInt(item.dataset.index)); } });
    });
  }

  // ── Render: Floor plans ───────────────────────────────────
  function renderFloorplans(p) {
    if (!pdFloorplansGrid) return;
    const plans = Array.isArray(p.floor_plans) ? p.floor_plans : [];
    if (!plans.length) return; // keep default state

    pdFloorplansGrid.innerHTML = plans.map((plan, i) => `
      <div class="pd-floorplan-card" data-url="${plan.image_url}" role="button" tabindex="0" aria-label="${plan.label || 'Floor plan ' + (i+1)}">
        <img class="pd-floorplan-card__img" src="${plan.image_url}" alt="${plan.label || 'Floor plan'}" loading="lazy">
        <p class="pd-floorplan-card__label">${plan.label || 'Floor Plan ' + (i + 1)}</p>
      </div>
    `).join('');

    pdFloorplansGrid.querySelectorAll('.pd-floorplan-card').forEach((card, i) => {
      card.addEventListener('click', () => openFloorplanLightbox(plans, i));
    });
  }

  function openFloorplanLightbox(plans, startIndex) {
    // Temporarily swap gallery with floor plan images for lightbox
    const prev = gallery;
    gallery = plans.map(pl => ({ url: pl.image_url, caption: pl.label || 'Floor Plan' }));
    openLightbox(startIndex);
    lightbox.addEventListener('hidden', () => { gallery = prev; }, { once: true });
  }

  // ── Render: Amenities ─────────────────────────────────────
  function renderAmenities(p) {
    if (!pdAmenitiesGrid) return;
    const amenities = Array.isArray(p.amenities) ? p.amenities : [];
    if (!amenities.length) return;

    pdAmenitiesGrid.innerHTML = amenities.map(a => {
      const icon = typeof a === 'string' ? '✓' : (a.icon || '✓');
      const name = typeof a === 'string' ? a : (a.name || a);
      return `<div class="amenity-card" data-reveal="up">
        <div class="amenity-card__icon">${icon}</div>
        <p class="amenity-card__name">${name}</p>
      </div>`;
    }).join('');
  }

  // ── Render: Location tab ──────────────────────────────────
  function renderLocation(p) {
    if (!pdMapEmbed) return;

    const query = encodeURIComponent([p.address, p.city, p.state, 'India'].filter(Boolean).join(', '));
    if (query) {
      pdMapEmbed.innerHTML = `<iframe
        title="Project location map"
        src="https://maps.google.com/maps?q=${query}&output=embed&z=14"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen>
      </iframe>`;
    }

    // Nearby landmarks
    if (pdNearby && pdNearbyList && Array.isArray(p.nearby_landmarks) && p.nearby_landmarks.length) {
      pdNearbyList.innerHTML = p.nearby_landmarks.map(lm => `
        <li class="pd-nearby__item">
          <span class="pd-nearby__item-name">${lm.name}</span>
          <span class="pd-nearby__item-dist">${lm.distance}</span>
        </li>
      `).join('');
      pdNearby.hidden = false;
    }
  }

  // ── Render: Sidebar ───────────────────────────────────────
  function renderSidebar(p) {
    if (sidebarPrice) {
      sidebarPrice.textContent = formatPriceRange(p.price_range_min, p.price_range_max, p.price_unit);
    }
    brochureUrl = p.brochure_url || null;
    if (brochureBtn && !brochureUrl) {
      brochureBtn.disabled = true;
      brochureBtn.title = 'Brochure not available';
    }
  }

  // ── Render: Related projects ──────────────────────────────
  async function loadRelated(p) {
    try {
      const res = await API.projects.list({ type: p.type, limit: 3 });
      const others = (res.data || []).filter(r => r.id !== p.id).slice(0, 3);
      if (!others.length) return;

      relatedGrid.innerHTML = others.map(renderProjectCard).join('');
      pdRelated.hidden = false;

      if (window.SP && window.SP.initReveal)        window.SP.initReveal();
      if (window.SP && window.SP.initCompareButtons) window.SP.initCompareButtons();
    } catch {
      // Related section stays hidden
    }
  }

  // ── Tabs ──────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.pd-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('aria-controls');
        switchTab(target.replace('tab-', ''));
      });
    });
  }

  function switchTab(name) {
    activeTab = name;
    document.querySelectorAll('.pd-tab').forEach(btn => {
      const isActive = btn.getAttribute('aria-controls') === `tab-${name}`;
      btn.classList.toggle('pd-tab--active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    document.querySelectorAll('.pd-tab-panel').forEach(panel => {
      panel.hidden = panel.id !== `tab-${name}`;
    });
  }

  // ── Lightbox ──────────────────────────────────────────────
  function openLightbox(index) {
    lbIndex = Math.max(0, Math.min(index, gallery.length - 1));
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    renderLightboxSlide();
    lbClose?.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lightbox.dispatchEvent(new Event('hidden'));
  }

  function renderLightboxSlide() {
    if (!gallery[lbIndex]) return;
    lbImg.src = gallery[lbIndex].url;
    lbImg.alt = gallery[lbIndex].caption || '';
    if (lbCaption) lbCaption.textContent = gallery[lbIndex].caption || '';
    if (lbCounter) lbCounter.textContent = `${lbIndex + 1} / ${gallery.length}`;
    if (lbPrev)    lbPrev.disabled    = lbIndex === 0;
    if (lbNext)    lbNext.disabled    = lbIndex === gallery.length - 1;
  }

  function initLightbox() {
    if (!lightbox) return;

    lbClose?.addEventListener('click', closeLightbox);
    lbPrev?.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; renderLightboxSlide(); } });
    lbNext?.addEventListener('click', () => { if (lbIndex < gallery.length - 1) { lbIndex++; renderLightboxSlide(); } });

    galleryOpenBtn?.addEventListener('click', () => openLightbox(0));

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  { if (lbIndex > 0) { lbIndex--; renderLightboxSlide(); } }
      if (e.key === 'ArrowRight') { if (lbIndex < gallery.length - 1) { lbIndex++; renderLightboxSlide(); } }
    });

    // Click overlay to close
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // ── Brochure modal ────────────────────────────────────────
  function openBrochureModal() {
    if (!brochureModal) return;
    brochureModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    brochureForm.reset();
    brochureForm.hidden = false;
    if (brochureSuccess) brochureSuccess.hidden = true;
    brochureModal.querySelector('input')?.focus();
  }

  function closeBrochureModal() {
    brochureModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initBrochureModal() {
    brochureBtn?.addEventListener('click', openBrochureModal);
    brochureClose?.addEventListener('click', closeBrochureModal);
    brochureOverlay?.addEventListener('click', closeBrochureModal);
    brochureDone?.addEventListener('click', closeBrochureModal);

    brochureForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(brochureForm);

      const nameEl  = brochureForm.querySelector('[name="name"]');
      const phoneEl = brochureForm.querySelector('[name="phone"]');
      const emailEl = brochureForm.querySelector('[name="email"]');
      let valid = true;

      if (!nameEl.value.trim())          { showFieldError(nameEl, 'Name is required');             valid = false; }
      if (!phoneEl.value.trim())         { showFieldError(phoneEl, 'Phone is required');            valid = false; }
      else if (!validatePhone(phoneEl.value)) { showFieldError(phoneEl, 'Enter a valid 10-digit number'); valid = false; }
      if (emailEl.value && !validateEmail(emailEl.value)) { showFieldError(emailEl, 'Enter a valid email'); valid = false; }

      if (!valid) return;

      const origHtml = brochureSubmit.innerHTML;
      setLoading(brochureSubmit, true, origHtml);

      try {
        const res = await API.brochure.download({
          name:       nameEl.value.trim(),
          phone:      phoneEl.value.trim(),
          email:      emailEl.value.trim() || undefined,
          project_id: project?.id,
          slug:       slug,
        });

        // Trigger download if URL returned
        const url = res.data?.brochure_url || brochureUrl;
        if (url) {
          const a = document.createElement('a');
          a.href = url; a.download = ''; a.target = '_blank'; a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        brochureForm.hidden = true;
        if (brochureSuccess) brochureSuccess.hidden = false;

      } catch (err) {
        if (err.errors) err.errors.forEach(e => {
          const f = brochureForm.querySelector(`[name="${e.field}"]`);
          if (f) showFieldError(f, e.message);
        });
        window.SP?.toast('error', 'Download Failed', err.message || 'Please try again.');
        setLoading(brochureSubmit, false, origHtml);
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && brochureModal.classList.contains('open')) closeBrochureModal();
    });
  }

  // ── Enquiry trigger ───────────────────────────────────────
  function initEnquiryTrigger() {
    enquiryTrigger?.addEventListener('click', () => {
      if (window.SP && window.SP.openEnquiryPopup) {
        window.SP.openEnquiryPopup(project?.id, project?.name);
      }
    });
  }

  // ── Share button ──────────────────────────────────────────
  function initShareBtn() {
    shareBtn?.addEventListener('click', async () => {
      const shareData = {
        title: project?.name || 'Samarth Properties',
        text:  `Check out ${project?.name} by Samarth Properties`,
        url:   window.location.href,
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          window.SP?.toast('success', 'Link Copied!', 'Project link copied to clipboard.');
        } catch {
          window.SP?.toast('info', 'Share', 'Copy the URL from your browser to share this project.');
        }
      }
    });
  }

  // ── Compare ───────────────────────────────────────────────
  function initCompare() {
    pdCompareBtn?.addEventListener('click', () => {
      if (window.SP && window.SP.toggleCompare) {
        window.SP.toggleCompare(project?.id, project?.name);
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    initTabs();
    initLightbox();
    initBrochureModal();
    initEnquiryTrigger();
    initShareBtn();
    initCompare();
    loadProject();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
