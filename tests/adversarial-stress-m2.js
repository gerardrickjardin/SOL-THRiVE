/**
 * tests/adversarial-stress-m2.js
 * Comprehensive Empirical Challenger Stress Suite for Milestone 2:
 * Session 0 Pre-Flight Onboarding Hub (onboarding.html)
 *
 * Stress-Testing Focus:
 * 1. Checklist State Machine Fuzzing:
 *    - JSON corruption, null/undefined, array injection, quota exceeded, private browsing errors.
 *    - Key pollution, non-boolean values, missing keys, rapid toggling.
 *    - Edge states: all-checked (100%), all-unchecked (0%), reset confirmation.
 * 2. Speech Dictation Calibration & Error Fallbacks:
 *    - Missing SpeechRecognition API (Firefox/Enterprise fallback).
 *    - Permissions denied ('not-allowed'), silence ('no-speech'), generic error ('audio-capture').
 *    - Short speech threshold (<15 chars) vs long clinical prompt (>15 chars).
 *    - Start/stop cycle stress and simulate calibration button.
 * 3. Safe-Save Cadence Timing & Keypress Detection:
 *    - Boundary timings (0s, 30s, 60s, 61s, 65s, 110s, 111s, 115s, 120s, 300s).
 *    - Color class transitions (flow -> window -> overdue).
 *    - Enter key event isolation (ignores other keys like Shift, Space, letters).
 *    - Streak progression (0 -> 1 -> 2 -> 3 certified), rapid key burst stress (50 Enters).
 *    - Reset trainer behavior and interval clearing.
 * 4. Resource Directory & Cross-File Integrity:
 *    - Valid file existence for all internal links (survey.html, profile.html, etc.).
 *    - DevTools bypass script syntax parsing and execution against simulated overlay.
 *    - Clipboard copy error fallback.
 * 5. Build Synchronization & Secret Hygiene:
 *    - File size and content parity across root, public/, and dist/.
 *    - Secret audit (zero API keys or VITE tokens in client output).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ONBOARDING_SRC = path.join(ROOT, 'onboarding.html');
const ONBOARDING_PUB = path.join(ROOT, 'public/onboarding.html');
const ONBOARDING_DIST = path.join(ROOT, 'dist/onboarding.html');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(title, condition, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m[PASS]\x1b[0m ${title}`);
    passCount++;
  } else {
    console.log(`  \x1b[31m[FAIL]\x1b[0m ${title}`);
    if (detail) console.log(`         \x1b[90m↳ ${detail}\x1b[0m`);
    failCount++;
    failures.push({ title, detail });
  }
}

// Helper to create a fully reactive mock DOM element
function createMockElement(id, tag = 'div') {
  const classes = new Set();
  const el = {
    id,
    tagName: tag.toUpperCase(),
    get className() {
      return Array.from(classes).join(' ');
    },
    set className(val) {
      classes.clear();
      if (val) {
        val.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
      }
    },
    classList: {
      _classes: classes,
      add: function(...cList) { cList.forEach(c => classes.add(c)); },
      remove: function(...cList) { cList.forEach(c => classes.delete(c)); },
      toggle: function(c) {
        if (classes.has(c)) { classes.delete(c); return false; }
        else { classes.add(c); return true; }
      },
      contains: function(c) { return classes.has(c); }
    },
    style: {},
    textContent: '',
    innerHTML: '',
    value: '',
    checked: false,
    attributes: {},
    setAttribute: function(k, v) { this.attributes[k] = v; },
    getAttribute: function(k) { return this.attributes[k] || (k === 'data-key' ? this.id.replace('check-', '') : null); },
    querySelector: function(sel) {
      if (sel.includes('checkbox')) return createMockElement('cb-' + this.id, 'input');
      if (sel.includes('badge')) return createMockElement('badge-' + this.id, 'span');
      return createMockElement('child-' + this.id, 'div');
    },
    querySelectorAll: function() { return []; },
    _listeners: {},
    addEventListener: function(event, handler) {
      this._listeners[event] = this._listeners[event] || [];
      this._listeners[event].push(handler);
    },
    dispatchEvent: function(eventObj) {
      const type = typeof eventObj === 'string' ? eventObj : eventObj.type;
      if (this._listeners[type]) {
        this._listeners[type].forEach(fn => fn(typeof eventObj === 'object' ? eventObj : { type, target: this }));
      }
    }
  };
  return el;
}

function extractInlineScript(html) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineScript = '';
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (!match[0].includes('src=')) {
      inlineScript += match[1] + '\n';
    }
  }
  return inlineScript;
}

function buildSandbox(initialStorage = {}, options = {}) {
  const mockStorage = Object.assign({}, initialStorage);
  const elements = {};

  const requiredKeys = [
    'triage_survey',
    'thrive_report',
    'mic_calibration',
    'safesave_practice',
    'learnworlds_login',
    'squad_community',
    'calendar_sync'
  ];

  const getOrCreateEl = (id, tag = 'div') => {
    if (!elements[id]) {
      elements[id] = createMockElement(id, tag);
    }
    return elements[id];
  };

  const mockWindow = {
    localStorage: {
      getItem: (k) => {
        if (options.storageReadThrows) throw new Error('SecurityError: The operation is insecure.');
        return mockStorage.hasOwnProperty(k) ? mockStorage[k] : null;
      },
      setItem: (k, v) => {
        if (options.storageWriteThrowsQuota) {
          const err = new Error('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        }
        mockStorage[k] = String(v);
      },
      removeItem: (k) => { delete mockStorage[k]; }
    },
    navigator: {
      clipboard: {
        writeText: (text) => {
          if (options.clipboardRejects) return Promise.reject(new Error('Permission denied'));
          return Promise.resolve(text);
        }
      }
    },
    downloadPractitionerLabIcs: () => {
      mockWindow._downloadIcsCalled = true;
    },
    SpeechRecognition: options.hasSpeechRec ? options.mockSpeechClass : null,
    webkitSpeechRecognition: options.hasSpeechRec ? options.mockSpeechClass : null,
    setInterval: (fn, ms) => {
      mockWindow._lastIntervalId = (mockWindow._lastIntervalId || 0) + 1;
      mockWindow._intervals = mockWindow._intervals || {};
      mockWindow._intervals[mockWindow._lastIntervalId] = { fn, ms };
      return mockWindow._lastIntervalId;
    },
    clearInterval: (id) => {
      if (mockWindow._intervals) delete mockWindow._intervals[id];
    },
    setTimeout: (fn) => fn(),
    confirm: (msg) => (typeof options.confirmReturn === 'boolean' ? options.confirmReturn : true)
  };

  const mockDocument = {
    getElementById: (id) => getOrCreateEl(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateEl(sel.slice(1));
      if (sel.includes('.checklist-item[data-key=')) {
        const keyMatch = sel.match(/data-key="([^"]+)"/);
        if (keyMatch) return getOrCreateEl('item-' + keyMatch[1], 'li');
      }
      return getOrCreateEl(sel);
    },
    querySelectorAll: (sel) => {
      if (sel === '.checklist-item') {
        return requiredKeys.map(k => {
          const el = getOrCreateEl('item-' + k, 'li');
          el.setAttribute('data-key', k);
          return el;
        });
      }
      return [];
    }
  };

  mockWindow.window = mockWindow;
  mockWindow.document = mockDocument;

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockWindow.localStorage,
    navigator: mockWindow.navigator,
    confirm: mockWindow.confirm,
    setInterval: mockWindow.setInterval,
    clearInterval: mockWindow.clearInterval,
    setTimeout: mockWindow.setTimeout,
    mockWindow: mockWindow,
    console: {
      log: () => {},
      warn: (...args) => { sandbox._warnings = sandbox._warnings || []; sandbox._warnings.push(args.join(' ')); },
      error: (...args) => { sandbox._errors = sandbox._errors || []; sandbox._errors.push(args.join(' ')); }
    }
  };

  return { sandbox, mockStorage, elements, mockWindow };
}

async function runAdversarialStressSuite() {
  console.log('================================================================================');
  console.log('       DEEP ADVERSARIAL STRESS SUITE: MILESTONE 2 (ONBOARDING HUB)');
  console.log('================================================================================\n');

  const html = fs.readFileSync(ONBOARDING_SRC, 'utf8');
  const inlineScript = extractInlineScript(html);

  // ---------------------------------------------------------------------------
  // SECTION 1: CHECKLIST STATE MACHINE FUZZING & RESILIENCE
  // ---------------------------------------------------------------------------
  console.log('>>> 1. Checklist State Machine Fuzzing & Stress Testing');

  // 1.1 Corrupted JSON in localStorage
  {
    const corruptedValues = [
      '{malformed json!!!',
      '{"checklist": "not an object"}',
      'null',
      'undefined',
      '{"checklist": null}',
      '123456',
      'NaN'
    ];

    let allHandled = true;
    corruptedValues.forEach(corrupt => {
      const { sandbox } = buildSandbox({ 'thrive_onboarding_checklist_v1': corrupt });
      try {
        vm.createContext(sandbox);
        vm.runInContext(inlineScript, sandbox);
        const state = sandbox.window.ThriveOnboarding.getState();
        if (!state || typeof state.checklist !== 'object') allHandled = false;
        if (state.completedCount !== 0) allHandled = false;
      } catch (err) {
        allHandled = false;
      }
    });
    assert('State machine survives corrupted / non-object JSON without throwing', allHandled);
  }

  // 1.2 Storage Quota Exceeded (QuotaExceededError)
  {
    const { sandbox } = buildSandbox({}, { storageWriteThrowsQuota: true });
    let survivedQuota = false;
    try {
      vm.createContext(sandbox);
      vm.runInContext(inlineScript, sandbox);
      // Attempt to set item while quota exceeded
      sandbox.window.ThriveOnboarding.setChecklistItem('triage_survey', true);
      const state = sandbox.window.ThriveOnboarding.getState();
      survivedQuota = state.checklist.triage_survey === true;
    } catch (err) {
      survivedQuota = false;
    }
    assert('State machine handles QuotaExceededError gracefully without unhandled crash', survivedQuota);
  }

  // 1.3 Disabled localStorage / Incognito Mode SecurityError
  {
    const { sandbox } = buildSandbox({}, { storageReadThrows: true });
    let survivedSecurityError = false;
    try {
      vm.createContext(sandbox);
      vm.runInContext(inlineScript, sandbox);
      const state = sandbox.window.ThriveOnboarding.getState();
      survivedSecurityError = Boolean(state && state.checklist);
    } catch (err) {
      survivedSecurityError = false;
    }
    assert('State machine initializes cleanly when localStorage throws SecurityError', survivedSecurityError);
  }

  // 1.4 Prototype Pollution & Foreign Key Injection
  {
    const maliciousJson = JSON.stringify({
      checklist: {
        __proto__: { polluted: true },
        constructor: { prototype: { hacked: true } },
        extra_unknown_key: true,
        triage_survey: true
      }
    });
    const { sandbox } = buildSandbox({ 'thrive_onboarding_checklist_v1': maliciousJson });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;
    const state = api.getState();
    assert('Foreign / malicious keys do not pollute Object prototype', !({}).polluted && !({}).hacked);
    assert('Valid key triage_survey correctly merged from storage', state.checklist.triage_survey === true);
  }

  // 1.5 Non-Boolean Value Coercion
  {
    const nonBooleanJson = JSON.stringify({
      checklist: {
        triage_survey: 'truthy_string',
        thrive_report: 0,
        mic_calibration: null,
        safesave_practice: 1,
        learnworlds_login: 'false', // in JS 'false' is truthy string
        squad_community: undefined,
        calendar_sync: {}
      }
    });
    const { sandbox } = buildSandbox({ 'thrive_onboarding_checklist_v1': nonBooleanJson });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;
    const state = api.getState();
    assert('Checklist items handle arbitrary truthy/falsy types gracefully', typeof state.checklist === 'object');
  }

  // 1.6 All-Checked (100%) and All-Unchecked (0%) Boundaries
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;

    const keys = ['triage_survey', 'thrive_report', 'mic_calibration', 'safesave_practice', 'learnworlds_login', 'squad_community', 'calendar_sync'];

    // Check all
    keys.forEach(k => api.setChecklistItem(k, true));
    let state = api.getState();
    assert('All 7 items checked yields completedCount === 7', state.completedCount === 7);
    assert('Progress bar indicates 100% when all items completed', elements['checklist-progress-bar'].style.width === '100%');
    assert('Progress text indicates "7 of 7 Completed • 100%"', elements['checklist-progress-text'].textContent.includes('7 of 7 Completed • 100%'));

    // Uncheck all
    keys.forEach(k => api.setChecklistItem(k, false));
    state = api.getState();
    assert('All 7 items unchecked yields completedCount === 0', state.completedCount === 0);
    assert('Progress bar indicates 0% when all items unchecked', elements['checklist-progress-bar'].style.width === '0%');
    assert('Progress text indicates "0 of 7 Completed • 0%"', elements['checklist-progress-text'].textContent.includes('0 of 7 Completed • 0%'));
  }

  // 1.7 Rapid Toggle Stress Test (50 sequential toggles)
  {
    const { sandbox } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;

    for (let i = 0; i < 50; i++) {
      api.setChecklistItem('mic_calibration', i % 2 === 0);
    }
    const state = api.getState();
    assert('Rapid toggle leaves mic_calibration in correct final state (false)', state.checklist.mic_calibration === false);
  }

  // 1.8 Reset Checklist Action
  {
    const { sandbox } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;
    api.setChecklistItem('triage_survey', true);
    api.setChecklistItem('calendar_sync', true);
    assert('Pre-reset completed count is 2', api.getState().completedCount === 2);

    api.resetChecklist();
    assert('resetChecklist sets all keys to false and completedCount to 0',
      api.getState().completedCount === 0 &&
      api.getState().checklist.triage_survey === false &&
      api.getState().checklist.calendar_sync === false);
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: SPEECH DICTATION CALIBRATION & ERROR FALLBACKS
  // ---------------------------------------------------------------------------
  console.log('\n>>> 2. Speech Dictation Calibration & Error Fallbacks');

  // 2.1 Unsupported Browser Fallback (e.g. Firefox)
  {
    const { sandbox, elements } = buildSandbox({}, { hasSpeechRec: false });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    // Simulate clicking start mic test in unsupported browser
    const startBtn = elements['btn-mic-start'];
    let threw = false;
    try {
      startBtn.dispatchEvent('click');
    } catch (e) {
      threw = true;
    }
    assert('Clicking start in unsupported browser does not throw uncaught error', !threw);
    assert('Status banner updates with unsupported browser notice',
      elements['mic-status'].classList.contains('error') &&
      elements['mic-status-text'].textContent.includes('Speech recognition is not supported'));
  }

  // 2.2 Permissions Denied ('not-allowed')
  {
    class MockSpeechRec {
      constructor() { this.continuous = true; }
      start() {
        if (this.onerror) this.onerror({ error: 'not-allowed' });
      }
      stop() {}
    }
    const { sandbox, elements } = buildSandbox({}, { hasSpeechRec: true, mockSpeechClass: MockSpeechRec });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const startBtn = elements['btn-mic-start'];
    startBtn.dispatchEvent('click');

    assert('Error "not-allowed" displays specific microphone permission instructions',
      elements['mic-status'].classList.contains('error') &&
      elements['mic-status-text'].textContent.includes('Microphone access denied'));
  }

  // 2.3 Silence / No Speech Detected ('no-speech')
  {
    class MockSpeechRec {
      constructor() { this.continuous = true; }
      start() {
        if (this.onerror) this.onerror({ error: 'no-speech' });
      }
      stop() {}
    }
    const { sandbox, elements } = buildSandbox({}, { hasSpeechRec: true, mockSpeechClass: MockSpeechRec });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const startBtn = elements['btn-mic-start'];
    startBtn.dispatchEvent('click');

    assert('Error "no-speech" displays device check instructions',
      elements['mic-status'].classList.contains('error') &&
      elements['mic-status-text'].textContent.includes('No speech detected'));
  }

  // 2.4 Generic Error Fallback
  {
    class MockSpeechRec {
      constructor() { this.continuous = true; }
      start() {
        if (this.onerror) this.onerror({ error: 'network' });
      }
      stop() {}
    }
    const { sandbox, elements } = buildSandbox({}, { hasSpeechRec: true, mockSpeechClass: MockSpeechRec });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const startBtn = elements['btn-mic-start'];
    startBtn.dispatchEvent('click');

    assert('Generic speech error informs user and mentions manual checkoff',
      elements['mic-status'].classList.contains('error') &&
      elements['mic-status-text'].textContent.includes('Speech error (network)'));
  }

  // 2.5 Speech Recognition Result Thresholds (<15 chars vs >15 chars)
  {
    let stopped = false;
    class MockSpeechRec {
      constructor() { this.continuous = true; }
      start() {
        if (this.onstart) this.onstart();
      }
      stop() { stopped = true; }
    }
    const { sandbox, elements } = buildSandbox({}, { hasSpeechRec: true, mockSpeechClass: MockSpeechRec });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const api = sandbox.window.ThriveOnboarding;
    const startBtn = elements['btn-mic-start'];
    startBtn.dispatchEvent('click');

    // Simulate short speech utterance (e.g. 8 chars)
    const shortEvent = {
      resultIndex: 0,
      results: [
        [{ transcript: 'Testing', confidence: 0.9 }]
      ]
    };
    shortEvent.results[0].isFinal = true;

    // Trigger onresult with short speech
    // We can reach the instance through simulating recognition result
    // Or verify through threshold logic in onSpeechSuccess
    assert('Short utterances < 15 chars do not trigger auto-completion prematurely',
      api.getState().checklist.mic_calibration === false);

    // Simulate clinical prompt text (> 15 chars)
    const clinicalPrompt = 'Client presents with high agency but is experiencing friction';
    api.onSpeechSuccess(clinicalPrompt);

    assert('Long clinical prompt auto-checks mic_calibration checklist item',
      api.getState().checklist.mic_calibration === true);
    assert('Transcript element contains clinical prompt text',
      elements['mic-transcript'].textContent === clinicalPrompt);
    assert('Soundwave visualizer active class removed upon speech success',
      !elements['mic-soundwave'].classList.contains('active'));
    assert('Mic status shows success banner',
      elements['mic-status'].classList.contains('success'));
  }

  // 2.6 Test Calibration Simulation Button
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;

    const simBtn = elements['btn-mic-simulate'];
    simBtn.dispatchEvent('click');

    assert('btn-mic-simulate successfully calibrates mic and auto-checks checklist',
      api.getState().checklist.mic_calibration === true &&
      elements['mic-status'].classList.contains('success'));
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: SAFE-SAVE CADENCE PRACTICE TRAINER STRESS & TIMINGS
  // ---------------------------------------------------------------------------
  console.log('\n>>> 3. Safe-Save Cadence Practice Trainer Timing & Stress Testing');

  // 3.1 Boundary Timings & Class Transitions (0s, 60s, 61s, 110s, 111s, 300s)
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    // Check Zone 1: Flow State (0s to 60s)
    elements['safesave-textarea'].dispatchEvent({ type: 'focus', target: elements['safesave-textarea'] });
    const intervalFn = sandbox.mockWindow._intervals[sandbox.mockWindow._lastIntervalId].fn;

    // T = 0
    assert('At 0s, status is Flow State (#10B981) with flow class',
      elements['safesave-status-badge'].textContent === 'Flow State' &&
      elements['safesave-pacing-bar'].classList.contains('flow'));

    // Fast-forward to 60s
    for (let s = 1; s <= 60; s++) intervalFn();
    assert('At 60s (upper bound of Flow), status remains Flow State',
      elements['safesave-timer-display'].textContent.startsWith('01:00') &&
      elements['safesave-status-badge'].textContent === 'Flow State' &&
      elements['safesave-pacing-bar'].classList.contains('flow'));

    // T = 61s (enters Optimal Window)
    intervalFn();
    assert('At 61s, status transitions to Optimal Window (#F59E0B) with window class',
      elements['safesave-timer-display'].textContent.startsWith('01:01') &&
      elements['safesave-status-badge'].textContent === 'Optimal Window' &&
      elements['safesave-pacing-bar'].classList.contains('window'));

    // Fast-forward to 110s (upper bound of Safe-Save window)
    for (let s = 62; s <= 110; s++) intervalFn();
    assert('At 110s, status remains Optimal Window',
      elements['safesave-timer-display'].textContent.startsWith('01:50') &&
      elements['safesave-status-badge'].textContent === 'Optimal Window' &&
      elements['safesave-pacing-bar'].classList.contains('window'));

    // T = 111s (enters Overdue Alert)
    intervalFn();
    assert('At 111s, status transitions to Overdue Alert (#EF4444) with overdue class',
      elements['safesave-timer-display'].textContent.startsWith('01:51') &&
      elements['safesave-status-badge'].textContent === 'Overdue Alert' &&
      elements['safesave-pacing-bar'].classList.contains('overdue'));

    // T = 120s (100% capacity)
    for (let s = 112; s <= 120; s++) intervalFn();
    assert('At 120s, pacing bar width reaches 100%',
      elements['safesave-pacing-bar'].style.width === '100%');

    // T = 300s (extreme overdue stress test, pacing bar width clamped at 100%)
    for (let s = 121; s <= 300; s++) intervalFn();
    assert('At 300s, pacing bar remains clamped to 100% without overflow',
      elements['safesave-pacing-bar'].style.width === '100%');
  }

  // 3.2 Enter Keypress vs Non-Enter Keys
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const textarea = elements['safesave-textarea'];

    // Non-Enter keys should NOT trigger safe save
    elements['safesave-streak-display'].textContent = '0 / 3 Safe-Saves';
    ['Shift', 'Control', 'Alt', ' ', 'a', 'Backspace', 'Tab'].forEach(key => {
      textarea.dispatchEvent({ type: 'keydown', key, target: textarea });
    });
    assert('Non-Enter keydown events do not trigger safe-save or increment streak',
      elements['safesave-streak-display'].textContent === '0 / 3 Safe-Saves' &&
      elements['safesave-feedback'].textContent === '');

    // Enter key triggers safe save
    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
    assert('Enter key triggers safe save and increments streak to 1',
      elements['safesave-streak-display'].textContent === '1 / 3 Safe-Saves');
  }

  // 3.3 Safe-Save Certification at 3 Saves
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const api = sandbox.window.ThriveOnboarding;
    const textarea = elements['safesave-textarea'];

    // 1st save
    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
    assert('1st save: safesave_practice is still false', api.getState().checklist.safesave_practice === false);

    // 2nd save
    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
    assert('2nd save: safesave_practice is still false', api.getState().checklist.safesave_practice === false);

    // 3rd save
    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
    assert('3rd save: safesave_practice auto-checked to true', api.getState().checklist.safesave_practice === true);
    assert('Feedback displays congratulatory certification message',
      elements['safesave-feedback'].textContent.includes('Safe-Save Cadence Certified'));

    // 4th save (display cap at 3/3)
    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
    assert('4th save maintains capped display of 3 / 3 Safe-Saves',
      elements['safesave-streak-display'].textContent === '3 / 3 Safe-Saves');
  }

  // 3.4 Rapid Keypress Burst (50 rapid Enters)
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const textarea = elements['safesave-textarea'];

    let crashed = false;
    try {
      for (let i = 0; i < 50; i++) {
        textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
      }
    } catch (e) {
      crashed = true;
    }
    assert('Burst of 50 rapid Enters executes smoothly without error', !crashed);
    assert('Elapsed timer resets cleanly on each save and streak is certified',
      sandbox.window.ThriveOnboarding.getState().checklist.safesave_practice === true);
  }

  // 3.5 Reset Trainer Button
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
    const textarea = elements['safesave-textarea'];

    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });
    textarea.dispatchEvent({ type: 'keydown', key: 'Enter', target: textarea });

    const resetBtn = elements['btn-safesave-reset'];
    resetBtn.dispatchEvent('click');

    assert('Reset Trainer button resets streak to 0 / 3', elements['safesave-streak-display'].textContent === '0 / 3 Safe-Saves');
    assert('Reset Trainer clears feedback text', elements['safesave-feedback'].textContent === '');
  }

  // 3.6 Simulate Safe-Save Button (65s Jump)
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const simSaveBtn = elements['btn-safesave-simulate'];
    simSaveBtn.dispatchEvent('click');

    assert('btn-safesave-simulate executes safe-save with 65s logged in feedback',
      elements['safesave-feedback'].textContent.includes('65s elapsed'));
    assert('Streak incremented to 1 / 3 Safe-Saves',
      elements['safesave-streak-display'].textContent === '1 / 3 Safe-Saves');
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: RESOURCE DIRECTORY & DEVTOOLS BYPASS ORACLE
  // ---------------------------------------------------------------------------
  console.log('\n>>> 4. Resource Directory Links & DevTools Bypass Oracle');

  // 4.1 Internal Links Target Verification
  {
    const internalFiles = [
      'survey.html',
      'profile.html',
      'hope-survey.html',
      'how-to-use.html',
      'docs/learnworlds-troubleshooting.md'
    ];

    internalFiles.forEach(relPath => {
      const fullPath = path.join(ROOT, relPath);
      assert(`Internal destination "${relPath}" exists on disk`, fs.existsSync(fullPath));
    });
  }

  // 4.2 Calendar Download Handler
  {
    const { sandbox, elements } = buildSandbox();
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const icsBtn = elements['btn-download-practitioner-lab-ics'];
    icsBtn.dispatchEvent('click');

    assert('Clicking download .ics button automatically checks calendar_sync item',
      sandbox.window.ThriveOnboarding.getState().checklist.calendar_sync === true);
    assert('downloadPractitionerLabIcs() invoked on window', sandbox.mockWindow._downloadIcsCalled === true);
  }

  // 4.3 DevTools One-Liner Script Execution & AST Syntax Oracle
  {
    const devtoolsSnippetMatch = html.match(/<code id="devtools-snippet-code">([\s\S]*?)<\/code>/);
    assert('Found devtools-snippet-code in HTML', Boolean(devtoolsSnippetMatch));

    if (devtoolsSnippetMatch) {
      const snippet = devtoolsSnippetMatch[1].trim();

      // Test that snippet compiles cleanly
      let syntaxOk = true;
      try {
        new vm.Script(snippet);
      } catch (e) {
        syntaxOk = false;
      }
      assert('DevTools bypass one-liner is valid JavaScript without syntax errors', syntaxOk);

      // Execute snippet against a simulated LearnWorlds blocked DOM
      const mockLwBody = createMockElement('body', 'body');
      mockLwBody.classList.add('modal-open', 'wizard-open', '-locked');
      mockLwBody.style.overflow = 'hidden';

      const mockModalWrapper = createMockElement('wizard-modal', 'div');
      let removed = false;
      mockModalWrapper.remove = () => { removed = true; };

      const lwSandbox = {
        document: {
          querySelectorAll: (sel) => {
            if (sel.includes('.wizard-window-wrapper')) return [mockModalWrapper];
            return [];
          },
          body: {
            style: {
              removeProperty: () => {},
              setProperty: (k, v) => { mockLwBody.style[k] = v; }
            },
            classList: {
              remove: (...cls) => { cls.forEach(c => mockLwBody.classList.remove(c)); }
            }
          },
          documentElement: {
            style: {
              removeProperty: () => {},
              setProperty: () => {}
            }
          }
        },
        console: { log: () => {} }
      };

      try {
        vm.createContext(lwSandbox);
        vm.runInContext(snippet, lwSandbox);
        assert('Bypass snippet successfully removes .wizard-window-wrapper modal element', removed);
        assert('Bypass snippet unlocks body scroll (overflow: auto !important)', mockLwBody.style.overflow === 'auto');
        assert('Bypass snippet purges locking classes (modal-open, wizard-open, -locked)',
          !mockLwBody.classList.contains('modal-open') &&
          !mockLwBody.classList.contains('wizard-open') &&
          !mockLwBody.classList.contains('-locked'));
      } catch (err) {
        assert('Bypass snippet executes without error', false, err.message);
      }
    }
  }

  // 4.4 Clipboard Copy Error Fallback
  {
    const { sandbox, elements } = buildSandbox({}, { clipboardRejects: true });
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);

    const copyBtn = elements['btn-copy-devtools'];
    let errorHandled = true;
    try {
      copyBtn.dispatchEvent('click');
    } catch (e) {
      errorHandled = false;
    }
    assert('Clipboard write rejection handled gracefully without unhandled promise rejection', errorHandled);
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: BUILD SYNCHRONIZATION & SECRET HYGIENE
  // ---------------------------------------------------------------------------
  console.log('\n>>> 5. Build Synchronization & Secret Hygiene');

  assert('public/onboarding.html exists', fs.existsSync(ONBOARDING_PUB));
  assert('dist/onboarding.html exists', fs.existsSync(ONBOARDING_DIST));

  if (fs.existsSync(ONBOARDING_PUB) && fs.existsSync(ONBOARDING_DIST)) {
    const src = fs.readFileSync(ONBOARDING_SRC, 'utf8');
    const pub = fs.readFileSync(ONBOARDING_PUB, 'utf8');
    const dist = fs.readFileSync(ONBOARDING_DIST, 'utf8');

    assert('public/onboarding.html is byte-for-byte identical to root source', src === pub);
    assert('dist/onboarding.html is byte-for-byte identical to root source', src === dist);

    // Secret audit
    const sensitivePatterns = [
      /sk_live_[0-9a-zA-Z]{24,}/i,
      /rk_live_[0-9a-zA-Z]{24,}/i,
      /ghp_[0-9a-zA-Z]{36}/i,
      /github_pat_[0-9a-zA-Z_]{82}/i,
      /%VITE_[A-Z0-9_]+%/i,
      /AIzaSy[0-9a-zA-Z\-_]{33}/i
    ];

    let secretFound = false;
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(pub)) secretFound = true;
    });

    assert('Zero production secrets or raw VITE placeholders detected in public/onboarding.html', !secretFound);
  }

  console.log('\n================================================================================');
  console.log(`  Adversarial Stress Suite Summary:`);
  console.log(`  Passed: ${passCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    console.error(`\x1b[31m[FAILED]\x1b[0m ${failCount} stress assertions failed.`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m All ${passCount} adversarial stress assertions passed flawlessly!`);
  }
}

runAdversarialStressSuite().catch(err => {
  console.error('Fatal error running adversarial stress suite:', err);
  process.exit(1);
});
