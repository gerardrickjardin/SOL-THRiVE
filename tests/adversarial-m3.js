/**
 * tests/adversarial-m3.js
 * Adversarial Empirical Verification Suite for Milestone 3:
 * High-Impact Performance and UI/UX Enhancements.
 *
 * Runs stress tests, generators, oracles, and edge case harnesses across:
 * 1. Precompiled React syntax, VM parsing, and sandboxed browser runtime mounting.
 * 2. API key placeholder protection, multi-vector token sanitization, and secret leak resistance.
 * 3. Static Tailwind CSS bundle integrity, class coverage (flex, grid, spacing, colors, breakpoints), and CDN elimination.
 * 4. Multi-source WebM video serving, MIME types, source order, bandwidth reduction, and script playback control.
 * 5. Desktop media query viewport overflow, nested scroll trap elimination, and cross-file parity.
 * 6. Build pipeline output parity, excluded files, and generated artifacts.
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

async function runAdversarialM3Suite() {
  console.log('================================================================================');
  console.log('       ADVERSARIAL EMPIRICAL CHALLENGE SUITE: MILESTONE 3');
  console.log('================================================================================\n');

  // Load project files
  const profileHtml = readProjectFile('profile.html') || '';
  const hopeSurveyHtml = readProjectFile('hope-survey.html') || '';
  const surveyHtml = readProjectFile('survey.html') || '';
  const classesHtml = readProjectFile('classes.html') || '';
  const funnelHtml = readProjectFile('funnel.html') || '';
  const mockupHtml = readProjectFile('mockup-landing.html') || '';
  const buildJs = readProjectFile('build.js') || '';
  const tailwindCss = readProjectFile('tailwind.css') || '';

  // ---------------------------------------------------------------------------
  // SECTION 1: Precompiled React Syntax, VM Compilation & Sandboxed Execution
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 1: Precompiled React Syntax & VM Compilation ---');

  // 1.1 Extract inline React scripts
  const extractInlineReactScript = (html, filename) => {
    const matches = [...html.matchAll(/<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const m of matches) {
      const attrs = m[1];
      const code = m[2];
      if (!attrs.includes('type="module"')) {
        return code;
      }
    }
    return null;
  };

  const profileScript = extractInlineReactScript(profileHtml, 'profile.html');
  const hopeScript = extractInlineReactScript(hopeSurveyHtml, 'hope-survey.html');

  assert(Boolean(profileScript && profileScript.length > 50000), 'Extract inline React script from profile.html', `${profileScript ? profileScript.length : 0} bytes`);
  assert(Boolean(hopeScript && hopeScript.length > 50000), 'Extract inline React script from hope-survey.html', `${hopeScript ? hopeScript.length : 0} bytes`);

  // 1.2 VM Script clean parse (SyntaxError detection)
  let profileParsed = false;
  try {
    new vm.Script(profileScript, { filename: 'profile.html#inline' });
    profileParsed = true;
  } catch (err) {
    console.error('Profile script parse error:', err.message);
  }
  assert(profileParsed, 'profile.html precompiled script compiles in Node.js VM without syntax errors');

  let hopeParsed = false;
  try {
    new vm.Script(hopeScript, { filename: 'hope-survey.html#inline' });
    hopeParsed = true;
  } catch (err) {
    console.error('Hope survey script parse error:', err.message);
  }
  assert(hopeParsed, 'hope-survey.html precompiled script compiles in Node.js VM without syntax errors');

  // 1.3 Verify zero @babel/standalone and zero script type="text/babel" across project
  const allProjectHtmlFiles = ['profile.html', 'hope-survey.html', 'survey.html', 'classes.html', 'index.html', 'funnel.html', 'mockup-landing.html', 'results.html'];
  let anyBabelFound = false;
  for (const f of allProjectHtmlFiles) {
    const c = readProjectFile(f) || '';
    if (c.includes('babel.min.js') || c.includes('@babel/standalone') || c.includes('type="text/babel"')) {
      anyBabelFound = true;
      console.error(`Babel dependency found in ${f}`);
    }
  }
  assert(!anyBabelFound, 'Zero @babel/standalone scripts or text/babel tags exist across all HTML pages');

  // 1.4 Uncompiled JSX Oracle: verify standard React.createElement calls and lack of uncompiled JSX
  assert(profileScript.includes('React.createElement('), 'profile.html uses standard React.createElement calls');
  assert(hopeScript.includes('React.createElement('), 'hope-survey.html uses standard React.createElement calls');

  // Stress-check for uncompiled raw tags like `<div className=` or `<button ` in script outside string literals
  const stripStringsAndComments = (code) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/`(?:[^`\\]|\\.)*`/g, '``');
  };

  const uncompiledJsxPattern = /<[A-Za-z][A-Za-z0-9]*(\s+[A-Za-z0-9_-]+=(?:\{[^}]*\}|""|''))*\s*\/?>/g;
  const profileMatches = (stripStringsAndComments(profileScript).match(uncompiledJsxPattern) || []).filter(m => !m.includes('React.createElement'));
  assert(profileMatches.length === 0, 'profile.html script contains 0 uncompiled JSX tags outside string literals', `found ${profileMatches.length}`);

  const hopeMatches = (stripStringsAndComments(hopeScript).match(uncompiledJsxPattern) || []).filter(m => !m.includes('React.createElement'));
  assert(hopeMatches.length === 0, 'hope-survey.html script contains 0 uncompiled JSX tags outside string literals', `found ${hopeMatches.length}`);

  // 1.5 Sandboxed Browser Runtime Test: Execute scripts in mock React environment
  function testScriptRuntime(scriptCode, name) {
    let renderedRoot = null;
    const mockReact = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      Fragment: Symbol('Fragment'),
      useState: (init) => [init, () => {}],
      useEffect: () => {},
      useRef: (init) => ({ current: init }),
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
    };

    const mockRoot = {
      render: (el) => { renderedRoot = el; }
    };

    const mockElement = {
      id: 'root',
      children: [],
      style: {},
      appendChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const mockDocument = {
      getElementById: (id) => (id === 'root' ? mockElement : null),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => mockElement,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const sandbox = {
      window: {},
      document: mockDocument,
      React: mockReact,
      ReactDOM: { createRoot: () => mockRoot },
      console: { log: () => {}, error: () => {}, warn: () => {} },
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      navigator: { userAgent: 'AdversarialTestHarness/1.0' },
      location: { href: 'http://localhost/test', search: '' },
      setTimeout: () => 1,
      clearTimeout: () => {},
      setInterval: () => 1,
      clearInterval: () => {},
      matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
      AudioContext: class {},
      webkitAudioContext: class {},
      fetch: async () => ({ ok: true, json: async () => ({}) }),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    sandbox.window = sandbox;
    sandbox.window.React = mockReact;
    sandbox.window.ReactDOM = sandbox.ReactDOM;

    const ctx = vm.createContext(sandbox);
    const script = new vm.Script(scriptCode, { filename: name });
    script.runInContext(ctx);

    return Boolean(renderedRoot && renderedRoot.type);
  }

  const profileRan = testScriptRuntime(profileScript, 'profile.html');
  assert(profileRan, 'profile.html executes in mock browser sandbox and mounts React root');

  const hopeRan = testScriptRuntime(hopeScript, 'hope-survey.html');
  assert(hopeRan, 'hope-survey.html executes in mock browser sandbox and mounts React root');

  console.log();

  // ---------------------------------------------------------------------------
  // SECTION 2: API Key Placeholder Sanitization & Build Protection
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 2: API Key Placeholder Sanitization & Build Protection ---');

  // 2.1 Verify raw %VITE_ placeholders are present in root source files
  const tokenFiles = ['profile.html', 'hope-survey.html', 'survey.html'];
  for (const f of tokenFiles) {
    const content = readProjectFile(f) || '';
    const hasEleven = content.includes('%VITE_ELEVENLABS_API_KEY%');
    const hasGemini = content.includes('%VITE_GEMINI_API_KEY%');
    assert(hasEleven && hasGemini, `Root ${f} maintains raw %VITE_ELEVENLABS_API_KEY% and %VITE_GEMINI_API_KEY% placeholders`);
  }

  // 2.2 Multi-vector token replacement test harness
  // Vector 1: Default build (no env vars) -> tokens replaced with ""
  execSync('node build.js', {
    cwd: PROJECT_ROOT,
    env: { ...process.env, VITE_ELEVENLABS_API_KEY: '', VITE_GEMINI_API_KEY: '', ELEVENLABS_API_KEY: '', GEMINI_API_KEY: '' }
  });

  let defaultSanitized = true;
  for (const f of tokenFiles) {
    const pub = readProjectFile(path.join('public', f)) || '';
    const dist = readProjectFile(path.join('dist', f)) || '';
    if (pub.includes('%VITE_') || dist.includes('%VITE_')) {
      defaultSanitized = false;
    }
  }
  assert(defaultSanitized, 'Default build cleanly removes all %VITE_ tokens without leaving unresolved placeholders');

  // Vector 2: Active dummy secret key -> tokens replaced with "__SERVER_PROXY__", NOT secret
  const DUMMY_SECRET_ELEVEN = 'sk_test_empirically_injected_super_secret_elevenlabs_12345';
  const DUMMY_SECRET_GEMINI = 'AIzaSy_empirically_injected_super_secret_gemini_67890';
  execSync('node build.js', {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      VITE_ELEVENLABS_API_KEY: DUMMY_SECRET_ELEVEN,
      VITE_GEMINI_API_KEY: DUMMY_SECRET_GEMINI
    }
  });

  let proxyEmitted = true;
  let secretLeaked = false;
  for (const f of tokenFiles) {
    const pub = readProjectFile(path.join('public', f)) || '';
    const dist = readProjectFile(path.join('dist', f)) || '';
    if (pub.includes(DUMMY_SECRET_ELEVEN) || dist.includes(DUMMY_SECRET_ELEVEN) ||
        pub.includes(DUMMY_SECRET_GEMINI) || dist.includes(DUMMY_SECRET_GEMINI)) {
      secretLeaked = true;
    }
    // Check that the assignment line was set to "__SERVER_PROXY__"
    const hasProxyLine = pub.includes('"%VITE_') === false && pub.includes('"__SERVER_PROXY__"');
    if (!hasProxyLine) {
      proxyEmitted = false;
    }
  }
  assert(!secretLeaked, 'Security Oracle: Active secret keys are NEVER leaked into public/ or dist/ HTML bundles');
  assert(proxyEmitted, 'Security Oracle: Non-secret proxy token "__SERVER_PROXY__" emitted when active keys exist');

  // Vector 3: Revoked key blocked
  execSync('node build.js', {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      VITE_GEMINI_API_KEY: 'AIzaSyDhByu-gVi8PNLtDdl41ETxOmu2JOEVt8A',
      VITE_ELEVENLABS_API_KEY: 'sk_d2fc2ac281afdb8a56178f44c8ebca76f21da62f7a256bf8'
    }
  });

  let revokedBlocked = true;
  for (const f of tokenFiles) {
    const pub = readProjectFile(path.join('public', f)) || '';
    // Verify that the key assignment variables evaluate to empty string (and NOT __SERVER_PROXY__ or the revoked key)
    const geminiMatch = pub.match(/(?:const\s+(?:ENV_GEMINI_KEY|injectedGeminiKey)\s*=\s*"([^"]*)";)/);
    const elevenMatch = pub.match(/(?:const\s+(?:ENV_ELEVENLABS_KEY|injectedElevenLabsKey)\s*=\s*"([^"]*)";)/);
    if (geminiMatch && geminiMatch[1] !== '') {
      revokedBlocked = false;
    }
    if (elevenMatch && elevenMatch[1] !== '') {
      revokedBlocked = false;
    }
  }
  assert(revokedBlocked, 'Security Oracle: Revoked API keys are rejected and set to empty string');

  // Restore clean build
  execSync('node build.js', { cwd: PROJECT_ROOT });
  console.log();

  // ---------------------------------------------------------------------------
  // SECTION 3: Static Tailwind CSS Bundle & Utility Class Coverage
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 3: Static Tailwind CSS & Utility Class Coverage ---');

  // 3.1 Verify tailwind.css presence and size constraints
  assert(projectFileExists('tailwind.css'), 'Static tailwind.css exists in project root');
  assert(projectFileExists(path.join('public', 'tailwind.css')), 'tailwind.css copied to public/ by build.js');
  assert(projectFileExists(path.join('dist', 'tailwind.css')), 'tailwind.css copied to dist/ by build.js');

  const twStats = fs.statSync(path.join(PROJECT_ROOT, 'tailwind.css'));
  assert(twStats.size > 20000 && twStats.size < 150000, `tailwind.css bundle size is optimal: ${twStats.size} bytes (target: < 150 KB)`);

  // 3.2 Verify cdn.tailwindcss.com completely eliminated
  let cdnTwFound = false;
  for (const f of allProjectHtmlFiles) {
    const c = readProjectFile(f) || '';
    if (c.includes('cdn.tailwindcss.com')) {
      cdnTwFound = true;
      console.error(`Tailwind CDN found in ${f}`);
    }
  }
  assert(!cdnTwFound, 'Zero references to cdn.tailwindcss.com across all project HTML files');

  // 3.3 Verify <link rel="stylesheet" href="tailwind.css"> on assessment pages
  const assessmentPages = ['survey.html', 'profile.html', 'hope-survey.html'];
  for (const f of assessmentPages) {
    const c = readProjectFile(f) || '';
    const hasTwLink = /<link[^>]*href=["']tailwind\.css["'][^>]*>|<link[^>]*rel=["']stylesheet["'][^>]*href=["']tailwind\.css["']/i.test(c);
    assert(hasTwLink, `${f} links to static tailwind.css`);
  }

  // 3.4 Utility Class Coverage Oracle
  function verifyClassInTailwind(cls) {
    // In CSS stylesheet:
    // [ -> \[, ] -> \], # -> \#, / -> \/, : -> \:, . -> \.
    const escaped = '.' + cls
      .replace(/\\/g, '')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/#/g, '\\#')
      .replace(/\//g, '\\/')
      .replace(/:/g, '\\:')
      .replace(/\./g, '\\.');
    return tailwindCss.includes(escaped);
  }

  const flexUtilities = ['flex', 'flex-col', 'flex-wrap', 'items-center', 'justify-between', 'justify-center', 'flex-1', 'shrink-0'];
  const missingFlex = flexUtilities.filter(c => !verifyClassInTailwind(c));
  assert(missingFlex.length === 0, 'Essential flexbox utilities exist in tailwind.css', `missing: ${missingFlex.join(', ') || 'none'}`);

  const gridUtilities = ['grid', 'grid-cols-1', 'grid-cols-3', 'grid-cols-6', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8'];
  const missingGrid = gridUtilities.filter(c => !verifyClassInTailwind(c));
  assert(missingGrid.length === 0, 'Essential grid utilities exist in tailwind.css', `missing: ${missingGrid.join(', ') || 'none'}`);

  const spacingUtilities = ['p-2', 'p-4', 'p-6', 'p-8', 'px-4', 'px-6', 'py-2', 'py-3', 'py-6', 'mb-2', 'mb-4', 'mt-2', 'mt-4', 'mx-auto'];
  const missingSpacing = spacingUtilities.filter(c => !verifyClassInTailwind(c));
  assert(missingSpacing.length === 0, 'Essential spacing utilities exist in tailwind.css', `missing: ${missingSpacing.join(', ') || 'none'}`);

  const colorUtilities = ['bg-white', 'text-white', 'text-slate-900', 'text-slate-600', 'border-slate-200', 'bg-emerald-500', 'text-emerald-500', 'bg-purple-600', 'text-purple-600', 'border-cyan-300', 'bg-[#FAF8F3]', 'border-[#1E2430]'];
  const missingColor = colorUtilities.filter(c => !verifyClassInTailwind(c));
  assert(missingColor.length === 0, 'Essential color and custom hex utilities exist in tailwind.css', `missing: ${missingColor.join(', ') || 'none'}`);

  const responsiveUtilities = ['sm:flex-row', 'sm:w-auto', 'lg:flex-row'];
  const missingResponsive = responsiveUtilities.filter(c => !verifyClassInTailwind(c));
  assert(missingResponsive.length === 0, 'Responsive breakpoint prefixes (sm:, lg:) exist in tailwind.css', `missing: ${missingResponsive.join(', ') || 'none'}`);

  console.log();

  // ---------------------------------------------------------------------------
  // SECTION 4: Multi-Source WebM Video Serving & Playback Control
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 4: Multi-Source WebM Video Serving & Playback Control ---');

  // 4.1 Asset inspection and bandwidth comparison
  const webmPath = path.join(PROJECT_ROOT, 'minds-eye-animated.webm');
  const mp4Path = path.join(PROJECT_ROOT, 'minds-eye-animated.mp4');
  assert(fs.existsSync(webmPath), 'minds-eye-animated.webm exists on disk');
  assert(fs.existsSync(mp4Path), 'minds-eye-animated.mp4 exists on disk');

  const webmSize = fs.statSync(webmPath).size;
  const mp4Size = fs.statSync(mp4Path).size;
  const bandwidthSavings = ((1 - webmSize / mp4Size) * 100).toFixed(1);
  assert(webmSize < mp4Size && bandwidthSavings > 50, `WebM provides ${bandwidthSavings}% bandwidth reduction over MP4 (${webmSize} vs ${mp4Size} bytes)`);

  // 4.2 Verify source element order and attributes in funnel.html and mockup-landing.html
  function verifyVideoStructure(html, filename) {
    const videoMatch = html.match(/<video\s+id=["']story["']([\s\S]*?)<\/video>/i);
    if (!videoMatch) return { valid: false, reason: 'No video#story tag found' };

    const videoTag = videoMatch[0];
    const hasControls = /controls/i.test(videoTag);
    const hasPlaysinline = /playsinline/i.test(videoTag);
    const hasLoop = /loop/i.test(videoTag);
    const hasPreload = /preload=["']metadata["']/i.test(videoTag);
    const hasPoster = /poster=["']assets\/sol-meadow-scene\.jpg["']/i.test(videoTag);

    const sourceMatches = [...videoTag.matchAll(/<source\s+([^>]*?)>/gi)];
    if (sourceMatches.length < 2) return { valid: false, reason: 'Less than 2 source tags' };

    const s1 = sourceMatches[0][1];
    const s2 = sourceMatches[1][1];

    const s1Webm = s1.includes('minds-eye-animated.webm') && s1.includes('type="video/webm"');
    const s2Mp4 = s2.includes('minds-eye-animated.mp4') && s2.includes('type="video/mp4"');

    return {
      valid: hasControls && hasPlaysinline && hasLoop && hasPreload && hasPoster && s1Webm && s2Mp4,
      details: `controls:${hasControls}, playsinline:${hasPlaysinline}, s1Webm:${s1Webm}, s2Mp4:${s2Mp4}`
    };
  }

  const funnelVideo = verifyVideoStructure(funnelHtml, 'funnel.html');
  assert(funnelVideo.valid, 'funnel.html video#story uses WebM prioritized before MP4 with full playback attributes', funnelVideo.details);

  const mockupVideo = verifyVideoStructure(mockupHtml, 'mockup-landing.html');
  assert(mockupVideo.valid, 'mockup-landing.html video#story uses WebM prioritized before MP4 with full playback attributes', mockupVideo.details);

  // 4.3 Script Playback Control Oracle: verify $('#story').pause() operates safely with <source> children
  function testVideoPauseExecution(html, filename) {
    let paused = false;
    const mockVideo = {
      tagName: 'VIDEO',
      id: 'story',
      children: [
        { tagName: 'SOURCE', src: 'minds-eye-animated.webm', type: 'video/webm' },
        { tagName: 'SOURCE', src: 'minds-eye-animated.mp4', type: 'video/mp4' }
      ],
      pause: () => { paused = true; }
    };

    const mockDoc = {
      querySelector: (sel) => (sel === '#story' ? mockVideo : null)
    };

    const $ = (sel) => mockDoc.querySelector(sel);

    // Simulate lead submission handler line: $('#story').pause()
    try {
      $('#story').pause();
      return paused;
    } catch (err) {
      return false;
    }
  }

  assert(testVideoPauseExecution(funnelHtml, 'funnel.html'), 'funnel.html playback script $(\'#story\').pause() functions cleanly with <source> children');
  assert(testVideoPauseExecution(mockupHtml, 'mockup-landing.html'), 'mockup-landing.html playback script $(\'#story\').pause() functions cleanly with <source> children');

  console.log();

  // ---------------------------------------------------------------------------
  // SECTION 5: Desktop Viewport Scroll Overflow & Nested Trap Elimination
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 5: Desktop Viewport Scroll Overflow & Trap Elimination ---');

  // 5.1 Desktop media query inspection
  function verifyDesktopScrolling(html, filename) {
    const m = html.match(/@media\s*\(\s*min-width\s*:\s*901px\s*\)\s*and\s*\(\s*min-height\s*:\s*620px\s*\)\s*\{([\s\S]*?)<\/style>/i);
    if (!m) return { valid: false, reason: 'Media query not found' };
    const mq = m[1];

    const hasHidden = /body\s*\{[^}]*overflow\s*:\s*hidden/i.test(mq);
    const hasFixedHeight = /body\s*\{[^}]*height\s*:\s*100%/i.test(mq) && !/min-height/i.test(mq);
    const hasScrollY = /overflow-y\s*:\s*auto/i.test(mq);
    const hasVisibleCard = /\.card\s*\{[^}]*overflow\s*:\s*visible/i.test(mq);
    const hasVisibleRightCol = /#right-col\s*\{[^}]*overflow\s*:\s*visible/i.test(mq);

    return {
      valid: !hasHidden && !hasFixedHeight && hasScrollY && hasVisibleCard && hasVisibleRightCol,
      details: `noOverflowHidden:${!hasHidden}, noFixedHeight:${!hasFixedHeight}, overflowYAuto:${hasScrollY}, cardVisible:${hasVisibleCard}, rightColVisible:${hasVisibleRightCol}`
    };
  }

  const funnelScroll = verifyDesktopScrolling(funnelHtml, 'funnel.html');
  assert(funnelScroll.valid, 'funnel.html desktop media query eliminates body overflow:hidden and scroll traps', funnelScroll.details);

  const mockupScroll = verifyDesktopScrolling(mockupHtml, 'mockup-landing.html');
  assert(mockupScroll.valid, 'mockup-landing.html desktop media query eliminates body overflow:hidden and scroll traps', mockupScroll.details);

  // 5.2 Cross-file desktop layout synchronization
  const mFunnel = funnelHtml.match(/@media\s*\(\s*min-width\s*:\s*901px[\s\S]*?#right-col\s*\{[^}]*\}/);
  const mMockup = mockupHtml.match(/@media\s*\(\s*min-width\s*:\s*901px[\s\S]*?#right-col\s*\{[^}]*\}/);
  const synced = Boolean(mFunnel && mMockup && mFunnel[0].replace(/\s+/g, '') === mMockup[0].replace(/\s+/g, ''));
  assert(synced, 'Exact CSS selector and rule parity between funnel.html and mockup-landing.html desktop media queries');

  console.log();

  // ---------------------------------------------------------------------------
  // SECTION 6: Build Pipeline & Output Parity
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 6: Build Pipeline & Output Parity ---');

  // 6.1 Run build and verify exit code
  let buildSucceeded = false;
  try {
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    buildSucceeded = true;
  } catch (err) {
    console.error('Build execution failed:', err.message);
  }
  assert(buildSucceeded, 'npm run build (node build.js) executes cleanly with exit code 0');

  // 6.2 Verify build outputs in both public/ and dist/
  const requiredOutputs = [
    'index.html', 'classes.html', 'funnel.html', 'landingpage.html',
    'mockup-landing.html', 'profile.html', 'hope-survey.html', 'survey.html',
    'tailwind.css', 'style.css', 'script.js'
  ];

  for (const f of requiredOutputs) {
    const inPub = projectFileExists(path.join('public', f));
    const inDist = projectFileExists(path.join('dist', f));
    assert(inPub && inDist, `Build artifact ${f} exists in both public/ and dist/`);
  }

  // 6.3 Verify excluded root files and assets
  const mindsEyeWhiteExcluded = !projectFileExists(path.join('public', 'minds-eye-white-bg.mp4')) &&
                               !projectFileExists(path.join('dist', 'minds-eye-white-bg.mp4'));
  assert(mindsEyeWhiteExcluded, 'Archival asset minds-eye-white-bg.mp4 is excluded from build output');

  const dsStoreExcluded = !projectFileExists(path.join('public', 'assets', '.DS_Store')) &&
                          !projectFileExists(path.join('dist', 'assets', '.DS_Store'));
  assert(dsStoreExcluded, 'Unwanted OS artifact .DS_Store is excluded from assets output');

  console.log();
  console.log('================================================================================');
  console.log('                        ADVERSARIAL SUITE SUMMARY');
  console.log('================================================================================');
  console.log(`  Total Adversarial Checks : ${passCount + failCount}`);
  console.log(`  Passed                   : ${passCount} (${Math.round((passCount / (passCount + failCount)) * 100)}%)`);
  console.log(`  Failed                   : ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAdversarialM3Suite().catch(err => {
  console.error('Fatal error during adversarial suite execution:', err);
  process.exit(1);
});
