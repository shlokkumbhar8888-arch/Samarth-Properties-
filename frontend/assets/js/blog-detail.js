// ============================================================
// SAMARTH PROPERTIES — Blog Detail Page
// File: frontend/assets/js/blog-detail.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function blogDetailPage() {
  'use strict';

  const slug = new URLSearchParams(window.location.search).get('slug');

  // ── DOM refs ──────────────────────────────────────────────
  const heroSkeleton   = document.getElementById('bd-hero-skeleton');
  const heroContent    = document.getElementById('bd-hero-content');
  const coverWrap      = document.getElementById('bd-cover-wrap');
  const coverImg       = document.getElementById('bd-cover-img');
  const bdLayout       = document.getElementById('bd-layout');
  const bdNotFound     = document.getElementById('bd-not-found');
  const bdRelated      = document.getElementById('bd-related');
  const relatedGrid    = document.getElementById('bd-related-grid');

  // Hero
  const bdBcTitle      = document.getElementById('bd-bc-title');
  const bdCategory     = document.getElementById('bd-category');
  const bdCategoryWrap = document.getElementById('bd-category-wrap');
  const bdTitle        = document.getElementById('bd-title');
  const bdAuthorAvatar = document.getElementById('bd-author-avatar');
  const bdAuthorName   = document.getElementById('bd-author-name');
  const bdArticleMeta  = document.getElementById('bd-article-meta');
  const bdShareBtn     = document.getElementById('bd-share-btn');

  // Article
  const bdToc          = document.getElementById('bd-toc');
  const bdTocList      = document.getElementById('bd-toc-list');
  const bdBody         = document.getElementById('bd-body');
  const bdTags         = document.getElementById('bd-tags');
  const bdTagsList     = document.getElementById('bd-tags-list');
  const bdAuthorBox    = document.getElementById('bd-author-box');
  const bdAuthorBoxAvatar = document.getElementById('bd-author-box-avatar');
  const bdAuthorBoxName   = document.getElementById('bd-author-box-name');
  const bdAuthorBoxBio    = document.getElementById('bd-author-box-bio');

  // Share
  const shareWhatsapp  = document.getElementById('share-whatsapp');
  const shareLinkedin  = document.getElementById('share-linkedin');
  const shareCopy      = document.getElementById('share-copy');

  // Sidebar
  const bdRecent       = document.getElementById('bd-recent');
  const bdRecentList   = document.getElementById('bd-recent-list');

  // Progress bar
  const progressBar    = document.getElementById('reading-progress-bar');

  // ── Load article ──────────────────────────────────────────
  async function loadArticle() {
    if (!slug) { showNotFound(); return; }

    try {
      const [articleRes, recentRes] = await Promise.all([
        API.blogs.bySlug(slug),
        API.blogs.list({ limit: 5 }),
      ]);

      const post = articleRes.data;
      if (!post) { showNotFound(); return; }

      setMeta(post);
      renderHero(post);
      renderBody(post);
      renderTags(post);
      renderShareLinks(post);
      renderAuthorBox(post);
      renderRecent(recentRes.data || [], post.id);

      heroSkeleton.hidden = false;
      heroSkeleton.style.display = 'none';
      heroContent.hidden  = false;
      bdLayout.hidden     = false;

      loadRelated(post);

      // Init after render
      initReadingProgress();
      initToc();
      if (window.SP && window.SP.initReveal) window.SP.initReveal();

    } catch (err) {
      console.error('Article load error:', err.message);
      showNotFound();
    }
  }

  function showNotFound() {
    heroSkeleton.style.display = 'none';
    if (bdNotFound) bdNotFound.hidden = false;
  }

  // ── Meta tags ─────────────────────────────────────────────
  function setMeta(p) {
    document.title = `${p.title} — Samarth Properties Blog`;
    const desc = p.excerpt || p.title;
    document.getElementById('meta-desc').content = desc;
    document.getElementById('og-title').content  = `${p.title} — Samarth Properties`;
    document.getElementById('og-desc').content   = desc;
    if (p.cover_image_url) document.getElementById('og-image').content = p.cover_image_url;
    if (p.published_at)    document.getElementById('og-published').content = p.published_at;
  }

  // ── Hero ──────────────────────────────────────────────────
  function renderHero(p) {
    // Cover image
    if (p.cover_image_url) {
      coverImg.src = p.cover_image_url;
      coverImg.alt = p.title;
    } else {
      coverWrap.style.display = 'none';
    }

    // Breadcrumb
    if (bdBcTitle) bdBcTitle.textContent = p.title.length > 40 ? p.title.slice(0, 40) + '…' : p.title;

    // Category
    if (p.category && bdCategory) {
      bdCategory.textContent = p.category;
    } else if (bdCategoryWrap) {
      bdCategoryWrap.hidden = true;
    }

    // Title
    if (bdTitle) bdTitle.textContent = p.title;

    // Author
    const authorName = p.author_name || 'Samarth Properties';
    if (bdAuthorName) bdAuthorName.textContent = authorName;
    if (bdAuthorAvatar) {
      if (p.author_photo) {
        bdAuthorAvatar.innerHTML = `<img src="${p.author_photo}" alt="${authorName}">`;
      } else {
        bdAuthorAvatar.textContent = authorName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      }
    }

    // Meta (date · read time · views)
    const parts = [];
    if (p.published_at)     parts.push(formatDate(p.published_at));
    if (p.read_time_mins)   parts.push(`${p.read_time_mins} min read`);
    if (p.view_count)       parts.push(`${p.view_count.toLocaleString()} views`);
    if (bdArticleMeta) bdArticleMeta.textContent = parts.join(' · ');
  }

  // ── Article body ──────────────────────────────────────────
  function renderBody(p) {
    if (!bdBody) return;

    if (p.content) {
      // Content may be HTML or plain text with newlines
      if (p.content.trim().startsWith('<')) {
        bdBody.innerHTML = p.content;
      } else {
        bdBody.innerHTML = p.content
          .split('\n\n')
          .filter(Boolean)
          .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('');
      }
    } else {
      bdBody.innerHTML = `<p>${p.excerpt || 'Article content coming soon.'}</p>`;
    }

    // Add IDs to h2/h3 for TOC linking
    bdBody.querySelectorAll('h2, h3').forEach((h, i) => {
      if (!h.id) h.id = `section-${i + 1}`;
    });
  }

  // ── Table of Contents ─────────────────────────────────────
  function initToc() {
    if (!bdBody || !bdToc || !bdTocList) return;
    const headings = bdBody.querySelectorAll('h2, h3');
    if (headings.length < 2) return;

    bdTocList.innerHTML = [...headings].map(h => `
      <li class="bd-toc__item bd-toc__item--${h.tagName.toLowerCase()}">
        <a class="bd-toc__link" href="#${h.id}">${h.textContent}</a>
      </li>
    `).join('');

    bdToc.hidden = false;

    // Highlight active section on scroll
    const links = bdTocList.querySelectorAll('.bd-toc__link');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id   = entry.target.getAttribute('id');
        const link = bdTocList.querySelector(`a[href="#${id}"]`);
        if (link) link.classList.toggle('active', entry.isIntersecting);
      });
    }, { rootMargin: '-20% 0% -70% 0%' });

    headings.forEach(h => observer.observe(h));

    // Smooth scroll
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ── Tags ──────────────────────────────────────────────────
  function renderTags(p) {
    const tags = Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []);
    if (!tags.length || !bdTagsList) return;

    bdTagsList.innerHTML = tags.map(tag => `
      <a class="bd-tag" href="blog.html?q=${encodeURIComponent(tag)}">${tag}</a>
    `).join('');
    if (bdTags) bdTags.hidden = false;
  }

  // ── Share links ───────────────────────────────────────────
  function renderShareLinks(p) {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(p.title);

    if (shareWhatsapp) {
      shareWhatsapp.href = `https://wa.me/?text=${title}%20${url}`;
    }
    if (shareLinkedin) {
      shareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }
    if (shareCopy) {
      shareCopy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          const orig = shareCopy.innerHTML;
          shareCopy.textContent = '✓ Copied!';
          setTimeout(() => { shareCopy.innerHTML = orig; }, 2000);
        } catch {
          window.SP?.toast('info', 'Copy the URL', 'Select and copy the URL from your browser address bar.');
        }
      });
    }
    if (bdShareBtn) {
      bdShareBtn.addEventListener('click', async () => {
        if (navigator.share) {
          try { await navigator.share({ title: p.title, url: window.location.href }); } catch {}
        } else {
          try { await navigator.clipboard.writeText(window.location.href); window.SP?.toast('success', 'Link Copied!', ''); } catch {}
        }
      });
    }
  }

  // ── Author box ────────────────────────────────────────────
  function renderAuthorBox(p) {
    if (!p.author_name) return;
    const name = p.author_name;
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (bdAuthorBoxAvatar) {
      bdAuthorBoxAvatar.innerHTML = p.author_photo
        ? `<img src="${p.author_photo}" alt="${name}">`
        : initials;
    }
    if (bdAuthorBoxName) bdAuthorBoxName.textContent = name;
    if (bdAuthorBoxBio)  bdAuthorBoxBio.textContent  = p.author_bio || `Expert contributor at Samarth Properties with deep knowledge of Pune's real estate market.`;
    if (bdAuthorBox) bdAuthorBox.hidden = false;
  }

  // ── Recent posts (sidebar) ────────────────────────────────
  function renderRecent(posts, currentId) {
    const others = posts.filter(p => p.id !== currentId).slice(0, 4);
    if (!others.length || !bdRecentList) return;

    bdRecentList.innerHTML = others.map(p => `
      <a class="bd-recent__item" href="blog-detail.html?slug=${p.slug}">
        <img class="bd-recent__item-img"
          src="${p.cover_image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=70'}"
          alt="${p.title}" loading="lazy">
        <div>
          <p class="bd-recent__item-title">${p.title}</p>
          <p class="bd-recent__item-date">${formatDate(p.published_at)}</p>
        </div>
      </a>
    `).join('');
    if (bdRecent) bdRecent.hidden = false;
  }

  // ── Related posts ─────────────────────────────────────────
  async function loadRelated(p) {
    try {
      const params = {};
      if (p.category) params.category = p.category;
      params.limit = 3;

      const res    = await API.blogs.list(params);
      const others = (res.data || []).filter(r => r.id !== p.id).slice(0, 3);
      if (!others.length) return;

      relatedGrid.innerHTML = others.map(renderBlogCard).join('');
      bdRelated.hidden = false;
      if (window.SP && window.SP.initReveal) window.SP.initReveal();
    } catch {
      // Related stays hidden
    }
  }

  // ── Reading progress ──────────────────────────────────────
  function initReadingProgress() {
    if (!progressBar || !bdBody) return;
    function update() {
      const article  = bdBody;
      const rect     = article.getBoundingClientRect();
      const total    = article.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      const pct      = Math.min(100, (scrolled / (total - window.innerHeight)) * 100);
      progressBar.style.width = `${pct}%`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ── Init ──────────────────────────────────────────────────
  function init() { loadArticle(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
