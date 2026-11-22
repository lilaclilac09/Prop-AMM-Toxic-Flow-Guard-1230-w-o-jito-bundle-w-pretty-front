# Acceptance audit — 2026-11-22

Existing work checked only against [ACCEPTANCE.md](../ACCEPTANCE.md), AGENTS.md, CLAUDE.md, `.cursor/rules/acceptance.mdc`, and README instructions. No criteria imported from other repos.

## Failing items

| Item | ACCEPTANCE § | Source rule | Status / evidence |
|------|--------------|-------------|-------------------|
| README local startup renders blank | §2, §3, §6 | `verification.mdc`, `debug-repro-loop.mdc`, repo README | **Fixed locally here:** add the missing module entry script in index.html. Before patch, Chromium observed empty body text and rootChildren 0; after patch, existing dashboard and controls render and the interaction checks pass. Not claimed fixed in production. |
| README lacks product status and next action | §5 | `AGENTS.md` 施工队安全条例; `ship-visible-mvp.mdc` | **Fixed here:** BLOCKED plus redeploy/verify next action. The configured Vercel homepage exists (HTTP 200), but Chromium observed an empty React root there too. |
| UI implies live Solana/Helius monitoring although data is simulated | §2, §5 | `verification.mdc`; `ship-visible-mvp.mdc` “Demo ≠ product” | **Fixed here:** qualify live-sync/mainnet labels as simulation and document actual data provenance. App.tsx generates random transactions; no feed transport is connected. Simulation logic unchanged. |
| Existing UI lacks recorded 390×844 stills and interaction proof | §4 | `ui-step-screenshot.mdc` | **Fixed here for current local UI:** PNGs and animated WebP walkthrough. UI was introduced through direct commits, not a prior UI PR. Historical task replies cannot be recreated. |
| README requires a Gemini key for an app that never imports its Gemini service | §6 | repo README setup instructions | **Fixed here:** key is not required for current simulation; unused service does not provide a UI analysis flow. No secrets requested or used. |
| Production remains blank | §5, §7 | `AGENTS.md` production proof and blocker table | **Not fixable here:** branch push is authorized, not deployment. Existing Vercel homepage must be redeployed and checked before any production-fixed claim. |

## Reproduction → root cause → minimal fix

1. Ran README's `npm run dev`; used Playwright Chromium at 390×844 on localhost and the configured homepage.
2. Hypotheses: missing bootstrap versus runtime failure versus wrong homepage. Both pages report title `ToxicGuard | Fluid Lane Security`, empty body text and rootChildren 0. Local page has only Vite's injected module scripts; production has none. Fetched production HTML also has the empty root and no app entry script. This disproves a running React component failure as the cause of the blank page.
3. `index.tsx` already mounts App into #root. `index.html` never loads it. Adding `<script type="module" src="/index.tsx"></script>` connects the existing implementation, without rewriting it. Build output now contains an application bundle; Chromium renders the dashboard and existing controls.
4. Live-data claim check: App.tsx calls `fetchBatchTransactions` on mount and its timer. That callback creates signatures, statuses, compute units and transaction categories using Math.random, and calls LaneManager. Search of app/services finds no live fetch/WebSocket ingestion; geminiService is not imported by the app. Labels are qualified, not simulated behavior removed.

## Passing items and historical limits

- **§1:** inspected rules, implementation, git history and all PRs before patching. Minimal bootstrap, copy and documentation changes; no new project dependencies, layout redesign, refactor or deleted flow. Historical internal planning/approval is not knowable from git and is not asserted.
- **§2:** build and typecheck executed; real browser captures and command output available. No lint or test scripts exist in package.json, so neither is claimed run.
- **§3:** reproduced blank page before editing and checked an alternative explanation; bootstrap fix uses existing index.tsx. No speculative detection-engine fix.
- **§4:** current local screenshot and interaction evidence produced. Checks cover populated state, pause, clear-to-empty and resume/repopulation; no complete accessibility or responsive-layout certification claimed.
- **§5:** `gh pr list --state all --limit 100` lists only merged process PR #1. API merge SHA is `d3585121f5321118d2ac78bc8f63eadadbc3a0ef`; after fetch, `git merge-base --is-ancestor d3585121f5321118d2ac78bc8f63eadadbc3a0ef origin/main` exits 0. Repository homepage is https://v0-3-d-galaxy-page-kappa.vercel.app (HTTP 200, blank root), has_pages false, Pages API HTTP 404, deployments API `[]`. No production fix claimed.
- **§6:** AGENTS.md, CLAUDE.md and the only Cursor rule delegate to ACCEPTANCE.md. README startup used; setup prerequisite corrected to reflect unused Gemini service.
- **§7:** remaining production limitation is explicitly recorded below.
- **§8:** `gh api repos/lilaclilac09/Prop-AMM-Toxic-Flow-Guard-1230-w-o-jito-bundle-w-pretty-front/pulls/1 --jq .body | python scripts/check_acceptance.py` prints `ACCEPTANCE.md: evidence closer complete`. **No past PRs fail the closer check.** PR #1 changes process files only. UI came from direct commits, whose original task replies are unavailable; no historical bodies were edited.

## Checks and artifacts

| Exact command | Output / result |
|---------------|-----------------|
| `npm run build` | `✓ 1702 modules transformed.`; `✓ built in 2.13s`; exit 0 |
| `npx tsc --noEmit` | no diagnostics; exit 0 |
| `node /home/ubuntu/audit-artifacts/Prop-AMM-Toxic-Flow-Guard-1230-w-o-jito-bundle-w-pretty-front/repro.cjs` | before patch: localhost and production rootChildren 0, empty bodyText |
| `node /home/ubuntu/audit-artifacts/Prop-AMM-Toxic-Flow-Guard-1230-w-o-jito-bundle-w-pretty-front/capture.cjs` | `PASS: 390x844 root renders, generated rows, pause, clear empty state, resume repopulates`; `Page errors: []` |

Artifacts, not committed, under `/home/ubuntu/audit-artifacts/Prop-AMM-Toxic-Flow-Guard-1230-w-o-jito-bundle-w-pretty-front/`:

- `local-before-390x844.png`, `production-before-390x844.png`
- `running-390x844.png`, `paused-390x844.png`, `empty-390x844.png`, `resumed-390x844.png`
- `walkthrough-390x844.webp`, encoded from actual `video/page@d04876ee1cc8e697030c667f804f7ac3.webm`
- `repro.cjs`, `capture.cjs`, `ui-result.json`, `build.log`, `types.log`, `encode.log`

Browser used installed Google Chrome through Playwright against `npm run dev`, without API credentials or mocked UI. Running and empty screenshots were opened and inspected. Browser tooling resides outside the repo. No draft PR body was written, per owner instruction.

Observed but not assigned a new acceptance criterion: at 390×844 the fixed-height layout collapses the populated transaction feed, although its generated rows exist in the DOM; the empty-state feed expands but its message is clipped. Pause/resume, simulation badge and lane widgets are visible. No generic mobile-layout criterion exists in this repo's rules; this audit does not claim to fix or certify responsive usability.

The pre-existing untracked package-lock.json is left untouched and excluded from the commit.

## Blockers

| blocked_on | evidence | impact | human_action | not_doing |
|------------|----------|--------|--------------|-----------|
| Production redeployment | configured homepage HTTP 200; Chromium rootChildren 0, no application module script | degraded: local fix verified; production acceptance blocked | Redeploy audited branch after merge and verify the homepage | No localhost-as-production, no unrequested deployment or production-fixed claim |

Status: BLOCKED — next human action: redeploy after merge and verify production. Safe-to-merge below assesses this minimal diff, not production readiness.

```txt
root cause: index.html omitted the existing React entry script; README omitted status and required an unused API key; UI labels overstated randomly generated data as live monitoring.
files changed: index.html; App.tsx; README.md; notes/acceptance-audit-2026-11-22.md.
checks run: npm run build exit 0; npx tsc --noEmit exit 0; historical PR #1 evidence checker passes; Playwright reproduction and post-patch interaction checks executed.
manual QA: inspected running and empty 390x844 screenshots; Chromium exercised root render, generated rows, pause, clear and resume; no page errors.
verification: PNGs, animated WebP, scripts and logs in /home/ubuntu/audit-artifacts/Prop-AMM-Toxic-Flow-Guard-1230-w-o-jito-bundle-w-pretty-front/; production blank page observed before patch, not redeployed.
remaining risks: production remains blank until redeployment; existing mobile feed collapse; simulation is not live monitoring or enforcement; CDN styling remains an existing external dependency.
manual steps: redeploy after merge and verify production before claiming production acceptance.
safe to merge: yes
```
