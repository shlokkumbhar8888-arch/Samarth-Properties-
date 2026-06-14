// ============================================================
// SAMARTH PROPERTIES — Admin Core
// File: frontend/admin/assets/js/admin-core.js
// Loaded on every admin page (except login)
// Depends on: ../../assets/js/config.js (APP_CONFIG)
// ============================================================

/* ── Auth ──────────────────────────────────────────────────── */
const Auth = (function () {
  const TOKEN_KEY = 'sp_token';
  const USER_KEY  = 'sp_admin_user';

  return {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
    getUser:  () => {
      try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
    },
    setUser:  (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
    clear:    () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
    logout:   () => { Auth.clear(); location.href = 'index.html'; },
    guard:    () => {
      if (!Auth.getToken()) {
        location.href = 'index.html';
        throw new Error('Not authenticated');
      }
    },
  };
})();

/* ── Admin fetch wrapper ───────────────────────────────────── */
async function adminFetch(path, options = {}) {
  const token = Auth.getToken();
  if (!token) { Auth.logout(); return; }

  const url     = APP_CONFIG.API_BASE + path;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };

  try {
    const res  = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) { Auth.logout(); return; }

    if (!res.ok) {
      const err = new Error(data.message || `HTTP ${res.status}`);
      if (data.errors && Array.isArray(data.errors)) err.details = data.errors;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.message.includes('fetch')) throw new Error('Network error. Check your connection.');
    throw err;
  }
}

/* ── Admin API methods ─────────────────────────────────────── */
const AdminAPI = {
  auth: {
    login: (body) => fetch(APP_CONFIG.API_BASE + '/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Login failed');
      return d;
    }),
  },
  stats: {
    get: () => adminFetch('/admin/auth/dashboard-stats'),
  },
  projects: {
    list:   (p = {}) => adminFetch('/admin/projects?' + new URLSearchParams(p)),
    get:    (id)      => adminFetch(`/admin/projects/${id}`),
    create: (b)       => adminFetch('/admin/projects', { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b)   => adminFetch(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id)      => adminFetch(`/admin/projects/${id}`, { method: 'DELETE' }),
  },
  enquiries: {
    list:   (p = {}) => adminFetch('/admin/enquiries?' + new URLSearchParams(p)),
    update: (id, b)  => adminFetch(`/admin/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
    delete: (id)     => adminFetch(`/admin/enquiries/${id}`, { method: 'DELETE' }),
  },
  appointments: {
    list:   (p = {}) => adminFetch('/admin/appointments?' + new URLSearchParams(p)),
    update: (id, b)  => adminFetch(`/admin/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
    delete: (id)     => adminFetch(`/admin/appointments/${id}`, { method: 'DELETE' }),
  },
  blogs: {
    list:   (p = {}) => adminFetch('/admin/blogs?' + new URLSearchParams(p)),
    get:    (id)      => adminFetch(`/admin/blogs/${id}`),
    create: (b)       => adminFetch('/admin/blogs', { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b)   => adminFetch(`/admin/blogs/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id)      => adminFetch(`/admin/blogs/${id}`, { method: 'DELETE' }),
  },
  team: {
    list:   ()       => adminFetch('/admin/team'),
    create: (b)      => adminFetch('/admin/team', { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b)  => adminFetch(`/admin/team/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id)     => adminFetch(`/admin/team/${id}`, { method: 'DELETE' }),
  },
  testimonials: {
    list:   (p = {}) => adminFetch('/admin/testimonials?' + new URLSearchParams(p)),
    create: (b)      => adminFetch('/admin/testimonials', { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b)  => adminFetch(`/admin/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id)     => adminFetch(`/admin/testimonials/${id}`, { method: 'DELETE' }),
  },
  config: {
    getAll: ()  => adminFetch('/admin/config'),
    update: (b) => adminFetch('/admin/config', { method: 'PUT', body: JSON.stringify(b) }),
  },
  media: {
    list:   (p = {}) => adminFetch('/media?' + new URLSearchParams(p)),
    update: (id, b)  => adminFetch(`/media/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
    delete: (id)     => adminFetch(`/media/${id}`, { method: 'DELETE' }),
  },
};

/* ── Sidebar definition ────────────────────────────────────── */
const NAV_ITEMS = [
  {
    href: 'dashboard.html', label: 'Dashboard',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  },
  {
    href: 'projects.html', label: 'Projects',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  },
  {
    href: 'enquiries.html', label: 'Enquiries',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    badgeId: 'nav-badge-enquiries',
  },
  {
    href: 'appointments.html', label: 'Appointments',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    badgeId: 'nav-badge-appts',
  },
  {
    href: 'team.html', label: 'Team',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  { divider: true },
  {
    href: 'config.html', label: 'Settings',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  },
  {
    href: 'media.html', label: 'Media',
    icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
];

/* ── Shell injection ───────────────────────────────────────── */
function initAdminShell(pageTitle, breadcrumb) {
  Auth.guard();

  const currentFile = location.pathname.split('/').pop() || 'dashboard.html';
  const user        = Auth.getUser() || { email: 'admin@samarth.in', role: 'admin' };
  const initials    = (user.name || user.email || 'A').slice(0, 2).toUpperCase();

  // ── Sidebar ──────────────────────────────────────────────
  const navHtml = NAV_ITEMS.map(item => {
    if (item.divider) return `<div style="border-top:1px solid rgba(255,255,255,.07);margin:8px 0;"></div>`;
    const isActive = item.href === currentFile;
    const cls = ['adm-nav__item', isActive ? 'active' : '', item.disabled ? 'adm-nav__item--disabled' : ''].join(' ');
    const badge = item.badgeId ? `<span class="adm-nav__badge" id="${item.badgeId}" style="display:none;"></span>` : '';
    return `<a href="${item.href}" class="${cls}">
      <span class="adm-nav__icon">${item.icon}</span>
      <span>${item.label}</span>${badge}
    </a>`;
  }).join('');

  const sidebarHtml = `
    <a class="adm-sidebar__logo" href="dashboard.html">
      <div class="adm-sidebar__logo-mark">SP</div>
      <div class="adm-sidebar__logo-text">
        <span class="adm-sidebar__logo-title">Samarth</span>
        <span class="adm-sidebar__logo-sub">Admin Panel</span>
      </div>
    </a>
    <nav class="adm-nav">${navHtml}</nav>
    <div class="adm-sidebar__footer">
      <div class="adm-user">
        <div class="adm-user__avatar">${initials}</div>
        <div class="adm-user__info">
          <p class="adm-user__name">${user.name || user.email}</p>
          <p class="adm-user__role">${user.role || 'admin'}</p>
        </div>
      </div>
      <button class="adm-logout-btn" id="adm-logout-btn">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
    </div>`;

  const sidebarEl = document.getElementById('adm-sidebar');
  if (sidebarEl) sidebarEl.innerHTML = sidebarHtml;

  // ── Overlay for mobile ───────────────────────────────────
  const overlayEl = document.getElementById('adm-sidebar-overlay');

  // ── Header ───────────────────────────────────────────────
  const bcHtml = Array.isArray(breadcrumb)
    ? breadcrumb.map((b, i) => i < breadcrumb.length - 1
        ? `<a href="${b.href || '#'}">${b.label}</a><span class="adm-breadcrumb__sep">›</span>`
        : `<span class="adm-breadcrumb__current">${b.label}</span>`
      ).join('')
    : `<span class="adm-breadcrumb__current">${pageTitle}</span>`;

  const headerHtml = `
    <div class="adm-header__left">
      <button class="adm-hamburger" id="adm-hamburger" aria-label="Toggle menu">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <nav class="adm-breadcrumb">
        <a href="dashboard.html">Home</a>
        <span class="adm-breadcrumb__sep">›</span>
        ${bcHtml}
      </nav>
    </div>
    <div class="adm-header__right">
      <div class="adm-lang-toggle" title="Translate content fields">
        <button class="adm-lang-btn adm-lang-btn--active" data-adm-lang="en" onclick="window.AdminTranslate?.setLang('en')" aria-label="English">EN</button>
        <button class="adm-lang-btn" data-adm-lang="mr" onclick="window.AdminTranslate?.setLang('mr')" aria-label="मराठी">म</button>
      </div>
      <a href="../../index.html" target="_blank" class="adm-header__site-link">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View Site
      </a>
    </div>`;

  const headerEl = document.getElementById('adm-header');
  if (headerEl) headerEl.innerHTML = headerHtml;

  // Update document title
  document.title = `${pageTitle} — Samarth Admin`;

  // ── Events ───────────────────────────────────────────────
  document.getElementById('adm-logout-btn')?.addEventListener('click', () => Auth.logout());

  const hamburger = document.getElementById('adm-hamburger');
  const sidebar   = document.getElementById('adm-sidebar');

  hamburger?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlayEl?.classList.toggle('open');
  });

  overlayEl?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlayEl?.classList.remove('open');
  });

  // ── Toast container ──────────────────────────────────────
  if (!document.getElementById('adm-toast-container')) {
    const tc = document.createElement('div');
    tc.id        = 'adm-toast-container';
    tc.className = 'adm-toast-container';
    document.body.appendChild(tc);
  }
}

/* ── Toast ─────────────────────────────────────────────────── */
function adminToast(type, title, msg = '', duration = 4000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('adm-toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `adm-toast adm-toast--${type}`;
  el.innerHTML = `
    <div class="adm-toast__icon">${icons[type] || 'ℹ️'}</div>
    <div class="adm-toast__body">
      <p class="adm-toast__title">${title}</p>
      ${msg ? `<p class="adm-toast__msg">${msg}</p>` : ''}
    </div>`;
  container.appendChild(el);

  const dismiss = () => {
    el.classList.add('closing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  el.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

/* ── Confirm modal ─────────────────────────────────────────── */
function adminConfirm({ title, desc, icon = '🗑️', type = 'danger' }) {
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.className = 'adm-modal-backdrop';
    backdrop.innerHTML = `
      <div class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-confirm-title">
        <div class="adm-modal__icon adm-modal__icon--${type}">${icon}</div>
        <h3 class="adm-modal__title" id="adm-confirm-title">${title}</h3>
        <p class="adm-modal__desc">${desc}</p>
        <div class="adm-modal__footer">
          <button class="adm-btn adm-btn--secondary" id="adm-confirm-cancel">Cancel</button>
          <button class="adm-btn adm-btn--danger" id="adm-confirm-ok">${type === 'danger' ? 'Delete' : 'Confirm'}</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    const close = (result) => {
      backdrop.remove();
      resolve(result);
    };

    backdrop.querySelector('#adm-confirm-cancel').addEventListener('click', () => close(false));
    backdrop.querySelector('#adm-confirm-ok').addEventListener('click',     () => close(true));
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(false); });
  });
}

/* ── Drawer open/close ─────────────────────────────────────── */
function openDrawer(drawerId, backdropId) {
  document.getElementById(drawerId)?.classList.add('open');
  document.getElementById(backdropId)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(drawerId, backdropId) {
  document.getElementById(drawerId)?.classList.remove('open');
  document.getElementById(backdropId)?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Date helpers ──────────────────────────────────────────── */
function admFormatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

function admFormatDateTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function admRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/* ── Slug generator ────────────────────────────────────────── */
function generateSlug(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ── Admin pagination ──────────────────────────────────────── */
function buildAdmPageRange(cur, tot) {
  if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
  if (cur <= 4)        return [1, 2, 3, 4, 5, '…', tot];
  if (cur >= tot - 3)  return [1, '…', tot-4, tot-3, tot-2, tot-1, tot];
  return [1, '…', cur-1, cur, cur+1, '…', tot];
}

function renderAdmPagination(pag, containerId, goFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!pag || pag.totalPages <= 1) { el.innerHTML = ''; return; }

  const { page, totalPages, total, pageSize } = pag;
  const from = (page - 1) * (pageSize || 10) + 1;
  const to   = Math.min(page * (pageSize || 10), total || 0);
  const pages = buildAdmPageRange(page, totalPages);

  el.innerHTML = `
    <div class="adm-pagination">
      <span class="adm-pagination__info">Showing ${from}–${to} of ${total}</span>
      <div class="adm-pagination__pages">
        <button class="adm-pagination__btn" ${page <= 1 ? 'disabled' : ''} onclick="${goFn}(${page-1})" aria-label="Previous">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        ${pages.map(p => p === '…'
          ? `<span class="adm-pagination__btn adm-pagination__btn--ellipsis">…</span>`
          : `<button class="adm-pagination__btn${p === page ? ' active' : ''}" onclick="${goFn}(${p})">${p}</button>`
        ).join('')}
        <button class="adm-pagination__btn" ${page >= totalPages ? 'disabled' : ''} onclick="${goFn}(${page+1})" aria-label="Next">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>`;
}

/* ── Skeleton rows ─────────────────────────────────────────── */
function renderAdmSkeletonRows(tbody, cols, count = 5) {
  tbody.innerHTML = Array(count).fill(`
    <tr class="adm-table__skeleton-row">
      ${Array(cols).fill('<td><div class="adm-skeleton" style="height:14px;border-radius:4px;"></div></td>').join('')}
    </tr>`).join('');
}
