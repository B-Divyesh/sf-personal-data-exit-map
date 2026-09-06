# Verification 3 — map personal data before leaving a service

Verified 2026-09-06 UTC for work order `personal-data-exit-map-verify-3`.

- Implementation candidate: `41a71848329099464a2ab21d416b240c6b1ad900`
- Product repair: `9b656022eef1cabfc784aeea99075b7700659423`
- Documentation baseline: `d26f3c74bdbafcc21e06c067e7a7d7cfe55515bd` (`e36fd923487bdc91a53d19f8d711500881d9441a` is the repair report)
- Live URL: <https://personal-data-exit-map.sociobot.in>
- Verdict: **FAIL**
- Findings: **1 minor**
- Untested public claims: **1**
- Verification changed reports only. Product code was not changed.

## Job, audience, and first action

Before scrolling, fresh desktop and phone browsers showed:

- Job: **“Map what leaves with you.”**
- Audience: **“For people leaving a service or preparing for lockout, it shows what they can preserve.”**
- First action: **“Try it with sample data.”** The next-step text says a prepared Google export opens next.
- Facts: **No upload**, **Works offline after first visit**, and **Free to use**.

The job, intended person, and safe first action are clear on both screen sizes.

## Finding

### Minor — the public 44 px target claim is false and incompletely tested

The README says the interface uses “≥44 px targets.” Several visible navigation targets on the live product are smaller:

- At 1440 px, the home header links **Demo**, **Inspect**, and **Exit guides** are 21.69 px high.
- The home footer links **Privacy**, **Terms**, and **Source** are 24.80 px high on desktop and at 390 px.
- Legal-page footer links **Privacy** and **Terms** are 24.80 px high on desktop and at 390 px.
- The legal header’s **Demo** target is 43.67 px wide.

The attached accessibility and design contracts require interactive targets to be at least 44 × 44 CSS px. The `@claim:accessible-controls` test measures the home brand and one opened guide link. The separate regression measures **Reload**. Neither checks the header or footer links, and the claim inventory does not list the README’s all-targets statement. The exact claim commands therefore pass while this public claim remains false and incompletely tested.

Evidence: `/work/.evidence/personal-data-exit-map-verify-3/target-confirmation.json` and `/work/.evidence/personal-data-exit-map-verify-3/touch-targets.json`.

## Exact claim commands

A detached clean checkout at the implementation candidate started without `dist/`. After `npm ci`, every command in `.factory/claims.json` was run exactly and individually.

| Claim | Result | Observed outcome |
| --- | --- | --- |
| `demo-sandbox` | PASS | Separate stores, sample, reset, exit, and real-data sentinel |
| `offline-reload` | PASS | Demo reload and reset while offline |
| `local-only` | PASS | Same-origin requests and no selected content in stored assessment |
| `input-support` | PASS | ZIP, JSON, CSV, and exact 1.5 GB boundary |
| `category-map` | PASS | Six categories and five preservation steps |
| `supported-layouts` | PASS | Seven documented service layouts |
| `signed-manifest` | PASS | SHA-256 and independently verified ECDSA P-256 signature |
| `tamper-detection` | PASS | Changed manifest shown as invalid |
| `data-export` | PASS | Complete JSON and one CSV row per file |
| `persistence` | PASS | Checklist and assessment survive reload |
| `service-guides` | PASS | Nine HTTPS destinations |
| `free-no-account` | PASS | Sample completes without login, payment, or billing request |
| `accessible-controls` | PASS | Declared keyboard, 390 px, skip-link, selected-target, and axe checks |

The command log is `/work/.evidence/personal-data-exit-map-verify-3/claims-exact.log`. The untested-claim count is still one because the broader README target-size statement is not represented or completely exercised by those tests.

## Clean checkout gates

| Gate | Result |
| --- | --- |
| `npm ci` | PASS — 143 packages, no reported vulnerabilities |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 6/6 |
| `npm run build` | PASS — `dist/index.html` produced |
| `npm run test:e2e` | PASS — 38/38 across desktop Chromium and Pixel 5 |

Initial app JavaScript is 31.17 KB raw / 11.25 KB gzip. CSS is 20.33 KB raw / 5.10 KB gzip. The hero WebP is 74.19 KB. All are within the stated budgets.

## Live workflow and recovery

Fresh desktop and phone contexts opened the one-click sample. Both showed Google Takeout with high confidence, six mapped files, six populated categories, five reusable categories, one account-dependent category, and a five-step plan. The **Demo — sample data, nothing is saved** label stayed visible.

A sentinel was written to the real `personal-data-exit-map` IndexedDB before demo entry. Reset restored the six-file sample and zero checked steps. **Start for real** removed `demo:personal-data-exit-map`, retained the real database and sentinel unchanged, and returned to `/`.

The live phone recovery run also passed:

- Empty CSV, unsupported TAR, and malformed ZIP messages explain what happened and are announced as alerts.
- A synthetic file one byte above 1.5 GB is rejected.
- A valid empty ZIP shows zero files and explains the next step.
- Reset restores the populated sample after each failure path.
- Delete cancel retains the map; confirm removes it; valid JSON import restores it with a verified signature.
- Guide disclosure works with Enter and Space. An unmatched search gives a next step.
- The native dialog moves focus inside, closes with Escape, and restores focus.
- At 200% browser zoom, the page content and primary action remain available.

Evidence: `live-browser-audit.json` and `live-resilience-audit.json` in the evidence directory.

## Accessibility, routes, privacy, and PWA

- `verify-url.sh` passed: HTTP 200, title, `lang`, one H1, main landmark, alt text, labelled buttons, and no console or page errors.
- Playwright axe found no serious or critical violations on `/`, `/demo/`, `/privacy/`, `/terms/`, or the designed 404 in desktop and phone contexts.
- The skip link has a 3 px visible focus ring and moves focus to `main`.
- Reduced motion changes transitions and animations to `0.001 ms`.
- The repaired **Reload** target measures 85.91 × 44 px on desktop and phone.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `robots.txt`, `sitemap.xml`, and the manifest return 200. An unknown route returns the expected designed HTTP 404.
- Route titles, one-H1 structure, `lang`, landmarks, canonical/social metadata, and 390 px overflow checks pass.
- The manifest is `application/manifest+json` and has no Chromium manifest errors. The worker controls scope `/` and uses cache `exit-map-v1.0.1-shell`.
- Live demo requests stayed on the product origin. No analytics, authentication, billing, upload, cookie, localStorage, or sessionStorage path appeared.
- Offline phone reload returned 200 and retained the six-file sample, demo label, and local tools without errors.
- CSP, `frame-ancestors 'none'`, Permissions Policy, referrer policy, HSTS, and `nosniff` are present. Hashed assets are immutable for one year; `sw.js` is `no-cache`.
- All 24 public non-source-map build files match live bytes.

All same-origin links returned 200. The official X, Discord, and Reddit destinations presented their providers’ automated-browser protection pages; their HTTPS destinations are current and not broken product routes. This is not counted as a product defect.

This is a static local-first PWA. Backend tenant isolation, restart persistence, health endpoints, and 429/`Retry-After` behavior do not apply. It has no paid or AI feature. The brief does not need an AI action for the core local inspection job.

## Performance

Lighthouse 13.4.1 completed without a runtime warning:

- Performance 100
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.01 s, LCP 1.22 s, TBT 64 ms, CLS 0
- 101,883 bytes transferred, with zero third-party requests

Evidence: `/work/.evidence/personal-data-exit-map-verify-3/lighthouse-mobile.json`.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims inventory and claim tests | Resolved; 13 entries and 13 exact commands pass cleanly |
| Missing one-click isolated demo | Resolved; live sample, reset, exit, and real-data sentinel pass |
| First screen omitted the intended audience | Resolved on desktop and phone |
| Missing designed 404 | Resolved; unknown route returns designed HTTP 404 |
| Missing metadata, robots, sitemap, footer identity | Resolved |
| Missing response policies | Resolved |
| Short asset caching | Resolved for hashed assets |
| Home brand and guide link below 44 px | Resolved; covered by claim test |
| Skip link did not move focus | Resolved |
| Wrong manifest MIME | Resolved |
| Missing copy audit and long landing copy | Resolved |
| Offline status appeared before readiness | Resolved; source starts with “Preparing offline access…” |
| Claim commands failed before a build | Resolved; every exact command builds first |
| Reload control below 44 px | Resolved; 85.91 × 44 px live and covered by regression |
| Other navigation/footer targets | **Open; finding above** |

## Verdict

**FAIL.** The main job, demo isolation, privacy boundary, offline behavior, routes, resilience, accessibility automation, deployment parity, and performance all pass. Release acceptance still fails because one public accessibility claim is false and incompletely tested. PASS requires zero findings and zero untested claims.
