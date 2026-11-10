/**
 * tests/adversarial-challenger-m3.js
 * Empirical Challenger Adversarial Test Suite for Milestone 3:
 * Practitioner Guide, 3-Tier Clinical Ecosystem, LearnWorlds Squad Walkthrough & IT Help Desk Portal.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { PROJECT_ROOT, mockServerlessRequest } = require('./helpers');
const eventHandler = require('../api/event');

console.log('================================================================================');
console.log('       EMPIRICAL CHALLENGER ADVERSARIAL SUITE: MILESTONE 3');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        fn();
        passCount++;
        console.log(`  [PASS] ${name}`);
    } catch (err) {
        failCount++;
        console.error(`  [FAIL] ${name}: ${err.message}`);
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        passCount++;
        console.log(`  [PASS] ${name}`);
    } catch (err) {
        failCount++;
        console.error(`  [FAIL] ${name}: ${err.message}`);
    }
}

async function run() {
    // -------------------------------------------------------------------------
    // SUITE 1: File Presence & Build Pipeline Synchronization
    // -------------------------------------------------------------------------
    console.log('--- SUITE 1: Build Output Parity & Secret Hygiene ---');

    const rootPath = path.join(PROJECT_ROOT, 'how-to-use.html');
    const pubPath = path.join(PROJECT_ROOT, 'public', 'how-to-use.html');
    const distPath = path.join(PROJECT_ROOT, 'dist', 'how-to-use.html');

    test('how-to-use.html exists in root directory', () => {
        assert(fs.existsSync(rootPath), 'how-to-use.html missing in root');
    });

    test('public/how-to-use.html exists after build', () => {
        assert(fs.existsSync(pubPath), 'public/how-to-use.html missing');
    });

    test('dist/how-to-use.html exists after build', () => {
        assert(fs.existsSync(distPath), 'dist/how-to-use.html missing');
    });

    const rootContent = fs.readFileSync(rootPath, 'utf8');
    const pubContent = fs.readFileSync(pubPath, 'utf8');
    const distContent = fs.readFileSync(distPath, 'utf8');

    test('Root and public/how-to-use.html match byte-for-byte', () => {
        assert.strictEqual(rootContent, pubContent, 'public/how-to-use.html out of sync with root');
    });

    test('Root and dist/how-to-use.html match byte-for-byte', () => {
        assert.strictEqual(rootContent, distContent, 'dist/how-to-use.html out of sync with root');
    });

    test('how-to-use.html contains zero raw %VITE_ placeholder tokens', () => {
        assert(!rootContent.includes('%VITE_'), 'Contains raw %VITE_ token');
    });

    test('how-to-use.html contains zero raw private API keys', () => {
        assert(!rootContent.includes('sk_live_'), 'Contains sk_live_ key');
        assert(!rootContent.includes('sk_test_'), 'Contains sk_test_ key');
        assert(!rootContent.includes('AIzaSy'), 'Contains Google API key');
    });

    // -------------------------------------------------------------------------
    // SUITE 2: 3-Tier Clinical Ecosystem Visual Architecture
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 2: 3-Tier Clinical Ecosystem Architecture ---');

    test('Hero headline declares 3-Tier Clinical Ecosystem', () => {
        assert(rootContent.includes('The 3-Tier <span class="highlight">Clinical Ecosystem</span>'), 'Missing hero headline');
    });

    test('Mentions 167 hours clinical bottleneck in hero subtitle', () => {
        assert(rootContent.includes('167 hours'), 'Missing 167 hours reference');
    });

    test('Tier 1 card documents thrivecoaching.ai as The Front Door with diagnostic intake', () => {
        assert(rootContent.includes('Tier 01 • The Front Door'), 'Missing Tier 1 tag');
        assert(rootContent.includes('thrivecoaching.ai'), 'Missing thrivecoaching.ai reference');
        assert(rootContent.includes('Flow Survey Triage'), 'Missing Flow Survey reference');
        assert(rootContent.includes('6-Pillar THRiVE Report'), 'Missing THRiVE Report reference');
        assert(rootContent.includes('HoPE Index Diagnostic'), 'Missing HoPE Index reference');
        assert(rootContent.includes('1-Click Clinical Dossier Export'), 'Missing Clinical Dossier reference');
    });

    test('Tier 2 card documents LearnWorlds LMS as The Classroom with 7 modules and Squads A/B/C', () => {
        assert(rootContent.includes('Tier 02 • The Classroom'), 'Missing Tier 2 tag');
        assert(rootContent.includes('https://thrive-coaching.learnworlds.com'), 'Missing LearnWorlds LMS URL');
        assert(rootContent.includes('7-Module Master Curriculum'), 'Missing 7-module curriculum reference');
        assert(rootContent.includes('3 Private Squads of 7'), 'Missing 3 Squads of 7 reference');
        assert(rootContent.includes('Squad A (1–7)'), 'Missing Squad A reference');
        assert(rootContent.includes('Squad B (8–14)'), 'Missing Squad B reference');
        assert(rootContent.includes('Squad C (15–21)'), 'Missing Squad C reference');
        assert(rootContent.includes('Review Center Submissions'), 'Missing Review Center reference');
    });

    test('Tier 3 card has id="tier-3-personos" and documents Personos AI execution engine', () => {
        assert(rootContent.includes('id="tier-3-personos"'), 'Missing id="tier-3-personos"');
        assert(rootContent.includes('Tier 03 • The Engine'), 'Missing Tier 3 tag');
        assert(rootContent.includes('Personos AI'), 'Missing Personos AI reference');
        assert(rootContent.includes('Safe-Save Cadence'), 'Missing Safe-Save reference');
        assert(rootContent.includes('Strict 3–5 Quota'), 'Missing 3-5 quota reference');
        assert(rootContent.includes('G.A.P.S. Custom Lenses'), 'Missing G.A.P.S. reference');
        assert(rootContent.includes('Automated DAP Notes'), 'Missing DAP notes reference');
        assert(rootContent.includes('$9/Mo Seats'), 'Missing $9/mo seats reference');
    });

    // -------------------------------------------------------------------------
    // SUITE 3: LearnWorlds & Review Center Walkthrough & DevTools Bypass
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 3: LearnWorlds Walkthrough & Modal Bypass Snippet ---');

    test('Walkthrough contains 4 clear operational steps', () => {
        assert(rootContent.includes('Step 01') && rootContent.includes('Sign In to LearnWorlds'), 'Missing Step 1');
        assert(rootContent.includes('Step 02') && rootContent.includes('Access Your Squad Space'), 'Missing Step 2');
        assert(rootContent.includes('Step 03') && rootContent.includes('Submit to Review Center'), 'Missing Step 3');
        assert(rootContent.includes('Step 04') && rootContent.includes('Bypass Setup Overlays'), 'Missing Step 4');
    });

    test('Walkthrough references Community -> 5 to THRiVE Practitioner Lab — Squads', () => {
        assert(rootContent.includes('5 to THRiVE Practitioner Lab — Squads'), 'Missing Squads community reference');
    });

    test('Walkthrough provides #devtools-snippet-code snippet element', () => {
        assert(rootContent.includes('id="devtools-snippet-code"'), 'Missing #devtools-snippet-code');
    });

    test('Bypass snippet targets .wizard-window-wrapper.-school and resets overflow', () => {
        const snippetMatch = rootContent.match(/<code id="devtools-snippet-code"[^>]*>([\s\S]*?)<\/code>/);
        assert(snippetMatch, 'Unable to extract snippet');
        const code = snippetMatch[1];
        assert(code.includes('.wizard-window-wrapper'), 'Missing .wizard-window-wrapper');
        assert(code.includes('.wizard-window-wrapper.-school'), 'Missing .wizard-window-wrapper.-school');
        assert(code.includes('overflow'), 'Missing overflow reset');
        assert(code.includes('auto'), 'Missing auto scroll property');

        // Check JS validity
        let validJs = false;
        try {
            new vm.Script(code);
            validJs = true;
        } catch (e) {
            console.error('Snippet parse error:', e.message);
        }
        assert(validJs, 'DevTools snippet is valid executable JavaScript');
    });

    test('1-click copy button #btn-copy-devtools exists in DOM', () => {
        assert(rootContent.includes('id="btn-copy-devtools"'), 'Missing #btn-copy-devtools');
    });

    test('Troubleshooting manual link points to docs/learnworlds-troubleshooting.md', () => {
        assert(rootContent.includes('docs/learnworlds-troubleshooting.md'), 'Missing troubleshooting docs link');
    });

    // -------------------------------------------------------------------------
    // SUITE 4: IT Help Desk & Tech Clinic Support Portal
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 4: IT Help Desk & Tech Clinic Portal ---');

    test('Section has id="it-help-desk"', () => {
        assert(rootContent.includes('id="it-help-desk"'), 'Missing id="it-help-desk"');
    });

    test('Form has id="it-helpdesk-form"', () => {
        assert(rootContent.includes('id="it-helpdesk-form"'), 'Missing id="it-helpdesk-form"');
    });

    test('Details Session 0 Weekend Tech Clinic hours (Nov 28–29) hosted by Gerard', () => {
        assert(rootContent.includes('Session 0 Weekend Drop-In Tech Clinics'), 'Missing Tech Clinic header');
        assert(rootContent.includes('Saturday, Nov 28, 2026'), 'Missing Saturday clinic date');
        assert(rootContent.includes('Sunday, Nov 29, 2026'), 'Missing Sunday clinic date');
        assert(rootContent.includes('Gerard Rick Jardin'), 'Missing Gerard reference');
    });

    test('Form inputs contain all required semantic IDs', () => {
        const requiredIds = [
            'it-fn', 'it-ln', 'it-em', 'it-ph', 'it-squad', 'it-urg', 'it-cat', 'it-msg', 'it-submit-btn', 'it-status'
        ];
        requiredIds.forEach(id => {
            assert(rootContent.includes(`id="${id}"`), `Missing required element id="${id}"`);
        });
    });

    test('Squad dropdown includes Squads A, B, C and Waitlist', () => {
        assert(rootContent.includes('Squad A (Seats 1–7)'), 'Missing Squad A option');
        assert(rootContent.includes('Squad B (Seats 8–14)'), 'Missing Squad B option');
        assert(rootContent.includes('Squad C (Seats 15–21)'), 'Missing Squad C option');
        assert(rootContent.includes('Not Yet Assigned / Waitlist'), 'Missing Waitlist option');
    });

    test('Issue Category dropdown includes mic calibration, LearnWorlds login, and Review Center', () => {
        assert(rootContent.includes('Microphone &amp; Voice Dictation Calibration'), 'Missing Mic calibration option');
        assert(rootContent.includes('LearnWorlds Login / White Screen Issue'), 'Missing LMS login option');
        assert(rootContent.includes('Review Center Homework Submission'), 'Missing Review Center option');
    });

    // -------------------------------------------------------------------------
    // SUITE 5: Client-Side Form Validation & Serverless /api/event Contract
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 5: Form Validation Logic & /api/event Integration ---');

    // Extract validation logic from script
    const valMatch = rootContent.match(/function validateHelpDeskInputs\([\s\S]*?return\s*\{[\s\S]*?\};\s*\}/);
    assert(valMatch, 'Found validateHelpDeskInputs function in how-to-use.html');

    let validateInputs;
    eval(valMatch[0] + '; validateInputs = validateHelpDeskInputs;');

    test('Validation rejects empty first name', () => {
        assert.strictEqual(validateInputs('', 'Smith', 'test@test.com', 'Message is long enough').valid, false);
        assert.strictEqual(validateInputs('   ', 'Smith', 'test@test.com', 'Message is long enough').valid, false);
    });

    test('Validation rejects empty last name', () => {
        assert.strictEqual(validateInputs('Jane', '', 'test@test.com', 'Message is long enough').valid, false);
        assert.strictEqual(validateInputs('Jane', '   ', 'test@test.com', 'Message is long enough').valid, false);
    });

    test('Validation rejects invalid email address', () => {
        assert.strictEqual(validateInputs('Jane', 'Smith', '', 'Message is long enough').valid, false);
        assert.strictEqual(validateInputs('Jane', 'Smith', 'invalid-email', 'Message is long enough').valid, false);
    });

    test('Validation rejects message shorter than 10 characters', () => {
        assert.strictEqual(validateInputs('Jane', 'Smith', 'test@test.com', 'Short').valid, false);
        assert.strictEqual(validateInputs('Jane', 'Smith', 'test@test.com', '123456789').valid, false);
        assert.strictEqual(validateInputs('Jane', 'Smith', 'test@test.com', '   12345   ').valid, false);
    });

    test('Validation accepts valid payload boundary (10 chars)', () => {
        assert.strictEqual(validateInputs('Jane', 'Smith', 'test@test.com', '1234567890').valid, true);
    });

    await testAsync('/api/event accepts IT Help Desk payload with type: lead', async () => {
        const payload = {
            type: 'lead',
            data: {
                source: 'it_help_desk_support',
                category: 'Microphone & Voice Dictation Calibration',
                squad: 'Squad A (Seats 1–7)',
                urgency: 'Medium — Needed for Weekend Tech Clinic (Nov 28–29)',
                message: 'Headset microphone not detecting audio on macOS Chrome.',
                label: 'IT Help Desk: [Microphone & Voice Dictation Calibration] - Luke Huff (Squad A (Seats 1–7))'
            },
            lead: {
                fn: 'Luke',
                ln: 'Huff',
                em: 'luke@example.com',
                ph: '720-588-2002',
                org: 'Squad A (Seats 1–7)'
            },
            ts: new Date().toISOString()
        };

        const res = await mockServerlessRequest(eventHandler, { method: 'POST', body: payload });
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.strictEqual(res.body.ok, true, 'Expected { ok: true }');
    });

    await testAsync('/api/event accepts IT Help Desk payload with type: support', async () => {
        const payload = {
            type: 'support',
            data: {
                category: 'LearnWorlds Login / White Screen Issue',
                squad: 'Squad B (Seats 8–14)',
                urgency: 'High — Blocking Live Lab Session',
                message: 'Encountered white screen on author/courses overlay.',
            },
            lead: {
                fn: 'Gerard',
                ln: 'Jardin',
                em: 'gerard@example.com'
            },
            ts: new Date().toISOString()
        };

        const res = await mockServerlessRequest(eventHandler, { method: 'POST', body: payload });
        assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
        assert.strictEqual(res.body.ok, true, 'Expected { ok: true }');
    });

    await testAsync('/api/event safely rejects unauthorized payment and bogus event types', async () => {
        const payRes = await mockServerlessRequest(eventHandler, { method: 'POST', body: { type: 'payment' } });
        assert.strictEqual(payRes.status, 400);

        const bogusRes = await mockServerlessRequest(eventHandler, { method: 'POST', body: { type: 'unsupported_type' } });
        assert.strictEqual(bogusRes.status, 400);

        const getRes = await mockServerlessRequest(eventHandler, { method: 'GET', body: { type: 'lead' } });
        assert.strictEqual(getRes.status, 405);
    });

    // -------------------------------------------------------------------------
    // SUITE 6: Common GAPS Simulation Lab Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 6: Common GAPS Simulation Lab Preservation ---');

    test('Section #common-gaps preserved with correct aria label', () => {
        assert(rootContent.includes('id="common-gaps"'), 'Missing id="common-gaps"');
        assert(rootContent.includes('aria-label="Common GAPS Clinical Simulation"'), 'Missing aria label');
    });

    test('Preserves 3-Step Simulation Instructions', () => {
        assert(rootContent.includes('Step 01') && rootContent.includes('Pick a Common GAP Category'), 'Missing simulation step 1');
        assert(rootContent.includes('Step 02') && rootContent.includes('Click "Copy Scenario"'), 'Missing simulation step 2');
        assert(rootContent.includes('Step 03') && rootContent.includes('Paste Into Personos AI'), 'Missing simulation step 3');
    });

    test('Preserves Category 1: Rebuilding Life Challenges with 4 scenarios link', () => {
        assert(rootContent.includes('href="rebuilding-life-challenges.html"'), 'Missing rebuilding-life link');
        assert(rootContent.includes('4 Scenarios'), 'Missing 4 scenarios count');
        assert(rootContent.includes('1. Emotional Regulation'), 'Missing scenario 1');
        assert(rootContent.includes('2. Finding a Good Job'), 'Missing scenario 2');
        assert(rootContent.includes('3. Peer Pressure'), 'Missing scenario 3');
        assert(rootContent.includes('4. Trust with Staff'), 'Missing scenario 4');
    });

    test('Preserves Category 2: Employment Challenges with 5 scenarios link', () => {
        assert(rootContent.includes('href="employment-challenges.html"'), 'Missing employment link');
        assert(rootContent.includes('5 Scenarios'), 'Missing 5 scenarios count');
        assert(rootContent.includes('1. The Job Hunt'), 'Missing scenario 1');
        assert(rootContent.includes('2. Career Stagnation'), 'Missing scenario 2');
        assert(rootContent.includes('3. Difficult Workplace Dynamics'), 'Missing scenario 3');
        assert(rootContent.includes('4. The Major Career Pivot'), 'Missing scenario 4');
        assert(rootContent.includes('5. Resignation &amp; Departure'), 'Missing scenario 5');
    });

    test('Preserves Master AI Coaching Prompt copy and share buttons', () => {
        assert(rootContent.includes('id="howto-copy-master-prompt-btn"'), 'Missing #howto-copy-master-prompt-btn');
        assert(rootContent.includes('id="howto-share-master-prompt-btn"'), 'Missing #howto-share-master-prompt-btn');
        assert(rootContent.includes('data-share-master-prompt'), 'Missing data-share-master-prompt');
        assert(rootContent.includes('data-dossier-status'), 'Missing data-dossier-status');
    });

    console.log('\n================================================================================');
    console.log(`  EMPIRICAL CHALLENGER SUMMARY: ${passCount} Passed, ${failCount} Failed`);
    console.log('================================================================================');

    if (failCount > 0) {
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
