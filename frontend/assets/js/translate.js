// ============================================================
// SAMARTH PROPERTIES — Translation Manager
// File: frontend/assets/js/translate.js
// Strategy: set googtrans cookie + page reload for reliable
//           full-page translation via Google Translate widget.
// ============================================================

(function SPTranslate() {
  'use strict';

  const STORAGE_KEY  = 'sp_lang';
  const SESSION_KEY  = 'sp_lang_asked'; // stored in localStorage so popup only shows once ever

  // ── Cookie helpers ────────────────────────────────────────
  function setGoogCookie(lang) {
    var val = (lang === 'mr') ? '/en/mr' : '/en/en';
    document.cookie = 'googtrans=' + val + '; path=/';
    document.cookie = 'googtrans=' + val + '; path=/; domain=.' + location.hostname;
  }

  function clearGoogCookie() {
    var exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'googtrans=; ' + exp + '; path=/';
    document.cookie = 'googtrans=; ' + exp + '; path=/; domain=.' + location.hostname;
  }

  // ── Set language, save preference, reload ─────────────────
  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    localStorage.setItem(SESSION_KEY, '1'); // don't show popup again this session
    if (lang === 'mr') {
      setGoogCookie('mr');
    } else {
      clearGoogCookie();
    }
    location.reload();
  }

  function getCurrentLang() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }

  // ── Update toggle button active state ─────────────────────
  function updateUI(lang) {
    document.querySelectorAll('[data-sp-lang]').forEach(function (btn) {
      btn.classList.toggle('sp-lang-btn--active', btn.dataset.spLang === lang);
    });
  }

  // ── Field-level translation (used by admin-translate too) ─
  async function translateText(text, targetLang) {
    if (!text || !text.trim()) return text;
    try {
      var url = 'https://translate.googleapis.com/translate_a/single' +
        '?client=gtx&sl=auto&tl=' + encodeURIComponent(targetLang) +
        '&dt=t&q=' + encodeURIComponent(text);
      var res  = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      return data[0].map(function (c) { return c[0]; }).join('');
    } catch (err) {
      throw new Error('Translation error: ' + err.message);
    }
  }

  // ── Language selection popup ───────────────────────────────
  function showLangPopup() {
    var overlay = document.createElement('div');
    overlay.id = 'sp-lang-popup-overlay';
    overlay.innerHTML = [
      '<div id="sp-lang-popup">',
        '<div class="sp-lp-brand">',
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">',
            '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
            '<polyline points="9 22 9 12 15 12 15 22"/>',
          '</svg>',
          '<span>Samarth Properties</span>',
        '</div>',
        '<h2 class="sp-lp-title">',
          'Choose your language',
          '<span class="sp-lp-title-mr">आपली भाषा निवडा</span>',
        '</h2>',
        '<p class="sp-lp-sub">',
          'Select your preferred language to continue.',
          '<br><span class="sp-lp-sub-mr">पुढे जाण्यासाठी आपली पसंतीची भाषा निवडा.</span>',
        '</p>',
        '<div class="sp-lp-btns">',
          '<button class="sp-lp-btn sp-lp-btn--en" id="sp-lp-en">',
            '<span class="sp-lp-btn-lang">English</span>',
            '<span class="sp-lp-btn-native">English</span>',
          '</button>',
          '<button class="sp-lp-btn sp-lp-btn--mr" id="sp-lp-mr">',
            '<span class="sp-lp-btn-lang">Marathi</span>',
            '<span class="sp-lp-btn-native">मराठी</span>',
          '</button>',
        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    document.getElementById('sp-lp-en').addEventListener('click', function () {
      overlay.remove();
      setLang('en');
    });
    document.getElementById('sp-lp-mr').addEventListener('click', function () {
      overlay.remove();
      setLang('mr');
    });
    // Clicking backdrop dismisses and defaults to English
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        localStorage.setItem(SESSION_KEY, '1');
        overlay.remove();
        setLang('en');
      }
    });

    // Animate in — setTimeout is more reliable than rAF for CSS transitions
    setTimeout(function () {
      overlay.classList.add('sp-lp-visible');
    }, 30);
  }

  // ── Load Google Translate widget (hidden) ─────────────────
  function loadWidget() {
    var container = document.createElement('div');
    container.id = 'sp-translate-el';
    container.style.cssText = 'display:none!important;position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(container);

    window.googleTranslateElementInit = function () {
      try {
        new google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,mr',
          autoDisplay: false,
        }, 'sp-translate-el');
      } catch (_) {}
    };

    var s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = function () {};
    document.head.appendChild(s);
  }

  // ── Public API ────────────────────────────────────────────
  window.SPTranslate = {
    setLang      : setLang,
    translateText: translateText,
    getCurrentLang: getCurrentLang,
    resetLang    : function () { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(SESSION_KEY); clearGoogCookie(); location.reload(); },
  };

  // ── Boot ──────────────────────────────────────────────────
  function boot() {
    var stored  = localStorage.getItem(STORAGE_KEY);
    var asked   = localStorage.getItem(SESSION_KEY);

    // Apply stored language preference on every load
    if (stored === 'mr') {
      setGoogCookie('mr');
    }
    updateUI(stored || 'en');
    loadWidget();

    // Show popup on every new session (not after language was just chosen)
    if (!asked) {
      showLangPopup();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
