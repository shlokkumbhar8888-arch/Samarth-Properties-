// ============================================================
// SAMARTH PROPERTIES — Frontend Configuration
// File: frontend/assets/js/config.js
// ============================================================

const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _API_BASE = _isLocal
  ? 'http://localhost:8080/api'
  : 'https://YOUR-APP-NAME.onrender.com/api'; // ← Replace with your Render URL after deploying backend

const APP_CONFIG = Object.freeze({
  // ── API ─────────────────────────────────────────────────────
  API_BASE: _API_BASE,

  // ── Business Info ────────────────────────────────────────────
  COMPANY_NAME: 'Samarth Properties',
  TAGLINE: 'Building Dreams, Delivering Trust',
  PHONE_PRIMARY: '+91 72765 83404',
  EMAIL: 'samarthproperties004@gmail.com',
  WHATSAPP: '917276583404',
  WHATSAPP_MESSAGE: 'Hello! I am interested in Samarth Park-4 plots at Karade, Ranjangaon MIDC. Please share more details.',

  // ── Addresses ────────────────────────────────────────────────
  ADDRESS_CORPORATE: 'Sunrise City, Talegaon Dhamdhare, Ta. Shirur, Ji. Pune',
  ADDRESS_SITE: 'Samarth Park-4, Karade, Ranjangaon, MIDC, Pune',

  // ── Social Links ─────────────────────────────────────────────
  SOCIAL: {
    facebook:  'https://www.facebook.com/share/17mx1Eu2Yo/',
    twitter:   'https://x.com/SamarthProperty',
    instagram: 'https://www.instagram.com/samarth_properties',
    linkedin:  'https://www.linkedin.com/in/samarth-properties-b3ab4b256',
    youtube:   '',
  },

  // ── Pagination ────────────────────────────────────────────────
  PAGE_SIZE: 9,

  // ── Feature Flags ─────────────────────────────────────────────
  ENABLE_EXIT_INTENT: true,
  ENABLE_ANALYTICS_TRACKING: true,
  EXIT_INTENT_DELAY_MS: 3000,   // Min time on page before exit intent can fire
  EXIT_INTENT_COOLDOWN_DAYS: 3, // Days before showing again after dismiss
});

// Whatsapp chat URL builder
function whatsappUrl(message = APP_CONFIG.WHATSAPP_MESSAGE) {
  return `https://wa.me/${APP_CONFIG.WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// Format price as Indian ₹ with lakh/crore suffix
function formatPrice(amount, unit = 'total') {
  if (!amount) return 'Price on Request';
  const n = Number(amount);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatPriceRange(min, max, unit = 'total') {
  if (!min && !max) return 'Price on Request';
  if (min && max && min !== max) return `${formatPrice(min)} – ${formatPrice(max)}`;
  return formatPrice(min || max, unit);
}

// Format area with unit
function formatArea(min, max, unit = 'sqft') {
  if (!min && !max) return '—';
  const fmt = (v) => Number(v).toLocaleString('en-IN') + ' ' + unit;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

// Relative time (e.g. "2 days ago")
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// Format date as "15 Mar 2024"
function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Estimated read time (words / 200 wpm)
function readTime(text) {
  const words = (text || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Debounce
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Generate session ID (stored in sessionStorage)
function getSessionId() {
  let id = sessionStorage.getItem('sp_session');
  if (!id) {
    id = 'sp_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now();
    sessionStorage.setItem('sp_session', id);
  }
  return id;
}
