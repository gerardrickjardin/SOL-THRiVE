#!/usr/bin/env node
'use strict';

/**
 * Adversarial & Integration Verification Suite — Milestone 4 & Full Release (R1–R5)
 * Verifies:
 *   1. Clinical Typography Restyle of results.html (zero Kalam / Patrick Hand / cursive; Plus Jakarta Sans & Inter)
 *   2. 1-Click Clinical Dossier Export across results.html, survey.html, profile.html, hope-survey.html, onboarding.html, how-to-use.html, index.html
 *   3. ThriveCoachingDossier runtime VM tests across 7 edge cases (empty storage, partial raw fallback, full 4-section dossier,
 *      corrupted JSON fuzzing, disabled localStorage SecurityError, blocked Clipboard API fallback to execCommand, rapid double-click label preservation)
 *   4. results.html standalone & delegated VM runtime tests (voting -> practiceAudit sync + 1-click export)
 *   5. onboarding.html hardening (foreign-key whitelist, single-fire .ics listener guard, clipboard fallback, cross-tab storage sync)
 *   6. Cross-site navigation to onboarding.html across all 12 HTML pages, public/docs/learnworlds-troubleshooting.md sync,
 *      exact 1-line parity between funnel.html & mockup-landing.html, and zero leaked secrets in public/
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}${detail ? ' — ' + detail : ''}`);
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function createStorageMock(initial = {}, opts = {}) {
  const store = Object.assign({}, initial);
  return {
    getItem(k) {
      if (opts.throwSecurityError) {
        const err = new Error('The operation is insecure.');
        err.name = 'SecurityError';
        throw err;
      }
      return Object.prototype.hasOwnProperty.call(store, k) ? String(store[k]) : null;
    },
    setItem(k, v) {
      if (opts.throwSecurityError || opts.throwQuotaError) {
        const err = new Error(opts.throwSecurityError ? 'SecurityError' : 'QuotaExceededError');
        err.name = opts.throwSecurityError ? 'SecurityError' : 'QuotaExceededError';
        throw err;
      }
      store[k] = String(v);
    },
    removeItem(k) {
      if (opts.throwSecurityError) {
        const err = new Error('SecurityError');
        err.name = 'SecurityError';
        throw err;
      }
      delete store[k];
    },
    _dump() {
      return Object.assign({}, store);
    }
  };
}

function runScriptJsInSandbox(localInit = {}, sessionInit = {}, opts = {}) {
  const localStorage = createStorageMock(localInit, opts);
  const sessionStorage = createStorageMock(sessionInit, opts);
  let lastCopiedViaClipboard = null;
  let lastCopiedViaExecCommand = null;
  const dispatchedEvents = [];
  const docListeners = {};
  const winListeners = {};

  const liveFeedbackEl = {
    id: 'dossier-export-feedback',
    textContent: ''
  };

  let appendedTextarea = null;

  const documentMock = {
    readyState: 'complete',
    body: {
      getAttribute: () => null,
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      appendChild(el) { appendedTextarea = el; },
      removeChild(el) { if (appendedTextarea === el) appendedTextarea = null; }
    },
    documentElement: { style: {} },
    getElementById(id) {
      if (id === 'dossier-export-feedback') return liveFeedbackEl;
      return null;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        value: '',
        style: {},
        setAttribute() {},
        focus() {},
        select() {}
      };
    },
    execCommand(cmd) {
      if (cmd === 'copy' && !opts.execCommandFails) {
        lastCopiedViaExecCommand = appendedTextarea ? appendedTextarea.value : '';
        return true;
      }
      return false;
    },
    addEventListener(type, fn) {
      (docListeners[type] = docListeners[type] || []).push(fn);
    }
  };

  const navigatorMock = {
    vibrate: () => true,
    clipboard: opts.noClipboardApi
      ? undefined
      : {
          writeText(text) {
            if (opts.clipboardRejects) {
              return Promise.reject(Object.assign(new Error('NotAllowedError'), { name: 'NotAllowedError' }));
            }
            lastCopiedViaClipboard = text;
            return Promise.resolve();
          }
        }
  };

  class CustomEventMock {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }

  const windowMock = {
    location: { origin: 'https://www.thrivecoaching.ai', pathname: '/onboarding.html', protocol: 'https:', href: 'https://www.thrivecoaching.ai/onboarding.html' },
    localStorage,
    sessionStorage,
    navigator: navigatorMock,
    document: documentMock,
    CustomEvent: CustomEventMock,
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    addEventListener(type, fn) {
      (winListeners[type] = winListeners[type] || []).push(fn);
    },
    dispatchEvent(evt) {
      dispatchedEvents.push(evt);
      (winListeners[evt.type] || []).forEach(fn => fn(evt));
      return true;
    },
    setTimeout,
    clearTimeout
  };

  const sandbox = {
    window: windowMock,
    document: documentMock,
    navigator: navigatorMock,
    localStorage,
    sessionStorage,
    CustomEvent: CustomEventMock,
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    Blob: class BlobMock { constructor(parts) { this.parts = parts; } },
    setTimeout,
    clearTimeout,
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(readFile('script.js'), sandbox);

  return {
    sandbox,
    window: windowMock,
    dossierApi: windowMock.ThriveCoachingDossier,
    liveFeedbackEl,
    dispatchedEvents,
    getCopiedText: () => lastCopiedViaClipboard ?? lastCopiedViaExecCommand
  };
}

function makeButtonMock(initialLabel = '📋 Export / Copy Clinical Dossier for LearnWorlds & Personos') {
  const classes = new Set(['export-dossier-btn', 'copy-master-prompt-btn']);
  const labelSpan = { textContent: initialLabel };
  return {
    textContent: initialLabel,
    dataset: {},
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c)
    },
    querySelector: (sel) => (sel === '.master-prompt-btn-label' ? labelSpan : null),
    hasAttribute: () => false,
    _labelSpan: labelSpan
  };
}

(async function main() {
  console.log('================================================================================');
  console.log('     MILESTONE 4 & FULL RELEASE ADVERSARIAL VERIFICATION SUITE');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: Clinical Restyle of results.html (R4)
  // ---------------------------------------------------------------------------
  console.log('--- SUITE 1: Clinical Typography & Layout Restyle (results.html) ---');
  for (const rel of ['results.html', 'public/results.html']) {
    const html = readFile(rel);
    assert(!/kalam/i.test(html), `${rel} contains zero references to Kalam`);
    assert(!/patrick\s*\+?\s*hand/i.test(html), `${rel} contains zero references to Patrick Hand`);
    assert(!/cursive/i.test(html), `${rel} contains zero cursive font fallbacks`);
    assert(html.includes('Plus+Jakarta+Sans') && html.includes("'Plus Jakarta Sans'"), `${rel} loads and applies Plus Jakarta Sans`);
    assert(html.includes('family=Inter') && html.includes("'Inter'"), `${rel} loads and applies Inter`);
    assert(!/\.wrap\{height:100vh\}/.test(html), `${rel} does not lock .wrap to fixed 100vh height on desktop`);
    assert(html.includes('id="export-clinical-dossier-btn"'), `${rel} renders 1-click Clinical Dossier Export button`);
    assert(html.includes('Export / Copy Clinical Dossier for LearnWorlds &amp; Personos'), `${rel} uses exact LearnWorlds & Personos label`);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: 1-Click Clinical Dossier Presence Across All Diagnostic Pages (R4)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: 1-Click Clinical Dossier Export Across Diagnostic Pages ---');
  const diagnosticTargets = [
    'results.html',
    'survey.html',
    'profile.html',
    'hope-survey.html',
    'onboarding.html',
    'how-to-use.html',
    'index.html'
  ];
  for (const page of diagnosticTargets) {
    for (const prefix of ['', 'public/']) {
      const content = readFile(prefix + page);
      assert(
        content.includes('export-dossier-btn') && content.includes('Export / Copy Clinical Dossier for LearnWorlds'),
        `${prefix + page} includes .export-dossier-btn and LearnWorlds & Personos export copy`
      );
    }
  }

  // Ensure style.css styles and print-hides .export-dossier-btn
  const styleCss = readFile('style.css');
  assert(styleCss.includes('.export-dossier-btn'), 'style.css defines .export-dossier-btn rules');
  assert(styleCss.includes('.export-dossier-btn.is-copied'), 'style.css defines .export-dossier-btn.is-copied state');

  // ---------------------------------------------------------------------------
  // SUITE 3: ThriveCoachingDossier Runtime & Edge Cases (script.js VM)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: ThriveCoachingDossier Runtime & Edge Cases ---');

  // Case A: Empty storage
  {
    const env = runScriptJsInSandbox({}, {});
    assert(Boolean(env.dossierApi), 'ThriveCoachingDossier initializes in clean VM');
    assert(typeof env.dossierApi.buildClinicalDossier === 'function', 'buildClinicalDossier alias is exposed');
    assert(typeof env.dossierApi.exportClinicalDossier === 'function', 'exportClinicalDossier alias is exposed');
    const prompt = env.dossierApi.buildMasterPrompt();
    assert(prompt.includes('0. SECTION 00 — PRACTICE READINESS & COMMUNITY BLUEPRINT AUDIT (results.html)'), 'Empty storage dossier includes Section 00');
    assert(prompt.includes('1. SECTION 01 — THE FLOW SURVEY (FRICTION & FLOW DIAGNOSTIC) (survey.html)'), 'Empty storage dossier includes Section 01');
    assert(prompt.includes('2. SECTION 02 — THE THRiVE REPORT (6-PILLAR STRENGTHS INVENTORY) (profile.html)'), 'Empty storage dossier includes Section 02');
    assert(prompt.includes('3. SECTION 03 — THE HoPE INDEX (20 LIFE ANCHORS & CONTEXTUAL LAYERING) (hope-survey.html)'), 'Empty storage dossier includes Section 03');
    assert(prompt.includes('4. SECTION 04 — PERSONOS AI EXECUTION ENGINE & LEARNWORLDS HOMEWORK DIRECTIVE'), 'Empty storage dossier includes Section 04');
    assert(prompt.includes('Automated Clinical DAP Note Draft'), 'Section 04 includes Automated Clinical DAP Note Draft directive');
  }

  // Case B: Partial completion (raw solThrive + raw 20-item Flow Survey state auto-computing strongest/lowest dimension)
  {
    const scores = [];
    for (let i = 0; i < 20; i++) {
      // Agency (0..4) = 5 (25/25), Actions (5..9) = 2 (10/25), Support (10..14) = 4 (20/25), Tools (15..19) = 3 (15/25)
      scores.push(i < 5 ? 5 : i < 10 ? 2 : i < 15 ? 4 : 3);
    }
    const env = runScriptJsInSandbox(
      {
        thrive_flow_survey_state_v1: JSON.stringify({
          problemDescription: 'Clients stall between sessions without micro-prompts.',
          metaphorText: 'Spinning Plates',
          scores,
          answered: Array(20).fill(true)
        })
      },
      {
        solThrive: JSON.stringify({
          first: 'Dr. Maya',
          last: 'Lin',
          organization: 'Denver Trauma Collective',
          ratings: [5, 5, 4],
          votes: ['Empower Mentors']
        })
      }
    );
    const prompt = env.dossierApi.buildClinicalDossier();
    assert(prompt.includes('Dr. Maya Lin') && prompt.includes('Denver Trauma Collective'), 'Section 00 renders practitioner name and organization from sessionStorage.solThrive');
    assert(prompt.includes('Empower Mentors'), 'Section 00 renders selected community/squad priority');
    assert(prompt.includes('Spinning Plates'), 'Section 01 renders Flow Survey metaphor from raw fallback');
    assert(prompt.includes('Strongest Flow Anchor: Agency (25/25)'), 'Section 01 auto-computes Strongest Flow Anchor (Agency 25/25) from raw scores');
    assert(prompt.includes('Primary Friction Drop: Actions (10/25)'), 'Section 01 auto-computes Primary Friction Drop (Actions 10/25) from raw scores');
  }

  // Case C: Full 4-diagnostic completion
  {
    const env = runScriptJsInSandbox({}, {});
    env.dossierApi.savePracticeAudit({
      first: 'Coach Eli',
      organization: 'Squad A',
      ratings: [4, 5, 5],
      priorities: ['Automated DAP Notes', 'Action Boards']
    });
    env.dossierApi.saveFlowSurvey({
      problem: 'Evening overwhelm',
      metaphor: 'Tangled Knot',
      currentScore: 62,
      targetScore: 85,
      dimensions: { Agency: 18, Actions: 15, Support: 20, Tools: 9 }
    });
    env.dossierApi.saveThriveReport({
      interviewee: 'Coach Eli',
      pillars: {
        traits: 'Compassionate, Strategic, Resilient',
        hobbies: 'Trail running, Woodworking, Cooking',
        relationships: 'Partner, Supervisor, Peer Triad',
        interests: 'Neurobiology, CYNEFIN, Somatic tracking',
        values: 'Integrity, Agency, Presence',
        experiences: 'Community clinic launch, Marathon finish, Clinical fellowship'
      }
    });
    env.dossierApi.saveHopeIndex({
      opsScore50: 38,
      irsScore50: 41,
      totalHoPEScore100: 79,
      tierText: 'THRIVING',
      flexGasScore: 1.0,
      flexGasLabel: 'Trapped',
      flexPssScore: 4.5,
      flexPssLabel: 'High Safety',
      lowestDimension: { name: 'Sleep & Recovery', score: 3.1, space: 'OPS' },
      reflections: [{ title: 'Daily Anchor', dimension: 'Routine', score: 4.5, text: 'Morning walk before caseload.' }]
    });

    const summary = env.dossierApi.getCompletionSummary();
    assert(summary.count === 3 && summary.totalCompleted === 4 && summary.hasPracticeAudit === true, 'Full completion reports 3/3 core tools + Practice Audit (totalCompleted === 4)');
    const prompt = env.dossierApi.buildMasterPrompt();
    assert(prompt.includes('[3 items logged]:\n  Compassionate, Strategic, Resilient'), 'Section 02 formats 6-pillar item counts and values');
    assert(prompt.includes('Total HoPE Capacity Score: 79%') && prompt.includes('4.5 / 5.0 (High Safety)'), 'Section 03 formats OPS/IRS and Flex Slots');
  }

  // Case D: Corrupted JSON fuzzing across all storage keys
  {
    const env = runScriptJsInSandbox(
      {
        thrive_coaching_dossier_v1: '{corrupted_json!!!',
        solThriveVotes: 'NaN',
        solThriveLead: 'undefined',
        thrive_flow_survey_state_v1: '{"scores": null}',
        thrive_profile_state_v1: '[1,2,3]',
        thrive_hope_survey_state_v1: '{broken'
      },
      { solThrive: '{also_broken' }
    );
    let survived = false;
    try {
      const p = env.dossierApi.buildMasterPrompt();
      survived = typeof p === 'string' && p.includes('SECTION 04');
    } catch (_) {}
    assert(survived, 'ThriveCoachingDossier survives corrupted JSON in every localStorage and sessionStorage key');
  }

  // Case E: Disabled localStorage / sessionStorage throwing SecurityError
  {
    const env = runScriptJsInSandbox({}, {}, { throwSecurityError: true });
    const btn = makeButtonMock();
    let ok = false;
    try {
      const res = await env.dossierApi.copyMasterPrompt(btn);
      ok = Boolean(res && res.copied && env.getCopiedText().includes('5 to THRiVE'));
    } catch (_) {}
    assert(ok, 'ThriveCoachingDossier exports cleanly even when localStorage/sessionStorage throw SecurityError');
  }

  // Case F: Clipboard API rejected -> fallback to document.execCommand('copy') + UI & live-region feedback
  {
    const env = runScriptJsInSandbox({}, {}, { clipboardRejects: true });
    const btn = makeButtonMock('📋 Export / Copy Clinical Dossier for LearnWorlds & Personos');
    const res = await env.dossierApi.copyMasterPrompt(btn);
    assert(res.copied === true, 'Falls back to document.execCommand("copy") when navigator.clipboard.writeText rejects');
    assert(env.getCopiedText().includes('LearnWorlds'), 'Fallback textarea copied full Clinical Dossier');
    assert(btn.classList.contains('is-copied'), 'Adds .is-copied class to trigger button');
    assert(btn._labelSpan.textContent === '✓ Clinical Dossier Copied!', 'Updates button label to "✓ Clinical Dossier Copied!"');
    assert(env.liveFeedbackEl.textContent.includes('LearnWorlds Review Center'), 'Updates #dossier-export-feedback live region');
    assert(env.dispatchedEvents.some(e => e.type === 'thrive-dossier-exported' && e.detail.copied === true), 'Dispatches thrive-dossier-exported CustomEvent');
    clearTimeout(btn._dossierTimeout);
    clearTimeout(env.liveFeedbackEl._dossierFeedbackTimer);
  }

  // Case G: Rapid 5x click preserves original button label
  {
    const env = runScriptJsInSandbox({}, {});
    const original = '📋 Export / Copy Clinical Dossier for LearnWorlds & Personos';
    const btn = makeButtonMock(original);
    for (let i = 0; i < 5; i++) {
      await env.dossierApi.copyMasterPrompt(btn);
    }
    assert(btn.dataset.defaultLabel === original, 'Rapid 5x clicks preserve original button label in dataset.defaultLabel');
    clearTimeout(btn._dossierTimeout);
    clearTimeout(env.liveFeedbackEl._dossierFeedbackTimer);
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: results.html Inline Script Standalone Execution (VM)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: results.html Inline Script Standalone VM Verification ---');
  {
    const resultsHtml = readFile('results.html');
    const scriptMatches = [...resultsHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert(scriptMatches.length === 1, 'results.html has 1 inline <script> block');
    const inlineCode = scriptMatches[0][1];

    let copiedPayload = null;
    const elementsById = {};
    const makeEl = (id, text = '') => {
      const listeners = {};
      const classes = new Set();
      const el = {
        id,
        textContent: text,
        value: '',
        disabled: false,
        muted: true,
        paused: true,
        currentTime: 0,
        dataset: { w: '84', base: '40' },
        style: {},
        classList: {
          add: (c) => classes.add(c),
          remove: (c) => classes.delete(c),
          toggle: (c, force) => (typeof force === 'boolean' ? (force ? classes.add(c) : classes.delete(c)) : (classes.has(c) ? classes.delete(c) : classes.add(c))),
          contains: (c) => classes.has(c)
        },
        setAttribute() {},
        getAttribute(attr) { return attr === 'data-priority' ? 'Empower Mentors' : '44'; },
        querySelector: () => ({ textContent: '📋 Export / Copy Clinical Dossier for LearnWorlds & Personos' }),
        select() {},
        play: () => Promise.resolve(),
        pause() {},
        addEventListener(t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
        _fire(t, evt = {}) { return Promise.all((listeners[t] || []).map(fn => fn.call(el, evt))); }
      };
      elementsById[id] = el;
      return el;
    };

    ['nm', 'org-label', 'r1', 'r2', 'r3', 'blueprint-video-box', 'blueprint-video', 'play-blueprint-btn',
     'blueprint-play-icon', 'restart-blueprint-btn', 'blueprint-caption', 'video-status-tag', 'voices-badge',
     'vote', 'lnk', 'copy', 'share-native', 'share-fb', 'share-ig', 'share-tt', 'share-feedback',
     'download-pdf-btn', 'export-clinical-dossier-btn', 'dossier-export-feedback', 'dossier-status-badge'].forEach(id => makeEl(id));

    const optEl = makeEl('opt-1');
    optEl.classList.add('on');

    const localStore = createStorageMock({
      solThriveLead: JSON.stringify({ first: 'Luke', organization: 'SOL Theory', ratings: [4, 5, 5] })
    });
    const sessionStore = createStorageMock({});

    const docMock = {
      getElementById: (id) => elementsById[id] || makeEl(id),
      querySelector: () => makeEl('voice-count'),
      querySelectorAll: (sel) => {
        if (sel === '.opt' || sel === '.opt.on') return [optEl];
        return [];
      },
      createElement: () => ({ value: '', style: {}, setAttribute() {}, select() {} }),
      body: { appendChild() {}, removeChild() {} },
      execCommand: () => true
    };
    const navMock = {
      vibrate: () => true,
      clipboard: { writeText: (txt) => { copiedPayload = txt; return Promise.resolve(); } }
    };
    const winMock = {
      location: { origin: 'https://www.thrivecoaching.ai' },
      localStorage: localStore,
      sessionStorage: sessionStore,
      navigator: navMock,
      document: docMock,
      matchMedia: () => ({ matches: false }),
      addEventListener() {},
      dispatchEvent() {},
      print() {}
    };
    const ctx = {
      window: winMock,
      document: docMock,
      navigator: navMock,
      localStorage: localStore,
      sessionStorage: sessionStore,
      CustomEvent: class { constructor(t, i = {}) { this.type = t; this.detail = i.detail; } },
      requestAnimationFrame: () => {},
      AbortController,
      setTimeout,
      clearTimeout,
      setInterval: () => 1,
      clearInterval: () => {},
      console
    };
    vm.createContext(ctx);
    vm.runInContext(inlineCode, ctx);

    assert(elementsById['nm'].textContent === 'Luke', 'results.html personalizes #nm from solThriveLead');
    await elementsById['export-clinical-dossier-btn']._fire('click');
    assert(typeof copiedPayload === 'string' && copiedPayload.includes('Section 00: Practice Readiness Audit'), 'results.html standalone 1-click export copies formatted Clinical Dossier');
    assert(copiedPayload.includes('Empower Mentors'), 'results.html standalone export includes selected priority');

    // Now wire window.ThriveCoachingDossier into results.html VM and verify delegated badge & export
    let savedAuditSnap = null;
    winMock.ThriveCoachingDossier = {
      getCompletionSummary: () => ({ count: 3, totalCompleted: 4, hasPracticeAudit: true }),
      savePracticeAudit: (s) => { savedAuditSnap = s; },
      copyMasterPrompt: async () => ({ ok: true, copied: true, promptText: 'DELEGATED_CLINICAL_DOSSIER' })
    };
    await elementsById['export-clinical-dossier-btn']._fire('click');
    assert(Boolean(savedAuditSnap && savedAuditSnap.first === 'Luke'), 'results.html delegated export syncs Practice Audit snapshot via savePracticeAudit');
    assert(elementsById['dossier-status-badge'].textContent === '4/4 Diagnostics Synced', 'results.html refreshResultsDossierBadge displays "4/4 Diagnostics Synced"', elementsById['dossier-status-badge'].textContent);

    clearTimeout(elementsById['export-clinical-dossier-btn']._dossierTimer);
    clearTimeout(elementsById['dossier-export-feedback']._timer);
    clearTimeout(elementsById['share-feedback']._timer);
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: onboarding.html Hardening (Foreign-key whitelist & Single .ics guard)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 5: onboarding.html Hardening Verification ---');
  {
    const onboardingHtml = readFile('onboarding.html');
    assert(onboardingHtml.includes('labIcsBtn._hasLabIcsListener = true'), 'onboarding.html sets _hasLabIcsListener = true to prevent double .ics downloads');
    assert(onboardingHtml.includes('VALID_CHECKLIST_KEYS'), 'onboarding.html whitelists valid checklist keys');

    // Verify foreign keys injected in localStorage do not inflate total beyond 7
    const inlineMatch = onboardingHtml.match(/<script>\s*\(function initOnboardingHub\(\)[\s\S]*?<\/script>/);
    assert(Boolean(inlineMatch), 'Located onboarding.html inline script');
    const code = inlineMatch[0].replace(/^<script>/, '').replace(/<\/script>$/, '');

    const progressTextEl = { textContent: '' };
    const progressBarEl = { style: {} };
    const localStore = createStorageMock({
      thrive_onboarding_checklist_v1: JSON.stringify({
        checklist: {
          triage_survey: true,
          injected_foreign_key_1: true,
          injected_foreign_key_2: true
        }
      })
    });
    const docMock = {
      getElementById: (id) => {
        if (id === 'checklist-progress-text') return progressTextEl;
        if (id === 'checklist-progress-bar') return progressBarEl;
        return null;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {}
    };
    const winMock = { localStorage: localStore, addEventListener() {} };
    const ctx = { window: winMock, document: docMock, localStorage: localStore, navigator: {}, setTimeout, clearTimeout, setInterval, clearInterval, console };
    vm.createContext(ctx);
    vm.runInContext(code, ctx);

    const state = winMock.ThriveOnboarding.getState();
    assert(Object.keys(state.checklist).length === 7, 'Foreign keys in localStorage do not inflate checklist key count beyond 7', `got ${Object.keys(state.checklist).length}`);
    assert(state.completedCount === 1 && progressTextEl.textContent === '1 of 7 Completed • 14%', 'Progress calculation ignores foreign keys accurately', progressTextEl.textContent);
  }

  // ---------------------------------------------------------------------------
  // SUITE 6: Cross-Site Navigation, Build Sync, Docs Copy & Secret Hygiene (R5)
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 6: Cross-Site Navigation, Build Sync & Secret Hygiene ---');
  const allHtmlPages = [
    'index.html',
    'classes.html',
    'onboarding.html',
    'how-to-use.html',
    'approach.html',
    'rebuilding-life-challenges.html',
    'employment-challenges.html',
    'survey.html',
    'profile.html',
    'hope-survey.html',
    'results.html',
    '404.html',
    'funnel.html',
    'mockup-landing.html'
  ];

  for (const page of allHtmlPages) {
    const rootContent = readFile(page);
    const pubContent = readFile('public/' + page);
    assert(rootContent.includes('onboarding.html'), `${page} links to onboarding.html`);
    assert(pubContent.includes('onboarding.html'), `public/${page} links to onboarding.html`);
  }

  // Verify public/docs/learnworlds-troubleshooting.md exists and internal team memo is NOT in public/docs/
  assert(fs.existsSync(path.join(ROOT, 'public/docs/learnworlds-troubleshooting.md')), 'public/docs/learnworlds-troubleshooting.md exists for Vercel serving');
  assert(!fs.existsSync(path.join(ROOT, 'public/docs/team-communication-learnworlds-trial.md')), 'Internal team memo is not exposed in public/docs/');
  assert(fs.existsSync(path.join(ROOT, 'docs/team-communication-learnworlds-trial.md')), 'docs/team-communication-learnworlds-trial.md exists in repo docs/');

  // Verify exact 1-line diff parity between funnel.html and mockup-landing.html
  const funnelLines = readFile('funnel.html').split('\n');
  const mockupLines = readFile('mockup-landing.html').split('\n');
  const diffs = [];
  for (let i = 0; i < Math.max(funnelLines.length, mockupLines.length); i++) {
    if (funnelLines[i] !== mockupLines[i]) diffs.push(i + 1);
  }
  assert(funnelLines.length === mockupLines.length && diffs.length === 1 && diffs[0] === 21, 'funnel.html and mockup-landing.html maintain exact 1-line diff parity on line 21');

  // Verify zero raw server API keys or unreplaced %VITE_ tokens in public/
  let secretLeak = null;
  for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
    if (!f.endsWith('.html') && !f.endsWith('.js')) continue;
    const c = fs.readFileSync(path.join(ROOT, 'public', f), 'utf8');
    if (/%VITE_[A-Z0-9_]+%/.test(c)) secretLeak = `Unreplaced VITE token in public/${f}`;
    // Ignore explicit REVOKED_API_KEYS blocklist entries and hope-survey.html's public Firebase Web App config identifier
    const strippedKnownPublicOrBlocklisted = c
      .replace(/AIzaSyDhByu-gVi8PNLtDdl41ETxOmu2JOEVt8A/g, '')
      .replace(/sk_d2fc2ac281afdb8a56178f44c8ebca76f21da62f7a256bf8/g, '')
      .replace(f === 'hope-survey.html' ? /AIzaSyDL5rSRy4P0PGK3xoq7hJu43xs14jZTuM8/g : /(?!)/, '');
    if (/AIza[0-9A-Za-z_-]{30,}/.test(strippedKnownPublicOrBlocklisted) || /sk_(?:live|test|[0-9a-f])[0-9A-Za-z_]{20,}/.test(strippedKnownPublicOrBlocklisted)) {
      secretLeak = `Live API key pattern in public/${f}`;
    }
  }
  assert(secretLeak === null, 'Zero unreplaced %VITE_% placeholders or server API keys in public/', secretLeak || '');

  console.log('\n================================================================================');
  console.log(`  Milestone 4 & Full Release Summary: ${passed} passed, ${failed} failed`);
  console.log('================================================================================');
  if (failed > 0) process.exit(1);
})();
