/**
 * tests/adversarial-m1.js
 * Adversarial Empirical Verification Suite for Milestone 1:
 * LearnWorlds Setup Modal Inspection & Bypass Troubleshooting Manual
 *
 * Tests:
 * 1. Bookmarklet URL format, syntax, URI decoding, execution safety, and return value.
 * 2. MutationObserver infinite loop triggers, memory leak stress, microtask recursion, and self-mutation immunity.
 * 3. Multi-backdrop stress handling and dynamic re-insertion resilience.
 * 4. Viewport scroll restoration and class preservation.
 * 5. False-positive / over-purge evaluation of wildcard selectors.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DOC_PATH = path.resolve(__dirname, '../docs/learnworlds-troubleshooting.md');

// ---------------------------------------------------------------------------
// Realistic In-Memory Event-Driven DOM & MutationObserver Implementation
// ---------------------------------------------------------------------------
class DOMNode {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.style = {
      _styles: {},
      setProperty: (prop, val, priority = '') => {
        this.style._styles[prop] = { val, priority };
        this.style[prop] = val;
      },
      removeProperty: (prop) => {
        delete this.style._styles[prop];
        delete this.style[prop];
      },
      getPropertyValue: (prop) => {
        return this.style._styles[prop] ? this.style._styles[prop].val : (this.style[prop] || '');
      }
    };
    this.classList = {
      _classes: new Set(),
      add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
      remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
      contains: (c) => this.classList._classes.has(c),
      toString: () => Array.from(this.classList._classes).join(' ')
    };
    this.id = '';
  }

  get className() {
    return Array.from(this.classList._classes).join(' ');
  }

  set className(val) {
    this.classList._classes = new Set(String(val).split(/\s+/).filter(Boolean));
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
    if (name === 'id') this.id = String(val);
    if (name === 'class') {
      this.className = String(val);
      this.classList._classes = new Set(String(val).split(/\s+/).filter(Boolean));
    }
  }

  getAttribute(name) {
    if (name === 'class') return this.classList.toString();
    if (name === 'id') return this.id;
    return this.attributes[name] ?? null;
  }

  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    MutationDispatcher.notifyChildListChange(this, [child], []);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
      MutationDispatcher.notifyChildListChange(this, [], [child]);
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  querySelectorAll(selector) {
    const results = [];
    const match = (el) => {
      if (matches(el, selector)) results.push(el);
      for (const ch of el.children) match(ch);
    };
    for (const ch of this.children) match(ch);
    return results;
  }

  querySelector(selector) {
    const res = this.querySelectorAll(selector);
    return res.length > 0 ? res[0] : null;
  }
}

function matches(el, selector) {
  // Support comma-separated selectors
  if (selector.includes(',')) {
    return selector.split(',').some(sub => matches(el, sub.trim()));
  }
  selector = selector.trim();
  if (selector.startsWith('.') && selector.includes('.-')) {
    const parts = selector.split('.').filter(Boolean);
    return parts.every(p => el.classList.contains(p));
  }
  if (selector.startsWith('.')) {
    return el.classList.contains(selector.slice(1));
  }
  if (selector.startsWith('#')) {
    return el.id === selector.slice(1);
  }
  if (selector.startsWith('[') && selector.includes('*="')) {
    const m = selector.match(/\[([a-zA-Z0-9_-]+)\*="([^"]+)"\]/);
    if (m) {
      const val = el.getAttribute(m[1]) || '';
      return val.includes(m[2]);
    }
  }
  return false;
}

const MutationDispatcher = {
  observers: [],
  isFlushing: false,
  notifyChildListChange(target, added, removed) {
    for (const obs of this.observers) {
      if (obs.isObserving(target, 'childList')) {
        obs.queueRecord({ type: 'childList', target, addedNodes: added, removedNodes: removed });
      }
    }
  },
  flushMicrotasks() {
    if (this.isFlushing) return;
    this.isFlushing = true;
    let iterations = 0;
    const MAX_MICROTASK_ITERATIONS = 1000;

    while (iterations < MAX_MICROTASK_ITERATIONS) {
      let firedAny = false;
      for (const obs of this.observers) {
        if (obs.records.length > 0) {
          firedAny = true;
          const records = obs.records.splice(0);
          obs.callbackCount++;
          obs.callback(records, obs);
        }
      }
      if (!firedAny) break;
      iterations++;
    }
    this.isFlushing = false;
    if (iterations >= MAX_MICROTASK_ITERATIONS) {
      throw new Error(`POTENTIAL INFINITE MICROTASK LOOP: MutationObserver exceeded ${MAX_MICROTASK_ITERATIONS} iterations`);
    }
  }
};

class ObservableMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.records = [];
    this.target = null;
    this.options = null;
    this.callbackCount = 0;
    MutationDispatcher.observers.push(this);
  }

  observe(target, options) {
    this.target = target;
    this.options = options;
  }

  disconnect() {
    const idx = MutationDispatcher.observers.indexOf(this);
    if (idx !== -1) MutationDispatcher.observers.splice(idx, 1);
  }

  isObserving(node, type) {
    if (!this.target || !this.options) return false;
    if (type === 'childList' && this.options.childList) {
      if (node === this.target) return true;
      if (this.options.subtree) {
        let p = node.parentNode;
        while (p) {
          if (p === this.target) return true;
          p = p.parentNode;
        }
      }
    }
    return false;
  }

  queueRecord(rec) {
    this.records.push(rec);
  }
}

function createDOMEnv() {
  MutationDispatcher.observers = [];
  const documentElement = new DOMNode('html');
  const body = new DOMNode('body');
  documentElement.appendChild(body);

  const document = {
    documentElement,
    body,
    createElement(tag) { return new DOMNode(tag); },
    querySelectorAll(sel) {
      const results = [];
      if (matches(documentElement, sel)) results.push(documentElement);
      if (matches(body, sel)) results.push(body);
      results.push(...body.querySelectorAll(sel));
      return results;
    },
    querySelector(sel) {
      const res = this.querySelectorAll(sel);
      return res.length > 0 ? res[0] : null;
    }
  };

  const logs = [];
  const window = {
    document,
    MutationObserver: ObservableMutationObserver,
    console: {
      log(...args) { logs.push(args.join(' ')); },
      warn(...args) { logs.push(args.join(' ')); },
      error(...args) { logs.push(args.join(' ')); }
    }
  };

  return { window, document, logs, flush: () => MutationDispatcher.flushMicrotasks() };
}

// ---------------------------------------------------------------------------
// Adversarial Test Harness Execution
// ---------------------------------------------------------------------------
async function runAdversarialSuite() {
  console.log('================================================================================');
  console.log('  EMPIRICAL ADVERSARIAL CHALLENGE: MILESTONE 1 TROUBLESHOOTING GUIDE & SCRIPTS');
  console.log('================================================================================\n');

  if (!fs.existsSync(DOC_PATH)) {
    console.error('FATAL: docs/learnworlds-troubleshooting.md does not exist!');
    process.exit(1);
  }

  const doc = fs.readFileSync(DOC_PATH, 'utf8');
  let passCount = 0;
  let failCount = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  \x1b[32m[PASS]\x1b[0m ${title}`);
      passCount++;
    } else {
      console.log(`  \x1b[31m[FAIL]\x1b[0m ${title}`);
      if (detail) console.log(`         \x1b[90m↳ ${detail}\x1b[0m`);
      failCount++;
    }
  }

  // Extract scripts from doc
  const bookmarkletMatch = doc.match(/javascript:\s*\(function[\s\S]*?\)\(\);?/);
  const bookmarkletCode = bookmarkletMatch ? bookmarkletMatch[0] : null;

  // Extract 4.1 console one-liner
  const section41Match = doc.match(/### 4\.1[\s\S]*?```javascript\s*([\s\S]*?)```/);
  const code41 = section41Match ? section41Match[1].trim() : null;

  // Extract 4.2 mutation observer
  const section42Match = doc.match(/### 4\.2[\s\S]*?```javascript\s*([\s\S]*?)```/);
  const code42 = section42Match ? section42Match[1].trim() : null;

  // Extract 4.4 userscript
  const section44Match = doc.match(/### 4\.4[\s\S]*?```javascript\s*([\s\S]*?)```/);
  const code44 = section44Match ? section44Match[1].trim() : null;

  // -------------------------------------------------------------------------
  // SUITE 1: Bookmarklet URL Encoding & Execution Validity
  // -------------------------------------------------------------------------
  console.log('--- SUITE 1: Bookmarklet URL Encoding & Execution Validity ---');

  assert('Bookmarklet exists in docs/learnworlds-troubleshooting.md', !!bookmarkletCode);

  if (bookmarkletCode) {
    assert(
      'Bookmarklet starts with "javascript:" protocol scheme',
      bookmarkletCode.startsWith('javascript:')
    );

    assert(
      'Bookmarklet is formatted as a single contiguous line (no raw newlines)',
      !bookmarkletCode.includes('\n') && !bookmarkletCode.includes('\r')
    );

    // Test URL-decodability (no malformed percent encodings)
    let urlDecodable = true;
    try {
      decodeURIComponent(bookmarkletCode);
    } catch (e) {
      urlDecodable = false;
    }
    assert('Bookmarklet string passes decodeURIComponent without URIError', urlDecodable);

    // Test execution return value: In browsers, bookmarklets that return non-undefined replace page body
    const rawJs = bookmarkletCode.replace(/^javascript:/, '');
    let returnVal = 'not-executed';
    try {
      const script = new vm.Script(rawJs);
      const { window } = createDOMEnv();
      returnVal = script.runInNewContext(window);
    } catch (e) {
      returnVal = 'ERROR: ' + e.message;
    }
    assert(
      'Bookmarklet returns undefined (avoids replacing browser document body with returned text)',
      returnVal === undefined,
      `Actual return value: ${returnVal}`
    );

    // Test execution on empty DOM (zero modals)
    let zeroModalThrew = false;
    try {
      const { window } = createDOMEnv();
      const script = new vm.Script(rawJs);
      script.runInNewContext(window);
    } catch (e) {
      zeroModalThrew = true;
    }
    assert('Bookmarklet runs gracefully on clean DOM with zero modal elements', !zeroModalThrew);

    // Test execution on modal DOM
    const { window, document } = createDOMEnv();
    const modal = document.createElement('div');
    modal.className = 'wizard-window-wrapper -school';
    const backdrop = document.createElement('div');
    backdrop.className = 'wizard-backdrop';
    document.body.appendChild(modal);
    document.body.appendChild(backdrop);
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.body.classList.add('modal-open', 'wizard-open');

    const script = new vm.Script(rawJs);
    script.runInNewContext(window);

    assert(
      'Bookmarklet successfully removes .wizard-window-wrapper and .wizard-backdrop',
      document.querySelectorAll('.wizard-window-wrapper').length === 0 &&
      document.querySelectorAll('.wizard-backdrop').length === 0
    );
    assert(
      'Bookmarklet restores body overflow to "auto"',
      document.body.style.getPropertyValue('overflow') === 'auto'
    );
    assert(
      'Bookmarklet purges modal-open and wizard-open classes from body',
      !document.body.classList.contains('modal-open') && !document.body.classList.contains('wizard-open')
    );
  }

  // -------------------------------------------------------------------------
  // SUITE 2: MutationObserver Infinite Loop & Memory Stress Testing
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 2: MutationObserver Infinite Loop & Memory Stress Testing ---');

  assert('Section 4.2 script extracted from doc', !!code42);

  if (code42) {
    // 2.1 Test microtask loop termination
    let loopTerminated = true;
    let observerError = null;
    let callbackCount = 0;

    const env = createDOMEnv();
    const modal = env.document.createElement('div');
    modal.className = 'wizard-window-wrapper -school';
    env.document.body.appendChild(modal);

    try {
      const script = new vm.Script(code42);
      script.runInNewContext(env.window);
      // Flush microtasks
      env.flush();
      const obs = MutationDispatcher.observers[0];
      callbackCount = obs ? obs.callbackCount : 0;
    } catch (e) {
      loopTerminated = false;
      observerError = e.message;
    }

    assert(
      'MutationObserver script terminates cleanly without infinite microtask loop',
      loopTerminated,
      observerError
    );
    assert(
      'MutationObserver callback count is strictly bounded (callbackCount <= 2)',
      callbackCount <= 2,
      `Actual callback count: ${callbackCount}`
    );

    // 2.2 Self-mutation immunity: Verify that changing body style or class does NOT re-trigger observer
    let selfTriggered = false;
    const envSelf = createDOMEnv();
    new vm.Script(code42).runInNewContext(envSelf.window);
    envSelf.flush();
    const obsSelf = MutationDispatcher.observers[0];
    const initialCallbacks = obsSelf ? obsSelf.callbackCount : 0;

    // Mutate body style and classes
    envSelf.document.body.style.setProperty('overflow', 'hidden');
    envSelf.document.body.classList.add('test-class');
    envSelf.flush();

    const afterCallbacks = obsSelf ? obsSelf.callbackCount : 0;
    assert(
      'Observer ignores body attribute/style mutations (observes childList only, immune to style feedback loops)',
      afterCallbacks === initialCallbacks,
      `Callbacks before: ${initialCallbacks}, after: ${afterCallbacks}`
    );

    // 2.3 Rapid dynamic re-insertion attack: 50 successive insertions
    let reinsertionSurvived = true;
    let purgedCount = 0;
    const envReinsert = createDOMEnv();
    new vm.Script(code42).runInNewContext(envReinsert.window);
    envReinsert.flush();

    try {
      for (let i = 0; i < 50; i++) {
        const reinserted = envReinsert.document.createElement('div');
        reinserted.className = 'wizard-window-wrapper';
        envReinsert.document.body.appendChild(reinserted);
        envReinsert.flush();
        if (envReinsert.document.querySelectorAll('.wizard-window-wrapper').length === 0) {
          purgedCount++;
        }
      }
    } catch (e) {
      reinsertionSurvived = false;
    }

    assert(
      'Observer neutralizes 50 rapid re-insertion attempts sequentially without crashing',
      reinsertionSurvived && purgedCount === 50,
      `Successfully purged: ${purgedCount} of 50`
    );

    // 2.4 Non-modal mutation flood: 10,000 DOM mutations of benign elements
    const envFlood = createDOMEnv();
    new vm.Script(code42).runInNewContext(envFlood.window);
    envFlood.flush();

    const initialMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();
    let floodSurvived = true;

    try {
      for (let i = 0; i < 10000; i++) {
        const item = envFlood.document.createElement('div');
        item.className = 'course-card normal-item';
        envFlood.document.body.appendChild(item);
        if (i % 500 === 0) envFlood.flush();
      }
      envFlood.flush();
    } catch (e) {
      floodSurvived = false;
    }
    const elapsed = Date.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memDeltaMB = (finalMemory - initialMemory) / (1024 * 1024);

    assert(
      'Observer survives 10,000 benign DOM mutations in < 500ms',
      floodSurvived && elapsed < 500,
      `Elapsed time: ${elapsed}ms`
    );
    assert(
      'Non-modal elements remain intact (0 benign elements removed by observer)',
      envFlood.document.querySelectorAll('.course-card').length === 10000
    );
    assert(
      'Heap delta is reasonable (< 30 MB for 10k mock elements)',
      memDeltaMB < 30,
      `Heap delta: ${memDeltaMB.toFixed(2)} MB`
    );
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Multiple Modal Backdrops & Nested Elements
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Multiple Modal Backdrops & Nested Hierarchy ---');

  if (code41) {
    const envMulti = createDOMEnv();
    // Add 10 distinct blocking elements
    const w1 = envMulti.document.createElement('div'); w1.className = 'wizard-window-wrapper -school';
    const w2 = envMulti.document.createElement('div'); w2.className = 'wizard-window';
    const b1 = envMulti.document.createElement('div'); b1.className = 'wizard-backdrop';
    const b2 = envMulti.document.createElement('div'); b2.className = 'wizard-backdrop';
    const b3 = envMulti.document.createElement('div'); b3.className = 'modal-backdrop';
    const b4 = envMulti.document.createElement('div'); b4.className = 'lw-modal-backdrop';
    const b5 = envMulti.document.createElement('div'); b5.className = 'custom-wizard-backdrop-overlay';
    const b6 = envMulti.document.createElement('div'); b6.className = 'lw-wizard-window-wrapper-inner';

    // Nesting: w2 inside w1
    w1.appendChild(w2);
    envMulti.document.body.appendChild(w1);
    envMulti.document.body.appendChild(b1);
    envMulti.document.body.appendChild(b2);
    envMulti.document.body.appendChild(b3);
    envMulti.document.body.appendChild(b4);
    envMulti.document.body.appendChild(b5);
    envMulti.document.body.appendChild(b6);

    const initialBlockers = envMulti.document.querySelectorAll(
      '.wizard-window-wrapper, .wizard-window, .wizard-backdrop, .modal-backdrop, .lw-modal-backdrop, [class*="wizard-backdrop"], [class*="wizard-window-wrapper"]'
    ).length;

    assert('Initial blocker elements mounted correctly in DOM (>= 7 elements)', initialBlockers >= 7);

    new vm.Script(code41).runInNewContext(envMulti.window);

    const remainingBlockers = envMulti.document.querySelectorAll(
      '.wizard-window-wrapper, .wizard-window, .wizard-backdrop, .modal-backdrop, .lw-modal-backdrop, [class*="wizard-backdrop"], [class*="wizard-window-wrapper"]'
    ).length;

    assert('Console One-Liner completely eliminates all 7+ multi-backdrop blockers', remainingBlockers === 0);
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Viewport Scroll Restoration & Non-Modal Class Preservation
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Viewport Scroll Restoration & Class Preservation ---');

  if (code41) {
    const envScroll = createDOMEnv();
    envScroll.document.body.style.setProperty('overflow', 'hidden', 'important');
    envScroll.document.body.style.setProperty('height', '100%', 'important');
    envScroll.document.body.style.setProperty('position', 'fixed', 'important');
    envScroll.document.documentElement.style.setProperty('overflow', 'hidden', 'important');

    envScroll.document.body.classList.add('modal-open', 'wizard-open', 'no-scroll', 'has-modal', '-locked', 'user-logged-in', 'theme-indigo');

    new vm.Script(code41).runInNewContext(envScroll.window);

    assert(
      'body overflow is set to "auto"',
      envScroll.document.body.style.getPropertyValue('overflow') === 'auto'
    );
    assert(
      'documentElement overflow is set to "auto"',
      envScroll.document.documentElement.style.getPropertyValue('overflow') === 'auto'
    );
    assert(
      'All 5 locking classes stripped from body',
      !['modal-open', 'wizard-open', 'no-scroll', 'has-modal', '-locked'].some(c => envScroll.document.body.classList.contains(c))
    );
    assert(
      'Non-locking classes ("user-logged-in", "theme-indigo") preserved on body',
      envScroll.document.body.classList.contains('user-logged-in') &&
      envScroll.document.body.classList.contains('theme-indigo')
    );
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Tampermonkey Userscript (4.4) Verification
  // -------------------------------------------------------------------------
  console.log('\n--- SUITE 5: Tampermonkey Userscript (4.4) Verification ---');

  if (code44) {
    const envUser = createDOMEnv();
    const modal = envUser.document.createElement('div');
    modal.className = 'wizard-window-wrapper';
    envUser.document.body.appendChild(modal);
    envUser.document.body.style.setProperty('overflow', 'hidden');

    let userScriptThrew = false;
    try {
      new vm.Script(code44).runInNewContext(envUser.window);
      envUser.flush();
    } catch (e) {
      userScriptThrew = true;
    }

    assert('Userscript (4.4) executes without syntax or runtime errors', !userScriptThrew);
    assert('Userscript purges modal immediately on initial sweep', envUser.document.querySelectorAll('.wizard-window-wrapper').length === 0);
    assert('Userscript resets body overflow to "auto"', envUser.document.body.style.getPropertyValue('overflow') === 'auto');
  }

  // -------------------------------------------------------------------------
  // SUMMARY & VERDICT
  // -------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`  EMPIRICAL ADVERSARIAL CHALLENGE SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    console.log('\x1b[31mVERDICT: REQUEST_CHANGES\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32mVERDICT: APPROVE (ALL ADVERSARIAL STRESS TESTS PASSED)\x1b[0m\n');
    process.exit(0);
  }
}

if (require.main === module) {
  runAdversarialSuite().catch(err => {
    console.error('Fatal challenge error:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialSuite };
