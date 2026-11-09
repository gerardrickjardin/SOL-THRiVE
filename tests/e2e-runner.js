#!/usr/bin/env node

/**
 * tests/e2e-runner.js
 * Opaque-box Automated E2E Test Harness for THRiVE Coaching.
 *
 * Implements the 4-Tier Test Methodology across all 13 project features:
 * - Tier 1: Feature Coverage (>=5 test cases per feature)
 * - Tier 2: Boundary & Corner Cases (>=5 test cases per feature)
 * - Tier 3: Cross-Feature Combinations (>=15 pairwise interaction tests)
 * - Tier 4: Real-World Application Scenarios (>=8 end-to-end user workflows)
 *
 * Usage:
 *   node tests/e2e-runner.js                  # Run all tests
 *   node tests/e2e-runner.js --tier=1         # Run only Tier 1
 *   node tests/e2e-runner.js --tier=1,2       # Run Tiers 1 and 2
 *   node tests/e2e-runner.js --feature=4      # Run tests for Feature 4
 *   node tests/e2e-runner.js --json           # Output JSON report
 *   node tests/e2e-runner.js --tap            # Output TAP report
 *   node tests/e2e-runner.js --strict         # Fail if any test is pending
 */

const { runTier1Tests } = require('./tier1-features');
const { runTier2Tests } = require('./tier2-boundaries');
const { runTier3Tests } = require('./tier3-combinations');
const { runTier4Tests } = require('./tier4-scenarios');

const FEATURE_NAMES = {
  1: 'LearnWorlds Setup Modal Inspection Guide',
  2: 'LearnWorlds DevTools Bypass & Automation Tools',
  3: 'LearnWorlds School Owner Permanent Resolution',
  4: 'Standalone Class Calendar & Schedule View',
  5: 'Interactive Timezone Conversion & Calendar Sync',
  6: '4-Week Modular Syllabus & Curriculum Presentation',
  7: 'Prospective Client Inquiry & Enrollment Flow',
  8: 'Site Navigation & Routing Integration',
  9: 'Runtime Babel Standalone Elimination',
  10: 'Runtime Tailwind CDN Elimination',
  11: 'Multi-Source WebM Video Serving',
  12: 'Desktop Viewport Overflow Fix',
  13: 'Build Pipeline & Repository Sync Verification'
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tiers: null,
    feature: null,
    json: false,
    tap: false,
    strict: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--tier=')) {
      options.tiers = arg.split('=')[1].split(',').map(t => parseInt(t.trim(), 10)).filter(Boolean);
    } else if (arg.startsWith('--feature=')) {
      options.feature = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--tap') {
      options.tap = true;
    } else if (arg === '--strict') {
      options.strict = true;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
THRiVE Coaching E2E Test Suite Runner
=====================================
Usage:
  node tests/e2e-runner.js [options]

Options:
  --tier=<1..4>      Filter execution by tier(s), e.g. --tier=1 or --tier=1,2
  --feature=<1..13>  Filter execution by feature number (1 through 13)
  --json             Output results as machine-readable JSON
  --tap              Output results in Test Anything Protocol (TAP) format
  --strict           Treat pending (in-progress milestone) tests as failures
  --help, -h         Show this help message
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const allTests = [];

  // Execute selected tiers
  const shouldRunTier = (t) => !options.tiers || options.tiers.includes(t);

  if (shouldRunTier(1)) {
    allTests.push(...runTier1Tests());
  }

  if (shouldRunTier(2)) {
    allTests.push(...runTier2Tests());
  }

  if (shouldRunTier(3)) {
    const t3 = await runTier3Tests();
    allTests.push(...t3);
  }

  if (shouldRunTier(4)) {
    const t4 = await runTier4Tests();
    allTests.push(...t4);
  }

  // Filter by feature if requested
  let filteredTests = allTests;
  if (options.feature) {
    filteredTests = allTests.filter(t => t.feature === options.feature);
  }

  const counts = {
    total: filteredTests.length,
    passed: filteredTests.filter(t => t.status === 'PASS').length,
    pending: filteredTests.filter(t => t.status === 'PENDING').length,
    failed: filteredTests.filter(t => t.status === 'FAIL').length
  };

  // Output formatting
  if (options.json) {
    const output = {
      timestamp: new Date().toISOString(),
      counts,
      options,
      results: filteredTests
    };
    console.log(JSON.stringify(output, null, 2));
  } else if (options.tap) {
    console.log(`1..${filteredTests.length}`);
    filteredTests.forEach((t, idx) => {
      const num = idx + 1;
      if (t.status === 'PASS') {
        console.log(`ok ${num} - [${t.id}] ${t.name}`);
      } else if (t.status === 'PENDING') {
        console.log(`ok ${num} - [${t.id}] ${t.name} # SKIP ${t.message}`);
      } else {
        console.log(`not ok ${num} - [${t.id}] ${t.name} # FAIL ${t.message}`);
      }
    });
  } else {
    // Pretty human-readable terminal output
    console.log('\n================================================================================');
    console.log('             THRiVE COACHING E2E AUTOMATED TEST SUITE RUNNER');
    console.log('================================================================================\n');

    let currentTier = null;
    let currentFeature = null;

    for (const test of filteredTests) {
      if (test.tier !== currentTier) {
        currentTier = test.tier;
        console.log(`\n--------------------------------------------------------------------------------`);
        console.log(`>>> TIER ${currentTier}: ${getTierTitle(currentTier)}`);
        console.log(`--------------------------------------------------------------------------------`);
        currentFeature = null;
      }

      if (test.feature && test.feature !== currentFeature) {
        currentFeature = test.feature;
        console.log(`\n  Feature ${currentFeature}: ${FEATURE_NAMES[currentFeature] || 'Cross-Feature'}`);
      }

      const statusBadge = test.status === 'PASS'
        ? '\x1b[32m[PASS]\x1b[0m'
        : test.status === 'PENDING'
          ? '\x1b[33m[PENDING]\x1b[0m'
          : '\x1b[31m[FAIL]\x1b[0m';

      console.log(`    ${statusBadge} ${test.id.padEnd(8)} ${test.name}`);
      if (test.message && test.status !== 'PASS') {
        console.log(`             \x1b[90m↳ ${test.message}\x1b[0m`);
      }
    }

    console.log('\n================================================================================');
    console.log('                             TEST RUN SUMMARY');
    console.log('================================================================================');
    console.log(`  Total Assertions : ${counts.total}`);
    console.log(`  \x1b[32mPassed\x1b[0m           : ${counts.passed} (${Math.round(counts.passed / (counts.total || 1) * 100)}%)`);
    console.log(`  \x1b[33mPending (WIP)\x1b[0m    : ${counts.pending} (${Math.round(counts.pending / (counts.total || 1) * 100)}%)`);
    console.log(`  \x1b[31mFailed\x1b[0m           : ${counts.failed}`);
    console.log('--------------------------------------------------------------------------------');

    // Feature breakdown
    console.log('  Feature Breakdown:');
    for (let f = 1; f <= 13; f++) {
      const fTests = filteredTests.filter(t => t.feature === f);
      if (fTests.length > 0) {
        const pass = fTests.filter(t => t.status === 'PASS').length;
        const pend = fTests.filter(t => t.status === 'PENDING').length;
        const fail = fTests.filter(t => t.status === 'FAIL').length;
        const statusColor = fail > 0 ? '\x1b[31m' : pend > 0 ? '\x1b[33m' : '\x1b[32m';
        console.log(`    Feature ${String(f).padStart(2)}: ${statusColor}${pass} pass\x1b[0m, \x1b[33m${pend} pend\x1b[0m, \x1b[31${fail > 0 ? '1' : '0'}m${fail} fail\x1b[0m — ${FEATURE_NAMES[f]}`);
      }
    }

    console.log('================================================================================\n');
  }

  // Determine exit code
  if (counts.failed > 0) {
    process.exit(1);
  }
  if (options.strict && counts.pending > 0) {
    process.exit(1);
  }
  process.exit(0);
}

function getTierTitle(tier) {
  switch (tier) {
    case 1: return 'Feature Coverage (Happy-Paths & Core Structure)';
    case 2: return 'Boundary & Corner Cases (Missing Fields, Types & Selectors)';
    case 3: return 'Cross-Feature Combinations (Pairwise System Interactions)';
    case 4: return 'Real-World Application Scenarios (End-to-End Workflows)';
    default: return 'General Tests';
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
}

module.exports = { main, parseArgs, FEATURE_NAMES };
