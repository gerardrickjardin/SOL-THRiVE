/**
 * tests/adversarial-challenger-m1.js
 * Empirical Challenger Verification Suite for Milestone 1:
 * Team Communication Draft & Funnel Alignment (5 to THRiVE Practitioner Lab)
 *
 * Suites:
 * 1. Team Communication Draft Completeness & Accuracy Oracle
 * 2. Exact Parity Oracle between funnel.html and mockup-landing.html (and public/ variants)
 * 3. 5 to THRiVE Practitioner Lab Copy & Pricing Consistency Oracle
 * 4. AST / Syntax & DOM Selector Integrity Oracle
 * 5. End-to-End User State Machine & Form Validation Stress Harness
 * 6. Adversarial Security: XSS Sanitization, Encoding, and Media Integrity
 * 7. Build Pipeline Sync & Secret Leakage Oracle
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const COMM_DOC = path.join(ROOT, 'docs/team-communication-learnworlds-trial.md');
const FUNNEL_PATH = path.join(ROOT, 'funnel.html');
const MOCKUP_PATH = path.join(ROOT, 'mockup-landing.html');
const PUB_FUNNEL = path.join(ROOT, 'public/funnel.html');
const PUB_MOCKUP = path.join(ROOT, 'public/mockup-landing.html');
const DIST_FUNNEL = path.join(ROOT, 'dist/funnel.html');

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
  console.log('     EMPIRICAL CHALLENGER ADVERSARIAL SUITE: MILESTONE 1');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: Team Communication Draft Completeness & Accuracy Oracle
  // ---------------------------------------------------------------------------
  console.log('--- SUITE 1: Team Communication Draft Completeness & Accuracy ---');

  assert('docs/team-communication-learnworlds-trial.md exists on disk', fs.existsSync(COMM_DOC));

  if (fs.existsSync(COMM_DOC)) {
    const doc = fs.readFileSync(COMM_DOC, 'utf8');

    assert('Document specifies LearnWorlds 30-day trial status', doc.includes('30-Day Trial') || doc.includes('30-day trial'));
    assert('Document includes LMS URL thrive-coaching.learnworlds.com', doc.includes('https://thrive-coaching.learnworlds.com'));
    assert('Document specifies trial expiration date (Tuesday, December 8, 2026)', doc.includes('Tuesday, December 8, 2026'));
    assert('Document specifies hard billing deadline (Friday, November 27, 2026)', doc.includes('November 27, 2026'));
    assert('Document specifies cohort launch date (Monday, Nov 30, 2026)', doc.includes('Nov 30') || doc.includes('November 30'));
    assert('Document specifies Session 0 Pre-Flight dates (Nov 28–29, 2026)', doc.includes('Nov 28') && doc.includes('29'));
    assert('Document specifies 21-seat cohort cap across Squads A, B, and C', doc.includes('21') && doc.includes('Squad A') && doc.includes('Squad B') && doc.includes('Squad C'));
    assert('Document specifies 7 seats per squad', doc.includes('7 Seats') || doc.includes('7 seats'));
    assert('Document provides Format A (Slack / Teams ready to send)', doc.includes('## Format A: Crisp Slack / Teams Message'));
    assert('Document provides Format B (Formal Executive Memo)', doc.includes('## Format B: Formal Executive Email Memo'));
    assert('Document outlines clear role assignments for Luke, Steve, and Gerard', doc.includes('Steve') && doc.includes('Gerard') && doc.includes('Luke'));
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: Exact Parity Oracle between funnel.html and mockup-landing.html
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: Exact Parity Oracle (funnel.html vs mockup-landing.html) ---');

  const funnelRaw = fs.readFileSync(FUNNEL_PATH, 'utf8');
  const mockupRaw = fs.readFileSync(MOCKUP_PATH, 'utf8');

  const funnelLines = funnelRaw.split(/\r?\n/);
  const mockupLines = mockupRaw.split(/\r?\n/);

  assert('Line counts are identical between funnel.html and mockup-landing.html', funnelLines.length === mockupLines.length, `funnel: ${funnelLines.length}, mockup: ${mockupLines.length}`);

  let diffLines = [];
  for (let i = 0; i < Math.max(funnelLines.length, mockupLines.length); i++) {
    if (funnelLines[i] !== mockupLines[i]) {
      diffLines.push({ line: i + 1, funnel: funnelLines[i], mockup: mockupLines[i] });
    }
  }

  assert(
    'Only exactly 1 line differs between funnel.html and mockup-landing.html',
    diffLines.length === 1,
    `Found ${diffLines.length} differing lines: ${JSON.stringify(diffLines.map(d => d.line))}`
  );

  if (diffLines.length === 1) {
    const diff = diffLines[0];
    const isOgUrl = diff.funnel.includes('og:url') && diff.mockup.includes('og:url');
    assert('The single differing line is the og:url meta tag', isOgUrl, `Diff at line ${diff.line}:\n  funnel: ${diff.funnel}\n  mockup: ${diff.mockup}`);
    assert('funnel.html og:url points to landingpage', diff.funnel.includes('https://sol-th-ri-ve.vercel.app/landingpage'));
    assert('mockup-landing.html og:url points to mockup-landing.html', diff.mockup.includes('https://sol-th-ri-ve.vercel.app/mockup-landing.html'));
  }

  // Check public/ parity
  if (fs.existsSync(PUB_FUNNEL) && fs.existsSync(PUB_MOCKUP)) {
    const pubFunnelRaw = fs.readFileSync(PUB_FUNNEL, 'utf8');
    const pubMockupRaw = fs.readFileSync(PUB_MOCKUP, 'utf8');
    const pubFunnelLines = pubFunnelRaw.split(/\r?\n/);
    const pubMockupLines = pubMockupRaw.split(/\r?\n/);

    let pubDiffLines = [];
    for (let i = 0; i < Math.max(pubFunnelLines.length, pubMockupLines.length); i++) {
      if (pubFunnelLines[i] !== pubMockupLines[i]) {
        pubDiffLines.push({ line: i + 1, funnel: pubFunnelLines[i], mockup: pubMockupLines[i] });
      }
    }
    assert(
      'Only exactly 1 line differs between public/funnel.html and public/mockup-landing.html',
      pubDiffLines.length === 1 && pubDiffLines[0].funnel.includes('og:url')
    );
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: 5 to THRiVE Practitioner Lab Copy & Pricing Consistency Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: 5 to THRiVE Practitioner Lab Copy & Pricing Consistency ---');

  const filesToCheck = [
    { name: 'funnel.html', content: funnelRaw },
    { name: 'mockup-landing.html', content: mockupRaw }
  ];

  for (const { name, content } of filesToCheck) {
    assert(`${name} title is "5 to THRiVE Practitioner Lab | Clinical Practice Audit & Enrollment"`, content.includes('<title>5 to THRiVE Practitioner Lab | Clinical Practice Audit &amp; Enrollment</title>'));
    assert(`${name} meta description mentions $297 tuition and 21-seat cap`, content.includes('enroll in the 5 to THRiVE Practitioner Lab ($297 tuition, 21-seat cap)'));
    assert(`${name} Step 1 eyebrow is "5 to THRiVE Practitioner Lab • Nov 30 Launch"`, content.includes('5 to THRiVE Practitioner Lab • Nov 30 Launch'));
    assert(`${name} Step 1 headline emphasizes 167 hours`, content.includes('Help every client THRIVE across the <em>167 hours</em> between sessions.'));
    assert(`${name} Step 1 subtitle highlights 6-Week Lab, Nov 30, capped at 21 seats across Squads A, B, and C`, content.includes('6-Week Experiential Lab launching Monday, Nov 30, 2026. Strictly capped at 21 seats across Squads A, B, and C.'));
    assert(`${name} Step 1 Q3 mentions ethical co-pilot & DAP notes`, content.includes('Q3 · The ethical co-pilot &amp; DAP notes') && content.includes('automated DAP notes and keep clients accountable for $9/month?'));
    assert(`${name} Step 2 lead capture mentions clinical practice profile and squad seat`, content.includes('Where should we send your clinical practice profile?') && content.includes('claim your squad seat'));
    assert(`${name} Step 3 consensus greeting uses practitioner consensus`, content.includes('Here is the practitioner consensus.'));
    assert(`${name} Step 3 consensus headline asks "Which Clinical Capability Should We Prioritize?"`, content.includes('Which Clinical Capability Should We Prioritize?'));
    assert(`${name} Step 3 voting cards include dap_notes, action_boards, and observer_stance`, content.includes('data-v="dap_notes"') && content.includes('data-v="action_boards"') && content.includes('data-v="observer_stance"'));
    assert(`${name} Step 4 calendar specifies Monday, Nov 30 launch and Mon & Wed 5:00–6:30 PM MT`, content.includes('Monday, Nov 30 launch (Live sessions Mon &amp; Wed 5:00–6:30 PM MT)'));
    assert(`${name} Step 5 order summary specifies 5 to THRiVE Practitioner Lab (Nov 30, 2026 Cohort)`, content.includes('5 to THRiVE Practitioner Lab (Nov 30, 2026 Cohort)'));
    assert(`${name} Step 5 line items include 6-Week Experiential Lab ($297.00), Squad Placement, Personos AI DAP Note Generator, Session 0 Pre-Flight, Practitioner Certification`,
      content.includes('6-Week Experiential Lab (21-Seat Cohort Cap)') &&
      content.includes('Private Squad Placement (Squad A, B, or C — 7 Seats Each)') &&
      content.includes('Personos AI DAP Note Generator &amp; Caseload Setup') &&
      content.includes('Session 0 Pre-Flight &amp; Weekend Tech Clinics (Nov 28–29)') &&
      content.includes('5 to THRiVE Practitioner Certification')
    );
    assert(`${name} checkout button text is "Pay $297.00 & Enroll in Practitioner Lab"`, content.includes('Pay $297.00 &amp; Enroll in Practitioner Lab'));
    assert(`${name} success state references LearnWorlds classroom invite and Squad assignment for Session 0`, content.includes('You will receive your LearnWorlds classroom invite and Squad assignment for Session 0 Pre-Flight (Nov 28–29).'));

    // Check pricing consistency: total must be $297.00, no other obsolete pricing
    const priceMatches = content.match(/\$\d+(\.\d{2})?(\/(mo|month))?/g) || [];
    const validPrices = new Set(['$9/month', '$9/mo', '$297.00', '$297']);
    const oddPrices = priceMatches.filter(p => !validPrices.has(p));
    assert(`${name} has no rogue or stale price points (found prices: ${[...new Set(priceMatches)].join(', ')})`, oddPrices.length === 0, `Unexpected prices: ${oddPrices.join(', ')}`);
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: AST / Syntax & DOM Selector Integrity Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Script Syntax & DOM Selector Integrity ---');

  function extractInlineScript(html) {
    const m = html.match(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/i);
    return m ? m[1] : '';
  }

  const funnelScript = extractInlineScript(funnelRaw);
  const mockupScript = extractInlineScript(mockupRaw);

  assert('Inline script extracted from funnel.html', funnelScript.length > 500);
  assert('Inline script extracted from mockup-landing.html', mockupScript.length > 500);

  let funnelCompiled = false;
  try {
    new vm.Script(funnelScript, { filename: 'funnel.inline.js' });
    funnelCompiled = true;
  } catch (e) {
    console.error('funnel.html script compilation failed:', e);
  }
  assert('funnel.html inline script compiles in Node.js VM without syntax errors', funnelCompiled);

  let mockupCompiled = false;
  try {
    new vm.Script(mockupScript, { filename: 'mockup-landing.inline.js' });
    mockupCompiled = true;
  } catch (e) {
    console.error('mockup-landing.html script compilation failed:', e);
  }
  assert('mockup-landing.html inline script compiles in Node.js VM without syntax errors', mockupCompiled);

  // Selector cross-check: collect all querySelector('#id') and check they exist in HTML
  const idSelectors = [...funnelScript.matchAll(/\$\(['"]#([a-zA-Z0-9_-]+)['"]\)/g)].map(m => m[1]);
  const uniqueIds = [...new Set(idSelectors)];

  const missingIdsInFunnel = uniqueIds.filter(id => !funnelRaw.includes(`id="${id}"`));
  assert(
    `All ${uniqueIds.length} IDs referenced via $('#...') exist in funnel.html markup`,
    missingIdsInFunnel.length === 0,
    `Missing IDs: ${missingIdsInFunnel.join(', ')}`
  );

  const missingIdsInMockup = uniqueIds.filter(id => !mockupRaw.includes(`id="${id}"`));
  assert(
    `All ${uniqueIds.length} IDs referenced via $('#...') exist in mockup-landing.html markup`,
    missingIdsInMockup.length === 0,
    `Missing IDs: ${missingIdsInMockup.join(', ')}`
  );

  // ---------------------------------------------------------------------------
  // SUITE 5: End-to-End User State Machine & Form Validation Stress Harness
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 5: End-to-End User State Machine & Validation Stress Harness ---');

  function buildMockDOMEnvironment() {
    // In-memory DOM tree builder
    const elements = new Map();

    function makeEl(tag, id = '', classes = []) {
      const el = {
        tagName: tag.toUpperCase(),
        id,
        className: classes.join(' '),
        classList: {
          contains: (c) => el.className.split(/\s+/).includes(c),
          add: (...cls) => {
            const set = new Set(el.className.split(/\s+/).filter(Boolean));
            cls.forEach(c => set.add(c));
            el.className = [...set].join(' ');
          },
          remove: (...cls) => {
            const set = new Set(el.className.split(/\s+/).filter(Boolean));
            cls.forEach(c => set.delete(c));
            el.className = [...set].join(' ');
          },
          toggle: (c, force) => {
            const has = el.classList.contains(c);
            const willHave = force !== undefined ? force : !has;
            if (willHave) el.classList.add(c);
            else el.classList.remove(c);
          }
        },
        style: {},
        children: [],
        dataset: {},
        attributes: {},
        value: '',
        textContent: '',
        innerHTML: '',
        disabled: false,
        listeners: {},
        setAttribute: (k, v) => { el.attributes[k] = String(v); if (k.startsWith('data-')) el.dataset[k.slice(5)] = String(v); },
        getAttribute: (k) => el.attributes[k] || (k.startsWith('data-') ? el.dataset[k.slice(5)] : null),
        appendChild: (ch) => { ch.parentNode = el; el.children.push(ch); return ch; },
        addEventListener: (evt, fn) => { el.listeners[evt] = el.listeners[evt] || []; el.listeners[evt].push(fn); },
        dispatchEvent: (evt) => { (el.listeners[evt.type] || []).forEach(fn => fn(evt)); },
        focus: () => {},
        scrollIntoView: () => {},
        pause: () => { el.paused = true; },
        paused: false,
        querySelector: (sel) => query(el, sel),
        querySelectorAll: (sel) => queryAll(el, sel),
      };
      if (id) elements.set('#' + id, el);
      return el;
    }

    function query(root, sel) {
      const all = queryAll(root, sel);
      return all.length > 0 ? all[0] : null;
    }

    function queryAll(root, sel) {
      const results = [];
      function traverse(n) {
        if (sel.startsWith('#')) {
          if (n.id === sel.slice(1)) results.push(n);
        } else if (sel.startsWith('.')) {
          if (n.classList && n.classList.contains(sel.slice(1))) results.push(n);
        } else if (sel.includes('div')) {
          if (n.tagName === 'DIV') results.push(n);
        } else if (sel.startsWith('button')) {
          if (n.tagName === 'BUTTON') results.push(n);
        }
        for (const c of n.children || []) traverse(c);
      }
      traverse(root);
      return results;
    }

    const docRoot = makeEl('div', 'document-root');

    // Populate mock elements matching funnel.html IDs
    const views = ['v-intro', 'v-consensus', 'v-book', 'v-pay'].map(id => {
      const v = makeEl('section', id, ['view']);
      if (id === 'v-intro') v.classList.add('active');
      docRoot.appendChild(v);
      return v;
    });

    const stepper = makeEl('div', 'stepper');
    for (let s = 1; s <= 5; s++) {
      const stepDiv = makeEl('div');
      stepDiv.dataset.s = String(s);
      if (s === 1) stepDiv.className = 'on';
      stepper.appendChild(stepDiv);
    }
    docRoot.appendChild(stepper);

    const navCta = makeEl('button', 'nav-cta');
    docRoot.appendChild(navCta);

    const audit = makeEl('div', 'audit');
    for (let q = 0; q < 3; q++) {
      const qDiv = makeEl('div', '', ['q']);
      qDiv.dataset.q = String(q);
      const rateDiv = makeEl('div', '', ['rate']);
      qDiv.appendChild(rateDiv);
      audit.appendChild(qDiv);
    }
    const auditSubmit = makeEl('button', 'audit-submit');
    auditSubmit.disabled = true;
    audit.appendChild(auditSubmit);
    views[0].appendChild(audit);

    const leadForm = makeEl('form', 'lead');
    leadForm.style.display = 'none';
    const fields = ['fn', 'ln', 'org', 'em', 'ph'];
    fields.forEach(f => {
      const inp = makeEl('input', f);
      leadForm.appendChild(inp);
    });
    const leadErr = makeEl('div', 'lead-err');
    leadForm.appendChild(leadErr);
    views[0].appendChild(leadForm);

    const storyVideo = makeEl('video', 'story');
    views[0].appendChild(storyVideo);

    const greet = makeEl('h1', 'greet');
    views[1].appendChild(greet);
    const bars = makeEl('div', 'bars');
    views[1].appendChild(bars);

    ['dap_notes', 'action_boards', 'observer_stance'].forEach(v => {
      const voteBtn = makeEl('button', '', ['vote']);
      voteBtn.dataset.v = v;
      views[1].appendChild(voteBtn);
    });
    const voteSubmit = makeEl('button', 'vote-submit');
    voteSubmit.disabled = true;
    views[1].appendChild(voteSubmit);
    const voteHint = makeEl('p', 'vote-hint');
    views[1].appendChild(voteHint);

    const bookingIframe = makeEl('iframe', 'qiNYlb85QHIu0foCh24A');
    views[2].appendChild(bookingIframe);
    const bookSubmit = makeEl('button', 'book-submit');
    views[2].appendChild(bookSubmit);

    const payGrid = makeEl('div', 'pay-grid');
    const payWhen = makeEl('span', 'pay-when');
    const payWho = makeEl('span', 'pay-who');
    payGrid.appendChild(payWhen);
    payGrid.appendChild(payWho);

    const payForm = makeEl('form', 'pay-form');
    const payBtn = makeEl('button', 'pay-btn');
    payBtn.disabled = true;
    const payErr = makeEl('div', 'pay-err');
    const paymentElem = makeEl('div', 'payment-element');
    payForm.appendChild(paymentElem);
    payForm.appendChild(payBtn);
    payForm.appendChild(payErr);
    payGrid.appendChild(payForm);
    views[3].appendChild(payGrid);

    const successCard = makeEl('div', 'success');
    successCard.style.display = 'none';
    const okMsg = makeEl('p', 'ok-msg');
    successCard.appendChild(okMsg);
    views[3].appendChild(successCard);

    const trackedEvents = [];

    const sandbox = {
      window: {
        scrollTo: () => {},
        matchMedia: () => ({ matches: false }),
        location: { origin: 'https://thrivecoaching.ai', pathname: '/funnel.html' },
      },
      document: {
        querySelector: (sel) => {
          if (elements.has(sel)) return elements.get(sel);
          return query(docRoot, sel);
        },
        querySelectorAll: (sel) => queryAll(docRoot, sel),
        createElement: (tag) => makeEl(tag),
      },
      fetch: async (url, opts) => {
        if (url === '/api/event') {
          trackedEvents.push(JSON.parse(opts.body));
          return { ok: true, json: async () => ({ ok: true }) };
        }
        if (url === '/api/config') {
          return { ok: true, json: async () => ({ publishableKey: 'pk_test_123' }) };
        }
        if (url === '/api/create-payment-intent') {
          return { ok: true, json: async () => ({ clientSecret: 'pi_test_secret_123' }) };
        }
        return { ok: true, json: async () => ({}) };
      },
      Stripe: () => ({
        elements: () => ({
          create: () => ({ mount: () => {} })
        }),
        confirmPayment: async () => ({ paymentIntent: { id: 'pi_success_123' } })
      }),
      URLSearchParams,
      Date,
      JSON,
      setTimeout: (fn) => fn(),
      console: { log: () => {}, error: () => {}, warn: () => {} },
      trackedEvents,
      elements,
      docRoot
    };

    sandbox.window.document = sandbox.document;
    return sandbox;
  }

  const env = buildMockDOMEnvironment();
  const ctx = vm.createContext(env);

  let harnessThrew = false;
  try {
    new vm.Script(funnelScript).runInContext(ctx);
  } catch (e) {
    harnessThrew = true;
    console.error('Runtime error executing funnelScript:', e);
  }
  assert('Funnel inline script executes in mock DOM sandbox without exceptions', !harnessThrew);

  // Test Step 1: 5 buttons created per .q (total 15 rate buttons)
  const rateBoxes = env.docRoot.querySelectorAll('.rate');
  const allRateButtons = rateBoxes.flatMap(b => b.children);
  assert('Each question receives 5 rating buttons (total 15 buttons across 3 questions)', allRateButtons.length === 15);

  const auditSubmit = env.elements.get('#audit-submit');
  assert('Audit submit button is initially disabled', auditSubmit.disabled === true);

  // Rate Q0 = 5, Q1 = 4, Q2 = 5
  rateBoxes[0].children[4].onclick(); // Q0 = 5
  assert('Audit submit remains disabled after partial rating (1 of 3)', auditSubmit.disabled === true);
  rateBoxes[1].children[3].onclick(); // Q1 = 4
  assert('Audit submit remains disabled after partial rating (2 of 3)', auditSubmit.disabled === true);
  rateBoxes[2].children[4].onclick(); // Q2 = 5
  assert('Audit submit becomes enabled after all 3 questions rated', auditSubmit.disabled === false);

  // Click audit-submit
  auditSubmit.onclick();
  const auditDiv = env.elements.get('#audit');
  const leadForm = env.elements.get('#lead');
  assert('Step 1 -> Step 2: Audit section hidden and Lead form displayed', auditDiv.style.display === 'none' && leadForm.style.display !== 'none');

  // Test Step 2 Validation Stress
  const leadErr = env.elements.get('#lead-err');
  const leadSubmitEvent = { preventDefault: () => {} };

  // 1. Empty submission
  leadForm.listeners.submit[0](leadSubmitEvent);
  assert('Empty lead form submission is blocked with "Please complete every field."', leadErr.textContent === 'Please complete every field.');

  // 2. Partial submission
  env.elements.get('#fn').value = 'Jordan';
  env.elements.get('#ln').value = 'Lee';
  leadForm.listeners.submit[0](leadSubmitEvent);
  assert('Partial lead form submission is blocked with "Please complete every field."', leadErr.textContent === 'Please complete every field.');

  // 3. Malformed email submissions
  env.elements.get('#org').value = 'Clinics Inc';
  env.elements.get('#ph').value = '555-0199';

  const badEmails = ['notanemail', 'user@', 'user@domain', 'user @domain.com', '@domain.com'];
  let allBadRejected = true;
  for (const be of badEmails) {
    env.elements.get('#em').value = be;
    leadForm.listeners.submit[0](leadSubmitEvent);
    if (leadErr.textContent !== 'Please enter a valid email address.') {
      allBadRejected = false;
      break;
    }
  }
  assert('Malformed email addresses are strictly rejected with validation error', allBadRejected);

  // 4. Valid lead submission
  env.elements.get('#em').value = 'jordan.lee@clinics.org';
  leadForm.listeners.submit[0](leadSubmitEvent);
  assert('Valid lead submission clears lead-err', leadErr.textContent === '');

  // Verify transition to Step 3
  const greetEl = env.elements.get('#greet');
  assert('Step 2 -> Step 3: Greeting displays "Welcome, Jordan. Here is the practitioner consensus."', greetEl.textContent === 'Welcome, Jordan. Here is the practitioner consensus.');

  const storyVideo = env.elements.get('#story');
  assert('Step 2 -> Step 3: Video playback is paused ($("#story").pause() called)', storyVideo.paused === true);

  const consensusView = env.elements.get('#v-consensus');
  assert('Step 3 view becomes active', consensusView.classList.contains('active'));

  const leadEvents = env.trackedEvents.filter(e => e.type === 'lead');
  assert('Lead submission emits /api/event with lead payload and ratings', leadEvents.length === 1 && leadEvents[0].data.ratings.length === 3);

  // Test Step 3 Voting
  const voteSubmit = env.elements.get('#vote-submit');
  const voteHint = env.elements.get('#vote-hint');
  assert('Vote submit button is initially disabled in Step 3', voteSubmit.disabled === true);
  assert('Vote hint prompts "Choose a priority to continue."', voteHint.textContent === 'Choose a priority to continue.');

  const voteButtons = env.docRoot.querySelectorAll('.vote');
  assert('Three squad priority vote buttons exist', voteButtons.length === 3);

  // Click dap_notes
  voteButtons[0].onclick();
  assert('Clicking dap_notes button selects it and enables vote-submit', voteButtons[0].classList.contains('sel') && voteSubmit.disabled === false);
  assert('Vote hint updates to "Ready when you are."', voteHint.textContent === 'Ready when you are.');

  // Click action_boards -> selection toggles
  voteButtons[1].onclick();
  assert('Selecting action_boards switches selection and unselects dap_notes', voteButtons[1].classList.contains('sel') && !voteButtons[0].classList.contains('sel'));

  // Submit vote
  voteSubmit.onclick();
  const bookView = env.elements.get('#v-book');
  assert('Step 3 -> Step 4: Booking view becomes active', bookView.classList.contains('active'));

  const voteEvents = env.trackedEvents.filter(e => e.type === 'vote');
  assert('Vote submission emits /api/event with selected vote ("action_boards")', voteEvents.length === 1 && voteEvents[0].data.vote === 'action_boards');

  // Check iframe URL initialization
  const bookingIframe = env.elements.get('#qiNYlb85QHIu0foCh24A');
  const iframeSrc = bookingIframe.src || '';
  assert('Booking iframe is populated with pre-filled lead query parameters',
    iframeSrc.includes('first_name=Jordan') &&
    iframeSrc.includes('last_name=Lee') &&
    iframeSrc.includes('email=jordan.lee%40clinics.org') &&
    iframeSrc.includes('phone=555-0199')
  );

  // Step 4 -> Step 5
  const bookSubmit = env.elements.get('#book-submit');
  bookSubmit.onclick();

  const payView = env.elements.get('#v-pay');
  assert('Step 4 -> Step 5: Checkout view becomes active', payView.classList.contains('active'));

  const payWhen = env.elements.get('#pay-when');
  const payWho = env.elements.get('#pay-who');
  assert('Order summary sets #pay-when to "Booked via Booking Calendar"', payWhen.textContent === 'Booked via Booking Calendar');
  assert('Order summary sets #pay-who to "Jordan Lee"', payWho.textContent === 'Jordan Lee');

  // ---------------------------------------------------------------------------
  // SUITE 6: Adversarial Security: XSS Sanitization, Encoding, and Media Integrity
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 6: Adversarial Security & Media Integrity ---');

  // XSS injection test in First Name
  const xssEnv = buildMockDOMEnvironment();
  const xssCtx = vm.createContext(xssEnv);
  new vm.Script(funnelScript).runInContext(xssCtx);

  // Rate all questions
  const xssRateBoxes = xssEnv.docRoot.querySelectorAll('.rate');
  xssRateBoxes[0].children[4].onclick();
  xssRateBoxes[1].children[4].onclick();
  xssRateBoxes[2].children[4].onclick();
  xssEnv.elements.get('#audit-submit').onclick();

  // Inject script payload in First Name
  xssEnv.elements.get('#fn').value = '<script>alert("xss")</script>';
  xssEnv.elements.get('#ln').value = 'Attacker';
  xssEnv.elements.get('#org').value = 'Malicious Corp';
  xssEnv.elements.get('#em').value = 'attacker@evil.com';
  xssEnv.elements.get('#ph').value = '123-456-7890';
  xssEnv.elements.get('#lead').listeners.submit[0]({ preventDefault: () => {} });

  const greetHtml = xssEnv.elements.get('#greet').textContent;
  assert('XSS payload in lead name is assigned safely via textContent (no HTML interpretation)',
    greetHtml === 'Welcome, <script>alert("xss")</script>. Here is the practitioner consensus.'
  );

  // Media Integrity Check
  const webmPath = path.join(ROOT, 'minds-eye-animated.webm');
  const mp4Path = path.join(ROOT, 'minds-eye-animated.mp4');
  assert('Hero video minds-eye-animated.webm exists on disk', fs.existsSync(webmPath));
  assert('Hero video minds-eye-animated.mp4 exists on disk', fs.existsSync(mp4Path));
  if (fs.existsSync(webmPath) && fs.existsSync(mp4Path)) {
    const webmStat = fs.statSync(webmPath);
    const mp4Stat = fs.statSync(mp4Path);
    assert('Hero WebM asset is non-empty (> 100 KB)', webmStat.size > 100000, `Size: ${webmStat.size} bytes`);
    assert('Hero MP4 asset is non-empty (> 500 KB)', mp4Stat.size > 500000, `Size: ${mp4Stat.size} bytes`);
  }

  // Check desktop media query in funnel.html and mockup-landing.html: must NOT lock viewport
  for (const { name, content } of filesToCheck) {
    const mqMatch = content.match(/@media\s*\(min-width:\s*901px\)[\s\S]*?\{([\s\S]*?)\}/);
    const hasMqBodyOverflowHidden = mqMatch && /body\s*\{[^}]*overflow:\s*hidden/i.test(mqMatch[0]);
    assert(`${name} desktop media query avoids overflow:hidden on body`, !hasMqBodyOverflowHidden);
  }

  // ---------------------------------------------------------------------------
  // SUITE 7: Build Pipeline Sync & Secret Leakage Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 7: Build Pipeline Sync & Secret Leakage Oracle ---');

  let buildOutput = '';
  let buildSucceeded = false;
  try {
    buildOutput = execSync('node build.js', { cwd: ROOT, encoding: 'utf8' });
    buildSucceeded = true;
  } catch (e) {
    buildOutput = e.message;
  }
  assert('node build.js executes cleanly with exit code 0', buildSucceeded, buildOutput);

  // Verify public/funnel.html and public/mockup-landing.html exist
  assert('public/funnel.html exists and is generated by build.js', fs.existsSync(PUB_FUNNEL));
  assert('public/mockup-landing.html exists and is generated by build.js', fs.existsSync(PUB_MOCKUP));

  // Check secret leakage in build artifacts
  const pubFunnelContent = fs.existsSync(PUB_FUNNEL) ? fs.readFileSync(PUB_FUNNEL, 'utf8') : '';
  const pubMockupContent = fs.existsSync(PUB_MOCKUP) ? fs.readFileSync(PUB_MOCKUP, 'utf8') : '';

  const secretTokens = ['sk_live_', 'sk_test_', 'AIzaSy', '%VITE_'];
  for (const st of secretTokens) {
    assert(`public/funnel.html contains zero raw ${st} tokens`, !pubFunnelContent.includes(st));
    assert(`public/mockup-landing.html contains zero raw ${st} tokens`, !pubMockupContent.includes(st));
  }

  // ---------------------------------------------------------------------------
  // SUMMARY & VERDICT
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`  EMPIRICAL CHALLENGER SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    console.log('\x1b[31mVERDICT: CHALLENGE_FAILED\x1b[0m\n');
    console.log('Failures:');
    failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f.title} (${f.detail})`));
    process.exit(1);
  } else {
    console.log('\x1b[32mVERDICT: APPROVE (ALL EMPIRICAL TESTS PASSED)\x1b[0m\n');
    process.exit(0);
  }
}

run().catch(e => {
  console.error('Fatal challenge execution error:', e);
  process.exit(1);
});
