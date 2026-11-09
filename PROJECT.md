# Project: THRiVE Coaching — November Cohort Integration & Performance Enhancements

## Architecture
- **Platform Stack**: Static HTML/CSS/Vanilla JavaScript compiled via `node build.js` (`npm run build`) into `public/` (tracked in Git) and hosted on Vercel (`sol-th-ri-ve`) with Vercel Serverless Functions in `api/*.js`.
- **Integration Architecture**:
  - Independent, standalone class schedule & calendar component (`classes.html`) avoiding LearnWorlds iframe and API gating dependencies.
  - Client-side calendar synchronization (.ics generation, Google Calendar URL construction).
  - Serverless event ingestion (`api/event.js`) for lead and enrollment inquiries forwarded to Vision Control.
  - High-performance static assets: Pre-compiled JSX (zero runtime Babel), static minified utility CSS (`tailwind.css`, zero runtime Tailwind CDN), and prioritized WebM video streaming.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | LearnWorlds Setup Modal Inspection & Diagnostic Guide | Step-by-step browser DevTools guide diagnosing `.wizard-window-wrapper.-school` and whiteout modal causes | M1 | Survey R1 |
| 2 | LearnWorlds DevTools Bypass & Automation Tools | Multi-browser element deletion, CSS overrides, Console one-liner, bookmarklet, and persistent MutationObserver script | M1 | Survey R1 |
| 3 | LearnWorlds School Owner Permanent Resolution Guide | Admin configuration and onboarding dismissal steps to permanently prevent the modal loop | M1 | Survey R1 |
| 4 | Standalone Class Calendar & Schedule View | Accessible, standalone calendar and schedule interface for November 2026 cohort classes | M2 | Survey R2 |
| 5 | Interactive Timezone Conversion & Calendar Sync | Timezone converter (MT, ET, CT, PT, Local) and RFC 5545 .ics / Google Calendar export | M2 | Survey R2 |
| 6 | 4-Week Modular Syllabus & Curriculum Presentation | Detailed breakdown of CYNEFIN, The Strengths Model, Personos AI, Action Boards & HoPE Index | M2 | Survey R3 |
| 7 | Prospective Client Inquiry & Enrollment Flow | Accessible consultation and enrollment contact form integrating with `/api/event` | M2 | Survey R3 |
| 8 | Site Navigation & Routing Integration | Updated desktop and mobile navigation headers/footers and slug registration in `script.js` | M2 | Survey R2/R3 |
| 9 | Runtime Babel Standalone Elimination | Pre-compile inline JSX in `profile.html` and `hope-survey.html`, eliminating 2.5 MB runtime Babel | M3 | Survey R4 |
| 10 | Runtime Tailwind CDN Elimination | Pre-compile static minified `tailwind.css` for `survey.html`, `profile.html`, and `hope-survey.html` | M3 | Survey R4 |
| 11 | Multi-Source WebM Video Serving | Prioritize `minds-eye-animated.webm` (1.15 MB) before `.mp4` (3.02 MB) in `funnel.html` & `mockup-landing.html` | M3 | Survey R4 |
| 12 | Desktop Viewport Overflow Fix | Remove `overflow: hidden` on desktop body in `funnel.html` & `mockup-landing.html` to restore natural scrolling | M3 | Survey R4 |
| 13 | Build Pipeline & Repository Sync Verification | Update `build.js` to register new files, compile to `public/`, and ensure clean Git parity | M4 | Survey R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | LearnWorlds Troubleshooting Manual | R1: Complete guide in `docs/learnworlds-troubleshooting.md` | none | DONE |
| M2 | Class Calendar, Schedule & Program Discovery / Contact Flow | R2 & R3: `classes.html`, navigation, contact form, calendar sync | none | DONE |
| M3 | Frontend Performance & Viewport Overflow Enhancements | R4: Eliminate Babel/Tailwind CDN, WebM video, fix body overflow | none | DONE |
| M4 | Build & Integration Verification | R4 & System: `npm run build`, `public/` sync, E2E validation | M1, M2, M3 | DONE |

## Interface Contracts
### `classes.html` ↔ `script.js` & `style.css`
- Navigation header links `classes.html` via `href="/classes"` (or `classes.html`).
- `script.js`: `KNOWN_PAGE_SLUGS.add('classes')` and `KNOWN_PAGE_SLUGS.add('schedule')`.
- Timezone converter dispatches custom event or updates `.session-time-display` innerText.
- Contact form submits JSON payload: `{ type: 'lead', lead: { name, email, phone, notes, source: 'cohort-inquiry' } }` to `POST /api/event`.

### `build.js` ↔ `public/`
- `files` array includes `'classes.html'` and `'tailwind.css'`.
- `build.js` sanitizes `%VITE_` tokens and outputs byte-for-byte to `dist/` and `public/`.

## Code Layout
- Root source files: `index.html`, `approach.html`, `classes.html`, `funnel.html`, `mockup-landing.html`, `profile.html`, `hope-survey.html`, `survey.html`, `style.css`, `script.js`, `tailwind.css`, `build.js`
- Compiled tracking output: `public/*` (strictly synchronized with root source files)
- Documentation: `docs/learnworlds-troubleshooting.md`
- Backend serverless functions: `api/*.js`
