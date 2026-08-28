# Repair handoff — Personal Data Exit Map 1.0.1

Work order: `personal-data-exit-map-repair-1`

Verifier report: `e9c6b569251e38514cb6febff4afcdf3916b3340`

Repaired candidate: `ba2776ea0170ca7054942f585a40937d12092d05`

Date: 2026-08-28 UTC

## What was repaired

- **RB-1, claims:** added `.factory/claims.json` with 13 public claims. Every ID occurs in exactly one `@claim:<id>` Playwright test. The tests use the clean demo entry and assert outcomes including privacy, isolation, offline reload, supported inputs/layouts, signing, tamper detection, CSV/JSON contents, persistence, guides, free use, and accessibility.
- **RB-2, demo:** added the first-screen **Try it with sample data** action and `/demo/` plus `/?demo=1`. It builds a realistic six-file Google Takeout ZIP in memory and runs the production worker/signing flow. Demo data and its signing key use `demo:personal-data-exit-map`; real data uses `personal-data-exit-map`. Reset and exit delete the demo store. `.factory/demo.md` documents the boundary.
- **RB-3, first read:** changed the headline to “Map what leaves with you.” The 15-word support sentence names people leaving a service or preparing for lockout. The safe sample action explains what opens next. All first-screen copy is within the 22-word cap.
- Added the designed 404 page and Azure 404 response override, canonical/Open Graph/Twitter metadata, a 1200×630 social image, Apple touch icon, `robots.txt`, and `sitemap.xml`.
- Added CSP with `frame-ancestors`, Permissions Policy, immutable `/assets/*` caching, no-cache service worker/HTML policy, and explicit Web Manifest MIME configuration.
- Raised the mobile brand and outbound guide link targets to 44 px. Skip-link activation now transfers focus to `main` on app and legal pages.
- Replaced the premature “Ready offline” label with “Preparing offline access…” until `navigator.serviceWorker.ready` resolves.
- Fixed the offline module reload root cause: Vite responses vary on `Origin`, while install-time precache requests do not. Same-origin cache lookup now ignores `Vary`, so cached JS and CSS load after a real offline reload.
- Added ESLint, release-policy unit tests, route-wide axe coverage, social metadata regressions, and `.factory/copy-audit.md`.

The archive inspector, classifier, local ECDSA signing, imports/exports, preservation checklist, service guides, original visual system, privacy boundary, and previously passing error/empty states remain intact.

## Clean verification evidence

Executed from `/work/repo` after a clean `npm ci`:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

- `npm ci`: 143 packages installed; 0 vulnerabilities.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm test`: 2 files, 6/6 unit/release-policy tests passed.
- `npm run build`: passed and produced `dist/index.html`, `dist/demo/index.html`, legal routes, 404, SEO files, static response configuration, and service worker.
- `npm run test:e2e`: 36/36 passed across desktop Chromium and Pixel 5. This includes all 13 claim tests on both projects and axe on `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` at desktop and 390 px.
- Dedicated claim run: `npm run test:claims` passed 13/13 in Chromium. A source audit confirmed each claims ID has exactly one matching test tag.
- Offline claim: after service-worker control, Playwright set the browser offline, reloaded `/demo/`, reset the demo while still offline, and regenerated the six-file signed map.
- Privacy claim: a unique JSON secret produced only same-origin requests and was absent from IndexedDB assessments, cookies, localStorage, and sessionStorage.
- Signature claim: Node Web Crypto independently verified the downloaded ECDSA P-256/SHA-256 manifest; a changed signed path imported as “Signature invalid”.
- Factory `verify-url.sh` against the production preview: HTTP 200, 542 ms load, correct title/lang, one H1, main present, zero missing alts, zero unlabeled buttons, and zero console/page errors.
- Lighthouse 12.8.2 mobile preset: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.4 s, LCP 1.8 s, TBT 0 ms, CLS 0, 100 KiB transferred.
- Production payload: initial app JS 31.17 KB plus 0.77 KB helper; app CSS 20.31 KB; worker 3.07 KB; hero 74.19 KB. All are below contract budgets.
- `git diff --check`: passed.
- Package/consumer checks: not applicable; this is a static PWA, not a package or CLI.
- Backend concurrency/rate-limit/identity checks: not applicable; the artifact has no application backend or authentication.

## Deployment

Target: Azure Static Web App `sf-personal-data-exit-map`, custom domain <https://personal-data-exit-map.sociobot.in>, using `/opt/fleet/lib/deploy-static.sh personal-data-exit-map /work/repo/dist`.

Repair commit `65c30a2` was pushed to `origin/main`. Deployment `2b7b5d8d-22d2-4a5d-b17e-e8ac444310fa` completed successfully to the existing Standard static app in Central US (`agreeable-mushroom-04df2bb10.7.azurestaticapps.net`). The custom domain remained `Ready` and returned HTTPS 200.

Live verification after deployment:

- Factory `verify-url.sh`: HTTP 200, 873 ms load, expected title and `lang`, one H1, main present, zero missing alts, zero unlabeled buttons, and zero console/page errors.
- SHA-256 comparison: all 24 public non-map files in `dist/` matched the live domain byte-for-byte. `staticwebapp.config.json` is deployment configuration and is correctly not publicly served.
- `/demo/`, `/privacy/`, and `/terms/` return 200. An unknown path returns the designed 404 body with HTTP 404. `robots.txt` and `sitemap.xml` return 200.
- The Web Manifest returns `application/manifest+json`. The hashed app JS returns `Cache-Control: public, max-age=31536000, immutable`.
- Live root responses include HSTS, CSP with `frame-ancestors 'none'`, Permissions Policy, strict referrer policy, and `nosniff`.
- Azure identity: resource `sf-personal-data-exit-map`, Standard SKU, Central US, expected default hostname and custom domain.
- Fresh 390 px live demo: correct demo title/banner, Google Takeout and six mapped files, zero overflow, only `demo:personal-data-exit-map`, active `/sw.js`, and `exit-map-v1.0.1-shell` cache. Axe reported zero serious/critical violations; there were zero third-party requests and zero console/page errors.
- Live offline reload retained the Google sample and reported “Offline — local tools ready”.
- Controlled update verification served a byte-changed worker, observed “A refreshed drawing is ready”, activated it through **Reload**, reloaded successfully, and produced zero console/page errors.

## Known product limits retained

- Parser 1.0 does not support ZIP64, multipart/split ZIPs, TAR archives, or password-based content extraction.
- Classification uses paths and extensions. It does not schema-validate changing service exports or prove completeness.
- Reading and hashing uses one in-memory `ArrayBuffer`; the UI enforces the 1.5 GB safety limit.
- A device-local signature detects manifest changes. It is not identity verification, a trusted timestamp, or legal certification.
- Official guide destinations require a network connection; cached in-app steps and all local analysis remain available offline.
