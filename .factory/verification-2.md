# Independent verification 2 — FAIL

Verified 2026-08-28 UTC for `personal-data-exit-map-verify-2`.

- Candidate commit: `8344f80cb2f7d9b4ef49dfe843cd9a605e28437e`
- Live URL: <https://personal-data-exit-map.sociobot.in>
- Verdict: **FAIL — release blocked**
- Verifier changes: this report and the verification addendum in `.factory/handoff.md` only. No product code was changed.

## Release blocker

### RB-1 — the required claim commands fail from a clean checkout

Per the work order, the first test activity after `npm ci` was every command listed in `.factory/claims.json`, before the production build. The repository's Playwright configuration starts `npm run preview`, which requires `dist/`; `dist/` is not committed and does not exist in a clean checkout.

The first two required, exact claim commands therefore failed:

```text
npm run test:claims -- --grep @claim:demo-sandbox
  expected visible: link "Try it with sample data"
  received: element not found

npm run test:claims -- --grep @claim:offline-reload
  expected visible: #results
  received: element not found
```

This is not a product-feature failure: it is a reproducible clean-checkout test-entry failure. It is nevertheless explicitly release-blocking under the claims contract: a listed claim test failed when run in the required clean-clone order. `test:claims` needs to build first (or its web-server entry needs to be able to serve a clean source checkout) before it can be considered a reliable release gate.

After `npm run build`, the same complete claim suite passed 13/13; the first failed aggregate rerun was followed by a passing isolated rerun and a passing complete rerun. The complete after-build result does not erase the required clean-checkout failure.

## First-read result

Cold live landing page, desktop and 390 px:

- **What it does:** maps a local service export into files/categories and indicates what can be preserved.
- **For whom:** “people leaving a service or preparing for lockout.”
- **What to click first:** the visible **Try it with sample data** link; it says a prepared Google export opens next.

The first screen has the required one-click demo and answers the three questions sufficiently in plain language. It did not trigger the first-read failure condition.

## Clean local gates

Started on a clean worktree at the exact candidate commit and installed with `npm ci` (143 packages, 0 audit vulnerabilities).

| Gate | Result | Evidence |
| --- | --- | --- |
| Each claims.json command before build | **FAIL** | RB-1 above; production preview has no `dist/` artifact in a clean clone |
| `npm run build` | PASS | `tsc --noEmit && vite build`; generated `dist/` |
| All claims after build | PASS | `npm run test:claims`: 13/13 Chromium tests passed in 36.0 s |
| `npm run lint` | PASS | zero warnings |
| `npm test` | PASS | 2 files, 6/6 Vitest tests |
| `npm run typecheck` | PASS | `tsc --noEmit` |
| `npm run test:e2e` | PASS | 36/36 Playwright tests, desktop Chromium and Pixel 5, 1.5 min |

Claim coverage after the build exercised the separate demo store/reset/exit, offline reload, local-only storage/network boundary, ZIP/JSON/CSV and 1.5 GB rejection, category map/checklist, all seven documented parser layouts, manifest signing/tamper detection, JSON/CSV exports, persistence, guides, no-account flow, mobile keyboard, and axe.

## End-to-end and resilience evidence

- `/demo/` created the realistic six-file Google Takeout sample and displayed Google Takeout / high confidence, six mapped files, five reusable categories, one account-dependent category, and a five-step plan.
- The claim suite independently verified downloaded SHA-256 / ECDSA P-256 manifest evidence, imported a changed manifest as **Signature invalid**, and verified JSON/CSV row counts.
- The input-support claim exercised normal ZIP, JSON and CSV inspection and a synthetic value one byte above the exact 1.5 GB limit; the recovery message was shown.
- Saved assessments and a checked preservation item survived reload in IndexedDB.
- The full deployed-demo exit sequence (check item → Reset demo → Start for real) was independently repeated against the live URL; only `personal-data-exit-map` remained afterward. This corroborates the demo boundary despite the earlier aggregate-test flake.

## Privacy, live parity, PWA and platform checks

- The live desktop and 390 px demo flows made requests only to `https://personal-data-exit-map.sociobot.in`; there were no third-party, analytics, authentication, billing, upload, console, or page-error requests. This static PWA has no application server-side API or sign-in, so API allowance/429 and Entra checks do not apply.
- Live root HTML SHA-256 was exactly the candidate build's `f34be767a79bf503d0bd4ffc61a507ad21be5cfa3f9eecbaa4cd3c0499d1b010`; referenced JS and CSS hash filenames and response lengths matched too. The live deployment matches the candidate.
- Live response headers included HSTS, `nosniff`, strict referrer policy, a self-only CSP with `frame-ancestors 'none'`, and a restrictive Permissions Policy. Hashed JS/CSS returned `Cache-Control: public, max-age=31536000, immutable`; `sw.js` returned `no-cache`.
- The live service worker controlled `/demo/`; after first visit, offline reload returned 200 and rendered sample results with no console error. The worker has versioned caches, `clients.claim()`, and handles the app's `SKIP_WAITING` update message; the UI listens for an update and offers Reload. A production version change was not available to force on the live hostname during this review.
- The initial app bundle is 31,167 bytes raw / 11.25 KB gzip plus a 771-byte module-preload helper; app CSS is 20,314 bytes raw / 5.11 KB gzip; worker is 3,069 bytes; hero WebP is 74,186 bytes. These meet the stated static/PWA budgets.

## Accessibility, responsive and keyboard checks

- Live root and populated demo had the required title, `lang`, one H1 and main landmark. The first Tab focused the skip link with a designed `rgb(195, 74, 24) solid 3px` outline; Enter moved focus to `main`.
- At 1440 px and 390 px, the demo had no horizontal overflow (`scrollWidth === clientWidth`) and no serious or critical axe violations.
- There were zero live console errors and zero page errors in normal and offline-demo flows.
- Reduced-motion behavior was covered by the passing E2E suite; source uses immediate/auto scrolling where the preference is reduced.

## Defects by severity

### Blocker

1. **RB-1 clean-checkout claim test entry is broken.** See above. The claimed release test command needs a build prerequisite or an independent development-server test entry.

### Minor

1. The update toast's **Reload** button is styled with `min-height: 40px`, below the product contract's 44 px touch-target baseline. This only appears when a service-worker update is available, but it is still an interactive control.

## Final decision

**FAIL.** The live product satisfies the main user job, privacy boundary, offline demo, accessibility checks, and deployment-parity checks. It cannot be accepted under this work order while the mandatory claim tests fail when invoked first from a clean clone. Fix the test entry point, rerun all claims in the prescribed order, and recheck the update-toast target.
