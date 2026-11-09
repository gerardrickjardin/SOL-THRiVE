# THRiVE Coaching (`SOL-THRiVE`) — Agent & Co-Editing Rules

## 1. Ownership & Deployment Context
- **Repository**: `gerardrickjardin/SOL-THRiVE` (`origin/main`)
- **Co-Developers**:
  - **Lucas Huff** (`@LucasSOLT`, `233151608+LucasSOLT@users.noreply.github.com`) — Owner / Lead Developer (works across Main PC and MacBook)
  - **Gerard Rick Jardin** (`@gerardrickjardin`, `gerard@soltheory.com`, `gerardrickjardin@gmail.com`) — Coworker / Co-Developer
- **Vercel Deployment**: Project `sol-th-ri-ve` inside Vercel team `gerard-6963s-projects` (`https://thrivecoaching.ai`)

---

## 2. Mandatory Co-Editing Git Protocol
1. **Before Any Edits**:
   ```bash
   git fetch origin
   git status
   git pull --rebase origin main
   ```
   Always pull incoming commits from Gerard or Lucas's Main PC before modifying files.
2. **Build Sync Requirement (`public/` is Tracked in Git)**:
   - `node build.js` (`npm run build`) compiles root HTML/JS/CSS into `public/`.
   - **Always run `npm run build` before committing** so `public/index.html`, `public/funnel.html`, and related assets stay synchronized with root source files.
   - Note: `SOL-THRiVE/build.js` safely substitutes `"__SERVER_PROXY__"` for client API key placeholders so raw keys are never leaked into `public/`.
3. **Parallel Landing Files**:
   - `funnel.html` and `mockup-landing.html` share landing sections. Whenever you update shared funnel copy or styles, check whether both files should be updated before running `npm run build`.
4. **Before Pushing**:
   ```bash
   git fetch origin
   git pull --rebase origin main
   git push origin main
   ```
