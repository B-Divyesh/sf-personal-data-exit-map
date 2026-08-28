# Handoff — Personal Data Exit Map v1

Completed 2026-08-28 for work order `personal-data-exit-map-build-1`.

## What was built

- A finished Vite + vanilla TypeScript local-first PWA using the product-specific blueprint drafting-sheet system in `.factory/design.md`.
- Local inspection for ordinary single-disk ZIP central directories and standalone JSON/CSV exports. Parsing and SHA-256 hashing run in a dedicated Web Worker; archive bytes are transferred to that worker and are never uploaded or persisted.
- Service-layout detection with precise support notes for common Google Takeout, Meta Accounts Center, X/Twitter, Mastodon, Discord, LinkedIn, and Reddit packages, plus an honest generic mode.
- A category and format inventory showing file counts, uncompressed size, representative paths, and reusable/review/account-dependent status.
- A persistent five-step preservation checklist, derived-map history in IndexedDB, confirmed deletion, assessment JSON import/export, and full inventory CSV export.
- A signed `personal-data-exit-map/manifest-v1` containing the archive SHA-256, ZIP CRC-32 evidence, full directory inventory, parser limitations, public JWK, and a device-local ECDSA P-256/SHA-256 signature. Imported manifests are verified before their status is shown.
- Static official exit guides for Google, Apple, Facebook/Instagram, X/Twitter, Mastodon, Reddit, Discord, LinkedIn, and TikTok.
- Offline installation with a versioned service worker precache, generated-bundle injection, offline fallback, update toast, Web App Manifest, 192/512/maskable icons, and offline-safe legal pages.
- Original generated blueprint dossier hero artwork, optimized from a 1536×1024 source PNG to a 74 KB 1200×800 WebP. Prompt, generation metadata, review criteria, and provenance are retained in `assets/src/` and `.factory/design.md`.
- Responsive 390 px layout, complete keyboard/focus states, reduced-motion treatment, semantic landmarks, one H1 per page, alt text, high-contrast labelled statuses, empty/loading/error/offline states, and ≥44 px controls.
- Privacy policy, terms, MIT license, and an operational README.

## Verification

Run from `/work/repo`:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Final local results:

- `npm test`: 3/3 Vitest unit tests passed.
- `npm run build`: passed TypeScript checks and produced `dist/index.html`; main app JS 28.41 KB uncompressed (10.35 KB gzip), deferred worker 3.07 KB, app CSS 18.33 KB (4.76 KB gzip), no font payload, hero WebP 74 KB.
- `npm run test:e2e`: 6/6 Playwright tests passed across desktop Chromium and Pixel 5 emulation. Covered ZIP inspection, service/category results, Web Crypto manifest verification, persisted checklist, manifest download, privacy/terms routes, and a real `context.setOffline(true)` reload.
- Playwright axe scan: zero serious or critical violations on desktop and mobile.
- Factory `verify-url.sh`: HTTP 200, title/lang/main/alt/button checks passed, one H1, zero console/page errors; measured load 542 ms on local preview.
- Lighthouse 12.8.2 mobile-class run on the final production build: Performance 100, Accessibility 100, Best Practices 100; FCP 1.1 s, LCP 1.5 s, TBT 0 ms, CLS 0, total transferred weight 98 KiB.
- `git diff --check`: passed.

## Known limits

- Parser v1 does not support ZIP64, multipart/split ZIPs, TAR archives, or password-based content extraction. It explains the corrective next step rather than guessing.
- Classification uses paths and extensions. It does not parse changing service-internal schemas or prove that an export is complete. Users are asked to open a representative file.
- Reading and hashing uses one in-memory `ArrayBuffer`; the UI caps files at 1.5 GB, but users on memory-constrained phones may need to request smaller ZIP parts.
- A local ECDSA signature detects manifest alteration and binds it to that browser key. It is not identity verification, a trusted timestamp, or legal certification.
- Official guide destinations naturally require a network connection; all in-app guide steps remain cached offline.

## Sensible next steps

- Add tested, versioned community parsers for high-value service schemas inside the worker boundary.
- Add streaming hashing when a broadly supported browser primitive makes it possible without a heavy dependency.
- Add fixture archives for more providers and non-UTF-8 ZIP file names.
