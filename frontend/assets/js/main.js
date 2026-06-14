// ============================================================
// SAMARTH PROPERTIES — Core Site Script
// File: frontend/assets/js/main.js
// Handles: navigation, footer inject, toast, WhatsApp FAB,
//          scroll reveal, counters, exit intent, ripple effects
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  injectNav();
  injectFooter();
  injectWhatsAppFab();
  injectScrollTop();
  injectToastContainer();
  initScrollReveal();
  initScrollProgress();
  initRippleEffect();
  initExitIntent();
  initScrollSpy();
  initCompareBar();
});

/* ════════════════════════════════════════════════════════════
   PAGE LOADER
   ════════════════════════════════════════════════════════════ */
function initPageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 500);
  });
}

/* ════════════════════════════════════════════════════════════
   NAVIGATION
   ════════════════════════════════════════════════════════════ */
function injectNav() {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;

  // Detect relative path depth for links
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const base = depth > 0 ? '../' : '';

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const links = [
    { href: `${base}index.html`,              label: 'Home',     page: 'index.html' },
    { href: `${base}pages/projects.html`,     label: 'Projects', page: 'projects.html' },
    { href: `${base}pages/about.html`,        label: 'About Us', page: 'about.html' },
    { href: `${base}pages/contact.html`,      label: 'Contact',  page: 'contact.html' },
  ];

  const navLinksHtml = links.map(l =>
    `<a href="${l.href}" class="nav-link${currentPage === l.page ? ' active' : ''}">${l.label}</a>`
  ).join('');

  const drawerLinksHtml = links.map(l =>
    `<a href="${l.href}" class="nav-drawer__link${currentPage === l.page ? ' active' : ''}">${l.label}</a>`
  ).join('');

  placeholder.innerHTML = `
  <nav class="site-nav site-nav--transparent" id="site-nav" role="navigation" aria-label="Main navigation">
    <div class="container nav-inner">
      <a href="${base}index.html" class="nav-logo" aria-label="Samarth Properties Home">
        <div class="nav-logo__text">
          <span class="nav-logo__name">Samarth Properties</span>
          <span class="nav-logo__tagline">Premium Real Estate</span>
        </div>
      </a>

      <div class="nav-links" role="list">${navLinksHtml}</div>

      <div class="nav-cta">
        <a href="tel:+917276583404" class="nav-phone nav-phone--icon" id="nav-phone-link" aria-label="Call us">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.97a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        </a>
        <div class="sp-lang-toggle" aria-label="Language">
          <button class="sp-lang-btn sp-lang-btn--active" data-sp-lang="en" onclick="window.SPTranslate?.setLang('en')" aria-label="English">EN</button>
          <button class="sp-lang-btn" data-sp-lang="mr" onclick="window.SPTranslate?.setLang('mr')" aria-label="मराठी">म</button>
        </div>
        <a href="${base}pages/contact.html" class="btn btn--primary btn--sm btn--round">Book Site Visit</a>
        <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <div class="nav-overlay" id="nav-overlay" aria-hidden="true"></div>
  <div class="nav-drawer" id="nav-drawer" role="dialog" aria-label="Mobile menu" aria-modal="true">
    <button class="nav-drawer__close" id="nav-drawer-close" aria-label="Close menu">✕</button>
    <div class="nav-drawer__links">${drawerLinksHtml}</div>
    <div style="display:flex;flex-direction:column;gap:12px;padding-top:8px;">
      <a href="tel:+917276583404" class="btn btn--ghost btn--full" id="drawer-phone-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.97a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        Call Us
      </a>
      <a href="${base}pages/contact.html" class="btn btn--primary btn--full btn--round">Book Site Visit</a>
    </div>
  </div>`;

  initNavBehavior();
}

function initNavBehavior() {
  const nav = document.getElementById('site-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-overlay');
  const closeBtn = document.getElementById('nav-drawer-close');

  if (!nav) return;

  // Scroll: transparent → solid
  const heroSection = document.getElementById('hero') || document.querySelector('.hero');
  let lastScroll = 0;

  function updateNav() {
    const scrollY = window.scrollY;
    if (scrollY > 80) {
      nav.classList.remove('site-nav--transparent');
      nav.classList.add('site-nav--solid');
    } else {
      nav.classList.add('site-nav--transparent');
      nav.classList.remove('site-nav--solid');
    }

    // Hide nav on fast scroll down, show on scroll up
    if (scrollY > 400) {
      if (scrollY > lastScroll + 5) {
        nav.style.transform = 'translateY(-100%)';
      } else if (scrollY < lastScroll - 2) {
        nav.style.transform = 'translateY(0)';
      }
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastScroll = scrollY;
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Drawer open/close
  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('visible');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (closeBtn)  closeBtn.addEventListener('click', closeDrawer);
  if (overlay)   overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}

/* ════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════ */
function injectFooter() {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;

  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const base = depth > 0 ? '../' : '';

  const year = new Date().getFullYear();

  placeholder.innerHTML = `
  <footer class="site-footer" role="contentinfo">
    <div class="footer-top">
      <div class="container footer-grid">

        <!-- Brand Column -->
        <div>
          <div class="footer-brand__logo">
            <div class="footer-brand__name" style="font-family:var(--font-serif);font-size:1.35rem;font-weight:700;color:var(--white);">
              Samarth <span style="color:var(--gold);">Properties</span>
            </div>
          </div>
          <p class="footer-brand__desc">
            Premium land and residential developments across Pune. Building trust, delivering dreams — one property at a time.
          </p>
          <div class="footer-social">
            <a id="footer-social-fb" href="${APP_CONFIG.SOCIAL.facebook}" target="_blank" rel="noopener noreferrer" class="footer-social__link" aria-label="Facebook">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a id="footer-social-ig" href="${APP_CONFIG.SOCIAL.instagram}" target="_blank" rel="noopener noreferrer" class="footer-social__link" aria-label="Instagram">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a id="footer-social-yt" href="${APP_CONFIG.SOCIAL.youtube}" target="_blank" rel="noopener noreferrer" class="footer-social__link" aria-label="YouTube">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
            </a>
            <a id="footer-social-li" href="${APP_CONFIG.SOCIAL.linkedin}" target="_blank" rel="noopener noreferrer" class="footer-social__link" aria-label="LinkedIn">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="footer-col__title">Quick Links</h3>
          <ul class="footer-links">
            <li><a href="${base}index.html" class="footer-link">Home</a></li>
            <li><a href="${base}pages/projects.html" class="footer-link">Our Projects</a></li>
            <li><a href="${base}pages/about.html" class="footer-link">About Us</a></li>
            <li><a href="${base}pages/contact.html" class="footer-link">Contact Us</a></li>
          </ul>
        </div>

        <!-- Projects -->
        <div>
          <h3 class="footer-col__title">Our Projects</h3>
          <ul class="footer-links" id="footer-projects">
            <li><a href="${base}pages/projects.html?type=plots" class="footer-link">Plots</a></li>
            <li><a href="${base}pages/projects.html?type=residential" class="footer-link">Residential</a></li>
            <li><a href="${base}pages/projects.html?type=villa" class="footer-link">Villas</a></li>
            <li><a href="${base}pages/projects.html?status=ongoing" class="footer-link">Ongoing Projects</a></li>
            <li><a href="${base}pages/projects.html?status=completed" class="footer-link">Completed Projects</a></li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h3 class="footer-col__title">Get In Touch</h3>
          <ul class="footer-contact-list">
            <li class="footer-contact-item">
              <div class="footer-contact-item__icon">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="footer-contact-item__text">
                <span class="footer-contact-item__label">Corporate Office</span>
                <span class="footer-contact-item__value" id="footer-address">${APP_CONFIG.ADDRESS_CORPORATE}</span>
              </div>
            </li>
            <li class="footer-contact-item">
              <div class="footer-contact-item__icon">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.97a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              </div>
              <div class="footer-contact-item__text">
                <span class="footer-contact-item__label">Phone</span>
                <span class="footer-contact-item__value">
                  <a href="tel:+917276583404" id="footer-phone">Call Us</a>
                </span>
              </div>
            </li>
            <li class="footer-contact-item">
              <div class="footer-contact-item__icon">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div class="footer-contact-item__text">
                <span class="footer-contact-item__label">Email</span>
                <span class="footer-contact-item__value">
                  <a href="mailto:${APP_CONFIG.EMAIL}" id="footer-email">${APP_CONFIG.EMAIL}</a>
                </span>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>

    <div class="footer-bottom">
      <div class="container" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <p>© ${year} Samarth Properties. All rights reserved.</p>
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">RERA Disclosure</a>
        </div>
      </div>
    </div>
  </footer>`;

  loadFooterSettings();
}

async function loadFooterSettings() {
  try {
    const base = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_BASE : _API_BASE);
    const res  = await fetch(base + '/public/settings');
    if (!res.ok) return;
    const { data } = await res.json();
    const c = data?.contact || {};

    if (c.phone_primary) {
      const el = document.getElementById('footer-phone');
      if (el) el.href = 'tel:' + c.phone_primary.replace(/\s+/g, '');
      const navEl = document.getElementById('nav-phone-link');
      if (navEl && c.phone_primary) navEl.href = 'tel:' + c.phone_primary.replace(/\s+/g, '');
      const drawerEl = document.getElementById('drawer-phone-link');
      if (drawerEl && c.phone_primary) drawerEl.href = 'tel:' + c.phone_primary.replace(/\s+/g, '');
    }
    if (c.email_primary) {
      const el = document.getElementById('footer-email');
      if (el) { el.href = 'mailto:' + c.email_primary; el.textContent = c.email_primary; }
    }
    if (c.address_line1) {
      const el = document.getElementById('footer-address');
      if (el) el.textContent = [c.address_line1, c.city, c.district].filter(Boolean).join(', ');
    }

    const s = data?.social || {};
    const socialMap = { 'footer-social-fb': s.facebook, 'footer-social-ig': s.instagram, 'footer-social-yt': s.youtube, 'footer-social-li': s.linkedin };
    Object.entries(socialMap).forEach(([id, url]) => {
      if (url) { const el = document.getElementById(id); if (el) el.href = url; }
    });
  } catch (_) {}
}

/* ════════════════════════════════════════════════════════════
   WHATSAPP FAB
   ════════════════════════════════════════════════════════════ */
function injectWhatsAppFab() {
  const fab = document.createElement('div');
  fab.className = 'whatsapp-fab';
  fab.innerHTML = `
    <span class="whatsapp-fab__tooltip">Chat with us</span>
    <a href="${whatsappUrl()}" target="_blank" rel="noopener noreferrer"
       class="whatsapp-fab__btn" aria-label="Chat on WhatsApp">
      <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>`;
  document.body.appendChild(fab);
}

/* ════════════════════════════════════════════════════════════
   SCROLL TO TOP
   ════════════════════════════════════════════════════════════ */
function injectScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ════════════════════════════════════════════════════════════ */
function injectToastContainer() {
  const el = document.createElement('div');
  el.className = 'toast-container';
  el.id = 'toast-container';
  document.body.appendChild(el);
}

const TOAST_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};
const TOAST_TITLES = {
  success: 'Success',
  error:   'Error',
  warning: 'Warning',
  info:    'Info',
};

function showToast({ type = 'info', title, message, duration = 5000 }) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.style.setProperty('--toast-duration', `${duration}ms`);

  toast.innerHTML = `
    <div class="toast__icon">${TOAST_ICONS[type] || 'ℹ'}</div>
    <div class="toast__content">
      <p class="toast__title">${title || TOAST_TITLES[type]}</p>
      ${message ? `<p class="toast__message">${message}</p>` : ''}
    </div>
    <button class="toast__close" aria-label="Dismiss">&times;</button>
    <div class="toast__progress"></div>`;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast__close');
  let timeout;

  function dismiss() {
    clearTimeout(timeout);
    toast.classList.add('closing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  closeBtn.addEventListener('click', dismiss);
  timeout = setTimeout(dismiss, duration);
}

// Convenience shortcuts
function toastSuccess(message, title) { showToast({ type: 'success', title, message }); }
function toastError(message, title)   { showToast({ type: 'error', title, message, duration: 7000 }); }
function toastWarning(message, title) { showToast({ type: 'warning', title, message }); }
function toastInfo(message, title)    { showToast({ type: 'info', title, message }); }

/* ════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal everything immediately
    document.querySelectorAll('[data-reveal], .reveal-stagger').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);

        // Trigger counter animation if target has data-counter children
        entry.target.querySelectorAll('[data-counter]').forEach(animateCounter);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-reveal], .reveal-stagger').forEach(el => {
    observer.observe(el);
  });

  // Also observe individual counter elements at top level
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => {
    counterObserver.observe(el);
  });
}

/* ════════════════════════════════════════════════════════════
   COUNTER ANIMATION
   ════════════════════════════════════════════════════════════ */
function animateCounter(el) {
  const target = parseFloat(el.dataset.counter);
  const duration = parseInt(el.dataset.counterDuration) || 2000;
  const decimals = (el.dataset.counter.toString().split('.')[1] || '').length;
  const suffix = el.dataset.counterSuffix || '';
  const prefix = el.dataset.counterPrefix || '';

  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startVal + (target - startVal) * eased;

    el.textContent = prefix + current.toFixed(decimals) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      el.classList.add('counter-done');
      el.addEventListener('animationend', () => el.classList.remove('counter-done'), { once: true });
    }
  }

  requestAnimationFrame(update);
}

/* ════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ════════════════════════════════════════════════════════════ */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.id = 'scroll-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
}

/* ════════════════════════════════════════════════════════════
   RIPPLE EFFECT on buttons
   ════════════════════════════════════════════════════════════ */
function initRippleEffect() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
    `;

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  });
}

/* ════════════════════════════════════════════════════════════
   EXIT INTENT
   ════════════════════════════════════════════════════════════ */
function initExitIntent() {
  if (!APP_CONFIG.ENABLE_EXIT_INTENT) return;

  const STORAGE_KEY = 'sp_exit_intent_dismissed';
  const cooldownDays = APP_CONFIG.EXIT_INTENT_COOLDOWN_DAYS;

  // Check if dismissed recently
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed) {
    const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
    if (daysSince < cooldownDays) return;
  }

  let minTimeReached = false;
  let shown = false;

  setTimeout(() => { minTimeReached = true; }, APP_CONFIG.EXIT_INTENT_DELAY_MS);

  // Inject exit intent overlay
  const overlay = document.createElement('div');
  overlay.className = 'exit-intent';
  overlay.id = 'exit-intent';
  overlay.innerHTML = `
    <div class="exit-intent__overlay"></div>
    <div class="exit-intent__box">
      <div class="exit-intent__visual">
        <button class="exit-intent__close" id="exit-intent-close" aria-label="Close">✕</button>
        <span class="exit-intent__emoji">🏡</span>
        <h2 class="exit-intent__headline">Wait — Don't Miss Out!</h2>
        <p class="exit-intent__sub">Get exclusive access to our latest projects and offers.</p>
      </div>
      <div class="exit-intent__body">
        <p style="font-size:.9375rem;color:var(--text-mid);margin-bottom:20px;line-height:1.7;">
          Let our experts help you find the perfect property. Book a <strong>free consultation</strong> before you go.
        </p>
        <a href="pages/contact.html" class="btn btn--primary btn--full btn--round" style="margin-bottom:10px;">
          Book Free Consultation
        </a>
        <a href="${whatsappUrl('Hi, I want to know more about Samarth Properties projects.')}"
           target="_blank" rel="noopener noreferrer"
           class="btn btn--ghost btn--full btn--round" style="border-color:rgba(0,0,0,.15);color:var(--text-dark);">
          💬 Chat on WhatsApp
        </a>
        <button class="exit-intent__dismiss" id="exit-intent-dismiss">No thanks, I'll look later</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  function showExitIntent() {
    if (shown || !minTimeReached) return;
    shown = true;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function dismissExitIntent() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }

  // Desktop: mouse leaves toward top of viewport
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 10) showExitIntent();
  });

  // Mobile: scroll back up aggressively (proxy for exit intent)
  let lastScrollY = 0;
  window.addEventListener('scroll', () => {
    if (lastScrollY - window.scrollY > 150 && window.scrollY < 200) showExitIntent();
    lastScrollY = window.scrollY;
  }, { passive: true });

  document.getElementById('exit-intent-close')?.addEventListener('click', dismissExitIntent);
  document.getElementById('exit-intent-dismiss')?.addEventListener('click', dismissExitIntent);
  overlay.querySelector('.exit-intent__overlay')?.addEventListener('click', dismissExitIntent);
}

/* ════════════════════════════════════════════════════════════
   ACTIVE NAV LINK — Scroll Spy (for single-page sections)
   ════════════════════════════════════════════════════════════ */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  if (!sections.length) return;

  const navLinks = document.querySelectorAll('.nav-link, .nav-drawer__link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.includes('#' + entry.target.id)) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => observer.observe(section));
}

/* ════════════════════════════════════════════════════════════
   PROJECT COMPARISON BAR
   ════════════════════════════════════════════════════════════ */
const compareList = [];
const MAX_COMPARE = 3;

function initCompareBar() {
  const bar = document.createElement('div');
  bar.className = 'compare-bar';
  bar.id = 'compare-bar';
  bar.innerHTML = `
    <div class="compare-bar__inner">
      <div class="compare-bar__items" id="compare-items"></div>
      <span class="compare-bar__hint" id="compare-hint">Select up to ${MAX_COMPARE} projects</span>
      <div style="display:flex;gap:10px;flex-shrink:0;">
        <button class="btn btn--ghost btn--sm" id="compare-clear">Clear</button>
        <button class="btn btn--primary btn--sm" id="compare-go" disabled>Compare Now</button>
      </div>
    </div>`;
  document.body.appendChild(bar);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.compare-btn');
    if (!btn) return;
    toggleCompare(btn.dataset.id, btn.dataset.name);
  });

  document.getElementById('compare-clear')?.addEventListener('click', clearCompare);
  document.getElementById('compare-go')?.addEventListener('click', () => {
    const ids = compareList.map(p => p.id).join(',');
    window.location.href = `pages/projects.html?compare=${ids}`;
  });
}

function toggleCompare(id, name) {
  const idx = compareList.findIndex(p => p.id === id);
  if (idx > -1) {
    compareList.splice(idx, 1);
  } else {
    if (compareList.length >= MAX_COMPARE) {
      toastWarning(`You can compare up to ${MAX_COMPARE} projects at once.`);
      return;
    }
    compareList.push({ id, name });
  }
  updateCompareBar();
}

function clearCompare() {
  compareList.length = 0;
  updateCompareBar();
}

function updateCompareBar() {
  const bar  = document.getElementById('compare-bar');
  const list = document.getElementById('compare-items');
  const hint = document.getElementById('compare-hint');
  const goBtn = document.getElementById('compare-go');

  if (!bar) return;

  bar.classList.toggle('visible', compareList.length > 0);

  if (list) {
    list.innerHTML = compareList.map(p => `
      <div class="compare-bar__item">
        <span class="compare-bar__item-name">${p.name}</span>
        <button class="compare-bar__item-remove" data-id="${p.id}" aria-label="Remove ${p.name}">✕</button>
      </div>`).join('');

    list.querySelectorAll('.compare-bar__item-remove').forEach(btn => {
      btn.addEventListener('click', () => toggleCompare(btn.dataset.id, ''));
    });
  }

  if (hint) hint.textContent = `${compareList.length} / ${MAX_COMPARE} selected`;
  if (goBtn) goBtn.disabled = compareList.length < 2;

  // Highlight cards
  document.querySelectorAll('.compare-btn').forEach(btn => {
    const isSelected = compareList.some(p => p.id === btn.dataset.id);
    btn.style.background = isSelected ? 'var(--gold)' : '';
    btn.style.color = isSelected ? 'var(--navy)' : '';
  });
}

/* ════════════════════════════════════════════════════════════
   ENQUIRY POPUP (Quick Enquiry)
   ════════════════════════════════════════════════════════════ */
function openEnquiryPopup(projectId = '', projectName = '') {
  const existing = document.getElementById('enquiry-popup');
  if (existing) {
    // Pre-fill project fields if provided
    const pidField = existing.querySelector('[name="project_id"]');
    const pnameField = existing.querySelector('[name="project_name"]');
    if (pidField) pidField.value = projectId;
    if (pnameField) pnameField.value = projectName;
    existing.classList.add('open');
    document.body.style.overflow = 'hidden';
    return;
  }

  const popup = document.createElement('div');
  popup.className = 'enquiry-popup';
  popup.id = 'enquiry-popup';
  popup.innerHTML = `
    <div class="enquiry-popup__overlay"></div>
    <div class="enquiry-popup__box">
      <div class="enquiry-popup__header">
        <div>
          <h2 class="enquiry-popup__title">Quick Enquiry</h2>
          <p class="enquiry-popup__subtitle">Our team will contact you within 2 hours.</p>
        </div>
        <button class="enquiry-popup__close" aria-label="Close">&times;</button>
      </div>
      <div class="enquiry-popup__body">
        <form id="quick-enquiry-form" novalidate>
          <input type="hidden" name="project_id" value="${projectId}">
          <input type="hidden" name="project_name" value="${projectName}">
          <div class="form-group">
            <label class="form-label">Your Name <span class="required">*</span></label>
            <input name="name" class="form-input" type="text" placeholder="Your full name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number <span class="required">*</span></label>
            <input name="phone" class="form-input" type="tel" placeholder="Your mobile number" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input name="email" class="form-input" type="email" placeholder="you@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea name="message" class="form-textarea" rows="3" placeholder="Tell us what you're looking for..."></textarea>
          </div>
          <button type="submit" class="btn btn--primary btn--full btn--round" id="quick-enquiry-submit">
            Send Enquiry
          </button>
        </form>
      </div>
    </div>`;
  document.body.appendChild(popup);

  setTimeout(() => popup.classList.add('open'), 10);
  document.body.style.overflow = 'hidden';

  function closePopup() {
    popup.classList.remove('open');
    document.body.style.overflow = '';
  }

  popup.querySelector('.enquiry-popup__close').addEventListener('click', closePopup);
  popup.querySelector('.enquiry-popup__overlay').addEventListener('click', closePopup);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  }, { once: true });

  popup.querySelector('#quick-enquiry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('#quick-enquiry-submit');
    clearAllErrors(form);

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    let valid = true;
    if (!data.name.trim()) { showFieldError(form.querySelector('[name="name"]'), 'Name is required'); valid = false; }
    if (!validatePhone(data.phone)) { showFieldError(form.querySelector('[name="phone"]'), 'Enter a valid Indian phone number'); valid = false; }
    if (data.email && !validateEmail(data.email)) { showFieldError(form.querySelector('[name="email"]'), 'Enter a valid email'); valid = false; }
    if (!valid) return;

    submitBtn.classList.add('loading');
    submitBtn.textContent = '';

    try {
      await API.enquiry.submit({ ...data, source: 'popup' });
      toastSuccess('Our team will call you within 2 hours!', 'Enquiry Received 🎉');
      closePopup();
    } catch (err) {
      toastError(err.message || 'Failed to send enquiry. Please try again.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.textContent = 'Send Enquiry';
    }
  });
}

// Expose for page scripts
window.SP = {
  showToast, toastSuccess, toastError, toastWarning, toastInfo,
  openEnquiryPopup,
  animateCounter,
  compareList,
  toggleCompare,
};
