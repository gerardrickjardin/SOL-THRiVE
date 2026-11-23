(function (window, document) {
  'use strict';

  var DEFAULT_MIN_DWELL_MS = 1200;
  var MAX_CLIENT_AGE_MS = 3 * 60 * 60 * 1000;

  var pageRenderedAt = Date.now();
  var interactionEvents = 0;
  var hasInteracted = false;
  var configPromise = null;
  var latestConfig = null;
  var turnstileScriptPromise = null;
  var turnstileWidgets = new WeakMap();
  var attachedForms = new WeakSet();

  function recordInteraction() {
    hasInteracted = true;
    interactionEvents += 1;
  }

  ['focusin', 'input', 'change', 'keydown', 'pointerdown', 'touchstart'].forEach(function (evtName) {
    document.addEventListener(evtName, recordInteraction, { passive: true, capture: true });
  });

  function fetchFreshConfig() {
    configPromise = fetch('/api/config', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Config request failed: ' + r.status);
        return r.json();
      })
      .then(function (cfg) {
        latestConfig = cfg || {};
        if (!latestConfig.botProtection) latestConfig.botProtection = {};
        if (!latestConfig.botProtection.fetchedAt) {
          latestConfig.botProtection.fetchedAt = Date.now();
        }
        return latestConfig;
      })
      .catch(function () {
        latestConfig = latestConfig || { publishableKey: '', botProtection: {} };
        return latestConfig;
      });
    return configPromise;
  }

  function getConfig() {
    if (!configPromise) return fetchFreshConfig();
    if (
      latestConfig &&
      latestConfig.botProtection &&
      latestConfig.botProtection.fetchedAt &&
      Date.now() - latestConfig.botProtection.fetchedAt > MAX_CLIENT_AGE_MS
    ) {
      return fetchFreshConfig();
    }
    return configPromise;
  }

  function refreshChallenge() {
    return fetchFreshConfig();
  }

  function ensureHoneypot(form) {
    if (!form) return null;
    var existing = form.querySelector('input[name="thrive_hp_check"]');
    if (existing) return existing;

    var wrap = document.createElement('div');
    wrap.className = 'hp-field-wrap';
    wrap.setAttribute('aria-hidden', 'true');

    var label = document.createElement('label');
    label.textContent = 'Leave this field blank';

    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'thrive_hp_check';
    input.tabIndex = -1;
    input.autocomplete = 'new-password';
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    input.value = '';

    wrap.appendChild(label);
    wrap.appendChild(input);
    form.insertBefore(wrap, form.firstChild);
    return input;
  }

  function ensureShieldSlot(form) {
    if (!form) return null;
    var slot = form.querySelector('.bot-shield-slot');
    if (slot) return slot;

    slot = document.createElement('div');
    slot.className = 'bot-shield-slot';
    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn && submitBtn.parentNode === form) {
      form.insertBefore(slot, submitBtn);
    } else {
      form.appendChild(slot);
    }
    return slot;
  }

  function renderBuiltInBadge(slot) {
    if (!slot || slot.dataset.shieldMode === 'turnstile') return;
    slot.dataset.shieldMode = 'builtin';
    slot.innerHTML =
      '<div class="bot-shield-note">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>' +
      '<path d="m9 12 2 2 4-4"></path>' +
      '</svg>' +
      '<span>Protected by THRiVE Anti-Spam &amp; Bot Shield</span>' +
      '</div>';
  }

  function loadTurnstileScript() {
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      return Promise.resolve(window.turnstile);
    }
    if (turnstileScriptPromise) return turnstileScriptPromise;

    turnstileScriptPromise = new Promise(function (resolve, reject) {
      window.__onThriveTurnstileLoad = function () {
        resolve(window.turnstile);
      };
      var script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onThriveTurnstileLoad';
      script.async = true;
      script.defer = true;
      script.onerror = function () {
        reject(new Error('Failed to load human verification widget.'));
      };
      document.head.appendChild(script);
    });
    return turnstileScriptPromise;
  }

  function mountTurnstileIfEnabled(form, siteKey) {
    if (!form || !siteKey) return Promise.resolve();
    if (turnstileWidgets.has(form)) return Promise.resolve();
    var slot = ensureShieldSlot(form);
    if (!slot) return Promise.resolve();

    slot.dataset.shieldMode = 'turnstile';
    slot.innerHTML = '<div class="turnstile-widget-host"></div>';
    var host = slot.querySelector('.turnstile-widget-host');

    return loadTurnstileScript()
      .then(function (ts) {
        if (!ts || typeof ts.render !== 'function' || turnstileWidgets.has(form)) return;
        var widgetId = ts.render(host, {
          sitekey: siteKey,
          theme: 'light'
        });
        turnstileWidgets.set(form, widgetId);
      })
      .catch(function () {
        renderBuiltInBadge(slot);
      });
  }

  function attachForm(form) {
    if (!form || attachedForms.has(form)) return;
    attachedForms.add(form);

    ensureHoneypot(form);
    var slot = ensureShieldSlot(form);
    renderBuiltInBadge(slot);

    getConfig().then(function (cfg) {
      var siteKey = cfg && cfg.botProtection && cfg.botProtection.turnstileSiteKey;
      if (siteKey) {
        mountTurnstileIfEnabled(form, siteKey);
      }
    });
  }

  function initAllProtectedForms() {
    var forms = document.querySelectorAll(
      'form[data-bot-protect], #program-inquiry-form, #lunch-learn-form, #it-helpdesk-form, #pay-form'
    );
    forms.forEach(attachForm);
  }

  function getPassivePayload(form) {
    var bp = (latestConfig && latestConfig.botProtection) || {};
    var hpInput = form ? form.querySelector('input[name="thrive_hp_check"]') : null;
    return {
      hp: hpInput ? String(hpInput.value || '') : '',
      token: bp.token || '',
      renderedAt: pageRenderedAt,
      interacted: hasInteracted || interactionEvents > 0,
      events: Math.max(interactionEvents, hasInteracted ? 1 : 0),
      turnstileToken: ''
    };
  }

  function prepareSubmission(form) {
    if (form) attachForm(form);
    recordInteraction();

    var hpInput = form ? form.querySelector('input[name="thrive_hp_check"]') : null;
    if (hpInput && String(hpInput.value || '').trim().length > 0) {
      return Promise.reject(new Error('Submission blocked by spam protection.'));
    }

    return getConfig().then(function (cfg) {
      var bp = (cfg && cfg.botProtection) || {};
      var minDwell = Number(bp.minDwellMs || DEFAULT_MIN_DWELL_MS);
      var issuedAt = Number(bp.issuedAt || pageRenderedAt);
      var elapsed = Date.now() - issuedAt;

      var waitMs = elapsed < minDwell ? (minDwell - elapsed + 50) : 0;
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          var turnstileToken = '';
          if (bp.turnstileSiteKey && window.turnstile && form && turnstileWidgets.has(form)) {
            turnstileToken = window.turnstile.getResponse(turnstileWidgets.get(form)) || '';
            if (!turnstileToken) {
              reject(new Error('Please complete the human verification check before submitting.'));
              return;
            }
          }

          resolve({
            hp: hpInput ? String(hpInput.value || '') : '',
            token: bp.token || '',
            renderedAt: pageRenderedAt,
            interacted: true,
            events: Math.max(interactionEvents, 1),
            turnstileToken: turnstileToken
          });
        }, waitMs);
      });
    });
  }

  function resetForm(form) {
    if (form && window.turnstile && turnstileWidgets.has(form)) {
      try {
        window.turnstile.reset(turnstileWidgets.get(form));
      } catch (_) {}
    }
    return refreshChallenge();
  }

  window.ThriveBotShield = {
    getConfig: getConfig,
    refreshChallenge: refreshChallenge,
    attachForm: attachForm,
    prepareSubmission: prepareSubmission,
    getPassivePayload: getPassivePayload,
    resetForm: resetForm
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllProtectedForms);
  } else {
    initAllProtectedForms();
  }
})(window, document);
