# Independent verification — FAIL

Verified on 2026-08-28 UTC for work order `personal-data-exit-map-verify-1`.

- Candidate commit: `ba2776ea0170ca7054942f585a40937d12092d05`
- Live URL: <https://personal-data-exit-map.sociobot.in>
- Verdict: **FAIL — release blocked**
- Scope of changes made by verification: this report and the verifier note in `.factory/handoff.md`; no product code was changed.

## Release-blocking acceptance failures

### RB-1 — required claims inventory is missing

The first command run from the clean checkout was:

```text
sed -n '1,240p' .factory/claims.json
sed: can't read .factory/claims.json: No such file or directory
```

The claims contract explicitly makes a missing `.factory/claims.json` release-blocking. There were consequently no listed claim commands to run and no `@claim:<id>` tests. Claim-like statements on the live page and in the README—including “No upload”, “Works offline”, the 1.5 GB limit, device-local processing/storage, signed-manifest verification, supported service layouts, and CSV/JSON export—are all unlisted.

### RB-2 — no one-click sample-data demo or sandbox

The live `/`, `/demo`, and `/?demo=1` routes were opened in fresh browser contexts. All three show the ordinary upload screen. Each had:

```text
Try it with sample data: absent
Demo — sample data, nothing is saved: absent
Reset demo: absent
Start for real: absent
```

There is no `.factory/demo.md`, sample archive, demo mode, or `demo:` storage namespace. A visitor must supply personal data before seeing any result. This directly fails the mandatory demo-sandbox gate.

### RB-3 — first screen does not identify the intended person/situation

Cold first read at 1440×1000:

- What it does: opens a personal export and maps reusable versus account-dependent data.
- For whom: **not stated**. It does not plainly say “people leaving a service” or “people preparing for lockout”.
- What to click first: “Inspect an export”, which jumps to the user-file picker; there is no safe sample action.

The headline is “Know what leaves with you.” The supporting sentence is 25 words, above the 22-word hard cap. The upload introduction is 23 words. Because the first screen does not answer all three required questions and has no sample-data action, the explicit first-read acceptance gate fails.

## Additional defects

### Moderate

1. **No real 404 route.** `/definitely-not-a-route` returns HTTP 200 and the home page. `/demo` also silently returns the home page. No designed 404 exists.
2. **Required site metadata is incomplete.** Root/legal pages lack canonical URLs, Open Graph data, Twitter card data, and an Apple touch icon declaration. `robots.txt` and `sitemap.xml` return 404. The footer lacks the required “Built by Param Factory” and candidate/build identity.
3. **Response policy is incomplete.** Live responses include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Content-Type-Options: nosniff`, but no Content-Security-Policy, frame restriction (`frame-ancestors` or `X-Frame-Options`), or Permissions-Policy.
4. **Production caching misses the stated policy.** Hashed JS, CSS, and image assets all return `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable caching. The service worker does cache them locally.
5. **Some mobile targets are below 44 px high.** At 390 px, the home brand measured 40 px high and an opened guide’s outbound text link measured 19 px high. The main actions and disclosures meet or exceed 44 px.

### Minor

1. The skip link visibly receives focus and jumps to `#main`, but Chromium leaves `document.activeElement` on `BODY` rather than the main landmark after activation.
2. `manifest.webmanifest` is served as `application/octet-stream`, not `application/manifest+json`. Chromium nevertheless reported no manifest parse or installability error other than the expected incognito restriction.
3. `.factory/copy-audit.md` is absent. Automated extraction found two landing-page text blocks over 22 words (25 and 23 words).
4. The app labels a fresh online session “Ready offline” before service-worker readiness is established. Actual offline behavior works once the first visit has completed.

## Clean local gates

The checkout began clean on `main` at the exact candidate commit. Dependencies were installed with `npm ci`.

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 61 packages installed; audit reported 0 vulnerabilities |
| `npm test` | PASS | 1 Vitest file, 3/3 tests passed |
| Type check | PASS | `tsc --noEmit` runs inside the production build |
| `npm run build` | PASS | Vite build completed and produced `dist/` |
| `npm run test:e2e` | PASS | 6/6 Playwright tests passed across desktop Chromium and Pixel 5 |
| Lint | N/A | no lint command/configuration exists |
| `git diff --check` | PASS | no whitespace errors before report edits |

Production output sizes:

- Initial app JS: 28.41 KB plus 0.77 KB module-preload helper (10.79 KB gzip combined as reported by Vite)
- Deferred worker JS: 3.07 KB
- App CSS: 18.33 KB / 4.76 KB gzip
- Fonts: 0 KB
- Hero WebP: 74.19 KB

All are below the stated static/PWA budgets.

## Functional end-to-end evidence

Independent Playwright scenarios used fresh contexts and the production preview unless noted.

- A representative six-entry Google Takeout ZIP produced six categories, a five-step preservation checklist, “Google Takeout / High confidence”, and a verified signed manifest.
- The manifest contained six entries, a 64-character SHA-256, and `ECDSA-P256-SHA256`. An independently computed SHA-256 matched.
- A real ZIP produced by the system `zip` tool was inventoried as two files. Its downloaded signature independently verified with Web Crypto; changing an entry path made verification fail. Importing that tampered assessment showed “Signature invalid”.
- Inventory CSV contained the header plus one row per file (7 lines for 6 files); JSON and manifest downloads completed with appropriate filenames.
- Checklist state and the derived assessment survived reload in IndexedDB. Delete cancel retained it; confirmed delete removed it; valid JSON re-import restored it.
- Unsupported TAR, zero-byte CSV, and malformed ZIP inputs each showed a specific recovery message. A valid input immediately afterward succeeded.
- A valid empty ZIP produced “0 files mapped”, an explicit empty state, and a no-directory warning.
- An encrypted entry was inventoried by name and warned that no password is requested.
- A 101-entry Unicode-path archive reported 101 files, retained the documented 100 example paths, and exported all 101 CSV rows.
- An unmatched guide search showed a useful next step.
- No page errors occurred in normal desktop/mobile result flows.

## Privacy and local persistence

- During an online live-file analysis, requests after input selection were only to the same-origin icon and archive-worker bundle. No third-party request, analytics request, upload, cookie, localStorage entry, or sessionStorage entry appeared.
- A unique secret inside a standalone JSON export was absent from the serialized IndexedDB assessment. Its filename, derived metadata, hash, and signature were present as disclosed.
- No authentication exists, so the Entra tenant check is not applicable.
- This is a static PWA with no application API, product-unlock call, or other server-side endpoint. Backend concurrency, health/build endpoint, and API rate-limit/429 checks are therefore not applicable.
- The package-consumer check is not applicable because this is not a library or CLI.

## PWA and offline evidence

- Chromium parsed the manifest without errors and found no installability issue except the expected `in-incognito` condition in automated Chromium.
- On local and live origins, the worker activated with scope `/` and populated `exit-map-v1.0.0-shell` with home, privacy, terms, fallback, manifest, icons, hero, JS, CSS, and archive-worker assets.
- With the browser offline, `/`, `/privacy/`, `/terms/`, and the installed start URL all reloaded with HTTP 200. The live page reported “Offline — local tools ready”.
- While still offline, a sample Takeout ZIP was inspected, signed, and downloaded successfully.
- The update path was exercised with a controlled server that served a byte-changed worker: the app displayed “A refreshed drawing is ready”, exposed Reload, activated the waiting worker, reloaded, and showed the app without console/page errors.

## Accessibility, responsive behavior, and motion

- Factory `verify-url.sh` against live: HTTP 200; 583 ms load; title and `lang` present; one H1; main landmark present; zero missing image alts; zero unlabeled buttons; zero console/page errors.
- Playwright axe on `/`, `/privacy/`, and `/terms/` at 1440×900 and 390×844: zero violations at any impact level, hence zero serious/critical findings.
- The populated results screen at 390 px had `scrollWidth === innerWidth === 390`, with no horizontal overflow, and axe again found no violations.
- Keyboard traversal reached the skip link, home, primary action, both file controls, search, and disclosures with a designed 3 px focus ring. Guide disclosures opened with Enter and closed with Space.
- The native delete dialog moved focus to “Keep map”, closed with Escape, and restored focus to the invoking remove button.
- Under `prefers-reduced-motion: reduce`, the tested transition duration was effectively zero (`0.001 ms`).

## Live deployment and performance

- Every non-map file in `dist/` was fetched from the live URL and SHA-256 compared. All 17 files were byte-for-byte identical, including root/legal HTML, service worker, manifest, icons, hero, JS, CSS, and archive worker. The live deployment matches the candidate build.
- Lighthouse 12.8.2 mobile-class run: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 0 ms, CLS 0, Speed Index 1.0 s, 99,186 bytes transferred, and zero third-party requests.
- INP has no meaningful value in a single-load lab run and no field data was available; TBT was 0 ms and tested controls responded immediately.

## Final decision

**FAIL.** The implementation itself is unusually solid for its core local inspection job, but the acceptance contract makes the missing claims inventory/tests and missing one-click isolated demo independently release-blocking. The first-screen audience requirement also fails. The candidate must not be released until those gates are implemented and rerun.
