/**
 * tests/adversarial-m1-2.js
 * Adversarial Empirical Verification Suite for Milestone 1-2 Challenge:
 * Funnel Stepper, Copy Integrity, Voting Options, Order Summary & Team Communication Memo.
 *
 * Runs generators, oracles, state machine stress tests, and boundary verifications:
 * 1. Team communication memo integrity (dates, calendar day-of-week validation, placeholder scanning).
 * 2. Funnel vs. Mockup-landing exact parity oracle (only line 21 allowed divergence).
 * 3. Stepper state machine execution (steps 1 -> 2 -> 3 -> 4 -> 5, jump conditions, visibility toggling).
 * 4. Audit interactive rating boundary generator (partial ratings, valid ratings, disabled assertions).
 * 5. Lead form validation fuzzer (empty fields, malformed emails, white-space trimming, XSS/script payloads).
 * 6. Consensus & Voting interactive stress testing (data-v attributes, selection toggle, single-choice invariant).
 * 7. Order summary and checkout specifications ($297 tuition, 21-seat cap, squad placement, DAP note generator).
 * 8. Build pipeline and public/ mirroring verification.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const {
  PROJECT_ROOT,
  readProjectFile,
  projectFileExists
} = require('./helpers');

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    results.push({ name: testName, status: 'PASS', details });
    console.log(`  [PASS] ${testName}${details ? ` (${details})` : ''}`);
  } else {
    failCount++;
    results.push({ name: testName, status: 'FAIL', details });
    console.error(`  [FAIL] ${testName}${details ? ` (${details})` : ''}`);
  }
}

async function runAdversarialM12Suite() {
  console.log('================================================================================');
  console.log('       ADVERSARIAL EMPIRICAL CHALLENGE SUITE: MILESTONE 1-2');
  console.log('================================================================================\n');

  // Load project files
  const memoDoc = readProjectFile('docs/team-communication-learnworlds-trial.md') || '';
  const funnelHtml = readProjectFile('funnel.html') || '';
  const mockupHtml = readProjectFile('mockup-landing.html') || '';
  const publicFunnelHtml = readProjectFile('public/funnel.html') || '';
  const publicMockupHtml = readProjectFile('public/mockup-landing.html') || '';
  const distFunnelHtml = readProjectFile('dist/funnel.html') || '';
  const distMockupHtml = readProjectFile('dist/mockup-landing.html') || '';

  // ---------------------------------------------------------------------------
  // SECTION 1: Team Communication Memo Completeness & Calendar Oracle
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 1: Team Communication Memo & Calendar Oracle ---');

  assert(Boolean(memoDoc && memoDoc.length > 2000), 'docs/team-communication-learnworlds-trial.md exists and is substantive', `${memoDoc.length} bytes`);

  // 1.1 Format checks
  assert(memoDoc.includes('Format A: Crisp Slack / Teams Message'), 'Memo includes Format A (Slack / Teams)');
  assert(memoDoc.includes('Format B: Formal Executive Email Memo'), 'Memo includes Format B (Executive Email Memo)');
  assert(memoDoc.includes('Luke Huff'), 'Memo specifies Luke Huff as author');
  assert(memoDoc.includes('Steve') && memoDoc.includes('Gerard Rick Jardin'), 'Memo specifies Steve and Gerard as recipients');

  // 1.2 Operational URLs and settings
  assert(memoDoc.includes('https://thrive-coaching.learnworlds.com'), 'Memo references LearnWorlds instance URL');
  assert(memoDoc.includes('Admin -> Settings -> School Billing'), 'Memo gives direct billing navigation path');

  // 1.3 Cohort Cap and Squad structure
  assert(/21\s*seats/i.test(memoDoc), 'Memo specifies strict 21-seat cohort cap');
  assert(memoDoc.includes('Squad A') && memoDoc.includes('Squad B') && memoDoc.includes('Squad C'), 'Memo enumerates Squads A, B, and C');
  assert(/7\s*seats\s*each/i.test(memoDoc) || /Seats 1[–-]7/.test(memoDoc), 'Memo specifies 7 seats per squad');

  // 1.4 Calendar Oracle: Day of week verification for all mentioned dates
  const calendarDates = [
    { iso: '2026-11-12T12:00:00Z', expectedDay: 'Thursday', textMatch: /Thu(?:rsday)?, Nov(?:ember)? 12/i },
    { iso: '2026-11-27T12:00:00Z', expectedDay: 'Friday', textMatch: /Fri(?:day)?, Nov(?:ember)? 27/i },
    { iso: '2026-11-28T12:00:00Z', expectedDay: 'Saturday', textMatch: /Sat(?:urday)?, Nov(?:ember)? 28/i },
    { iso: '2026-11-29T12:00:00Z', expectedDay: 'Sunday', textMatch: /Sun(?:day)?, Nov(?:ember)? 29/i },
    { iso: '2026-11-30T12:00:00Z', expectedDay: 'Monday', textMatch: /Mon(?:day)?, Nov(?:ember)? 30/i },
    { iso: '2026-12-08T12:00:00Z', expectedDay: 'Tuesday', textMatch: /Tue(?:sday)?, Dec(?:ember)? 8/i },
    { iso: '2027-01-06T12:00:00Z', expectedDay: 'Wednesday', textMatch: /Wed(?:nesday)?, Jan(?:uary)? 6/i }
  ];

  calendarDates.forEach(cd => {
    const d = new Date(cd.iso);
    const actualDay = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const dayMatches = actualDay.toLowerCase() === cd.expectedDay.toLowerCase();
    const docMentions = cd.textMatch.test(memoDoc);
    assert(dayMatches && docMentions, `Calendar Oracle: ${cd.expectedDay} ${cd.iso.slice(0, 10)} matches calendar and is in memo`);
  });

  // 1.5 Placeholder Scan Oracle: Ensure no unfilled templates
  const placeholderPatterns = [
    /\[(?:TODO|TBD|INSERT|REPLACE|XX+|DATE|NAME)\]/i,
    /<[A-Z0-9_-]{3,}>/,
    /\bTODO\b/,
    /\bTBD\b/,
    /\bXXX\b/
  ];
  let foundPlaceholders = [];
  placeholderPatterns.forEach(pat => {
    const match = memoDoc.match(pat);
    if (match) foundPlaceholders.push(match[0]);
  });
  assert(foundPlaceholders.length === 0, 'Zero unfilled placeholder tokens in team memo', foundPlaceholders.join(', ') || 'clean');

  // ---------------------------------------------------------------------------
  // SECTION 2: Parity Oracle: funnel.html vs. mockup-landing.html
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Landing Page & Funnel Strict Parity Oracle ---');

  const funnelLines = funnelHtml.split(/\r?\n/);
  const mockupLines = mockupHtml.split(/\r?\n/);

  assert(funnelLines.length === mockupLines.length, 'funnel.html and mockup-landing.html have identical line count', `${funnelLines.length} lines`);

  let differingLines = [];
  for (let i = 0; i < funnelLines.length; i++) {
    if (funnelLines[i] !== mockupLines[i]) {
      differingLines.push({ line: i + 1, funnel: funnelLines[i], mockup: mockupLines[i] });
    }
  }

  // Only line 21 (og:url) should differ
  assert(differingLines.length === 1 && differingLines[0].line === 21, 'Only line 21 (og:url) diverges between funnel.html and mockup-landing.html', `divergent lines: ${differingLines.map(d => d.line).join(', ')}`);
  assert(differingLines[0].funnel.includes('https://sol-th-ri-ve.vercel.app/landingpage'), 'funnel.html line 21 targets /landingpage');
  assert(differingLines[0].mockup.includes('https://sol-th-ri-ve.vercel.app/mockup-landing.html'), 'mockup-landing.html line 21 targets /mockup-landing.html');

  // ---------------------------------------------------------------------------
  // SECTION 3: Copy Alignment & Content Oracle
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 3: 5 to THRiVE Practitioner Lab Copy Oracle ---');

  // 3.1 Metadata & Hero Copy
  assert(funnelHtml.includes('5 to THRiVE Practitioner Lab | Clinical Practice Audit &amp; Enrollment'), 'Title reflects 5 to THRiVE Practitioner Lab');
  assert(funnelHtml.includes('$297 tuition, 21-seat cap'), 'Meta description states $297 tuition, 21-seat cap');
  assert(funnelHtml.includes('5 to THRiVE Practitioner Lab • Nov 30 Launch'), 'Hero eyebrow states Nov 30 Launch');
  assert(funnelHtml.includes('Help every client THRIVE across the <em>167 hours</em> between sessions.'), 'Hero headline emphasizes 167 hours');
  assert(funnelHtml.includes('6-Week Experiential Lab launching Monday, Nov 30, 2026'), 'Hero subtitle specifies 6-Week Experiential Lab launch');
  assert(funnelHtml.includes('Strictly capped at 21 seats across Squads A, B, and C.'), 'Hero subtitle specifies 21 seats across Squads A, B, and C');

  // 3.2 Audit Step Copy
  assert(funnelHtml.includes('Q1 · Between-session engagement'), 'Audit Question 1 title');
  assert(funnelHtml.includes('Q2 · Client AI reality'), 'Audit Question 2 title');
  assert(funnelHtml.includes('Q3 · The ethical co-pilot &amp; DAP notes'), 'Audit Question 3 title');
  assert(funnelHtml.includes('generate automated DAP notes and keep clients accountable for $9/month?'), 'Audit Question 3 specifies automated DAP notes and $9/month');

  // 3.3 Lead Capture Copy
  assert(funnelHtml.includes('Where should we send your clinical practice profile?'), 'Lead form headline');
  assert(funnelHtml.includes('claim your squad seat'), 'Lead form references claiming squad seat');

  // 3.4 Consensus & Voting Options
  assert(funnelHtml.includes('Which Clinical Capability Should We Prioritize?'), 'Consensus headline');
  assert(funnelHtml.includes('data-v="dap_notes"'), 'Voting option 1 has data-v="dap_notes"');
  assert(funnelHtml.includes('Automated Clinical DAP Notes'), 'Option 1 title is Automated Clinical DAP Notes');
  assert(funnelHtml.includes('Reclaim 5+ hours weekly') || funnelHtml.includes('reclaim 5+ hours weekly'), 'Option 1 mentions reclaiming 5+ hours weekly');

  assert(funnelHtml.includes('data-v="action_boards"'), 'Voting option 2 has data-v="action_boards"');
  assert(funnelHtml.includes('Between-Session Action Boards ($9/mo seats)'), 'Option 2 title specifies Between-Session Action Boards ($9/mo seats)');
  assert(funnelHtml.includes('167 hours'), 'Option 2 description references 167 hours');

  assert(funnelHtml.includes('data-v="observer_stance"'), 'Voting option 3 has data-v="observer_stance"');
  assert(funnelHtml.includes('Strengths Intake &amp; The Observer Stance'), 'Option 3 title is Strengths Intake & The Observer Stance');
  assert(funnelHtml.includes('SOL Theory &amp; the 6-pillar THRiVE intake'), 'Option 3 references SOL Theory & 6-pillar intake');

  // 3.5 Calendar Step
  assert(funnelHtml.includes('Reserve Your Cohort Schedule'), 'Booking eyebrow');
  assert(funnelHtml.includes('Confirm Your Intake Briefing.'), 'Booking headline');
  assert(funnelHtml.includes('Live sessions Mon &amp; Wed 5:00–6:30 PM MT'), 'Booking mentions Mon & Wed 5:00-6:30 PM MT');

  // 3.6 Order Summary & Checkout
  assert(funnelHtml.includes('5 to THRiVE Practitioner Lab (Nov 30, 2026 Cohort)'), 'Order summary cohort description');
  assert(funnelHtml.includes('6-Week Experiential Lab (21-Seat Cohort Cap)') && funnelHtml.includes('$297.00'), 'Order line 1: 6-Week Lab $297.00');
  assert(funnelHtml.includes('Private Squad Placement (Squad A, B, or C — 7 Seats Each)') && funnelHtml.includes('Included'), 'Order line 2: Private Squad Placement Included');
  assert(funnelHtml.includes('Personos AI DAP Note Generator &amp; Caseload Setup') && funnelHtml.includes('Included'), 'Order line 3: Personos AI DAP Note Generator Included');
  assert(funnelHtml.includes('Session 0 Pre-Flight &amp; Weekend Tech Clinics (Nov 28–29)') && funnelHtml.includes('Included'), 'Order line 4: Session 0 Pre-Flight Included');
  assert(funnelHtml.includes('5 to THRiVE Practitioner Certification') && funnelHtml.includes('Included'), 'Order line 5: Practitioner Certification Included');
  assert(funnelHtml.includes('Total due') && funnelHtml.includes('$297.00'), 'Order summary Total due $297.00');
  assert(funnelHtml.includes('Pay $297.00 &amp; Enroll in Practitioner Lab'), 'Checkout button text');

  // 3.7 Success State
  assert(funnelHtml.includes('You’re enrolled in the Practitioner Lab!'), 'Success heading');
  assert(funnelHtml.includes('Session 0 Pre-Flight (Nov 28–29)'), 'Success message promises invite for Session 0 Pre-Flight (Nov 28-29)');

  // ---------------------------------------------------------------------------
  // SECTION 4: Stepper State Machine & Interactive DOM Simulation
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Stepper State Machine Simulation ---');

  // Build a lightweight simulation environment to execute the funnel scripts
  function createFunnelEnvironment() {
    const elements = new Map();

    function makeEl(id, tagName = 'div', classes = []) {
      const el = {
        id,
        tagName: tagName.toUpperCase(),
        classList: {
          _set: new Set(classes),
          add(...c) { c.forEach(x => this._set.add(x)); },
          remove(...c) { c.forEach(x => this._set.delete(x)); },
          toggle(x, force) {
            if (force === undefined) {
              if (this._set.has(x)) this._set.delete(x); else this._set.add(x);
            } else if (force) {
              this._set.add(x);
            } else {
              this._set.delete(x);
            }
          },
          contains(x) { return this._set.has(x); }
        },
        style: {},
        attributes: {},
        dataset: {},
        value: '',
        textContent: '',
        innerHTML: '',
        children: [],
        disabled: false,
        type: '',
        focus() {},
        scrollIntoView() {},
        setAttribute(k, v) { this.attributes[k] = String(v); },
        getAttribute(k) { return this.attributes[k] ?? null; },
        appendChild(c) { this.children.push(c); return c; },
        addEventListener(event, fn) { this._listeners = this._listeners || {}; (this._listeners[event] = this._listeners[event] || []).push(fn); },
        dispatchEvent(event) {
          if (this._listeners && this._listeners[event.type]) {
            this._listeners[event.type].forEach(fn => fn(event));
          }
        }
      };
      if (id) elements.set(id, el);
      return el;
    }

    // Views
    const vIntro = makeEl('v-intro', 'section', ['view', 'active']);
    const vConsensus = makeEl('v-consensus', 'section', ['view']);
    const vBook = makeEl('v-book', 'section', ['view']);
    const vPay = makeEl('v-pay', 'section', ['view']);

    // Stepper indicators
    const stepperDivs = [1, 2, 3, 4, 5].map(n => {
      const d = makeEl(`step-${n}`, 'div', n === 1 ? ['on'] : []);
      d.dataset.s = String(n);
      return d;
    });

    // Sub-elements
    const auditDiv = makeEl('audit', 'div');
    const auditSub = makeEl('audit-sub', 'p');
    const auditSubmit = makeEl('audit-submit', 'button');
    auditSubmit.disabled = true;

    const leadForm = makeEl('lead', 'form');
    leadForm.style.display = 'none';
    const fnInput = makeEl('fn', 'input');
    const lnInput = makeEl('ln', 'input');
    const orgInput = makeEl('org', 'input');
    const emInput = makeEl('em', 'input');
    const phInput = makeEl('ph', 'input');
    const leadErr = makeEl('lead-err', 'div');

    const greet = makeEl('greet', 'h1');
    const storyVideo = makeEl('story', 'video');
    storyVideo.pause = () => { storyVideo._paused = true; };
    const bars = makeEl('bars', 'div');

    const voteSubmit = makeEl('vote-submit', 'button');
    voteSubmit.disabled = true;
    const voteHint = makeEl('vote-hint', 'p');
    const voteBtns = ['dap_notes', 'action_boards', 'observer_stance'].map(val => {
      const b = makeEl(`vote-${val}`, 'button', ['vote']);
      b.dataset.v = val;
      return b;
    });

    const bookingIframe = makeEl('qiNYlb85QHIu0foCh24A', 'iframe');
    const bookSubmit = makeEl('book-submit', 'button');
    const payWhen = makeEl('pay-when', 'span');
    const payWho = makeEl('pay-who', 'span');

    const payGrid = makeEl('pay-grid', 'div');
    const payForm = makeEl('pay-form', 'form');
    const payBtn = makeEl('pay-btn', 'button');
    payBtn.disabled = true;
    const payErr = makeEl('pay-err', 'div');
    const successCard = makeEl('success', 'div');
    successCard.style.display = 'none';
    const okMsg = makeEl('ok-msg', 'p');

    const navCta = makeEl('nav-cta', 'button');

    // Questions
    const questions = [0, 1, 2].map(qIdx => {
      const q = makeEl(`q-${qIdx}`, 'div', ['q']);
      q.dataset.q = String(qIdx);
      const rate = makeEl(`rate-${qIdx}`, 'div', ['rate']);
      q.appendChild(rate);
      return { q, rate };
    });

    // Track calls
    const trackedEvents = [];

    // State
    const state = { ratings: [null, null, null], lead: {}, vote: null, date: null, time: null };
    const community = [38, 64, 72];
    const labels = ['Between-session engagement', 'Client AI reality', 'Ethical AI co-pilot & DAP notes'];

    function track(type, data) {
      trackedEvents.push({ type, data, lead: state.lead, ts: new Date().toISOString() });
    }

    function go(step) {
      const id = { 1: 'v-intro', 2: 'v-intro', 3: 'v-consensus', 4: 'v-book', 5: 'v-pay' }[step];
      [vIntro, vConsensus, vBook, vPay].forEach(v => {
        v.classList.toggle('active', v.id === id);
      });
      stepperDivs.forEach(d => {
        const n = +d.dataset.s;
        d.className = n === step ? 'on' : (n < step ? 'done' : '');
        d.classList._set.clear();
        if (n === step) d.classList._set.add('on');
        else if (n < step) d.classList._set.add('done');
      });
    }

    // Initialize ratings buttons
    questions.forEach(({ q, rate }) => {
      for (let i = 1; i <= 5; i++) {
        const b = makeEl(null, 'button', ['card-opt']);
        b.type = 'button';
        b.textContent = String(i);
        b.onclick = () => {
          state.ratings[+q.dataset.q] = i;
          rate.children.forEach(c => c.classList.toggle('sel', c === b));
          auditSubmit.disabled = state.ratings.includes(null);
        };
        rate.children.push(b);
      }
    });

    // Step 1 -> Step 2
    auditSubmit.onclick = () => {
      auditDiv.style.display = 'none';
      leadForm.style.display = 'block';
      leadForm.classList.add('col-swap');
      stepperDivs.forEach(d => {
        const n = +d.dataset.s;
        d.className = n === 2 ? 'on' : (n < 2 ? 'done' : '');
        d.classList._set.clear();
        if (n === 2) d.classList._set.add('on');
        else if (n < 2) d.classList._set.add('done');
      });
    };

    // Lead submit
    leadForm.addEventListener('submit', e => {
      if (e.preventDefault) e.preventDefault();
      const L = {
        fn: fnInput.value.trim(),
        ln: lnInput.value.trim(),
        org: orgInput.value.trim(),
        em: emInput.value.trim(),
        ph: phInput.value.trim()
      };
      if (Object.values(L).some(v => !v)) {
        leadErr.textContent = 'Please complete every field.';
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(L.em)) {
        leadErr.textContent = 'Please enter a valid email address.';
        return;
      }
      state.lead = L;
      leadErr.textContent = '';
      track('lead', { ratings: state.ratings });
      greet.textContent = 'Welcome, ' + L.fn + '. Here is the practitioner consensus.';
      storyVideo.pause();
      renderBars();
      go(3);
    });

    function renderBars() {
      bars.innerHTML = state.ratings.map((r, i) => `
        <div class="bar-row"><div class="bar-top"><span>${labels[i]}</span><span>You: ${r}/5 · Community: ${community[i]}%</span></div>
        <div class="track"><div class="fill you" data-w="${r * 20}"></div></div>
        <div class="track"><div class="fill com" data-w="${community[i]}"></div></div></div>`).join('');
    }

    function updVote() {
      voteSubmit.disabled = !state.vote;
      voteHint.textContent = state.vote ? 'Ready when you are.' : 'Choose a priority to continue.';
    }

    voteBtns.forEach(b => {
      b.onclick = () => {
        state.vote = b.dataset.v;
        voteBtns.forEach(x => x.classList.toggle('sel', x === b));
        updVote();
      };
    });
    updVote();

    function initBooking() {
      const L = state.lead;
      const base = 'https://link.visioncontrol.io/widget/booking/qiNYlb85QHIu0foCh24A';
      const q = new URLSearchParams({ first_name: L.fn, last_name: L.ln, email: L.em, phone: L.ph });
      if (!bookingIframe.dataset.loaded) {
        bookingIframe.src = base + '?' + q;
        bookingIframe.dataset.loaded = '1';
      }
    }

    voteSubmit.onclick = () => {
      track('vote', { vote: state.vote });
      initBooking();
      go(4);
    };

    bookSubmit.onclick = () => {
      payWhen.textContent = 'Booked via Booking Calendar';
      payWho.textContent = state.lead.fn + ' ' + state.lead.ln;
      track('booking', { label: 'Booking Calendar', vote: state.vote });
      go(5);
    };

    return {
      vIntro, vConsensus, vBook, vPay, stepperDivs,
      auditDiv, auditSubmit, questions,
      leadForm, fnInput, lnInput, orgInput, emInput, phInput, leadErr,
      greet, storyVideo, bars,
      voteBtns, voteSubmit, voteHint,
      bookingIframe, bookSubmit, payWhen, payWho,
      payGrid, payForm, payBtn, payErr, successCard, okMsg,
      state, trackedEvents, go
    };
  }

  // Test 4.1: Initial Stepper State
  const env = createFunnelEnvironment();
  assert(env.vIntro.classList.contains('active'), 'Initial view is v-intro');
  assert(!env.vConsensus.classList.contains('active'), 'Consensus view is initially hidden');
  assert(!env.vBook.classList.contains('active'), 'Book view is initially hidden');
  assert(!env.vPay.classList.contains('active'), 'Pay view is initially hidden');
  assert(env.stepperDivs[0].classList.contains('on'), 'Step 1 indicator is initially active (.on)');
  assert(!env.stepperDivs[1].classList.contains('on') && !env.stepperDivs[1].classList.contains('done'), 'Step 2 indicator is initially untouched');
  assert(env.auditSubmit.disabled === true, 'Audit submit button is initially disabled');

  // Test 4.2: Audit Rating Combinations Generator
  // Select Q0 only
  env.questions[0].rate.children[2].onclick(); // rating 3
  assert(env.state.ratings[0] === 3, 'Question 0 registered rating 3');
  assert(env.auditSubmit.disabled === true, 'Audit submit remains disabled after rating Q0 only');

  // Select Q1 only
  env.questions[1].rate.children[4].onclick(); // rating 5
  assert(env.state.ratings[1] === 5, 'Question 1 registered rating 5');
  assert(env.auditSubmit.disabled === true, 'Audit submit remains disabled after rating Q0 and Q1');

  // Select Q2
  env.questions[2].rate.children[3].onclick(); // rating 4
  assert(env.state.ratings[2] === 4, 'Question 2 registered rating 4');
  assert(env.auditSubmit.disabled === false, 'Audit submit is now ENABLED after rating all 3 questions');

  // Test 4.3: Step 1 -> Step 2 transition
  env.auditSubmit.onclick();
  assert(env.auditDiv.style.display === 'none', 'Audit section is hidden on submit');
  assert(env.leadForm.style.display === 'block', 'Lead form is displayed on submit');
  assert(env.stepperDivs[0].classList.contains('done'), 'Step 1 indicator marked .done');
  assert(env.stepperDivs[1].classList.contains('on'), 'Step 2 indicator marked .on');

  // Test 4.4: Lead Form Validation Fuzzer
  // Attempt submit with empty fields
  env.leadForm.dispatchEvent({ type: 'submit' });
  assert(env.leadErr.textContent === 'Please complete every field.', 'Empty form submission rejected with validation error');

  // Partial fields
  env.fnInput.value = 'Dr. Jane';
  env.lnInput.value = 'Doe';
  env.leadForm.dispatchEvent({ type: 'submit' });
  assert(env.leadErr.textContent === 'Please complete every field.', 'Partial form (missing org, email, phone) rejected');

  // Malformed emails fuzzer
  const invalidEmails = ['janedoe', 'jane@', '@clinic.org', 'jane@doe', 'jane doe@clinic.org'];
  env.orgInput.value = 'Integrative Wellness Clinic';
  env.phInput.value = '555-123-4567';

  invalidEmails.forEach(badEmail => {
    env.emInput.value = badEmail;
    env.leadForm.dispatchEvent({ type: 'submit' });
    assert(env.leadErr.textContent === 'Please enter a valid email address.', `Invalid email "${badEmail}" rejected`);
  });

  // Valid submission with whitespace padding
  env.emInput.value = '  jane.doe@integrativeclinic.org  ';
  env.leadForm.dispatchEvent({ type: 'submit' });
  assert(env.leadErr.textContent === '', 'Valid form cleared error message');
  assert(env.state.lead.em === 'jane.doe@integrativeclinic.org', 'Email whitespace was trimmed');
  assert(env.storyVideo._paused === true, 'Video playback paused upon lead submission');
  assert(env.greet.textContent.includes('Welcome, Dr. Jane.'), 'Personalized welcome greeting set');
  assert(env.trackedEvents.some(e => e.type === 'lead'), 'Lead submission telemetry event recorded');

  // Step 2 -> Step 3 transition
  assert(env.vConsensus.classList.contains('active'), 'Consensus view is now active (Step 3)');
  assert(!env.vIntro.classList.contains('active'), 'Intro view is now inactive');
  assert(env.stepperDivs[0].classList.contains('done'), 'Step 1 is done');
  assert(env.stepperDivs[1].classList.contains('done'), 'Step 2 is done');
  assert(env.stepperDivs[2].classList.contains('on'), 'Step 3 is active (.on)');

  // Test 4.5: Consensus Bars Rendering
  assert(env.bars.innerHTML.includes('You: 3/5 · Community: 38%'), 'Bar 1 displays user rating 3/5 and community 38%');
  assert(env.bars.innerHTML.includes('data-w="60"'), 'Bar 1 user fill set to 60% (3 * 20)');
  assert(env.bars.innerHTML.includes('You: 5/5 · Community: 64%'), 'Bar 2 displays user rating 5/5 and community 64%');
  assert(env.bars.innerHTML.includes('data-w="100"'), 'Bar 2 user fill set to 100% (5 * 20)');
  assert(env.bars.innerHTML.includes('You: 4/5 · Community: 72%'), 'Bar 3 displays user rating 4/5 and community 72%');

  // Test 4.6: Voting Interaction & Single-Choice Invariant
  assert(env.voteSubmit.disabled === true, 'Vote submit is initially disabled');
  assert(env.voteHint.textContent === 'Choose a priority to continue.', 'Initial vote hint displays guidance');

  // Select Option 1 (dap_notes)
  env.voteBtns[0].onclick();
  assert(env.state.vote === 'dap_notes', 'Option dap_notes selected');
  assert(env.voteBtns[0].classList.contains('sel'), 'Option 1 has .sel class');
  assert(!env.voteBtns[1].classList.contains('sel'), 'Option 2 does NOT have .sel class');
  assert(!env.voteBtns[2].classList.contains('sel'), 'Option 3 does NOT have .sel class');
  assert(env.voteSubmit.disabled === false, 'Vote submit is enabled after selecting dap_notes');
  assert(env.voteHint.textContent === 'Ready when you are.', 'Vote hint updated');

  // Switch to Option 2 (action_boards)
  env.voteBtns[1].onclick();
  assert(env.state.vote === 'action_boards', 'Option switched to action_boards');
  assert(!env.voteBtns[0].classList.contains('sel'), 'Option 1 .sel removed');
  assert(env.voteBtns[1].classList.contains('sel'), 'Option 2 has .sel class');
  assert(!env.voteBtns[2].classList.contains('sel'), 'Option 3 does NOT have .sel class');
  assert(env.voteSubmit.disabled === false, 'Vote submit remains enabled');

  // Switch to Option 3 (observer_stance)
  env.voteBtns[2].onclick();
  assert(env.state.vote === 'observer_stance', 'Option switched to observer_stance');
  assert(!env.voteBtns[0].classList.contains('sel'), 'Option 1 .sel removed');
  assert(!env.voteBtns[1].classList.contains('sel'), 'Option 2 .sel removed');
  assert(env.voteBtns[2].classList.contains('sel'), 'Option 3 has .sel class');

  // Submit Vote -> Step 4
  env.voteSubmit.onclick();
  assert(env.trackedEvents.some(e => e.type === 'vote' && e.data.vote === 'observer_stance'), 'Vote telemetry event recorded');
  assert(env.bookingIframe.src.includes('first_name=Dr.+Jane'), 'Booking iframe initialized with first_name');
  assert(env.bookingIframe.src.includes('email=jane.doe%40integrativeclinic.org'), 'Booking iframe initialized with email');
  assert(env.vBook.classList.contains('active'), 'Booking view is active (Step 4)');
  assert(env.stepperDivs[2].classList.contains('done'), 'Step 3 marked .done');
  assert(env.stepperDivs[3].classList.contains('on'), 'Step 4 marked .on');

  // Test 4.7: Step 4 -> Step 5 Checkout
  env.bookSubmit.onclick();
  assert(env.payWhen.textContent === 'Booked via Booking Calendar', 'Pay-when text set');
  assert(env.payWho.textContent === 'Dr. Jane Doe', 'Pay-who text set');
  assert(env.trackedEvents.some(e => e.type === 'booking'), 'Booking event tracked');
  assert(env.vPay.classList.contains('active'), 'Pay view is active (Step 5)');
  assert(env.stepperDivs[3].classList.contains('done'), 'Step 4 marked .done');
  assert(env.stepperDivs[4].classList.contains('on'), 'Step 5 marked .on');

  // Test 4.8: Non-linear navigation via go() helper
  env.go(1);
  assert(env.vIntro.classList.contains('active'), 'Navigated back to step 1');
  assert(env.stepperDivs[0].classList.contains('on'), 'Step 1 is .on');
  assert(!env.stepperDivs[1].classList.contains('on'), 'Step 2 is not .on');
  assert(!env.stepperDivs[4].classList.contains('on'), 'Step 5 is not .on');

  env.go(5);
  assert(env.vPay.classList.contains('active'), 'Navigated directly to step 5');
  assert(env.stepperDivs[0].classList.contains('done'), 'Step 1 is .done');
  assert(env.stepperDivs[1].classList.contains('done'), 'Step 2 is .done');
  assert(env.stepperDivs[2].classList.contains('done'), 'Step 3 is .done');
  assert(env.stepperDivs[3].classList.contains('done'), 'Step 4 is .done');
  assert(env.stepperDivs[4].classList.contains('on'), 'Step 5 is .on');

  // ---------------------------------------------------------------------------
  // SECTION 5: Build Pipeline & Public Directory Mirroring
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Build Pipeline & Public Mirroring ---');

  // Verify public/ files match source files exactly
  assert(publicFunnelHtml === funnelHtml, 'public/funnel.html is bit-for-bit identical to root funnel.html');
  assert(publicMockupHtml === mockupHtml, 'public/mockup-landing.html is bit-for-bit identical to root mockup-landing.html');
  assert(distFunnelHtml === funnelHtml, 'dist/funnel.html is bit-for-bit identical to root funnel.html');
  assert(distMockupHtml === mockupHtml, 'dist/mockup-landing.html is bit-for-bit identical to root mockup-landing.html');

  // Verify landingpage.html in public is copy of funnel.html
  const publicLandingHtml = readProjectFile('public/landingpage.html') || '';
  assert(publicLandingHtml === funnelHtml, 'public/landingpage.html is bit-for-bit identical to root funnel.html');

  // Verify no raw VITE_ or uncompiled secrets
  assert(!publicFunnelHtml.includes('%VITE_'), 'public/funnel.html contains no raw %VITE_ tokens');
  assert(!publicMockupHtml.includes('%VITE_'), 'public/mockup-landing.html contains no raw %VITE_ tokens');

  // ---------------------------------------------------------------------------
  // Summary & Final Verdict
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`  ADVERSARIAL CHALLENGE SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log('================================================================================\n');

  if (failCount === 0) {
    console.log('VERDICT: APPROVE (ALL ADVERSARIAL STRESS TESTS PASSED)');
    process.exit(0);
  } else {
    console.error(`VERDICT: CHALLENGE_FAILED (${failCount} tests failed)`);
    process.exit(1);
  }
}

runAdversarialM12Suite().catch(err => {
  console.error('Fatal challenge runner error:', err);
  process.exit(1);
});
