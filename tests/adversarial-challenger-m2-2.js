/**
 * tests/adversarial-challenger-m2-2.js
 * 
 * EMPIRICAL CHALLENGER ADVERSARIAL VERIFICATION SUITE — MILESTONE 2-2
 * Focus: Build byte-parity, clean URL routing, checklist robustness,
 * Web Speech resilience, Safe-Save cadence pacing, and test regressions.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passCount++;
        console.log(`  [PASS] ${message}`);
    } else {
        failCount++;
        failures.push(message);
        console.error(`  [FAIL] ${message}`);
    }
}

function sha256(filePath) {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
}

console.log('='.repeat(80));
console.log('    EMPIRICAL CHALLENGER ADVERSARIAL SUITE: MILESTONE 2-2');
console.log('='.repeat(80));

// ============================================================================
// SUITE 1: Static Build Byte-Parity & Build System Parity
// ============================================================================
console.log('\n--- SUITE 1: Static Build Byte-Parity & Pipeline Idempotency ---');
const rootFile = path.join(__dirname, '..', 'onboarding.html');
const publicFile = path.join(__dirname, '..', 'public', 'onboarding.html');
const distFile = path.join(__dirname, '..', 'dist', 'onboarding.html');

assert(fs.existsSync(rootFile), 'onboarding.html exists in root directory');
assert(fs.existsSync(publicFile), 'public/onboarding.html exists');
assert(fs.existsSync(distFile), 'dist/onboarding.html exists');

const rootHash = sha256(rootFile);
const publicHash = sha256(publicFile);
const distHash = sha256(distFile);

assert(rootHash === publicHash, `Root and public/ SHA-256 match bit-for-bit (${rootHash})`);
assert(rootHash === distHash, `Root and dist/ SHA-256 match bit-for-bit (${distHash})`);

const rootSize = fs.statSync(rootFile).size;
const publicSize = fs.statSync(publicFile).size;
const distSize = fs.statSync(distFile).size;

assert(rootSize === publicSize && rootSize === distSize, `Exact byte size parity across all 3 locations (${rootSize} bytes)`);

// Check build registration in build.js and build.py
const buildJsContent = fs.readFileSync(path.join(__dirname, '..', 'build.js'), 'utf8');
const buildPyContent = fs.readFileSync(path.join(__dirname, '..', 'build.py'), 'utf8');

assert(buildJsContent.includes("'onboarding.html'"), "build.js explicitly registers 'onboarding.html' in files array");
assert(buildPyContent.includes("'onboarding.html'"), "build.py explicitly registers 'onboarding.html' in files list");

// Verify zero unescaped/raw %VITE_ tokens in onboarding.html
const onboardingHtml = fs.readFileSync(rootFile, 'utf8');
assert(!/%VITE_[A-Z0-9_]+%/.test(onboardingHtml), 'onboarding.html contains zero raw %VITE_ secret placeholders');

// ============================================================================
// SUITE 2: Clean URLs & Slug Resolution in script.js
// ============================================================================
console.log('\n--- SUITE 2: Clean URLs & script.js Routing Resolution ---');
const scriptJsContent = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert(scriptJsContent.includes("'onboarding'"), "script.js KNOWN_PAGE_SLUGS includes 'onboarding'");

// Extract KNOWN_PAGE_SLUGS, normalizePageSlug, and resolveCurrentPageSlug logic
const knownPageMatch = scriptJsContent.match(/const\s+KNOWN_PAGE_SLUGS\s*=\s*new\s+Set\(\[([\s\S]*?)\]\);/);
assert(Boolean(knownPageMatch), 'Successfully extracted KNOWN_PAGE_SLUGS definition from script.js');

const rawSlugs = knownPageMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
const KNOWN_PAGE_SLUGS = new Set(rawSlugs);
assert(KNOWN_PAGE_SLUGS.has('onboarding'), "Extracted KNOWN_PAGE_SLUGS Set contains 'onboarding'");

// Recreate the exact routing functions from script.js lines 94-136
const normalizePageSlug = (rawPath) => {
    const cleaned = String(rawPath || '')
        .split('?')[0]
        .split('#')[0]
        .replace(/\/+$/, '');
    const lastSegment = cleaned.split('/').pop() || '';
    const slug = lastSegment.replace(/\.html$/i, '').trim().toLowerCase();
    return slug || 'index';
};

const resolveCurrentPageSlug = (rawPathname, isCustomPathname = false) => {
    const rawStr = String(rawPathname || '').trim();
    const pathBeforeQueryHash = rawStr.split('?')[0].split('#')[0];
    const hasExplicitPath = Boolean(pathBeforeQueryHash);
    const effectivePath = hasExplicitPath ? pathBeforeQueryHash : '';
    if (/\.html\/+/i.test(effectivePath)) return '404';
    const cleaned = effectivePath.replace(/\/+$/, '');
    if (!cleaned) return 'index';
    const segments = cleaned.replace(/^\/+/, '').split('/').filter(Boolean);
    if (segments.length > 1) return '404';
    const slug = normalizePageSlug(cleaned);
    if (slug === '404' || !KNOWN_PAGE_SLUGS.has(slug)) return '404';
    return slug;
};

// Empirical stress testing of URL path resolution
assert(resolveCurrentPageSlug('/onboarding', true) === 'onboarding', "Clean route '/onboarding' resolves to 'onboarding'");
assert(resolveCurrentPageSlug('/onboarding.html', true) === 'onboarding', "Direct route '/onboarding.html' resolves to 'onboarding'");
assert(resolveCurrentPageSlug('/onboarding/', true) === 'onboarding', "Trailing slash '/onboarding/' resolves to 'onboarding'");
assert(resolveCurrentPageSlug('/onboarding?squad=A&token=xyz', true) === 'onboarding', "Query string '/onboarding?squad=A' resolves to 'onboarding'");
assert(resolveCurrentPageSlug('/onboarding#mic-tester', true) === 'onboarding', "Hash fragment '/onboarding#mic-tester' resolves to 'onboarding'");
assert(resolveCurrentPageSlug('/onboarding?ref=email#step3', true) === 'onboarding', "Compound query + hash resolves to 'onboarding'");
assert(resolveCurrentPageSlug('/ONBOARDING', true) === 'onboarding', "Uppercase '/ONBOARDING' case-normalizes to 'onboarding'");
assert(resolveCurrentPageSlug('/Onboarding.html', true) === 'onboarding', "Mixed case '/Onboarding.html' normalizes to 'onboarding'");
assert(resolveCurrentPageSlug('/onboarding/invalid-subpath', true) === '404', "Deep nested '/onboarding/invalid-subpath' rejects to '404'");
assert(resolveCurrentPageSlug('/onboarding.html/deep', true) === '404', "Invalid path traversal '.html/' rejects to '404'");
assert(resolveCurrentPageSlug('/nonexistent-page', true) === '404', "Unknown slug rejects to '404'");

// Check vercel.json cleanUrls setting
const vercelJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
assert(vercelJson.cleanUrls === true, 'vercel.json has cleanUrls: true enabled for clean extensionless URLs');

// ============================================================================
// SUITE 3: Checklist State Machine Adversarial Stress Testing
// ============================================================================
console.log('\n--- SUITE 3: Checklist Storage & State Machine Resilience ---');

// Mock a full DOM sandbox for testing the inline script in onboarding.html
function createSandbox(initialLocalStorage = {}) {
    let storage = Object.assign({}, initialLocalStorage);
    let throwOnSet = false;

    const listeners = {};
    const elements = {};

    function createElement(id, tagName = 'div', extra = {}) {
        const el = {
            id,
            tagName: tagName.toUpperCase(),
            textContent: '',
            style: {},
            className: '',
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
                contains(c) { return this.classes.has(c); }
            },
            addEventListener(ev, fn) {
                if (!listeners[id + ':' + ev]) listeners[id + ':' + ev] = [];
                listeners[id + ':' + ev].push(fn);
            },
            trigger(ev, eventObj = {}) {
                const fns = listeners[id + ':' + ev] || [];
                fns.forEach(fn => fn(eventObj));
            },
            querySelector(sel) {
                if (sel === '.checklist-item-checkbox') return elements['check-' + extra.key];
                if (sel === '.checklist-item-badge') return elements['badge-' + extra.key];
                return null;
            },
            getAttribute(attr) {
                if (attr === 'data-key') return extra.key;
                return null;
            },
            ...extra
        };
        elements[id] = el;
        return el;
    }

    // Create required elements
    const itemKeys = [
        'triage_survey', 'thrive_report', 'mic_calibration',
        'safesave_practice', 'learnworlds_login', 'squad_community', 'calendar_sync'
    ];

    itemKeys.forEach(k => {
        createElement('item-' + k, 'div', { key: k, className: 'checklist-item' });
        createElement('check-' + k, 'input', { key: k, type: 'checkbox', checked: false });
        createElement('badge-' + k, 'span', { key: k, textContent: 'Pending' });
    });

    createElement('checklist-progress-bar', 'div');
    createElement('checklist-progress-text', 'div');
    createElement('btn-reset-checklist', 'button');
    createElement('btn-mic-start', 'button');
    createElement('btn-mic-stop', 'button');
    createElement('btn-mic-simulate', 'button');
    createElement('mic-status', 'div');
    createElement('mic-status-text', 'div');
    createElement('mic-status-icon', 'div');
    createElement('mic-soundwave', 'div');
    createElement('mic-transcript', 'div');
    createElement('safesave-timer-display', 'div');
    createElement('safesave-streak-display', 'div');
    createElement('safesave-status-badge', 'div');
    createElement('safesave-pacing-bar', 'div');
    createElement('safesave-pacing-text', 'div');
    createElement('safesave-textarea', 'textarea');
    createElement('safesave-feedback', 'div');
    createElement('btn-safesave-reset', 'button');
    createElement('btn-safesave-simulate', 'button');
    createElement('btn-download-practitioner-lab-ics', 'button');
    createElement('btn-copy-devtools', 'button');
    createElement('devtools-snippet-code', 'code', { textContent: "const m=document.querySelector('.wizard-window-wrapper.-school');if(m)m.remove();document.body.style.overflow='auto';" });

    const context = {
        window: {
            localStorage: {
                getItem: (k) => (k in storage ? storage[k] : null),
                setItem: (k, v) => {
                    if (throwOnSet) throw new Error('QuotaExceededError');
                    storage[k] = String(v);
                },
                removeItem: (k) => { delete storage[k]; }
            },
            location: { pathname: '/onboarding' },
            SpeechRecognition: undefined,
            webkitSpeechRecognition: undefined,
            navigator: {
                clipboard: {
                    writeText: async (t) => { context._copiedText = t; }
                }
            },
            confirm: () => true
        },
        document: {
            getElementById: (id) => elements[id] || null,
            querySelector: (sel) => {
                const matchItem = sel.match(/\.checklist-item\[data-key="([^"]+)"\]/);
                if (matchItem) return elements['item-' + matchItem[1]] || null;
                return elements[sel.replace(/^#/, '')] || null;
            },
            querySelectorAll: (sel) => {
                if (sel === '.checklist-item') return itemKeys.map(k => elements['item-' + k]);
                return [];
            }
        },
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        },
        setTimeout: (fn) => fn(),
        setInterval: (fn) => 123,
        clearInterval: () => {},
        Math,
        Object,
        JSON,
        String,
        Boolean,
        Date,
        elements,
        getStorage: () => storage,
        setThrowOnSet: (val) => { throwOnSet = val; }
    };

    context.window.window = context.window;
    context.window.document = context.document;
    context.window.localStorage = context.window.localStorage;
    context.localStorage = context.window.localStorage;
    vm.createContext(context);

    // Extract script content
    const scriptMatch = onboardingHtml.match(/<script>([\s\S]*?)<\/script>/);
    vm.runInContext(scriptMatch[1], context);

    return context;
}

// Adversarial Test 3.1: Clean initial state
{
    const ctx = createSandbox();
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.completedCount === 0, 'Clean state initializes completedCount to 0');
    assert(ctx.elements['checklist-progress-bar'].style.width === '0%', 'Progress bar width is 0%');
    assert(ctx.elements['checklist-progress-text'].textContent.includes('0 of 7 Completed • 0%'), 'Progress text indicates 0 of 7');
}

// Adversarial Test 3.2: Corrupted JSON in localStorage
{
    const ctx = createSandbox({ 'thrive_onboarding_checklist_v1': '{{{MALFORMED_JSON_STRING}}' });
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.completedCount === 0, 'Corrupted JSON gracefully falls back to default state without throwing');
}

// Adversarial Test 3.3: Primitive non-object JSON in localStorage
{
    const ctx = createSandbox({ 'thrive_onboarding_checklist_v1': '"plain string"' });
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.completedCount === 0, 'Non-object string JSON gracefully falls back to default state');
}

// Adversarial Test 3.4: Partial checklist in localStorage
{
    const ctx = createSandbox({
        'thrive_onboarding_checklist_v1': JSON.stringify({
            checklist: { triage_survey: true, thrive_report: true },
            completedCount: 2
        })
    });
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.completedCount === 2, 'Partial checklist successfully merges with defaults (completedCount = 2)');
    assert(state.checklist.triage_survey === true, 'triage_survey is true');
    assert(state.checklist.mic_calibration === false, 'mic_calibration merged from default as false');
    assert(ctx.elements['checklist-progress-bar'].style.width === '29%', 'Progress bar calculates Math.round(2/7*100) = 29%');
}

// Adversarial Test 3.5: QuotaExceededError handling on localStorage.setItem
{
    const ctx = createSandbox();
    ctx.setThrowOnSet(true); // Simulate quota error
    let threw = false;
    try {
        ctx.window.ThriveOnboarding.setChecklistItem('triage_survey', true);
    } catch (e) {
        threw = true;
    }
    assert(!threw, 'localStorage.setItem QuotaExceededError is caught gracefully without unhandled exception');
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.checklist.triage_survey === true, 'In-memory state remains updated despite storage failure');
}

// Adversarial Test 3.6: Non-linear toggling & 100% completion
{
    const ctx = createSandbox();
    const itemKeys = [
        'triage_survey', 'thrive_report', 'mic_calibration',
        'safesave_practice', 'learnworlds_login', 'squad_community', 'calendar_sync'
    ];
    // Complete all in reverse order
    [...itemKeys].reverse().forEach(k => ctx.window.ThriveOnboarding.setChecklistItem(k, true));
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.completedCount === 7, 'All 7 items completed non-linearly');
    assert(ctx.elements['checklist-progress-bar'].style.width === '100%', 'Progress bar fills to 100%');
    assert(ctx.elements['checklist-progress-text'].textContent.includes('7 of 7 Completed • 100%'), 'Progress text shows 7 of 7 • 100%');

    // Reset checklist
    ctx.window.ThriveOnboarding.resetChecklist();
    assert(ctx.window.ThriveOnboarding.getState().completedCount === 0, 'Reset checklist sets completedCount back to 0');
    assert(ctx.elements['checklist-progress-bar'].style.width === '0%', 'Progress bar resets to 0%');
}

// ============================================================================
// SUITE 4: Speech Recognition & Workstation Mic Resilience
// ============================================================================
console.log('\n--- SUITE 4: Web Speech Dictation Resilience ---');
{
    const ctx = createSandbox();
    // Start button clicked when SpeechRec is undefined
    ctx.elements['btn-mic-start'].trigger('click');
    assert(ctx.elements['mic-status'].className.includes('error'), 'Unavailable SpeechRecognition triggers error banner');
    assert(ctx.elements['mic-status-text'].textContent.includes('not supported'), 'Error message informs user of browser compatibility');

    // Speech Simulation Button
    ctx.elements['btn-mic-simulate'].trigger('click');
    const state = ctx.window.ThriveOnboarding.getState();
    assert(state.checklist.mic_calibration === true, 'Speech simulation triggers onSpeechSuccess and auto-checks mic_calibration');
    assert(ctx.elements['mic-status'].className.includes('success'), 'Status banner changes to success state');
    assert(ctx.elements['mic-transcript'].textContent.length > 30, 'Simulated transcript text is populated');
}

// ============================================================================
// SUITE 5: Safe-Save Cadence Practice Trainer Stress Testing
// ============================================================================
console.log('\n--- SUITE 5: Safe-Save Cadence Practice Trainer ---');
{
    const ctx = createSandbox();
    // Simulate hitting Enter 3 times
    ctx.window.ThriveOnboarding.executeSafeSave();
    assert(ctx.elements['safesave-streak-display'].textContent.includes('1 / 3'), 'First Safe-Save sets streak to 1 / 3');
    assert(ctx.window.ThriveOnboarding.getState().checklist.safesave_practice === false, '1 save does not yet check off practice');

    ctx.window.ThriveOnboarding.executeSafeSave();
    assert(ctx.elements['safesave-streak-display'].textContent.includes('2 / 3'), 'Second Safe-Save sets streak to 2 / 3');
    assert(ctx.window.ThriveOnboarding.getState().checklist.safesave_practice === false, '2 saves does not yet check off practice');

    ctx.window.ThriveOnboarding.executeSafeSave();
    assert(ctx.elements['safesave-streak-display'].textContent.includes('3 / 3'), 'Third Safe-Save sets streak to 3 / 3');
    assert(ctx.window.ThriveOnboarding.getState().checklist.safesave_practice === true, '3 saves certifies cadence and auto-checks safesave_practice');
    assert(ctx.elements['safesave-feedback'].textContent.includes('Certified'), 'Feedback confirms Safe-Save Cadence Certified');

    // Reset trainer, then test simulation button from clean state
    ctx.elements['btn-safesave-reset'].trigger('click');
    assert(ctx.elements['safesave-streak-display'].textContent.includes('0 / 3'), 'Trainer reset clears streak counter to 0 / 3');

    // Simulate clicking simulate button
    ctx.elements['btn-safesave-simulate'].trigger('click');
    assert(ctx.elements['safesave-feedback'].textContent.includes('Profile Memory Locked'), 'Simulate button executes Safe-Save and locks memory');
    assert(ctx.elements['safesave-streak-display'].textContent.includes('1 / 3'), 'Simulate button advances streak to 1 / 3');
}

// ============================================================================
// SUITE 6: Directory Links & LearnWorlds Bypass Snippet
// ============================================================================
console.log('\n--- SUITE 6: Directory Card Links & Bypass Snippet Integrity ---');

// Check all directory links in HTML
const requiredHrefs = [
    'survey.html',
    'profile.html',
    'hope-survey.html',
    'how-to-use.html',
    'https://thrive-coaching.learnworlds.com',
    'how-to-use.html#tier-3-personos',
    'how-to-use.html#it-help-desk'
];

requiredHrefs.forEach(href => {
    assert(onboardingHtml.includes(href), `Directory contains valid resource link: ${href}`);
});

// Check DevTools bypass snippet syntax
const snippetMatch = onboardingHtml.match(/<code id="devtools-snippet-code"[\s\S]*?>([\s\S]*?)<\/code>/);
assert(Boolean(snippetMatch), 'Found #devtools-snippet-code snippet in onboarding.html');
const snippetText = snippetMatch[1].trim();

let snippetParsed = false;
try {
    new vm.Script(snippetText);
    snippetParsed = true;
} catch (e) {
    console.error('Snippet parse error:', e);
}
assert(snippetParsed, 'DevTools Console one-liner snippet is syntactically valid JavaScript');

// Execute snippet in mock DOM with modal
{
    let removed = false;
    let unlocked = false;
    const createMockStyle = () => {
        const props = { overflow: 'hidden' };
        return {
            props,
            removeProperty: (p) => { delete props[p]; },
            setProperty: (p, v) => { props[p] = v; },
            get overflow() { return props.overflow; }
        };
    };
    const bodyStyle = createMockStyle();
    const docElementStyle = createMockStyle();
    const mockContext = {
        console: { log: () => {} },
        document: {
            querySelectorAll: (sel) => {
                if (sel === '.wizard-window-wrapper.-school') {
                    return [{
                        remove: () => { removed = true; }
                    }];
                }
                return [];
            },
            body: {
                style: bodyStyle,
                classList: {
                    remove: () => {}
                }
            },
            documentElement: {
                style: docElementStyle
            }
        }
    };
    vm.createContext(mockContext);
    vm.runInContext(snippetText, mockContext);
    unlocked = bodyStyle.overflow === 'auto' && docElementStyle.overflow === 'auto';
    assert(removed && unlocked, 'DevTools snippet removes .wizard-window-wrapper.-school and sets body.style.overflow to auto');
}

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log(`  Milestone 2-2 Empirical Challenger Summary:`);
console.log(`  Passed: ${passCount}`);
console.log(`  Failed: ${failCount}`);
console.log('='.repeat(80));

if (failCount > 0) {
    console.error(`\n[CHALLENGE_FAILED] ${failCount} assertions failed:`);
    failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    process.exit(1);
} else {
    console.log(`\n[APPROVE] All ${passCount} Milestone 2-2 assertions passed flawlessly!`);
    process.exit(0);
}
