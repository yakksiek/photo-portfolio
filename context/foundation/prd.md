---
project: "Marcin Kulbicki — Photography Portfolio"
version: 1
status: draft
created: 2026-06-08
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: medium
timeline_budget:
  mvp_weeks: 1
  hard_deadline: null
  after_hours_only: false
---

## Vision & Problem Statement

Marcin Kulbicki is a hobbyist photographer who shoots concerts, portraits, lifestyle, and landscape work. When a concert organisation or brand asks to see his work, he has no self-manageable website to point them to: today the content lives in code (hand-placed image slots saved to a code-side data file), so publishing a new photoshoot means editing code. That costs him on two fronts — a credibility gap (orgs and brands expect a real website before they engage) and a publishing bottleneck (every update needs a developer round-trip).

The distinctive, on-brand front-end already exists and is fully built — a moody, grainy, editorial dark portfolio with two view modes (cinematic Single and editorial All) and a bespoke scroll engine. The missing piece is not design; it is a content layer that lets the owner add, remove, and reorder sections, chapters, and photos — with light metadata (name, place, optional year, occasional description) — without touching code, while keeping the reference build pixel-identical.

## User & Persona

**Primary persona — Marcin Kulbicki, hobbyist photographer & site owner.** He curates and publishes his own work across four sections (Concerts, Portraits, Lifestyle, Landscape). He reaches for the product when there is new work to publish and wants it live without a developer in the loop.

### Secondary persona — concert organisations & brands (viewers)
They land on the site to evaluate his work when deciding whether to commission or collaborate. They browse; they never edit. Their experience matters for credibility, but it is not precious — Marcin is a hobbyist, not selling to consumers — so the MVP optimises the owner's publishing experience first.

## Success Criteria

### Primary
- The owner can add a new section, chapter, and photos **end-to-end without editing code** — setting name, place, optional year, and an occasional description — and the new photoshoot renders **pixel-faithfully to the reference build** on the live site, in **both** Single (cinematic) and All (overview) modes, on **desktop and mobile**.

### Secondary
- Per-photo captions (deferred to v2 — not sufficient on their own and not required for the first version). Note: per-photo **alt** text was promoted to must-have (FR-005) during shaping.

### Guardrails
- **Visual fidelity:** the live site is visually identical to the reference build — Single + All modes and all scroll/animation behaviour intact.
- **Performance:** fast load times; responsive images that do not cause layout shift; smooth ~60fps scroll on desktop.
- **Mobile parity:** all desktop features remain available on mobile (mobile is a first-class requirement, not a reduced experience).

## User Stories

### US-01: Owner publishes a new photoshoot without code

- **Given** the owner is authenticated in the content-management surface
- **When** they create a chapter under a section, add and reorder photos, set the section's landing hero, fill in name / place / optional year, and publish
- **Then** the photoshoot appears on the live site in both Single and All modes, pixel-faithful to the reference build, on desktop and mobile

#### Acceptance Criteria
- A newly added section auto-numbers (01–0N) and orders the nav by section order — no manual numbering required (a manual number override is available; see FR-006).
- The section's landing/backdrop hero is taken from the dedicated landing-hero photo set for that section (see FR-004); within a chapter, the first photo serves as the chapter hero (see FR-003).
- The entire flow requires zero code changes.

### US-02: Visitor explores a section

- **Given** a visitor on the landing
- **When** they click a section band and scroll
- **Then** they advance one frame per scroll-step through the section's chapters in Single mode, can toggle to All mode, and can click any photo in All to open it in Single at that exact frame

#### Acceptance Criteria
- Hovering a section name on the landing crossfades the backdrop to that section's hero; on touch, a tap/scroll-triggered equivalent provides the backdrop behaviour (see FR-008).
- Navigation works via keyboard and touch, with all desktop features present on mobile.

## Functional Requirements

### Content management
- FR-001: Owner can create, edit, remove, and reorder sections (fields: title, number, tagline, tags). Priority: must-have
  > Socrates: Counter-argument considered: "with only 4 fairly fixed sections, full add/remove/reorder is over-engineering." Resolution: kept as written — the owner wants to manage sections freely.
- FR-002: Owner can create, edit, remove, and reorder chapters within a section (fields: title, place, optional year, optional description), and reorder the photos within each chapter. Priority: must-have
  > Socrates: Counter-argument considered: "flatten to sections → photos for v1 and add chapters later." Resolution: kept — chapters are core; the Single-mode scroll track and the All-mode side-list both depend on them.
- FR-003: Owner can upload, reorder, and remove photos within a chapter; the first photo in a chapter is its hero (no separate hero control). All photos are sourced from the content-management surface — the reference build's drag-and-drop photo-placeholder mechanism is removed entirely. Priority: must-have
  > Socrates: Counter-argument considered: "first photo = hero by convention, drop the explicit hero control." Resolution: accepted and extended — first photo is the chapter hero, no hero picker; additionally the owner removed drag-and-drop entirely (all content comes from the CMS).
- FR-004: Owner can upload and replace a dedicated landing hero photo for each section, in a dedicated content area, used for that section's landing band and the intro backdrop crossfade. Priority: must-have
  > Socrates: Counter-argument considered: "reuse the section's first chapter hero for the landing band instead of a separate area." Resolution: kept the dedicated area — the owner wants landing heroes chosen independently of chapter content.
- FR-005: Owner can set per-photo alt text. Priority: must-have
  > Socrates: Counter-argument considered: "alt is an accessibility/SEO baseline and shouldn't be deferred." Resolution: alt text promoted to must-have; per-photo captions remain deferred to v2 (recorded in Non-Goals).

### Content rules the system enforces
- FR-006: System derives nav order and 01–0N section numbering from section order, with a manual per-section number override available. Priority: must-have
  > Socrates: Counter-argument considered: "auto-numbering removes manual control over labelling." Resolution: added a manual number override per section.
- FR-007: System generates responsive image variants from each upload and applies the fixed fit rules — cover for heroes and landing bands, contain for in-section frames and overview thumbnails (per-chapter lead cell = cover). Priority: must-have
  > Socrates: Counter-argument considered: "if a bought CMS provides an image CDN, variant generation is the platform's job, not yours." Resolution: kept as a product requirement regardless of provider — if a CMS image CDN supplies it, we configure rather than build, but the cover/contain fit rules must hold.

### Public site (ported front-end)
- FR-008: Visitor can browse the landing (intro title sequence, four section bands, contact) and hover a section name to crossfade the backdrop to that section's hero; because touch has no hover, a mobile-appropriate equivalent of the backdrop behaviour is provided. Priority: must-have
  > Socrates: Counter-argument considered: "hover-to-crossfade doesn't translate to mobile." Resolution: a mobile equivalent (tap/scroll-triggered) is required, since mobile parity is a guardrail.
- FR-009: Visitor can browse a section in Single (cinematic) mode and All (overview) mode, toggle between them, and click any photo in All to open it in Single at that exact frame. Priority: must-have
  > Socrates: Counter-argument considered: "both modes pixel-faithful on mobile within 2 days is the biggest risk." Resolution: parity remains the target, but an explicit, acknowledged release valve permits a simpler mobile treatment of ONE mode as a last resort to protect the deadline. Tension with FR-010 recorded in Open Questions.
- FR-010: Visitor can navigate by keyboard and touch, and use the full site with all desktop features on mobile. Priority: must-have
  > Socrates: Counter-argument considered: "is full mobile parity truly non-negotiable?" Resolution: parity is non-negotiable — mobile is a top priority. The tension with FR-009's release valve is recorded in Open Questions.

## Non-Functional Requirements

- Pages reach a Lighthouse performance score of at least 90, with largest-contentful-paint under 2.5s and cumulative layout shift under 0.1 on a typical broadband connection.
- Scrolling and transitions stay smooth (~60fps) on desktop.
- Appropriately sized images are served per device, and images appear without causing visible layout shift as they load.
- All content remains visible and readable under reduced-motion, print, or a frozen animation timeline — entrance reveals never leave content stuck invisible.
- The full site, with all desktop features present, is usable on touch/mobile devices.
- The rendered live site is visually indistinguishable from the reference design build.

## Business Logic

The site transforms a simple Section → Chapter → Photo content model into a fixed editorial presentation — deterministically deriving each section's number and navigation order, treating the first photo of each chapter as its hero, and applying context-driven image fit (cover for heroes and landing bands, contain for in-section frames) — so the same content renders faithfully across the cinematic Single and overview All modes.

The inputs the rule consumes are entirely owner-supplied content: sections (title, tagline, tags), chapters (title, place, optional year, optional description), the ordered photos within each chapter, and a dedicated landing hero photo per section. From these, the rule produces a consistently structured, navigable site — sections auto-numbered `01–0N` by order (with an optional manual override), each chapter led by its first photo as hero, and every image placed by the fixed cover/contain rule for its context.

The owner encounters the rule as "I arrange content once and it renders correctly everywhere" — the same content drives the landing bands, the cinematic frame-by-frame Single mode, and the editorial All overview without re-authoring. The viewer encounters it as a coherent experience: numbered sections on the landing, hero-led chapters when they enter a section, and a one-to-one mapping between a photo clicked in All and the exact frame it opens in Single.

This is a presentation/transformation rule, not an algorithmic decision over the photos — there is no recommendation, scoring, or classification of content. For a photography portfolio this is deliberate: the photographs are the value, and the application's job is faithful, consistent presentation plus code-free self-management.

## Access Control

The public site is **open and read-only**: anyone can view it, there is no sign-up and no login to browse. There is no viewer account model.

Editing is restricted to a **single owner-editor (Marcin)** with a **flat role model** — one role, no admin/contributor separation, no other accounts. There is no public sign-up path into the content-management surface.

The **mechanism and strength** of owner authentication (password / OAuth / passwordless / magic-link / local-only / access key) is **deliberately undecided** and routed to Open Questions; it will be resolved at the tech-stack-selection step alongside the build-vs-buy decision for the content-management surface.

## Non-Goals

**Functional non-goals**
- **No e-commerce / print sales / cart** — this is a pure portfolio; no selling, checkout, or print fulfillment.
- **No viewer accounts, comments, or client galleries** — single-owner, public-only; no private per-client galleries.
- **No blog / journal** — no written long-form section.
- **No EXIF / map / advanced photo metadata** — metadata is limited to title, place, optional year, and alt text.
- **No in-page tweak controls** — the reference build's tweak panel (accent colour, hero-name layout) is removed entirely.
- **No drag-and-drop photo slots** — the reference build's drag-and-drop photo-placeholder mechanism is removed; all content comes from the content-management surface.
- **No self-editable Contact (v1)** — Contact is hardcoded for v1: Marcin Kulbicki · marcin.kulbicki@gmail.com · Switzerland · Poland. Revisit later if needed.
- **No native mobile apps** — web only, responsive.

**Non-functional non-goals**
- **Captions deferred** — per-photo captions are out of v1 scope (alt text is in; see FR-005).

## Open Questions

1. ~~**How does the owner authenticate into the content-management surface?**~~ **RESOLVED (2026-06-08):** the content backend is **Sanity** (headless CMS). The owner authenticates into **Sanity Studio** (Sanity-managed login) — no auth code is built in this project. The public site is read-only and fetches content via a public token. This supersedes the Supabase auth bundled in the `10x-astro-starter` scaffold.
2. **Mobile-parity vs the delivery deadline (FR-009 ↔ FR-010 tension).** — FR-010 makes full mobile parity non-negotiable, while FR-009 carries an acknowledged release valve allowing a simpler mobile treatment of one view mode as a last resort. If the deadline forces the valve, which mode degrades and how far? Owner: Marcin, at build time.
