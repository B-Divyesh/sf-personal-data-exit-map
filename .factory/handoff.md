# Repair handoff — Personal Data Exit Map 1.0.1

Date: 2026-09-06 UTC
Work order: `personal-data-exit-map-repair-2`
Verdict: **PASS — release blocker and minor target issue repaired.**

## Release identity

- Product repair commit: `9b656022eef1cabfc784aeea99075b7700659423`.
- Final verified implementation commit: `41a71848329099464a2ab21d416b240c6b1ad900`. The two commits after the repair are test-only reliability and demo-boundary proofs.
- Deployment build commit: `8cfc8264957b8b1d733953a0093eba7025102f09`; deployment `1e27cc30-481e-40bd-8924-bc199e53fa77` succeeded on the existing `sf-personal-data-exit-map` static app.
- The 24 public non-source-map files from the final `41a7184` build exactly match HTTPS production bytes. The final commit changed tests only, so no additional production image was needed.
- Documentation/report commit: this handoff is committed after the implementation and does not change the deployed artifact.

## What changed

- `npm run test:claims` now builds `dist/` before starting the production preview. Every exact claim command can run first after `npm ci` in a clean clone.
- The service-worker update toast's **Reload** control now has a minimum 44 × 44 CSS px target. A browser regression test measures the rendered control on desktop and mobile projects.
- The demo-sandbox claim now writes a sentinel to the real IndexedDB `settings` store before demo entry and proves that reset/exit remove only `demo:personal-data-exit-map`; the real sentinel remains unchanged.
- The demo-exit assertion waits for the destination document before inspecting IndexedDB, removing a navigation race discovered during the clean-clone suite.
- Added the verb-first catalog description in `.factory/catalog-description.txt` and copied it to `/work/.evidence/catalog-description.txt`.

## Current disposition of earlier findings

- **Claims inventory / clean claim entry:** resolved. `.factory/claims.json` still lists 13 public claims, each with one tagged outcome test. All 13 listed commands passed first from a fresh clone without an existing `dist/`.
- **One-click isolated demo:** remains resolved. Fresh live desktop and phone contexts show the sample action before scrolling, the six-file Google Takeout map, and the persistent demo label. Reset regenerates the sample; Start for real removes only the demo database. The automated sentinel proof confirms real browser state is not changed.
- **First-screen wording:** remains resolved. Before scrolling on desktop and phone: job “Map what leaves with you.”; audience “people leaving a service or preparing for lockout”; first action “Try it with sample data,” followed by “A prepared Google export opens next.”
- **404, metadata, policy, cache, and target findings:** remain resolved. Live `/demo/`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200. An unknown route returns HTTP 404 with the designed page. The manifest is `application/manifest+json`; immutable asset caching, CSP with `frame-ancestors 'none'`, Permissions Policy, referrer policy, and `nosniff` are present.
- **Previous minor accessibility findings:** remain resolved. The clean E2E suite covers skip-link focus, 390 px overflow, guide target size, axe, reduced motion, route metadata, and the new 44 px Reload target. The live Reload control measured 85.9 × 44 px on both desktop and 390 px phone contexts.

## Verification

Final clean checkout at `41a7184`, starting with no `dist/`:

```sh
npm ci
# Each exact command from .factory/claims.json, individually:
npm run test:claims -- --grep @claim:<id>
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- `npm ci`: passed; 143 packages installed, no vulnerabilities reported.
- All 13 individual claim commands: passed. Each built the production artifact, then ran its one requested claim test in Chromium.
- `npm run lint`: passed with no warnings.
- `npm run typecheck`: passed.
- `npm test`: 6/6 unit tests passed.
- `npm run build`: passed; `dist/index.html` is at the deploy root. Initial app JS is 31.17 KB raw / 11.25 KB gzip; CSS is 20.33 KB raw / 5.10 KB gzip; hero WebP is 74.19 KB.
- `npm run test:e2e`: 38/38 passed across desktop Chromium and Pixel 5. This includes normal, invalid, boundary, recovery, offline, signing/tampering, demo reset/exit, keyboard, mobile, reduced-motion, and axe paths.
- `verify-url.sh` against HTTPS production: HTTP 200; 884 ms load; title, `lang`, one H1, main landmark, image alt text, and button names present; zero console or page errors.
- Fresh live desktop and phone checks made only same-origin requests. Both loaded the realistic six-file sample. Live offline reload retained Google Takeout and the six-file map without errors.
- Live response checks: expected public routes return 200, the unknown route returns designed HTTP 404, and all 24 public production files exactly match the final build.
- A current Lighthouse 13.4.1 attempt reached 100/100/100/100 category scores with FCP 1.0 s, LCP 1.2 s, TBT 0 ms, and CLS 0, but the supplied Playwright Chromium crashed while Lighthouse collected its full-page screenshot. The output therefore has a `TARGET_CRASHED` runtime warning and is not claimed as a clean Lighthouse completion. Previous independent verification completed Lighthouse successfully at 99/100/100/100; the current build-size, Playwright, axe, and live checks pass.

## Product scope and limits

- This remains a free, static, local-first PWA. It has no backend, sign-in, billing offer, API rate limits, tenant data, or paid entitlement path; backend and billing checks are not applicable. No billing metadata is required for the brief's free product.
- Parser 1.0 supports ordinary single-disk ZIP central directories and direct JSON/CSV. ZIP64, split archives, TAR, encrypted content extraction, and service-schema completeness checks remain outside scope.
- Archive reading/hashing uses one in-memory `ArrayBuffer` and enforces the 1.5 GB safety limit.
- The device-local ECDSA signature detects manifest modification. It is not identity proof, a trusted timestamp, legal certification, platform-access restoration, or social-relationship migration.
- Manual official export destinations require a network connection. Cached in-app steps and local analysis remain available offline.

## Evidence

- Live audit output: `/work/.evidence/personal-data-exit-map-repair-2/verify.json`
- Lighthouse output with the runtime-warning caveat: `/work/.evidence/personal-data-exit-map-repair-2/lighthouse-mobile.json`
- Catalog description: `/work/.evidence/catalog-description.txt`
