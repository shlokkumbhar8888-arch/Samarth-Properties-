// ============================================================
// SAMARTH PROPERTIES — Contact Page
// File: frontend/assets/js/contact.js
// Depends on: config.js, api.js, main.js
// ============================================================

(function contactPage() {
  'use strict';

  // ── Set minimum visit date to tomorrow ────────────────────
  function setMinDate() {
    const dateInput = document.getElementById('vis-date');
    if (!dateInput) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }

  // ── Tab switcher ──────────────────────────────────────────
  function initTabs() {
    const tabs    = document.querySelectorAll('.contact-form-tab');
    const panels  = document.querySelectorAll('.contact-form-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('aria-controls');

        tabs.forEach(t => {
          t.classList.remove('contact-form-tab--active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => { p.hidden = true; });

        tab.classList.add('contact-form-tab--active');
        tab.setAttribute('aria-selected', 'true');
        const target = document.getElementById(targetId);
        if (target) target.hidden = false;
      });
    });
  }

  // ── Enquiry form ──────────────────────────────────────────
  function initEnquiryForm() {
    const form       = document.getElementById('enquiry-form');
    const submitBtn  = document.getElementById('enquiry-submit-btn');
    const successEl  = document.getElementById('enquiry-success');
    const againBtn   = document.getElementById('enquiry-again-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(form);

      const nameEl    = document.getElementById('enq-name');
      const phoneEl   = document.getElementById('enq-phone');
      const emailEl   = document.getElementById('enq-email');
      const messageEl = document.getElementById('enq-message');
      const consentEl = document.getElementById('enq-consent');

      let valid = true;

      if (!nameEl.value.trim()) {
        showFieldError(nameEl, 'Full name is required');
        valid = false;
      }

      if (!phoneEl.value.trim()) {
        showFieldError(phoneEl, 'Phone number is required');
        valid = false;
      } else if (!validatePhone(phoneEl.value)) {
        showFieldError(phoneEl, 'Enter a valid 10-digit Indian mobile number');
        valid = false;
      }

      if (emailEl.value.trim() && !validateEmail(emailEl.value)) {
        showFieldError(emailEl, 'Enter a valid email address');
        valid = false;
      }

      if (!messageEl.value.trim()) {
        showFieldError(messageEl, 'Please tell us what you\'re looking for');
        valid = false;
      }

      if (!consentEl.checked) {
        const label = document.querySelector('label[for="enq-consent"], .form-check__label');
        if (label) {
          label.style.color = '#e53935';
          setTimeout(() => { label.style.color = ''; }, 3000);
        }
        window.SP?.toast('info', 'Consent Required', 'Please agree to being contacted before submitting.');
        valid = false;
      }

      if (!valid) return;

      const origHtml = submitBtn.innerHTML;
      submitBtn.disabled  = true;
      submitBtn.innerHTML = '<span class="btn-spinner"></span> Sending…';

      const typeEl    = document.getElementById('enq-type');
      const projectEl = document.getElementById('enq-project');
      const budgetEl  = document.getElementById('enq-budget');

      const messageParts = [messageEl.value.trim()];
      if (typeEl?.value)    messageParts.push(`Enquiry type: ${typeEl.value.replace(/_/g, ' ')}`);
      if (projectEl?.value) messageParts.push(`Interested in: ${projectEl.value}`);
      if (budgetEl?.value)  messageParts.push(`Budget: ${budgetEl.value.replace(/_/g, ' ')}`);

      try {
        await API.enquiry.submit({
          name:    nameEl.value.trim(),
          phone:   phoneEl.value.trim(),
          email:   emailEl.value.trim() || undefined,
          message: messageParts.join(' | '),
          source:  'contact_enquiry',
        });

        form.hidden        = true;
        successEl.hidden   = false;
        window.SP?.toast('success', 'Enquiry Sent!', 'Our team will contact you within 24 hours.');

      } catch (err) {
        console.error('Enquiry submit error:', err.message);
        window.SP?.toast('error', 'Submission Failed', err.message || 'Please try again or call us directly.');
        submitBtn.disabled  = false;
        submitBtn.innerHTML = origHtml;
      }
    });

    if (againBtn) {
      againBtn.addEventListener('click', () => {
        form.reset();
        form.hidden      = false;
        successEl.hidden = true;
        clearAllErrors(form);
        const submitEl = document.getElementById('enquiry-submit-btn');
        if (submitEl) {
          submitEl.disabled  = false;
          submitEl.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Enquiry`;
        }
      });
    }
  }

  // ── Site visit form ───────────────────────────────────────
  function initVisitForm() {
    const form       = document.getElementById('visit-form');
    const submitBtn  = document.getElementById('visit-submit-btn');
    const successEl  = document.getElementById('visit-success');
    const againBtn   = document.getElementById('visit-again-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(form);

      const nameEl    = document.getElementById('vis-name');
      const phoneEl   = document.getElementById('vis-phone');
      const emailEl   = document.getElementById('vis-email');
      const dateEl    = document.getElementById('vis-date');
      const timeEl    = document.getElementById('vis-time');

      let valid = true;

      if (!nameEl.value.trim()) {
        showFieldError(nameEl, 'Full name is required');
        valid = false;
      }

      if (!phoneEl.value.trim()) {
        showFieldError(phoneEl, 'Phone number is required');
        valid = false;
      } else if (!validatePhone(phoneEl.value)) {
        showFieldError(phoneEl, 'Enter a valid 10-digit Indian mobile number');
        valid = false;
      }

      if (emailEl.value.trim() && !validateEmail(emailEl.value)) {
        showFieldError(emailEl, 'Enter a valid email address');
        valid = false;
      }

      if (!dateEl.value) {
        showFieldError(dateEl, 'Please choose a preferred date');
        valid = false;
      } else {
        const chosen = new Date(dateEl.value);
        const today  = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosen <= today) {
          showFieldError(dateEl, 'Please select a date from tomorrow onwards');
          valid = false;
        }
      }

      if (!timeEl.value) {
        showFieldError(timeEl, 'Please choose a preferred time');
        valid = false;
      }

      if (!valid) return;

      const origHtml = submitBtn.innerHTML;
      submitBtn.disabled  = true;
      submitBtn.innerHTML = '<span class="btn-spinner"></span> Booking…';

      const projectEl  = document.getElementById('vis-project');
      const messageEl  = document.getElementById('vis-message');
      const pickupEl   = document.getElementById('vis-pickup');

      const notes = [];
      if (messageEl?.value.trim()) notes.push(messageEl.value.trim());
      if (pickupEl?.checked)       notes.push('Pickup & drop from Pune city requested.');
      if (projectEl?.value)        notes.push(`Interest: ${projectEl.value}`);

      try {
        await API.appointment.book({
          name:           nameEl.value.trim(),
          phone:          phoneEl.value.trim(),
          email:          emailEl.value.trim() || undefined,
          preferred_date: dateEl.value,
          preferred_time: timeEl.value,
          message:        notes.length ? notes.join(' | ') : undefined,
          source:         'contact_site_visit',
        });

        form.hidden        = true;
        successEl.hidden   = false;
        window.SP?.toast('success', 'Site Visit Booked!', 'We\'ll confirm your appointment within 2 hours.');

      } catch (err) {
        console.error('Visit booking error:', err.message);
        window.SP?.toast('error', 'Booking Failed', err.message || 'Please try again or call us directly.');
        submitBtn.disabled  = false;
        submitBtn.innerHTML = origHtml;
      }
    });

    if (againBtn) {
      againBtn.addEventListener('click', () => {
        form.reset();
        setMinDate();
        form.hidden      = false;
        successEl.hidden = true;
        clearAllErrors(form);
        const submitEl = document.getElementById('visit-submit-btn');
        if (submitEl) {
          submitEl.disabled  = false;
          submitEl.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Confirm My Visit`;
        }
      });
    }
  }

  // ── FAQ accordion ─────────────────────────────────────────
  function initFaq() {
    document.querySelectorAll('.contact-faq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const answerId = btn.getAttribute('aria-controls');
        const answer   = document.getElementById(answerId);

        // Collapse all
        document.querySelectorAll('.contact-faq-btn').forEach(b => {
          b.setAttribute('aria-expanded', 'false');
          const aId = b.getAttribute('aria-controls');
          const a   = document.getElementById(aId);
          if (a) a.hidden = true;
        });

        // Toggle clicked
        if (!expanded && answer) {
          btn.setAttribute('aria-expanded', 'true');
          answer.hidden = false;
        }
      });
    });
  }

  // ── Load live contact settings from admin ─────────────────
  async function loadContactSettings() {
    try {
      const base = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.API_BASE : 'http://localhost:8080/api');
      const res  = await fetch(base + '/public/settings');
      if (!res.ok) return;
      const { data } = await res.json();
      const c = data?.contact || {};

      if (c.email_primary) {
        const chip = document.getElementById('ct-email-chip');
        if (chip) chip.href = 'mailto:' + c.email_primary;
        const link = document.getElementById('ct-email-link');
        if (link) { link.href = 'mailto:' + c.email_primary; link.textContent = c.email_primary; }
      }

      if (c.phone_primary) {
        const el = document.getElementById('ct-phone-link');
        if (el) el.href = 'tel:' + c.phone_primary.replace(/\s+/g, '');
      }

      if (c.map_embed_url && (c.map_embed_url.includes('google.com/maps/embed') || c.map_embed_url.includes('maps.google.com/maps?') || c.map_embed_url.includes('openstreetmap.org'))) {
        const fr = document.getElementById('office-map-iframe');
        if (fr) fr.src = c.map_embed_url;
      }

      const mapHref = c.map_link;
      if (mapHref) {
        ['ct-office-directions', 'ct-map-open-link'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.href = mapHref;
        });
      }

      if (c.address_line1) {
        const addrEl = document.getElementById('ct-office-address');
        if (addrEl) {
          const parts = ['Samarth Properties', c.address_line1, c.address_line2, c.city,
            c.district ? 'Ji. ' + c.district : null, c.state].filter(Boolean);
          addrEl.innerHTML = parts.join(',<br>');
        }
        const mapAddr = document.getElementById('ct-map-address');
        if (mapAddr) {
          mapAddr.textContent = ['Samarth Properties', c.address_line1, c.city, c.district].filter(Boolean).join(', ');
        }
      }

      const setEl = (id, txt) => { const el = document.getElementById(id); if (el && txt) el.textContent = txt; };
      if (c.hours_weekday_open || c.hours_weekday_close) {
        const parts = [c.hours_weekday_open, c.hours_weekday_close].filter(Boolean);
        setEl('ct-hours-weekday', parts.join(' – '));
      }
      if (c.hours_sat_open || c.hours_sat_close) {
        const parts = [c.hours_sat_open, c.hours_sat_close].filter(Boolean);
        setEl('ct-hours-sat', parts.join(' – '));
      }
      setEl('ct-hours-sun', c.hours_sun);

      const s = data?.social || {};
      const socialMap = { 'ct-social-fb': s.facebook, 'ct-social-ig': s.instagram, 'ct-social-yt': s.youtube, 'ct-social-li': s.linkedin };
      Object.entries(socialMap).forEach(([id, url]) => {
        if (url) { const el = document.getElementById(id); if (el) el.href = url; }
      });
    } catch (_) {}
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    setMinDate();
    initTabs();
    initEnquiryForm();
    initVisitForm();
    initFaq();
    loadContactSettings();

    if (window.SP && window.SP.initReveal) window.SP.initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
