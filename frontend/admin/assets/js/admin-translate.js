// ============================================================
// SAMARTH PROPERTIES — Admin Content Translator
// File: frontend/admin/assets/js/admin-translate.js
// Adds per-field and batch translate buttons to admin inputs.
// Uses the unofficial Google Translate API (no key required).
// ============================================================

(function AdminTranslate() {
  'use strict';

  const STORAGE_KEY = 'adm_translate_lang';
  let   currentLang = localStorage.getItem(STORAGE_KEY) || 'en';

  // ── Unofficial Google Translate API ──────────────────────
  async function translateText(text, targetLang) {
    if (!text || !text.trim()) return text;
    try {
      const url = 'https://translate.googleapis.com/translate_a/single' +
        '?client=gtx&sl=auto&tl=' + encodeURIComponent(targetLang) +
        '&dt=t&q=' + encodeURIComponent(text);
      const res  = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data[0].map(function (chunk) { return chunk[0]; }).join('');
    } catch (err) {
      throw new Error('Translation error: ' + err.message);
    }
  }

  // ── Create translate button for a single field ───────────
  function makeTranslateBtn(el) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adm-translate-btn';
    btn.title = 'Translate this field';
    btn.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8l6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;
    btn.addEventListener('click', async function () {
      const text = el.value.trim();
      if (!text) return;
      btn.disabled = true;
      btn.style.opacity = '0.5';
      try {
        const translated = await translateText(text, currentLang);
        el.value = translated;
        el.dispatchEvent(new Event('input'));
      } catch (_) {
        // silently fail — no toast spam per field
      } finally {
        btn.disabled = false;
        btn.style.opacity = '';
      }
    });
    return btn;
  }

  // ── Inject translate buttons next to text/textarea fields ─
  function injectButtons() {
    // Skip non-content fields (urls, numbers, emails, passwords, selects)
    const selector = 'input[type="text"].adm-input:not([type="url"]):not([type="number"]):not([type="email"]):not([readonly]), textarea.adm-input';
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.dataset.translateWired) return;
      el.dataset.translateWired = '1';
      const wrap = el.parentElement;
      if (!wrap) return;
      wrap.style.position = 'relative';
      const btn = makeTranslateBtn(el);
      wrap.appendChild(btn);
    });
  }

  // ── "Translate All" for a section ─────────────────────────
  async function translateSection(sectionEl, lang) {
    const target = lang || currentLang;
    const inputs = sectionEl.querySelectorAll(
      'input[type="text"].adm-input:not([type="url"]):not([readonly]), textarea.adm-input'
    );
    const btn = sectionEl.querySelector('.adm-translate-all-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Translating…'; }
    try {
      await Promise.all(Array.from(inputs).map(async function (el) {
        const text = el.value.trim();
        if (!text) return;
        try {
          el.value = await translateText(text, target);
          el.dispatchEvent(new Event('input'));
        } catch (_) {}
      }));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = target === 'mr' ? 'Translate All → मराठी' : 'Translate All → English'; }
    }
  }

  // ── Inject "Translate All" buttons per section panel ─────
  function injectSectionButtons() {
    document.querySelectorAll('.adm-panel').forEach(function (panel) {
      if (panel.querySelector('.adm-translate-all-btn')) return;
      const saveBar = panel.querySelector('.cfg-save-bar');
      if (!saveBar) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'adm-btn adm-translate-all-btn';
      btn.textContent = currentLang === 'mr' ? 'Translate All → मराठी' : 'Translate All → English';
      btn.addEventListener('click', function () { translateSection(panel); });
      saveBar.insertBefore(btn, saveBar.firstChild);
    });
  }

  // ── Update header toggle active state ────────────────────
  function updateUI(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-adm-lang]').forEach(function (btn) {
      btn.classList.toggle('adm-lang-btn--active', btn.dataset.admLang === lang);
    });
    document.querySelectorAll('.adm-translate-all-btn').forEach(function (btn) {
      btn.textContent = lang === 'mr' ? 'Translate All → मराठी' : 'Translate All → English';
    });
  }

  // ── Public API ────────────────────────────────────────────
  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    updateUI(lang);
  }

  window.AdminTranslate = { setLang, translateText, translateSection };

  // ── Boot ──────────────────────────────────────────────────
  function boot() {
    updateUI(currentLang);
    injectButtons();
    injectSectionButtons();
    // Re-run when new panels load (e.g. tab switches that add DOM)
    const obs = new MutationObserver(function () {
      injectButtons();
      injectSectionButtons();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
