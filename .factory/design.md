# Visual thesis — Blueprint drafting sheet

## Why this direction

Leaving a service is less like pressing a transfer button and more like surveying a building before the keys stop working. The product therefore behaves like a working blueprint: pale technical paper, measured rules, ink annotations, location coordinates, and one safety-orange mark for the next physical action. The metaphor clarifies the job—map what exists, mark what moves, document what stays—without suggesting automation the app cannot provide.

This is an intentionally single-mode light treatment. A blueprint is a legible working document, and the fixed paper/ink contrast keeps exports, printed records, and status semantics consistent. The page background is explicitly painted; `color-scheme: light` prevents browser dark-mode substitutions.

## Palette

All colors are encoded as CSS tokens.

| Token | Value | Purpose |
| --- | --- | --- |
| Drafting paper | `#F3F0E6` | page background |
| Clean sheet | `#FBFAF4` | raised working surface |
| Blueprint ink | `#123B5D` | primary text and strong rules |
| Annotation blue | `#176B8C` | links, focus, selected states |
| Faded notation | `#536875` | secondary text |
| Construction line | `#B9C8C9` | grids and dividers |
| Safety orange | `#C34A18` | primary action; white text is 5.2:1 |
| Verified green | `#27644E` | reusable/verified state |
| Caution ochre | `#795A09` | attention/partial state |
| Revision red | `#9C3030` | errors and account-dependent state |

Blueprint ink on drafting paper exceeds 10:1; muted notation exceeds 5:1. Statuses always combine color with labels, icons, or patterns.

## Typography

- Titles and technical labels: `Arial Narrow`, `Aptos Narrow`, `Roboto Condensed`, system sans-serif. Uppercase is limited to short drawing labels, never prose.
- Body and controls: `Inter`-like native stack (`ui-sans-serif`, `system-ui`, `Segoe UI`, sans-serif), avoiding a font download and supporting offline startup immediately.
- File sizes and counts use tabular figures. Body is at least 16px with 1.55 line height. Reading width is capped at 72 characters.
- Scale: 14px notation, 16px body, 20px subhead, 28px section title, clamp(36–62px) product title.

## Layout and spacing

An 8px base rhythm with 4px micro-alignment. Main sections use 24/32/48px spacing. The desktop shell uses a 12-column drafting grid; mobile (390px) collapses to one column and removes ornamental coordinate labels while preserving results and actions. Independent assessment sheets have clipped corners instead of generic rounded cards. Targets are at least 44px.

Fine 24px grid lines and heavier 120px rules are rendered in CSS. Coordinates, registration marks, measurement ticks, and dotted hatching create hierarchy and reinforce the map metaphor. The orange action color appears only on the current next step.

## Interaction grammar

- The workflow is a numbered survey: **Open → Inspect → Preserve**.
- Drop-zone activation resembles placing a document on a light table; choosing a file remains the obvious primary action and drag-and-drop is supplemental.
- Inventory rows read like a bill of materials. Selecting a category opens its paths directly below the row.
- Checklist marks resemble inspection stamps and persist locally. Removal is confirmed because analysis history is user data.
- Results label confidence and parser version. No copy suggests that relationships, legal access, or platform functionality transfer.

## Motion policy

Panels settle vertically by 8px over 180ms and progress strokes fill from their measured origin over 240ms. Only transform and opacity animate. There is no ambient or looping motion. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are disabled and every state change is immediate while hierarchy remains intact.

## Original asset plan and provenance

The hero illustration is a top-down architectural survey of a translucent export archive: a physical dossier, nested media/contact/message sheets, checksum marks, archival box, and one orange route arrow. It explains that the app inventories a local package rather than transmitting it.

**Prompt sheet:** “Top-down editorial still life rendered as a meticulous architectural blueprint drafting table, a translucent personal data archive dossier opened into nested layers representing photos, contacts, messages, calendar and documents, precise cyan technical ink lines, cream drafting paper, deep navy annotations without legible text, one restrained safety-orange route arrow leading toward an archival box, tactile paper fibers, registration marks, soft north-window shadows, orthographic 50mm lens, sober privacy utility, high detail. No people, hands, faces, brands, logos, passwords, readable text, watermark, UI screenshot, glowing gradient, cyberpunk neon, padlock cliché, distorted objects.”

- Generator: Azure OpenAI image generation via the factory `gen-image.sh`, deployment `factory-image`.
- Date: 2026-08-28.
- License/provenance: original AI-generated asset commissioned for this product; no external source imagery.
- Source PNG and exact prompt sidecar live in `assets/src/`. Shipping WebP is optimized to ≤300 KB with explicit dimensions. The footer discloses generated imagery.
- `public/og-image.jpg` is a 1200×630 center crop of that same original artwork. `public/apple-touch-icon.png` is a 180×180 resize of the original product icon; neither introduces outside source material.

## Iconography

Interface icons are hand-authored inline SVG using square drafting strokes and round line caps. They contain no third-party icon set. PWA icons are original programmatic SVG-derived drafting marks: nested document outlines with an exit route.
