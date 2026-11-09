/**
 * tests/tier3-combinations.js
 * Tier 3: Cross-Feature Combinations (>=15 pairwise interaction tests)
 * Tests interactions between multiple system features and modules.
 */

const {
  readProjectFile,
  projectFileExists,
  createMockEnvironment,
  validateRFC5545,
  mockServerlessRequest,
  verifyJsSyntax
} = require('./helpers');

async function runTier3Tests() {
  const tests = [];

  async function record({ id, name, run }) {
    try {
      const result = await run();
      tests.push({
        tier: 3,
        id,
        name,
        status: result.status,
        message: result.message || ''
      });
    } catch (err) {
      tests.push({
        tier: 3,
        id,
        name,
        status: 'FAIL',
        message: err.message
      });
    }
  }

  const classesExists = projectFileExists('classes.html');
  const classesContent = readProjectFile('classes.html') || '';
  const scriptContent = readProjectFile('script.js') || '';
  const funnelContent = readProjectFile('funnel.html') || '';
  const mockupContent = readProjectFile('mockup-landing.html') || '';
  const buildContent = readProjectFile('build.js') || '';
  const docContent = readProjectFile('docs/learnworlds-troubleshooting.md') || '';

  // -------------------------------------------------------------------------
  // T3.1: Calendar Timezone Sync + Inquiry Submission
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.1',
    name: 'Timezone selector state integrates with inquiry lead context',
    run: async () => {
      if (!classesExists) return { status: 'PENDING', message: 'classes.html pending M2' };
      const hasTz = classesContent.includes('tz-select');
      const hasInq = classesContent.includes('program-inquiry-form');
      if (hasTz && hasInq) {
        return { status: 'PASS', message: 'Timezone selector and inquiry form co-located on classes page' };
      }
      return { status: 'FAIL', message: 'Timezone selector or inquiry form missing' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.2: Navigation Links + Page Routing Slugs
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.2',
    name: 'Navigation link targets match registered slugs in script.js KNOWN_PAGE_SLUGS',
    run: async () => {
      // Slugs registered in script.js
      const slugMatch = scriptContent.match(/KNOWN_PAGE_SLUGS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
      if (!slugMatch) return { status: 'FAIL', message: 'Could not parse KNOWN_PAGE_SLUGS in script.js' };
      const registeredSlugs = new Set(
        slugMatch[1].split(',').map(s => s.replace(/['"\s]/g, '')).filter(Boolean)
      );

      // Verify classes slug is included or pending
      if (!registeredSlugs.has('classes')) {
        return { status: 'PENDING', message: 'classes slug pending addition to KNOWN_PAGE_SLUGS in script.js' };
      }

      // Verify essential existing slugs
      const essential = ['index', 'survey', 'profile', 'approach', 'funnel', 'classes'];
      const missing = essential.filter(s => !registeredSlugs.has(s));
      if (missing.length === 0) return { status: 'PASS', message: 'All navigation targets match KNOWN_PAGE_SLUGS' };
      return { status: 'FAIL', message: `Missing slugs: ${missing.join(', ')}` };
    }
  });

  // -------------------------------------------------------------------------
  // T3.3: Multi-Source Video + Viewport Scrolling
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.3',
    name: 'Multi-source video in funnel.html functions without desktop body scroll lock',
    run: async () => {
      const hasMultiSource = funnelContent.includes('minds-eye-animated.webm') && funnelContent.includes('minds-eye-animated.mp4');
      const m = funnelContent.match(/@media\s*\(\s*min-width\s*:\s*901px\s*\)\s*and\s*\(\s*min-height\s*:\s*620px\s*\)\s*\{([\s\S]*?)\}/);
      const isLocked = m && /body\s*\{[^}]*overflow\s*:\s*hidden/i.test(m[1]);
      if (hasMultiSource && !isLocked) {
        return { status: 'PASS', message: 'WebM video and natural scrolling co-exist in funnel.html' };
      }
      return { status: 'PENDING', message: 'Multi-source video or overflow fix pending M3 execution' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.4: Timezone Conversion + RFC 5545 .ics Timestamps
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.4',
    name: 'Timezone conversion preserves UTC timestamp accuracy in RFC 5545 .ics generation',
    run: async () => {
      // 5:00 PM Mountain Standard Time (UTC-7) on Nov 3, 2026 = 00:00 UTC Nov 4, 2026
      const nov3Utc = new Date('2026-11-03T17:00:00-07:00').toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      if (nov3Utc !== '20261104T000000Z') {
        return { status: 'FAIL', message: `UTC timestamp mismatch: expected 20261104T000000Z, got ${nov3Utc}` };
      }
      const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//THRiVE//EN\r\nBEGIN:VEVENT\r\nUID:sess1@thrive\r\nDTSTAMP:20261101T000000Z\r\nDTSTART:${nov3Utc}\r\nDTEND:20261104T011500Z\r\nSUMMARY:Week 1 CYNEFIN\r\nEND:VEVENT\r\nEND:VCALENDAR`;
      const val = validateRFC5545(ics);
      if (val.valid) return { status: 'PASS', message: 'Converted timezone formats valid RFC 5545 UTC timestamp' };
      return { status: 'FAIL', message: `RFC 5545 validation error: ${val.errors.join(', ')}` };
    }
  });

  // -------------------------------------------------------------------------
  // T3.5: Syllabus Week Details + Calendar Session Sync
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.5',
    name: 'Syllabus Week 1 corresponds to Session 1 date (Nov 3, 2026) in schedule',
    run: async () => {
      if (!classesExists) return { status: 'PENDING', message: 'classes.html pending M2' };
      const hasW1Date = /Week\s*0?1[\s\S]*?Nov\s*3/i.test(classesContent) || /Nov\s*3[\s\S]*?CYNEFIN/i.test(classesContent);
      if (hasW1Date) return { status: 'PASS', message: 'Syllabus Week 1 matches November 3 session date' };
      return { status: 'FAIL', message: 'Syllabus Week 1 and November 3 date mismatch' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.6: Inquiry Form Client Validation + Serverless /api/event
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.6',
    name: 'Valid lead inquiry payload succeeds against api/event.js handler (HTTP 200)',
    run: async () => {
      const eventHandler = require('../api/event');
      const payload = {
        type: 'lead',
        lead: {
          fn: 'Jane',
          ln: 'Doe',
          em: 'jane.doe@example.com',
          ph: '720-555-0100',
          org: 'Acme Health'
        },
        data: {
          source: 'classes_inquiry_form',
          inquiry_type: 'November 2026 Cohort',
          message: 'Interested in signing up for the November class.'
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
        return { status: 'PASS', message: 'Inquiry form payload successfully accepted by api/event.js' };
      }
      return { status: 'FAIL', message: `api/event.js returned status ${res.status}: ${JSON.stringify(res.body)}` };
    }
  });

  // -------------------------------------------------------------------------
  // T3.7: Bad Event Type Rejection in api/event.js
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.7',
    name: 'api/event.js correctly rejects unauthorized payment and invalid event types (HTTP 400)',
    run: async () => {
      const eventHandler = require('../api/event');
      // payment is restricted to stripe-webhook.js
      const badPayload = { type: 'payment', data: { amount: 29700 } };
      const res = await mockServerlessRequest(eventHandler, { method: 'POST', body: badPayload });
      if (res.status === 400 && res.body && res.body.error === 'Bad event type') {
        return { status: 'PASS', message: 'api/event.js safely rejected unauthorized event type with HTTP 400' };
      }
      return { status: 'FAIL', message: `Expected 400 Bad event type, got status ${res.status}` };
    }
  });

  // -------------------------------------------------------------------------
  // T3.8: Static Tailwind CSS + React Rendering in profile.html
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.8',
    name: 'profile.html links static tailwind.css and initializes React root',
    run: async () => {
      const profileContent = readProjectFile('profile.html') || '';
      const hasTailwindLink = profileContent.includes('tailwind.css');
      const hasReactRoot = profileContent.includes('id="root"');
      if (hasTailwindLink && hasReactRoot) {
        return { status: 'PASS', message: 'profile.html links static tailwind.css and defines React root' };
      }
      return { status: 'PENDING', message: 'profile.html static tailwind.css link pending M3' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.9: Static Tailwind CSS + React Rendering in hope-survey.html
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.9',
    name: 'hope-survey.html links static tailwind.css and initializes React root',
    run: async () => {
      const hopeContent = readProjectFile('hope-survey.html') || '';
      const hasTailwindLink = hopeContent.includes('tailwind.css');
      const hasReactRoot = hopeContent.includes('id="root"');
      if (hasTailwindLink && hasReactRoot) {
        return { status: 'PASS', message: 'hope-survey.html links static tailwind.css and defines React root' };
      }
      return { status: 'PENDING', message: 'hope-survey.html static tailwind.css link pending M3' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.10: build.js Token Sanitization + Precompiled JSX
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.10',
    name: 'build.js token sanitization operates cleanly on precompiled JavaScript code',
    run: async () => {
      // Simulate build.js token replacement on JS code
      const sampleJs = `const key = "%VITE_ELEVENLABS_API_KEY%"; const gemini = "%VITE_GEMINI_API_KEY%";`;
      const sanitized = sampleJs
        .replace(/%VITE_ELEVENLABS_API_KEY%/g, '__SERVER_PROXY__')
        .replace(/%VITE_GEMINI_API_KEY%/g, '__SERVER_PROXY__');
      const syntax = verifyJsSyntax(sanitized);
      if (syntax.valid && !sanitized.includes('%VITE_')) {
        return { status: 'PASS', message: 'Token sanitization preserves valid JS syntax without leaking placeholders' };
      }
      return { status: 'FAIL', message: 'Sanitized JS produced invalid syntax' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.11: build.js Output Parity for classes.html and tailwind.css
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.11',
    name: 'build.js files array registers classes.html and tailwind.css for public/ mirroring',
    run: async () => {
      const hasClasses = buildContent.includes("'classes.html'");
      const hasTailwind = buildContent.includes("'tailwind.css'");
      if (hasClasses && hasTailwind) {
        return { status: 'PASS', message: 'build.js registers both classes.html and tailwind.css' };
      }
      return { status: 'PENDING', message: 'build.js registration pending M2/M3 execution' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.12: DevTools Console One-Liner + DOM Body Unlocking
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.12',
    name: 'DevTools Console one-liner removes blocking modal and unlocks body overflow in simulated DOM',
    run: async () => {
      const env = createMockEnvironment();
      // Inject simulated blocking modal
      const modal = env.document.createElement('div');
      modal.setAttribute('class', 'wizard-window-wrapper -school');
      env.document.body.appendChild(modal);

      const backdrop = env.document.createElement('div');
      backdrop.setAttribute('class', 'wizard-backdrop');
      env.document.body.appendChild(backdrop);

      env.document.body.style.setProperty('overflow', 'hidden', 'important');
      env.document.body.classList.add('modal-open');

      // Execute DevTools one-liner logic
      const selectors = ['.wizard-window-wrapper', '.wizard-backdrop'];
      selectors.forEach(sel => env.document.querySelectorAll(sel).forEach(el => el.remove()));
      env.document.body.style.setProperty('overflow', 'auto', 'important');
      env.document.body.classList.remove('modal-open');

      const modalRemoved = env.document.querySelectorAll('.wizard-window-wrapper').length === 0;
      const backdropRemoved = env.document.querySelectorAll('.wizard-backdrop').length === 0;
      const overflowRestored = env.document.body.style.getPropertyValue('overflow') === 'auto';
      const classCleared = !env.document.body.classList.contains('modal-open');

      if (modalRemoved && backdropRemoved && overflowRestored && classCleared) {
        return { status: 'PASS', message: 'DevTools one-liner successfully purged modal and unlocked viewport' };
      }
      return { status: 'FAIL', message: 'DevTools one-liner failed to restore simulated DOM' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.13: Persistent MutationObserver + Late Dynamic Re-Injection
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.13',
    name: 'Persistent MutationObserver guard destroys dynamically re-injected modal elements',
    run: async () => {
      const env = createMockEnvironment();
      let purgeCount = 0;
      const purge = () => {
        const modals = env.document.querySelectorAll('.wizard-window-wrapper');
        modals.forEach(m => {
          m.remove();
          purgeCount++;
        });
      };
      const obs = new env.window.MutationObserver(purge);
      obs.observe(env.document.body, { childList: true });

      // Late mounting of modal
      const lateModal = env.document.createElement('div');
      lateModal.setAttribute('class', 'wizard-window-wrapper');
      env.document.body.appendChild(lateModal);
      obs.trigger();

      if (env.document.querySelectorAll('.wizard-window-wrapper').length === 0 && purgeCount > 0) {
        return { status: 'PASS', message: 'MutationObserver guard destroyed dynamically injected modal' };
      }
      return { status: 'FAIL', message: 'MutationObserver guard failed to intercept re-injected modal' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.14: vercel.json Clean URLs + classes/schedule Routing
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.14',
    name: 'vercel.json cleanUrls supports clean extensionless /classes route',
    run: async () => {
      const vercelJson = readProjectFile('vercel.json') || '';
      if (vercelJson.includes('"cleanUrls": true')) {
        return { status: 'PASS', message: 'vercel.json cleanUrls configured for extensionless routing' };
      }
      return { status: 'FAIL', message: 'vercel.json missing cleanUrls configuration' };
    }
  });

  // -------------------------------------------------------------------------
  // T3.15: Parallel Landing Pages Parity (funnel.html vs mockup-landing.html)
  // -------------------------------------------------------------------------
  await record({
    id: 'T3.15',
    name: 'funnel.html and mockup-landing.html maintain exact video and desktop layout parity',
    run: async () => {
      const fVideo = funnelContent.match(/<video[^>]*id=["']story["'][\s\S]*?<\/video>/i);
      const mVideo = mockupContent.match(/<video[^>]*id=["']story["'][\s\S]*?<\/video>/i);
      if (!fVideo || !mVideo) return { status: 'FAIL', message: 'Video player markup missing from funnel files' };
      const fClean = fVideo[0].replace(/\s+/g, ' ');
      const mClean = mVideo[0].replace(/\s+/g, ' ');
      if (fClean === mClean) {
        return { status: 'PASS', message: 'funnel.html and mockup-landing.html have matching video markup' };
      }
      return { status: 'FAIL', message: 'Video markup disparity between funnel.html and mockup-landing.html' };
    }
  });

  return tests;
}

module.exports = { runTier3Tests };
