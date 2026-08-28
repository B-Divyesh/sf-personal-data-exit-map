# Personal Data Exit Map

Personal Data Exit Map is a free, installable local-first web app for people leaving an online service or preparing for an account lockout. It turns an opaque export package into a file/category inventory, identifies reusable and account-dependent material, creates a preservation checklist, and downloads a cryptographically signed manifest.

Live product: <https://personal-data-exit-map.sociobot.in>

## What it does

- Reads ZIP central directories and standalone JSON/CSV exports in a dedicated Web Worker.
- Computes the original archive’s SHA-256 locally; no archive bytes are uploaded or persisted.
- Detects common Google Takeout, Meta, X/Twitter, Mastodon, Discord, LinkedIn, and Reddit layouts and states the supported convention precisely.
- Maps photos, messages, contacts, activity, calendars, documents, location, social relationships, purchases, and settings.
- Persists derived assessments and checklist state in IndexedDB.
- Exports a signed manifest, full assessment JSON, and inventory CSV; imports assessment JSON.
- Includes official manual export routes for services that users have not exported yet.
- Installs as an offline PWA, including the archive worker and legal pages.

It does not collect credentials, extract encrypted entries, scrape services, migrate live relationships, or claim that exported records preserve account access or legal rights.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. It type-checks and builds the static multi-page app to `dist/`, with `dist/index.html` at the deploy root. `npm run preview` serves that output locally. Playwright is pinned to 1.58.2; in the factory image its browsers are supplied through `PLAYWRIGHT_BROWSERS_PATH`.

## Parser support and security model

Parser version 1.0 supports ordinary single-disk ZIP central directories plus direct JSON and CSV files. ZIP64, multipart ZIPs, TAR files, and content/schema validation are deliberately out of scope. Encrypted entries are inventoried by visible directory metadata and never prompt for a password.

The signed manifest uses ECDSA P-256 with SHA-256. A per-browser signing key is generated with Web Crypto and stored in IndexedDB; the public JWK travels with the manifest. This detects manifest alteration and binds it to that local key, but it is not identity verification or a trusted timestamp.

## Privacy and accessibility

There are no analytics, ads, trackers, third-party fonts, runtime CDNs, or cloud processing. See the in-product [privacy policy](https://personal-data-exit-map.sociobot.in/privacy/) and [terms](https://personal-data-exit-map.sociobot.in/terms/).

The interface uses semantic landmarks, one page-level heading, labelled controls, visible keyboard focus, ≥44 px targets, high-contrast status labels, and a reduced-motion mode. Desktop and 390 px mobile flows are covered by Playwright and axe.

## Project sources

- [`.factory/brief.json`](.factory/brief.json) — product scope
- [`.factory/design.md`](.factory/design.md) — blueprint visual system and generated-image provenance
- [`.factory/handoff.md`](.factory/handoff.md) — verification record and known limitations

## License

MIT. See [LICENSE](LICENSE).
