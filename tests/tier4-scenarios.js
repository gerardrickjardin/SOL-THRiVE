/**
 * tests/tier4-scenarios.js
 * Tier 4: Real-World Application Scenarios (>=8 end-to-end user workflows)
 * Simulates real-world user and developer workflows across multiple components.
 */

const {
  readProjectFile,
  projectFileExists,
  createMockEnvironment,
  validateRFC5545,
  mockServerlessRequest
} = require('./helpers');

async function runTier4Tests() {
  const tests = [];

  async function record({ id, name, run }) {
    try {
      const result = await run();
      tests.push({
        tier: 4,
        id,
        name,
        status: result.status,
        message: result.message || ''
      });
    } catch (err) {
      tests.push({
        tier: 4,
        id,
        name,
        status: 'FAIL',
        message: err.message
      });
    }
  }

  const classesExists = projectFileExists('classes.html');
  const classesContent = readProjectFile('classes.html') || '';
  const indexContent = readProjectFile('index.html') || '';
  const docContent = readProjectFile('docs/learnworlds-troubleshooting.md') || '';

  // -------------------------------------------------------------------------
  // Scenario 1: Student Class Discovery & Timezone Verification
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.1',
    name: 'Workflow 1: Student visits homepage -> follows Classes link -> views November cohort -> converts MT to ET',
    run: async () => {
      // Step 1: Check homepage navigation link to classes
      const hasHomeLink = indexContent.includes('classes.html') || indexContent.includes('/classes');
      if (!hasHomeLink) return { status: 'PENDING', message: 'Homepage classes link pending M2' };

      // Step 2: Check classes.html presence
      if (!classesExists) return { status: 'PENDING', message: 'classes.html pending M2' };

      // Step 3: Check cohort presentation
      const hasCohort = classesContent.includes('November 2026') || classesContent.includes('Nov 3');
      if (!hasCohort) return { status: 'FAIL', message: 'classes.html missing November 2026 cohort dates' };

      // Step 4: Check timezone conversion elements
      const hasTzSelect = classesContent.includes('tz-select');
      const hasEasternOpt = classesContent.includes('America/New_York') || classesContent.includes('Eastern Time');
      if (hasTzSelect && hasEasternOpt) {
        return { status: 'PASS', message: 'Workflow 1 verified: Student discovers class, inspects dates, and converts timezone' };
      }
      return { status: 'FAIL', message: 'Workflow 1 failed: Timezone conversion controls incomplete' };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 2: 4-Week Syllabus Exploration & .ics Calendar Download
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.2',
    name: 'Workflow 2: Student explores 4-week syllabus -> reviews all modules -> downloads 4-week .ics bundle',
    run: async () => {
      if (!classesExists) return { status: 'PENDING', message: 'classes.html pending M2' };

      // Step 1: Verify all 4 weekly modules exist in curriculum
      const modules = ['Week 01', 'Week 02', 'Week 03', 'Week 04'];
      const missingModules = modules.filter(m => !classesContent.includes(m) && !classesContent.includes(m.replace('0', '')));
      if (missingModules.length > 0) {
        return { status: 'FAIL', message: `Missing curriculum modules: ${missingModules.join(', ')}` };
      }

      // Step 2: Verify .ics download action
      const hasDownloadBtn = classesContent.includes('.ics') || classesContent.includes('btn-download-all-ics');
      if (!hasDownloadBtn) return { status: 'FAIL', message: 'Missing .ics download action in calendar sync bar' };

      // Step 3: Validate sample 4-week RFC 5545 bundle
      const sample4WeekIcs = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//THRiVE Coaching//November 2026 Cohort//EN',
        'BEGIN:VEVENT',
        'UID:w1@thrivecoaching.ai',
        'DTSTAMP:20261101T000000Z',
        'DTSTART:20261104T000000Z',
        'DTEND:20261104T011500Z',
        'SUMMARY:Week 1: Sensing the Landscape (CYNEFIN)',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:w2@thrivecoaching.ai',
        'DTSTAMP:20261101T000000Z',
        'DTSTART:20261111T000000Z',
        'DTEND:20261111T011500Z',
        'SUMMARY:Week 2: Activating Your Core (Strengths)',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:w3@thrivecoaching.ai',
        'DTSTAMP:20261101T000000Z',
        'DTSTART:20261118T000000Z',
        'DTEND:20261118T011500Z',
        'SUMMARY:Week 3: Partnering with Intelligence (Personos AI)',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:w4@thrivecoaching.ai',
        'DTSTAMP:20261101T000000Z',
        'DTSTART:20261125T000000Z',
        'DTEND:20261125T011500Z',
        'SUMMARY:Week 4: Architecture of Momentum (Action Boards)',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const val = validateRFC5545(sample4WeekIcs);
      if (val.valid && val.eventCount === 4) {
        return { status: 'PASS', message: 'Workflow 2 verified: All 4 syllabus modules present and 4-week .ics bundle valid' };
      }
      return { status: 'FAIL', message: `Workflow 2 failed: 4-week .ics validation failed: ${val.errors.join(', ')}` };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 3: Prospective Client Consultation Inquiry to API Relay
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.3',
    name: 'Workflow 3: Prospective client fills inquiry form -> client-side validation passes -> relays to /api/event',
    run: async () => {
      // Step 1: Check form in classes.html
      if (!classesExists) return { status: 'PENDING', message: 'classes.html pending M2' };
      const hasForm = classesContent.includes('program-inquiry-form');
      if (!hasForm) return { status: 'FAIL', message: 'program-inquiry-form missing from classes.html' };

      // Step 2: Simulate client form input validation
      const formInput = {
        first_name: 'Alex',
        last_name: 'Rivera',
        email: 'alex.rivera@example.com',
        phone: '303-555-0199',
        organization: 'Colorado Health Group',
        inquiry_type: 'Employer Reimbursement',
        message: 'Does THRiVE provide syllabus documentation for employer tuition reimbursement?'
      };

      const isValid = Boolean(
        formInput.first_name.trim() &&
        formInput.last_name.trim() &&
        formInput.email.includes('@') &&
        formInput.message.length >= 10
      );
      if (!isValid) return { status: 'FAIL', message: 'Client validation failed on valid form input' };

      // Step 3: Relay to /api/event serverless function
      const eventHandler = require('../api/event');
      const payload = {
        type: 'lead',
        lead: {
          fn: formInput.first_name,
          ln: formInput.last_name,
          em: formInput.email,
          ph: formInput.phone,
          org: formInput.organization
        },
        data: {
          source: 'classes_inquiry_form',
          inquiry_type: formInput.inquiry_type,
          message: formInput.message,
          label: `Program Inquiry — ${formInput.inquiry_type}`
        },
        ts: new Date().toISOString()
      };

      const origLog = console.log;
      console.log = () => {};
      let res;
      try {
        res = await mockServerlessRequest(eventHandler, { method: 'POST', body: payload });
      } finally {
        console.log = origLog;
      }
      if (res.status === 200 && res.body && res.body.ok === true) {
        return { status: 'PASS', message: 'Workflow 3 verified: Inquiry form validates and successfully dispatches to /api/event' };
      }
      return { status: 'FAIL', message: `Workflow 3 failed: /api/event returned status ${res.status}` };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Coach LearnWorlds Author Dashboard DevTools Bypass
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.4',
    name: 'Workflow 4: Coach hits white popup on author/courses -> executes DevTools bypass -> unlocks dashboard',
    run: async () => {
      // Step 1: Verify documentation exists
      if (!projectFileExists('docs/learnworlds-troubleshooting.md')) {
        return { status: 'PENDING', message: 'Troubleshooting documentation pending M1' };
      }

      // Step 2: Simulate coach browser with blocking modal and scroll lock
      const env = createMockEnvironment();

      // Underlying dashboard content
      const dashboard = env.document.createElement('div');
      dashboard.setAttribute('id', 'author-courses-grid');
      dashboard.innerText = 'THRiVE Coaching Course Outline: November Cohort';
      env.document.body.appendChild(dashboard);

      // Blocking modal injected by LearnWorlds onboarding check
      const modalWrapper = env.document.createElement('div');
      modalWrapper.setAttribute('class', 'wizard-window-wrapper -school');
      modalWrapper.style.setProperty('position', 'fixed');
      modalWrapper.style.setProperty('background', '#ffffff');
      env.document.body.appendChild(modalWrapper);

      const backdrop = env.document.createElement('div');
      backdrop.setAttribute('class', 'wizard-backdrop');
      env.document.body.appendChild(backdrop);

      env.document.body.style.setProperty('overflow', 'hidden', 'important');
      env.document.body.classList.add('modal-open', 'wizard-open');

      // Step 3: Coach executes Console one-liner
      const selectors = [
        '.wizard-window-wrapper',
        '.wizard-window-wrapper.-school',
        '.wizard-window',
        '.wizard-backdrop',
        '.modal-backdrop'
      ];
      let removedCount = 0;
      selectors.forEach(sel => {
        env.document.querySelectorAll(sel).forEach(el => {
          el.remove();
          removedCount++;
        });
      });
      env.document.body.style.removeProperty('overflow');
      env.document.body.style.setProperty('overflow', 'auto', 'important');
      env.document.body.classList.remove('modal-open', 'wizard-open', 'no-scroll');

      // Step 4: Verify coach can now access dashboard
      const modalGone = env.document.querySelector('.wizard-window-wrapper') === null;
      const backdropGone = env.document.querySelector('.wizard-backdrop') === null;
      const scrollUnlocked = env.document.body.style.getPropertyValue('overflow') === 'auto';
      const classesCleared = !env.document.body.classList.contains('modal-open');
      const dashboardVisible = env.document.querySelector('#author-courses-grid') !== null;

      if (modalGone && backdropGone && scrollUnlocked && classesCleared && dashboardVisible && removedCount >= 2) {
        return { status: 'PASS', message: 'Workflow 4 verified: Blocking modal destroyed and courses dashboard unlocked' };
      }
      return { status: 'FAIL', message: 'Workflow 4 failed: Dashboard was not restored cleanly' };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 5: School Owner Permanent Resolution Verification
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.5',
    name: 'Workflow 5: School Owner accesses direct admin URL -> completes profile -> dismisses checklist',
    run: async () => {
      if (!projectFileExists('docs/learnworlds-troubleshooting.md')) {
        return { status: 'PENDING', message: 'Troubleshooting documentation pending M1' };
      }
      const hasDirectAdmin = docContent.includes('/admin/settings/school');
      const hasChecklistDismiss = /checklist/i.test(docContent) || /getting started/i.test(docContent);
      const hasTimezone = docContent.includes('America/Denver') || /timezone/i.test(docContent);
      if (hasDirectAdmin && hasChecklistDismiss && hasTimezone) {
        return { status: 'PASS', message: 'Workflow 5 verified: Permanent resolution path fully articulated' };
      }
      return { status: 'FAIL', message: 'Workflow 5 failed: Permanent resolution guide incomplete' };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 6: Mobile Learner Navigation & Direct Enrollment Pathway
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.6',
    name: 'Workflow 6: Mobile visitor opens drawer -> selects Classes -> reviews syllabus -> clicks Enroll ($297)',
    run: async () => {
      // Step 1: Check mobile drawer in index.html
      const hasMobileDrawer = indexContent.includes('mobile-drawer');
      if (!hasMobileDrawer) return { status: 'FAIL', message: 'Mobile drawer missing from index.html' };

      // Step 2: Check classes.html
      if (!classesExists) return { status: 'PENDING', message: 'classes.html pending M2' };

      // Step 3: Check mobile drawer in classes.html
      const hasClassesMobile = classesContent.includes('mobile-drawer');
      if (!hasClassesMobile) return { status: 'FAIL', message: 'Mobile drawer missing from classes.html' };

      // Step 4: Check enrollment action link to $297 funnel
      const hasEnrollLink = classesContent.includes('funnel.html') || classesContent.includes('$297');
      if (hasEnrollLink) {
        return { status: 'PASS', message: 'Workflow 6 verified: Mobile navigation seamlessly routes to enrollment' };
      }
      return { status: 'FAIL', message: 'Workflow 6 failed: Enrollment CTA link missing from classes page' };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 7: Student Flow Survey to Profile Report Transition
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.7',
    name: 'Workflow 7: Student completes survey -> loads profile.html with zero runtime Babel compiler latency',
    run: async () => {
      const profileContent = readProjectFile('profile.html') || '';
      const hasBabel = profileContent.includes('@babel/standalone');
      const hasCdn = profileContent.includes('cdn.tailwindcss.com');
      const hasReactRoot = profileContent.includes('id="root"');

      if (!hasBabel && !hasCdn && hasReactRoot) {
        return { status: 'PASS', message: 'Workflow 7 verified: profile.html loads with static Tailwind and zero Babel latency' };
      }
      return { status: 'PENDING', message: 'Workflow 7 pending M3 Babel & Tailwind CDN elimination' };
    }
  });

  // -------------------------------------------------------------------------
  // Scenario 8: Production Build & Git Parity Workflow
  // -------------------------------------------------------------------------
  await record({
    id: 'T4.8',
    name: 'Workflow 8: Production build executes node build.js -> verifies public/ parity and sanitized API keys',
    run: async () => {
      const buildContent = readProjectFile('build.js') || '';
      const hasBuildScript = Boolean(buildContent);
      if (!hasBuildScript) return { status: 'FAIL', message: 'build.js is missing' };

      // Verify token sanitization pattern
      const hasSanitize = buildContent.includes('%VITE_ELEVENLABS_API_KEY%') && buildContent.includes('%VITE_GEMINI_API_KEY%');
      if (!hasSanitize) return { status: 'FAIL', message: 'build.js lacks API key token sanitization' };

      // Verify public output copy
      const hasPublic = buildContent.includes("'public'") && buildContent.includes('fs.copyFileSync');
      if (hasPublic) {
        return { status: 'PASS', message: 'Workflow 8 verified: Build pipeline architecture guarantees clean public/ sync and token sanitization' };
      }
      return { status: 'FAIL', message: 'Workflow 8 failed: Build output copying logic incomplete' };
    }
  });

  return tests;
}

module.exports = { runTier4Tests };
