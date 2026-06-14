// ============================================================
// SAMARTH PROPERTIES — About Page
// File: frontend/assets/js/about.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function aboutPage() {
  'use strict';

  // ── Animated counters ─────────────────────────────────────
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
    const suffix   = el.dataset.counterSuffix || '';
    const format   = el.dataset.counterFormat;
    const duration = 2200;
    const start    = performance.now();

    function step(now) {
      const elapsed  = Math.min(now - start, duration);
      const eased    = 1 - Math.pow(1 - elapsed / duration, 3);
      const current  = target * eased;

      let display;
      if (format === 'compact') {
        display = current >= 1000
          ? (current / 1000).toFixed(current >= 10000 ? 0 : 1) + 'K'
          : Math.round(current).toString();
      } else {
        display = String(target).includes('.')
          ? current.toFixed(1)
          : Math.round(current).toString();
      }

      el.textContent = display + suffix;
      if (elapsed < duration) requestAnimationFrame(step);
      else {
        // Final exact value
        if (format === 'compact') {
          el.textContent = (target >= 1000 ? (target / 1000).toFixed(0) + 'K' : target) + suffix;
        } else {
          el.textContent = (String(target).includes('.') ? target.toFixed(1) : target) + suffix;
        }
      }
    }
    requestAnimationFrame(step);
  }

  // ── Load About Page settings from admin ───────────────────
  async function loadAboutSettings() {
    try {
      const base = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_BASE : 'http://localhost:8080/api';
      const res  = await fetch(base + '/public/settings');
      if (!res.ok) return;
      const { data } = await res.json();
      const a = data?.about || {};

      const setText = (id, txt) => { const el = document.getElementById(id); if (el && txt) el.textContent = txt; };
      const setSrc  = (id, src) => { const el = document.getElementById(id); if (el && src) el.src = src; };

      // Hero
      setText('ab-hero-eyebrow', a.hero_eyebrow);
      setText('ab-hero-desc',    a.hero_desc);
      if (a.hero_title) {
        const el = document.getElementById('ab-hero-title');
        if (el) el.textContent = a.hero_title;
      }

      // Hero stats
      [1,2,3,4].forEach(i => {
        setText(`ab-hstat-${i}-num`, a[`hstat${i}_value`]);
        setText(`ab-hstat-${i}-lbl`, a[`hstat${i}_label`]);
      });

      // Story
      setText('ab-story-lead',   a.story_lead);
      setText('ab-story-body-1', a.story_body1);
      setText('ab-story-body-2', a.story_body2);
      setSrc('ab-story-img-main',   a.story_img_main);
      setSrc('ab-story-img-accent', a.story_img_accent);

      // Founder badge
      if (a.founder_name) {
        setText('ab-founder-name', a.founder_name);
        const av = document.getElementById('ab-founder-avatar');
        if (av) {
          const parts = a.founder_name.trim().split(/\s+/);
          av.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
        }
      }
      setText('ab-founder-title', a.founder_title);

      // Pillars
      [1,2,3].forEach(i => {
        setText(`ab-pillar-${i}-title`, a[`pillar${i}_title`]);
        setText(`ab-pillar-${i}-desc`,  a[`pillar${i}_desc`]);
      });

      // Stats strip — update text AND data-counter before animation runs
      for (let i = 1; i <= 5; i++) {
        const val = a[`stat${i}_value`], lbl = a[`stat${i}_label`];
        if (val) {
          const el = document.getElementById(`ab-stat-${i}-num`);
          if (el) {
            el.textContent = val;
            const num = parseFloat(val.replace(/[^0-9.]/g, ''));
            if (!isNaN(num)) el.dataset.counter = num;
            const suffix = val.replace(/^[\d.]+/, '');
            el.dataset.counterSuffix = suffix;
          }
        }
        setText(`ab-stat-${i}-lbl`, lbl);
      }
    } catch(_) {}
  }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    await loadAboutSettings();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
