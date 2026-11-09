/**
 * tests/helpers.js
 * Common test utilities, mock DOM environment, RFC 5545 validator,
 * file inspectors, and serverless API test runner.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Read file safely relative to project root
 */
function readProjectFile(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Check if file exists relative to project root
 */
function projectFileExists(relPath) {
  return fs.existsSync(path.join(PROJECT_ROOT, relPath));
}

/**
 * Get file stats
 */
function getFileStats(relPath) {
  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.statSync(fullPath);
}

/**
 * Lightweight in-memory DOM simulation for verifying client-side scripts
 * (Bypass snippets, MutationObserver, timezone selection, form validation).
 */
class MockDOMElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.style = {
      _styles: {},
      setProperty(prop, val, priority = '') {
        this._styles[prop] = { val, priority };
        this[prop] = val;
      },
      removeProperty(prop) {
        delete this._styles[prop];
        delete this[prop];
      },
      getPropertyValue(prop) {
        return this._styles[prop] ? this._styles[prop].val : (this[prop] || '');
      }
    };
    this.classList = {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); },
      toString() { return Array.from(this._classes).join(' '); }
    };
    this.value = '';
    this.innerText = '';
    this.textContent = '';
    this.id = '';
    this.className = '';
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

  removeAttribute(name) {
    delete this.attributes[name];
    if (name === 'id') this.id = '';
    if (name === 'class') {
      this.className = '';
      this.classList._classes.clear();
    }
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
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
      if (matchesSelector(el, selector)) results.push(el);
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

function matchesSelector(el, selector) {
  selector = selector.trim();
  // Compound class selector e.g. .wizard-window-wrapper.-school
  if (selector.startsWith('.') && selector.includes('.-')) {
    const parts = selector.split('.').filter(Boolean);
    return parts.every(p => el.classList.contains(p));
  }
  // Simple class selector
  if (selector.startsWith('.')) {
    const cls = selector.slice(1);
    return el.classList.contains(cls);
  }
  // ID selector
  if (selector.startsWith('#')) {
    return el.id === selector.slice(1);
  }
  // Attribute selector contains e.g. [class*="wizard-"]
  if (selector.startsWith('[') && selector.includes('*="')) {
    const m = selector.match(/\[([a-zA-Z0-9_-]+)\*="([^"]+)"\]/);
    if (m) {
      const attrVal = el.getAttribute(m[1]) || '';
      return attrVal.includes(m[2]);
    }
  }
  // Tag selector
  if (/^[a-zA-Z0-9]+$/.test(selector)) {
    return el.tagName.toLowerCase() === selector.toLowerCase();
  }
  return false;
}

class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
    MockMutationObserver.instances.push(this);
  }
  observe(target, options) {
    this.target = target;
    this.options = options;
  }
  disconnect() {
    const idx = MockMutationObserver.instances.indexOf(this);
    if (idx !== -1) MockMutationObserver.instances.splice(idx, 1);
  }
  trigger() {
    if (this.callback) this.callback([], this);
  }
}
MockMutationObserver.instances = [];

/**
 * Create a fresh simulated browser environment
 */
function createMockEnvironment() {
  MockMutationObserver.instances = [];
  const document = {
    documentElement: new MockDOMElement('html'),
    body: new MockDOMElement('body'),
    createElement(tag) { return new MockDOMElement(tag); },
    querySelectorAll(sel) {
      const results = [];
      if (matchesSelector(this.documentElement, sel)) results.push(this.documentElement);
      if (matchesSelector(this.body, sel)) results.push(this.body);
      results.push(...this.body.querySelectorAll(sel));
      return results;
    },
    querySelector(sel) {
      const res = this.querySelectorAll(sel);
      return res.length > 0 ? res[0] : null;
    }
  };
  document.documentElement.appendChild(document.body);

  const window = {
    document,
    MutationObserver: MockMutationObserver,
    location: { pathname: '/classes' },
    console: {
      logs: [],
      log(...args) { this.logs.push(args.join(' ')); },
      warn(...args) { this.logs.push(args.join(' ')); },
      error(...args) { this.logs.push(args.join(' ')); }
    }
  };

  return { window, document, MockMutationObserver };
}

/**
 * Validate RFC 5545 iCalendar format
 */
function validateRFC5545(icsString) {
  const errors = [];
  if (typeof icsString !== 'string' || !icsString.trim()) {
    return { valid: false, errors: ['Empty or non-string iCalendar content'] };
  }

  const lines = icsString.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  if (!lines[0] || lines[0] !== 'BEGIN:VCALENDAR') {
    errors.push('Does not start with BEGIN:VCALENDAR');
  }
  if (!lines.includes('END:VCALENDAR')) {
    errors.push('Missing END:VCALENDAR');
  }
  if (!lines.some(l => l.startsWith('VERSION:2.0'))) {
    errors.push('Missing or invalid VERSION:2.0');
  }

  // Count VEVENT components
  const eventBegins = lines.filter(l => l === 'BEGIN:VEVENT').length;
  const eventEnds = lines.filter(l => l === 'END:VEVENT').length;

  if (eventBegins === 0) {
    errors.push('No VEVENT components found');
  }
  if (eventBegins !== eventEnds) {
    errors.push(`Mismatched VEVENT count: ${eventBegins} BEGIN vs ${eventEnds} END`);
  }

  // Check required properties inside events
  let inEvent = false;
  let currentEventProps = new Set();
  const utcRegex = /^\d{8}T\d{6}Z$/;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEventProps.clear();
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      const required = ['UID', 'DTSTART', 'DTEND', 'SUMMARY'];
      for (const req of required) {
        if (!currentEventProps.has(req)) {
          errors.push(`VEVENT missing required property: ${req}`);
        }
      }
      continue;
    }
    if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).split(';')[0];
        const val = line.slice(colonIdx + 1);
        currentEventProps.add(key);
        if ((key === 'DTSTART' || key === 'DTEND') && val.endsWith('Z')) {
          if (!utcRegex.test(val)) {
            errors.push(`Invalid UTC datetime format: ${val}`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    eventCount: eventBegins,
    errors
  };
}

/**
 * Execute serverless function (e.g. api/event.js) with mock request & response
 */
async function mockServerlessRequest(handler, { method = 'POST', body = {}, query = {}, headers = {} }) {
  return new Promise((resolve) => {
    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = null;

    const req = {
      method,
      body,
      query,
      headers
    };

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(name, val) {
        responseHeaders[name] = val;
        return this;
      },
      json(data) {
        responseBody = data;
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: responseBody
        });
      },
      send(data) {
        responseBody = data;
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: responseBody
        });
      },
      end() {
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: responseBody
        });
      }
    };

    try {
      const result = handler(req, res);
      if (result && typeof result.then === 'function') {
        result.catch((err) => {
          resolve({
            status: 500,
            headers: responseHeaders,
            body: { error: err.message }
          });
        });
      }
    } catch (err) {
      resolve({
        status: 500,
        headers: responseHeaders,
        body: { error: err.message }
      });
    }
  });
}

/**
 * Verify JavaScript syntax using Node VM
 */
function verifyJsSyntax(code) {
  try {
    new vm.Script(code);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  PROJECT_ROOT,
  readProjectFile,
  projectFileExists,
  getFileStats,
  createMockEnvironment,
  validateRFC5545,
  mockServerlessRequest,
  verifyJsSyntax
};
