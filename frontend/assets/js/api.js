// ============================================================
// SAMARTH PROPERTIES — API Client (Fetch Wrapper)
// File: frontend/assets/js/api.js
// ============================================================

class APIError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.errors = errors;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${APP_CONFIG.API_BASE}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem('sp_token');
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data.errors || null
      );
    }

    return data;
  } catch (err) {
    if (err instanceof APIError) throw err;
    // Network / CORS errors
    throw new APIError('Network error. Please check your connection.', 0);
  }
}

// ── Public API ────────────────────────────────────────────────
const API = {
  // Projects
  projects: {
    list: (params = {}) => apiFetch('/public/projects?' + new URLSearchParams(params)),
    featured: (limit = 6) => apiFetch(`/public/projects/featured?limit=${limit}`),
    bySlug: (slug) => apiFetch(`/public/projects/${slug}`),
  },

  // Testimonials
  testimonials: {
    list: (limit = 12, featured = false) =>
      apiFetch(`/public/testimonials?limit=${limit}${featured ? '&featured=true' : ''}`),
  },

  // Blogs
  blogs: {
    list: (params = {}) => apiFetch('/public/blogs?' + new URLSearchParams(params)),
    bySlug: (slug) => apiFetch(`/public/blogs/${slug}`),
  },

  // Team
  team: {
    list: () => apiFetch('/public/team'),
  },

  // Content (CMS)
  content: {
    all: (section = '') => apiFetch(`/public/content${section ? `?section=${section}` : ''}`),
  },

  // Forms
  enquiry: {
    submit: (body) => apiFetch('/public/enquiries', { method: 'POST', body: JSON.stringify(body) }),
  },
  appointment: {
    book: (body) => apiFetch('/public/appointments', { method: 'POST', body: JSON.stringify(body) }),
  },
  brochure: {
    download: (body) => apiFetch('/public/brochure-download', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Analytics
  analytics: {
    track: (body) => apiFetch('/public/analytics/track', { method: 'POST', body: JSON.stringify(body) }),
  },
};

// ── Skeleton helpers ──────────────────────────────────────────

function skeletonCard() {
  return `<div class="project-card project-card--skeleton">
    <div class="skeleton skeleton--img"></div>
    <div class="project-card--skeleton__body" style="padding:22px;display:flex;flex-direction:column;gap:10px;">
      <div class="skeleton skeleton--text" style="width:45%;height:.65em;"></div>
      <div class="skeleton skeleton--text" style="width:85%;height:1.2em;"></div>
      <div class="skeleton skeleton--text" style="width:100%;height:.85em;"></div>
      <div class="skeleton skeleton--text" style="width:70%;height:.85em;"></div>
    </div>
  </div>`;
}

function skeletonBlogCard() {
  return `<div class="blog-card" style="pointer-events:none;">
    <div class="skeleton" style="width:100%;aspect-ratio:16/9;"></div>
    <div style="padding:22px;display:flex;flex-direction:column;gap:10px;">
      <div class="skeleton skeleton--text" style="width:35%;height:.65em;"></div>
      <div class="skeleton skeleton--text" style="width:90%;height:1.1em;"></div>
      <div class="skeleton skeleton--text" style="width:100%;height:.8em;"></div>
      <div class="skeleton skeleton--text" style="width:65%;height:.8em;"></div>
    </div>
  </div>`;
}

// ── Render helpers ────────────────────────────────────────────

function projectTypeLabel(type) {
  const map = { plots: 'Plots', residential: 'Residential', commercial: 'Commercial', villa: 'Villa', apartment: 'Apartment' };
  return map[type] || type;
}

function projectStatusLabel(status) {
  const map = { ongoing: 'Ongoing', completed: 'Completed', upcoming: 'Upcoming' };
  return map[status] || status;
}

function renderProjectCard(p) {
  const priceStr = formatPriceRange(p.price_range_min, p.price_range_max, p.price_unit);
  const areaStr  = formatArea(p.area_min, p.area_max, p.area_unit);
  const imgSrc   = p.cover_image_url || 'assets/images/placeholder-property.jpg';

  return `
  <article class="project-card" data-reveal="up">
    <a href="pages/project-detail.html?slug=${p.slug}" class="project-card__img-wrap">
      <img class="project-card__img" src="${imgSrc}" alt="${p.name}" loading="lazy">
      <div class="project-card__badges">
        <span class="badge badge--${p.status}">${projectStatusLabel(p.status)}</span>
        <span class="badge badge--${p.type}">${projectTypeLabel(p.type)}</span>
        ${p.is_featured ? '<span class="badge badge--featured">Featured</span>' : ''}
      </div>
      <div class="project-card__actions">
        <button class="project-card__action compare-btn" data-id="${p.id}" data-name="${p.name}" title="Compare">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        </button>
        <button class="project-card__action wishlist-btn" data-id="${p.id}" title="Save">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </a>
    <div class="project-card__body">
      <div class="project-card__location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${p.city}${p.state ? ', ' + p.state : ''}
      </div>
      <h3 class="project-card__name">
        <a href="pages/project-detail.html?slug=${p.slug}">${p.name}</a>
      </h3>
      ${p.short_description ? `<p class="project-card__desc">${p.short_description}</p>` : ''}
      <div class="project-card__meta">
        <div class="project-card__meta-item">
          <span class="project-card__meta-label">Area</span>
          <span class="project-card__meta-value">${areaStr}</span>
        </div>
        ${p.total_units ? `
        <div class="project-card__meta-item">
          <span class="project-card__meta-label">Units</span>
          <span class="project-card__meta-value">${p.available_units ?? p.total_units} / ${p.total_units}</span>
        </div>` : ''}
        ${p.rera_number ? `
        <div class="project-card__meta-item">
          <span class="project-card__meta-label">RERA</span>
          <span class="project-card__meta-value" style="font-size:.75rem;">${p.rera_number}</span>
        </div>` : ''}
      </div>
    </div>
    <div class="project-card__footer">
      <div class="project-card__price">
        <span class="project-card__price-label">Price</span>
        <span class="project-card__price-value">${priceStr}</span>
      </div>
      <a href="pages/project-detail.html?slug=${p.slug}" class="btn btn--primary btn--sm">View Details</a>
    </div>
  </article>`;
}

function renderBlogCard(b) {
  const imgSrc = b.cover_image_url || 'assets/images/placeholder-blog.jpg';
  return `
  <article class="blog-card" data-reveal="up">
    <a href="pages/blog-detail.html?slug=${b.slug}" class="blog-card__img-wrap">
      <img class="blog-card__img" src="${imgSrc}" alt="${b.title}" loading="lazy">
      ${b.category ? `<span class="blog-card__category">${b.category}</span>` : ''}
    </a>
    <div class="blog-card__body">
      <div class="blog-card__meta">
        <span class="blog-card__meta-item">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${formatDate(b.published_at)}
        </span>
        ${b.read_time_mins ? `
        <span class="blog-card__meta-item">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${b.read_time_mins} min read
        </span>` : ''}
      </div>
      <h3 class="blog-card__title">
        <a href="pages/blog-detail.html?slug=${b.slug}">${b.title}</a>
      </h3>
      ${b.excerpt ? `<p class="blog-card__excerpt">${b.excerpt}</p>` : ''}
      <a href="pages/blog-detail.html?slug=${b.slug}" class="blog-card__link">
        Read Article
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>
  </article>`;
}

function renderStars(rating = 5) {
  return Array.from({ length: 5 }, (_, i) =>
    `<svg width="14" height="14" fill="${i < rating ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  ).join('');
}

function renderTestimonialCard(t) {
  const initials = t.client_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return `
  <div class="testimonial-card" data-reveal="up">
    <span class="testimonial-card__quote" aria-hidden="true">"</span>
    <div class="testimonial-card__stars">${renderStars(t.rating)}</div>
    <p class="testimonial-card__review">${t.review}</p>
    <div class="testimonial-card__author">
      ${t.photo_url
        ? `<img class="testimonial-card__avatar" src="${t.photo_url}" alt="${t.client_name}" loading="lazy">`
        : `<div class="testimonial-card__avatar testimonial-card__avatar--placeholder">${initials}</div>`
      }
      <div>
        <p class="testimonial-card__name">${t.client_name}</p>
        ${t.client_designation ? `<p class="testimonial-card__project">${t.client_designation}</p>` : ''}
        ${t.project_name ? `<p class="testimonial-card__project">${t.project_name}</p>` : ''}
      </div>
    </div>
  </div>`;
}

// ── Error display ─────────────────────────────────────────────
function renderError(message = 'Something went wrong. Please try again.', el) {
  const html = `<div class="empty-state">
    <div class="empty-state__icon">⚠️</div>
    <p class="empty-state__title">Oops!</p>
    <p class="empty-state__desc">${message}</p>
  </div>`;
  if (el) el.innerHTML = html;
  return html;
}

// ── Form validation helpers ───────────────────────────────────
function validatePhone(phone) {
  return /^(\+91|91)?[6-9]\d{9}$/.test(phone.replace(/\s|-/g, ''));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, message) {
  input.classList.add('error');
  const group = input.closest('.form-group');
  if (!group) return;
  let err = group.querySelector('.form-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error';
    input.after(err);
  }
  err.textContent = message;
}

function clearFieldError(input) {
  input.classList.remove('error');
  const group = input.closest('.form-group');
  if (group) {
    const err = group.querySelector('.form-error');
    if (err) err.remove();
  }
}

function clearAllErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => el.remove());
}
