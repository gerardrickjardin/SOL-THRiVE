# E2E Test Infra: THRiVE Coaching

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | LearnWorlds Setup Modal Inspection Guide | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | DevTools Bypass & Automation Snippets | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | School Owner Permanent Resolution | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Standalone Class Calendar & Schedule View | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | Timezone Conversion & Calendar Sync (.ics/Google) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | 4-Week Modular Syllabus Presentation | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 7 | Prospective Client Contact / Inquiry Flow | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 8 | Site Navigation Integration | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 9 | Runtime Babel Standalone Elimination | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 10 | Runtime Tailwind CDN Elimination | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 11 | Multi-Source WebM Video Serving | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 12 | Desktop Viewport Overflow Fix | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 13 | Build Pipeline & Repository Sync Verification | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Automated Node.js opaque-box test runner (`tests/e2e-runner.js`)
- Test cases: Covering Tiers 1-4
- Output: Structured TAP or JSON report; exit code 0 on 100% pass.

## Coverage Thresholds
- Tier 1: ≥5 per feature (65 tests)
- Tier 2: ≥5 per feature (65 tests)
- Tier 3: Pairwise combinations of major features (15 tests)
- Tier 4: Realistic end-user workflows (8 tests)
- Total tests: ≥ 150 test assertions
