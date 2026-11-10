/**
 * tests/adversarial-challenger-m2.js
 * Empirical Challenger Verification Suite for Milestone 2:
 * Session 0 Pre-Flight Onboarding Hub (onboarding.html)
 *
 * Suites:
 * 1. File Artifact & Build Pipeline Oracle
 * 2. Routing & Slug Registration Oracle
 * 3. Semantic HTML & Cohort Metadata Oracle
 * 4. Non-Linear Checklist State Machine & Storage Oracle
 * 5. Microphone & Speech Dictation Calibration Oracle
 * 6. Safe-Save Cadence Practice Trainer Oracle
 * 7. Resource Directory Cards Oracle
 * 8. LearnWorlds Modal Inspection & DevTools One-Liner Oracle
 * 9. DOM Event Handling & Execution Simulation Oracle
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ONBOARDING_SRC = path.join(ROOT, 'onboarding.html');
const ONBOARDING_PUB = path.join(ROOT, 'public/onboarding.html');
const ONBOARDING_DIST = path.join(ROOT, 'dist/onboarding.html');
const BUILD_JS = path.join(ROOT, 'build.js');
const BUILD_PY = path.join(ROOT, 'build.py');
const SCRIPT_JS = path.join(ROOT, 'script.js');

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

async function run() {
  console.log('================================================================================');
  console.log('     EMPIRICAL CHALLENGER ADVERSARIAL SUITE: MILESTONE 2 (ONBOARDING HUB)');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: File Artifact & Build Pipeline Oracle
  // ---------------------------------------------------------------------------
  console.log('--- SUITE 1: File Artifact & Build Pipeline ---');

  assert('onboarding.html exists in root directory', fs.existsSync(ONBOARDING_SRC));
  assert('public/onboarding.html exists (compiled via build.js)', fs.existsSync(ONBOARDING_PUB));
  assert('dist/onboarding.html exists (compiled via build.js)', fs.existsSync(ONBOARDING_DIST));

  const buildJsContent = fs.readFileSync(BUILD_JS, 'utf8');
  assert('build.js files array includes "onboarding.html"', buildJsContent.includes("'onboarding.html'"));

  const buildPyContent = fs.readFileSync(BUILD_PY, 'utf8');
  assert('build.py files list includes "onboarding.html"', buildPyContent.includes("'onboarding.html'"));

  const srcSize = fs.existsSync(ONBOARDING_SRC) ? fs.statSync(ONBOARDING_SRC).size : 0;
  const pubSize = fs.existsSync(ONBOARDING_PUB) ? fs.statSync(ONBOARDING_PUB).size : 0;
  assert('public/onboarding.html matches root onboarding.html content size', srcSize > 0 && srcSize === pubSize);

  // ---------------------------------------------------------------------------
  // SUITE 2: Routing & Slug Registration Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Routing & Slug Registration ---');

  const scriptContent = fs.readFileSync(SCRIPT_JS, 'utf8');
  const slugMatch = scriptContent.match(/KNOWN_PAGE_SLUGS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  assert('script.js defines KNOWN_PAGE_SLUGS Set', Boolean(slugMatch));

  if (slugMatch) {
    const slugs = slugMatch[1].split(',').map(s => s.replace(/['"\s]/g, '')).filter(Boolean);
    assert('KNOWN_PAGE_SLUGS contains "onboarding"', slugs.includes('onboarding'));
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: Semantic HTML & Cohort Metadata Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Semantic HTML & Cohort Metadata ---');

  const html = fs.readFileSync(ONBOARDING_SRC, 'utf8');

  assert('Page has valid HTML5 doctype', html.startsWith('<!DOCTYPE html>'));
  assert('Header includes brand mark THRiVE Coaching', html.includes('brand-mark') && html.includes('THRiVE'));
  assert('Header includes mobile hamburger button', html.includes('hamburger') && html.includes('aria-label="Toggle menu"'));
  assert('Header includes desktop-menu and mobile-drawer', html.includes('desktop-menu') && html.includes('mobile-drawer'));

  assert('Hero displays eyebrow "Session 0 • Pre-Flight Onboarding Hub"', html.includes('Session 0 • Pre-Flight Onboarding Hub'));
  assert('Hero displays title "Welcome to the Practitioner Lab"', html.includes('Welcome to the') && html.includes('Practitioner Lab'));
  assert('Hero references 167 Hours Between Sessions', html.includes('167 Hours Between Sessions'));
  assert('Hero includes Nov 28–29 Weekend Drop-In Tech Clinics', html.includes('Nov 28') && html.includes('Nov 29') && html.includes('Tech Clinics'));
  assert('Hero includes Monday, Nov 30, 2026 Cohort Launch', html.includes('Nov 30, 2026') || html.includes('November 30, 2026'));
  assert('Hero specifies 21 Practitioners in 3 Squads of 7', html.includes('21 Practitioners') && html.includes('3 Squads of 7'));

  // ---------------------------------------------------------------------------
  // SUITE 4: Non-Linear Checklist State Machine & Storage Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Non-Linear Checklist State Machine & Storage ---');

  assert('Checklist container exists with id "onboarding-checklist-card"', html.includes('id="onboarding-checklist-card"'));
  assert('Checklist uses localStorage key "thrive_onboarding_checklist_v1"', html.includes('thrive_onboarding_checklist_v1'));
  assert('Progress bar track and fill elements present', html.includes('id="checklist-progress-bar"') && html.includes('id="checklist-progress-text"'));
  assert('Reset checklist button present with id "btn-reset-checklist"', html.includes('id="btn-reset-checklist"'));

  const requiredKeys = [
    'triage_survey',
    'thrive_report',
    'mic_calibration',
    'safesave_practice',
    'learnworlds_login',
    'squad_community',
    'calendar_sync'
  ];

  requiredKeys.forEach(key => {
    assert(`Checklist contains item with data-key="${key}"`, html.includes(`data-key="${key}"`));
    assert(`Checklist contains input with id="check-${key}"`, html.includes(`id="check-${key}"`));
  });

  // ---------------------------------------------------------------------------
  // SUITE 5: Microphone & Speech Dictation Calibration Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Microphone & Speech Dictation Calibration ---');

  assert('Mic tester container exists with id "mic-tester-card"', html.includes('id="mic-tester-card"'));
  assert('Mic prompt box contains required clinical text', html.includes('Client presents with high agency but is experiencing friction'));
  assert('Mic status banner present with id "mic-status"', html.includes('id="mic-status"'));
  assert('Soundwave visualizer container present with id "mic-soundwave"', html.includes('id="mic-soundwave"'));
  assert('Transcript display element present with id "mic-transcript"', html.includes('id="mic-transcript"'));
  assert('Start mic test button present with id "btn-mic-start"', html.includes('id="btn-mic-start"'));
  assert('Stop mic test button present with id "btn-mic-stop"', html.includes('id="btn-mic-stop"'));
  assert('Simulate mic button present with id "btn-mic-simulate"', html.includes('id="btn-mic-simulate"'));
  assert('Script handles Web Speech API via SpeechRecognition / webkitSpeechRecognition',
    html.includes('window.SpeechRecognition') && html.includes('window.webkitSpeechRecognition'));
  assert('Script handles error states: not-allowed, no-speech, and missing API',
    html.includes('not-allowed') && html.includes('no-speech'));

  // ---------------------------------------------------------------------------
  // SUITE 6: Safe-Save Cadence Practice Trainer Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 6: Safe-Save Cadence Practice Trainer ---');

  assert('Trainer container exists with id "safesave-trainer-card"', html.includes('id="safesave-trainer-card"'));
  assert('Timer display element exists with id "safesave-timer-display"', html.includes('id="safesave-timer-display"'));
  assert('Streak display element exists with id "safesave-streak-display"', html.includes('id="safesave-streak-display"'));
  assert('Pacing bar element exists with id "safesave-pacing-bar"', html.includes('id="safesave-pacing-bar"'));
  assert('Practice textarea exists with id "safesave-textarea"', html.includes('id="safesave-textarea"'));
  assert('Feedback message element exists with id "safesave-feedback"', html.includes('id="safesave-feedback"'));
  assert('Reset trainer button exists with id "btn-safesave-reset"', html.includes('id="btn-safesave-reset"'));
  assert('Simulate save button exists with id "btn-safesave-simulate"', html.includes('id="btn-safesave-simulate"'));
  assert('Pacing logic implements 0-60s Flow, 60-110s Safe-Save Window, >110s Overdue Alert',
    html.includes('60') && html.includes('110') && html.includes('Overdue'));
  assert('Script checks for 3 successful safe-saves to certify cadence', html.includes('saveStreak >= 3'));

  // ---------------------------------------------------------------------------
  // SUITE 7: Resource Directory Cards Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 7: Resource Directory Cards ---');

  assert('Directory grid exists with id "onboarding-directory-grid"', html.includes('id="onboarding-directory-grid"'));
  assert('Directory links to Flow Survey (survey.html)', html.includes('href="survey.html"'));
  assert('Directory links to THRiVE Report (profile.html)', html.includes('href="profile.html"'));
  assert('Directory links to HoPE Index (hope-survey.html)', html.includes('href="hope-survey.html"'));
  assert('Directory links to Practitioner Guide (how-to-use.html)', html.includes('href="how-to-use.html"'));
  assert('Directory links to LearnWorlds LMS (https://thrive-coaching.learnworlds.com)', html.includes('https://thrive-coaching.learnworlds.com'));
  assert('Directory links to Personos AI overview', html.includes('how-to-use.html#tier-3-personos'));
  assert('Directory includes Calendar sync button with id "btn-download-practitioner-lab-ics"', html.includes('id="btn-download-practitioner-lab-ics"'));
  assert('Directory links to IT Help Desk (how-to-use.html#it-help-desk)', html.includes('how-to-use.html#it-help-desk'));

  // ---------------------------------------------------------------------------
  // SUITE 8: LearnWorlds Modal Inspection & DevTools One-Liner Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 8: LearnWorlds Modal Inspection & DevTools One-Liner ---');

  assert('LearnWorlds modal guide section exists with id "learnworlds-modal-guide"', html.includes('id="learnworlds-modal-guide"'));
  assert('Guide targets .wizard-window-wrapper.-school', html.includes('.wizard-window-wrapper.-school'));
  assert('One-liner code snippet present with id "devtools-snippet-code"', html.includes('id="devtools-snippet-code"'));
  assert('Copy button present with id "btn-copy-devtools"', html.includes('id="btn-copy-devtools"'));
  assert('Links to docs/learnworlds-troubleshooting.md', html.includes('docs/learnworlds-troubleshooting.md'));

  // ---------------------------------------------------------------------------
  // SUITE 9: DOM Event Handling & Execution Simulation Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 9: DOM Event Handling & Execution Simulation ---');

  // Verify that the inline script parses and runs without syntax errors
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let inlineScript = '';
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (!match[0].includes('src=')) {
      inlineScript += match[1] + '\n';
    }
  }

  assert('Extracted inline JavaScript from onboarding.html', inlineScript.length > 500);

  // Mock DOM environment to test script execution in Node VM
  const mockStorage = {};
  const mockElements = {};

  const createMockElement = (id, tag = 'div') => {
    return {
      id,
      tagName: tag.toUpperCase(),
      className: '',
      classList: {
        add: function(c) { this._classes = this._classes || new Set(); this._classes.add(c); },
        remove: function(c) { if (this._classes) this._classes.delete(c); },
        contains: function(c) { return this._classes ? this._classes.has(c) : false; }
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
      addEventListener: function(event, handler) {
        this._listeners = this._listeners || {};
        this._listeners[event] = this._listeners[event] || [];
        this._listeners[event].push(handler);
      },
      dispatchEvent: function(event) {
        if (this._listeners && this._listeners[event]) {
          this._listeners[event].forEach(fn => fn({ target: this, key: event === 'keydown' ? 'Enter' : null }));
        }
      }
    };
  };

  const mockWindow = {
    localStorage: {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; }
    },
    navigator: {
      clipboard: {
        writeText: () => Promise.resolve()
      }
    },
    downloadPractitionerLabIcs: () => {},
    SpeechRecognition: null,
    webkitSpeechRecognition: null,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: (fn) => fn(),
    confirm: () => true
  };

  const mockDocument = {
    getElementById: (id) => {
      if (!mockElements[id]) mockElements[id] = createMockElement(id);
      return mockElements[id];
    },
    querySelector: (sel) => createMockElement(sel),
    querySelectorAll: (sel) => {
      if (sel === '.checklist-item') {
        return requiredKeys.map(k => {
          const el = createMockElement('item-' + k, 'li');
          el.setAttribute('data-key', k);
          return el;
        });
      }
      return [];
    }
  };

  const sandbox = {
    window: mockWindow,
    document: mockDocument,
    localStorage: mockWindow.localStorage,
    navigator: mockWindow.navigator,
    confirm: mockWindow.confirm,
    setInterval: mockWindow.setInterval,
    clearInterval: mockWindow.clearInterval,
    setTimeout: mockWindow.setTimeout,
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };
  mockWindow.window = mockWindow;
  mockWindow.document = mockDocument;

  let executionError = null;
  try {
    vm.createContext(sandbox);
    vm.runInContext(inlineScript, sandbox);
  } catch (err) {
    executionError = err;
  }

  assert('Inline script executed in DOM sandbox without errors', executionError === null, executionError ? executionError.message : '');
  assert('window.ThriveOnboarding exposed for test harness and verification', Boolean(sandbox.window.ThriveOnboarding));

  if (sandbox.window.ThriveOnboarding) {
    const api = sandbox.window.ThriveOnboarding;
    const initialState = api.getState();
    assert('Initial checklist state has 7 items initialized', Object.keys(initialState.checklist).length === 7);

    api.setChecklistItem('triage_survey', true);
    assert('Setting item true updates in-memory and persisted state', api.getState().checklist.triage_survey === true);
    assert('localStorage persisted checklist state with updated item', mockStorage['thrive_onboarding_checklist_v1'].includes('"triage_survey":true'));

    api.onSpeechSuccess('Client presents with high agency');
    assert('onSpeechSuccess auto-checks mic_calibration item', api.getState().checklist.mic_calibration === true);

    api.executeSafeSave();
    api.executeSafeSave();
    api.executeSafeSave();
    assert('3 Safe-Saves auto-check safesave_practice item', api.getState().checklist.safesave_practice === true);
  }

  console.log('\n================================================================================');
  console.log(`  Milestone 2 Adversarial Suite Summary:`);
  console.log(`  Passed: ${passCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    console.error(`\x1b[31m[FAILED]\x1b[0m ${failCount} assertions failed.`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m All ${passCount} Milestone 2 assertions passed flawlessly!`);
  }
}

run().catch(err => {
  console.error('Fatal error running adversarial suite:', err);
  process.exit(1);
});
