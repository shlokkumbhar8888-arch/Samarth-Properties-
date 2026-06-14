// ============================================================
// SAMARTH PROPERTIES — Homepage JS
// File: frontend/assets/js/home.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function homePage() {
  'use strict';

  // ── Helpers ───────────────────────────────────────────────────

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = loading
      ? `<span class="btn-spinner"></span> Sending…`
      : btn.dataset.originalText;
  }

  function setMinDate(input) {
    if (!input) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    input.min = tomorrow.toISOString().split('T')[0];
  }

  // ── Animated counters ─────────────────────────────────────────

  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        animateCounter(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.counter);
    const suffix   = el.dataset.counterSuffix || el.dataset.suffix || '';
    const prefix   = el.dataset.counterPrefix || el.dataset.prefix || '';
    const decimals = String(target).includes('.') ? 1 : 0;
    const duration = 2000;
    const start    = performance.now();

    function step(now) {
      const elapsed  = Math.min(now - start, duration);
      const progress = elapsed / duration;
      // Ease out cubic
      const eased   = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (elapsed < duration) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  // ── Projects section ──────────────────────────────────────────

  let activeFilter = '';

  const TYPE_LABELS = { plots: 'Plots', residential: 'Residential', villa: 'Villa', commercial: 'Commercial', apartment: 'Apartment' };

  async function initProjects() {
    const grid            = document.getElementById('projects-grid');
    const filterContainer = document.querySelector('#projects .filter-pills');

    if (!grid) return;

    loadProjects(grid);

    // Fetch available types and rebuild filter pills dynamically
    try {
      const res  = await fetch(APP_CONFIG.API_BASE + '/public/projects/types');
      const json = res.ok ? await res.json() : {};
      const types = (json.data || {}).types || [];

      if (filterContainer && types.length) {
        filterContainer.innerHTML =
          `<button class="filter-pill active" data-filter="">All Projects</button>` +
          types.map(t => `<button class="filter-pill" data-filter="${t}">${TYPE_LABELS[t] || t}</button>`).join('');

        filterContainer.querySelectorAll('.filter-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            filterContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilter = pill.dataset.filter || '';
            loadProjects(grid);
          });
        });
      }
    } catch (_) {}
  }

  async function loadProjects(grid) {
    // Show skeletons
    grid.innerHTML = Array(6).fill(skeletonCard()).join('');

    try {
      const params = { limit: 6 };
      if (activeFilter) params.type = activeFilter;

      const res = await API.projects.list(params);
      const projects = res.data || [];

      if (!projects.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state__icon">🏗️</div>
          <p class="empty-state__title">No projects found</p>
          <p class="empty-state__desc">Check back soon — new projects are coming.</p>
        </div>`;
        return;
      }

      grid.innerHTML = projects.map(renderProjectCard).join('');

      // Re-init reveal for newly added cards
      if (window.SP && window.SP.initReveal) window.SP.initReveal();
      if (window.SP && window.SP.initCompareButtons) window.SP.initCompareButtons();

    } catch (err) {
      console.warn('Projects load error:', err.message);
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state__icon">⚠️</div>
        <p class="empty-state__title">Could not load projects</p>
        <p class="empty-state__desc">Please refresh the page or try again later.</p>
      </div>`;
    }
  }

  // ── Hero enquiry form ─────────────────────────────────────────

  function initHeroForm() {
    const form = document.getElementById('hero-enquiry-form');
    if (!form) return;

    // Inline real-time validation
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) clearFieldError(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateHeroForm(form)) return;

      const btn = form.querySelector('[type="submit"]');
      setLoading(btn, true);

      try {
        const fd = new FormData(form);
        const interestedIn = fd.get('interested_in');
        const payload = {
          name:    fd.get('name')?.trim(),
          phone:   fd.get('phone')?.trim(),
          message: interestedIn ? `Interested in: ${interestedIn}. Callback request from homepage.` : 'Callback request from homepage hero form.',
          source:  'website_hero',
        };

        await API.enquiry.submit(payload);
        window.SP.toast('success', 'Request Received!', 'Our team will call you back within 24 hours.');
        form.reset();
      } catch (err) {
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => {
            const field = form.querySelector(`[name="${e.field}"]`);
            if (field) showFieldError(field, e.message);
          });
        }
        window.SP.toast('error', 'Submission Failed', err.message || 'Please try again.');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  function validateField(field) {
    const { name, value } = field;
    if (name === 'name'  && !value.trim())       { showFieldError(field, 'Name is required'); return false; }
    if (name === 'phone') {
      if (!value.trim())                         { showFieldError(field, 'Phone is required'); return false; }
      if (!validatePhone(value))                 { showFieldError(field, 'Enter a valid 10-digit Indian mobile number'); return false; }
    }
    if (name === 'email' && value && !validateEmail(value)) { showFieldError(field, 'Enter a valid email address'); return false; }
    clearFieldError(field);
    return true;
  }

  function validateHeroForm(form) {
    clearAllErrors(form);
    let valid = true;
    ['name', 'phone'].forEach(n => {
      const el = form.querySelector(`[name="${n}"]`);
      if (el && !validateField(el)) valid = false;
    });
    const email = form.querySelector('[name="email"]');
    if (email && email.value && !validateEmail(email.value)) {
      showFieldError(email, 'Enter a valid email address');
      valid = false;
    }
    return valid;
  }

  // ── CTA / Appointment form ────────────────────────────────────

  function initCtaForm() {
    const form    = document.getElementById('cta-appointment-form');
    const success = document.getElementById('cta-success');
    const visitIn = document.getElementById('visit-date');

    if (!form) return;
    setMinDate(visitIn);

    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) clearFieldError(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateCtaForm(form)) return;

      const btn = form.querySelector('[type="submit"]');
      setLoading(btn, true);

      try {
        const fd = new FormData(form);
        const payload = {
          name:           fd.get('name')?.trim(),
          phone:          fd.get('phone')?.trim(),
          preferred_date: fd.get('preferred_date') || undefined,
          preferred_time: fd.get('preferred_time') || undefined,
          source:         'website_cta',
        };

        await API.appointment.book(payload);

        // Show success state
        form.style.display = 'none';
        if (success) success.style.display = 'flex';
        window.SP.toast('success', 'Appointment Booked!', 'We will confirm your site visit shortly.');

      } catch (err) {
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach(e => {
            const field = form.querySelector(`[name="${e.field}"]`);
            if (field) showFieldError(field, e.message);
          });
        }
        window.SP.toast('error', 'Booking Failed', err.message || 'Please try again.');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  function validateCtaForm(form) {
    clearAllErrors(form);
    let valid = true;

    const name  = form.querySelector('[name="name"]');
    const phone = form.querySelector('[name="phone"]');
    const date  = form.querySelector('[name="preferred_date"]');
    const time  = form.querySelector('[name="preferred_time"]');

    if (name && !name.value.trim())         { showFieldError(name, 'Full name is required');               valid = false; }
    if (phone) {
      if (!phone.value.trim())              { showFieldError(phone, 'Phone number is required');            valid = false; }
      else if (!validatePhone(phone.value)) { showFieldError(phone, 'Enter a valid 10-digit number');       valid = false; }
    }
    if (date && !date.value)                { showFieldError(date, 'Please choose a preferred visit date'); valid = false; }
    if (time && !time.value)                { showFieldError(time, 'Please choose a preferred time slot');  valid = false; }

    return valid;
  }

  // ── Site settings (admin → homepage live content) ─────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function parseStatValue(val) {
    const match = String(val).match(/^([\d.]+)(.*)/);
    if (!match) return { num: 0, suffix: String(val) };
    return { num: parseFloat(match[1]), suffix: match[2].trim() };
  }

  async function loadSiteSettings() {
    try {
      const res = await fetch(APP_CONFIG.API_BASE + '/public/settings');
      if (!res.ok) return;
      const json = await res.json();
      const hp = (json.data || {}).homepage || {};

      const set = (id, val, prop = 'textContent') => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el) el[prop] = val;
      };

      // Hero
      set('hp-hero-badge', hp.hero_badge);
      if (hp.hero_heading_1 || hp.hero_heading_2) {
        const el = document.getElementById('hp-hero-headline');
        if (el) {
          const h1 = escHtml(hp.hero_heading_1 || '');
          const h2 = escHtml(hp.hero_heading_2 || '');
          el.innerHTML = h2 ? `${h1} <em class="text-shimmer">${h2}</em>` : h1;
        }
      }
      set('hp-hero-sub', hp.hero_subtext);
      set('hp-hero-cta1-text', hp.hero_cta_text);

      // Stats
      for (let i = 1; i <= 5; i++) {
        const val = hp[`stat_${i}_value`];
        const lbl = hp[`stat_${i}_label`];
        if (val) {
          const el = document.getElementById(`hp-stat-${i}-val`);
          if (el) {
            const { num, suffix } = parseStatValue(val);
            el.setAttribute('data-counter', num);
            el.setAttribute('data-counter-suffix', suffix);
            el.textContent = val;
          }
        }
        set(`hp-stat-${i}-lbl`, lbl);
      }

      // About
      set('hp-about-eyebrow', hp.about_eyebrow);
      if (hp.about_heading) {
        const el = document.getElementById('hp-about-title');
        if (el) el.innerHTML = escHtml(hp.about_heading);
      }
      set('hp-about-lead', hp.about_body);
      if (hp.about_image) set('hp-about-img', hp.about_image, 'src');
      if (hp.about_accent_image) set('hp-about-accent-img', hp.about_accent_image, 'src');

      // CTA section
      if (hp.cta_heading) {
        const el = document.getElementById('hp-cta-headline');
        if (el) el.innerHTML = escHtml(hp.cta_heading);
      }
      set('hp-cta-desc', hp.cta_subtext);

    } catch (_) {
      // Silent fail — hardcoded defaults remain visible
    }
  }

  // ── Init ──────────────────────────────────────────────────────

  async function init() {
    await loadSiteSettings(); // fetch settings before counter animation reads data-counter
    initCounters();
    initProjects();
    initHeroForm();
    initCtaForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
