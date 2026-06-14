// ============================================================
// SAMARTH PROPERTIES — Admin Config / Settings
// File: frontend/admin/assets/js/config-admin.js
// ============================================================

(function configAdmin() {
  'use strict';

  initAdminShell('Settings', [{ label: 'Settings' }]);

  const statusEl = document.getElementById('cfg-load-status');

  // ── Tab switching ──────────────────────────────────────────
  const tabs     = document.querySelectorAll('.cfg-tab');
  const sections = document.querySelectorAll('.cfg-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.section;
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      sections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(`sec-${target}`)?.classList.add('active');
    });
  });

  // ── Keyboard navigation ───────────────────────────────────
  document.querySelector('.cfg-tabs')?.addEventListener('keydown', e => {
    if (!e.target.matches('.cfg-tab')) return;
    const list  = [...tabs];
    const idx   = list.indexOf(e.target);
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % list.length;
    if (e.key === 'ArrowLeft')  next = (idx - 1 + list.length) % list.length;
    if (next >= 0) { e.preventDefault(); list[next].focus(); list[next].click(); }
  });

  // ── API helpers ────────────────────────────────────────────
  // Config routes live at /api/config/... (not /api/admin/...)
  // but still use the admin JWT via adminFetch.
  const ConfigAPI = {
    getAll: () => adminFetch('/config/settings'),
    bulkUpdate: (rows) => adminFetch('/config/settings/bulk', {
      method: 'POST',
      body:   JSON.stringify({ settings: rows }),
    }),
  };

  // ── Data shape helpers ─────────────────────────────────────
  // Backend returns: [{ category, key, value, ... }]
  // Frontend uses:   "category.key" as data-config-key attribute
  function arrayToFlatMap(rows) {
    const map = {};
    for (const row of rows) {
      if (row.category && row.key) map[`${row.category}.${row.key}`] = row.value;
    }
    return map;
  }

  // Flat map { "brand.site_name": "val" } → bulk rows array
  function flatMapToRows(flatData) {
    return Object.entries(flatData).map(([compositeKey, value]) => {
      const dotIdx  = compositeKey.indexOf('.');
      const category = compositeKey.slice(0, dotIdx);
      const key      = compositeKey.slice(dotIdx + 1);
      return { category, key, value: String(value), value_type: 'text' };
    });
  }

  // ── Load config into form ─────────────────────────────────
  async function loadConfig() {
    if (statusEl) statusEl.textContent = 'Loading configuration…';
    try {
      const res    = await ConfigAPI.getAll();
      const rows   = res.data || [];
      const config = arrayToFlatMap(rows);

      document.querySelectorAll('[data-config-key]').forEach(el => {
        const key = el.dataset.configKey;
        const val = config[key];
        if (val == null) return;

        if (el.tagName === 'SELECT') {
          const opt = [...el.options].find(o => o.value === String(val));
          if (opt) opt.selected = true;
        } else if (el.type === 'checkbox') {
          el.checked = val === 'true' || val === true;
        } else {
          el.value = val;
        }
      });

      const lastUpdated = rows.reduce((latest, r) => {
        return r.updated_at && r.updated_at > latest ? r.updated_at : latest;
      }, '');
      if (statusEl) {
        statusEl.textContent = lastUpdated
          ? `Last saved: ${admFormatDateTime(lastUpdated)}`
          : 'No settings saved yet';
      }
    } catch (err) {
      if (statusEl) statusEl.textContent = 'Could not load settings';
      adminToast('error', 'Load failed', err.message);
    }
  }

  // ── Save a section ────────────────────────────────────────
  async function save(section) {
    const flat = {};
    document.querySelectorAll(`[data-config-key][data-section="${section}"]`).forEach(el => {
      const key = el.dataset.configKey;
      if (el.type === 'checkbox') {
        flat[key] = String(el.checked);
      } else {
        const val = el.value.trim();
        flat[key] = val;
      }
    });

    const btn      = document.querySelector(`#sec-${section} .adm-btn--primary`);
    const savedEl  = document.getElementById(`saved-${section}`);
    const origText = btn?.innerHTML;

    if (btn)    { btn.disabled = true; btn.innerHTML = '<span class="adm-spinner"></span> Saving…'; }
    if (savedEl) savedEl.classList.remove('visible');

    try {
      await ConfigAPI.bulkUpdate(flatMapToRows(flat));
      adminToast('success', 'Settings saved', sectionLabel(section) + ' settings have been updated.');
      if (savedEl) {
        savedEl.classList.add('visible');
        setTimeout(() => savedEl.classList.remove('visible'), 4000);
      }
    } catch (err) {
      adminToast('error', 'Save failed', err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = origText; }
    }
  }

  function sectionLabel(section) {
    const map = { brand: 'Brand', contact: 'Contact', social: 'Social', homepage: 'Homepage', about: 'About Page', seo: 'SEO' };
    return map[section] || section;
  }

  // ── Public API for inline onclick handlers ─────────────────
  window._cfg = { save };

  // ── Init ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
  } else {
    loadConfig();
  }
})();
