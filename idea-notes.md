# Marcin Kulbicki — Photography Portfolio

## Idea / PRD-shaping notes for Claude (repo build)

> **Read me first.** The entire front‑end — layout, typography, colour, grain,
> animations, scroll behaviour and the two view modes — **has already been
> designed and built with Claude.** The working reference implementation is in
> this handoff package under `design-reference/`:
>
> - `Marcin Kulbicki — Portfolio.html` — entry file
> - `portfolio.css` — all styling + tokens + animations
> - `portfolio.js` — structure, data model, scroll engine, view modes
> - `image-slot.js` — the drag‑and‑drop image placeholder web component
> - `tweaks-panel.jsx` + `tweaks-app.jsx` — in‑page tweak controls (optional)
>
> **Treat that code as the source of truth for everything visual.** This
> document explains _intent_ and the _one missing piece I actually need built_:
> a **CMS** so I can add sections / chapters / photos myself without editing code.
> Where this doc and the reference code disagree, the **code wins** for visuals.

---

### Main goal

A minimalist, moody, editorial photography portfolio. Very little text, lots of
negative space, film‑grain texture, a single red accent on a near‑black ground.
The photography is the content; the UI gets out of the way.

Aesthetic in one line: **grainy, dark, editorial; colour + black‑and‑white mix;
one signal‑red accent.**

---

### What already exists (built with Claude — port it, don't redesign it)

- A single self‑contained front‑end (HTML + one CSS + one JS file + one web component).
- Full‑viewport "stage" that scales to any screen; everything is `position:fixed`/absolute over a dark ground with an animated grain overlay and a vignette.
- A complete **navigation + scroll system** (see below).
- Two **view modes** per section: **Single** (cinematic) and **All** (editorial overview).
- **Drag‑and‑drop photo slots** everywhere (placeholder component), persisted to a JSON sidecar. This is the temporary stand‑in for the CMS (see "What I need").
- An optional **Tweaks panel** (toggle hero name layout, name size, backdrop dimming, accent colour).

When porting to the repo, keep the structure and class names from `portfolio.css` /
`portfolio.js` so the visual result is identical. The data that drives the whole
site is a single `SECTIONS` array in `portfolio.js` (see "Content model").

---

### Information architecture

```
Landing
 ├─ Intro (full‑screen title + hero backdrop)
 ├─ Section band ×4  (Concerts · Portraits · Lifestyle · Landscape)
 └─ Contact (name + email + location)

Section  (one of 4)
 └─ Chapters (subsections, 2–3 per section)
     └─ Hero frame + 5–7 photo frames
```

Current sections & chapters (placeholder names/locations/years — I will rename in the CMS):

| #   | Section   | Chapters (frames)                                                                             |
| --- | --------- | --------------------------------------------------------------------------------------------- |
| 01  | Concerts  | Open'er · Gdynia 2023 (6) · Unsound · Kraków 2022 (5) · Club Nights · Warsaw 2024 (7)         |
| 02  | Portraits | Studio · Warsaw 2021–24 (6) · Street Faces · 2019–24 (5) · Performers · Backstage 2022–25 (6) |
| 03  | Lifestyle | Mornings · Interiors 2023 (5) · City Hours · Warsaw 2022–24 (6) · Off the Map · 2020–24 (6)   |
| 04  | Landscape | Tatra · Highlands 2021 (6) · Baltic · Coast 2023 (5) · Northbound · Iceland 2024 (7)          |

Contact: name **Marcin Kulbicki**, email **marcin.kulbicki@gmail.com**, location **Switzerland · Poland**.

---

### Scroll behaviour & interactions (core of the design)

**Landing**

- Vertical scroll through stacked full‑bleed bands: Intro → 4 section bands → Contact. Soft scroll‑snap.
- **Intro hero backdrop**: shows the _Portraits_ chapter‑1 hero photo by default. **Hovering** a section name in the centered role line (or in the top nav) **crossfades** the backdrop to that section's hero and underlines the name in red; leaving reverts to Portraits.
- **Intro title sequence**: on load, "MARCIN KULBICKI" (one line) + "Photographer — …" show for **2 seconds**, then the name and the "Photographer —" prefix **collapse away** and the section links glide to centre. **In sync**, the backdrop dimming eases from `1 → 0.5` so the photo comes forward. The sequence replays when you return via the logo / "Index".
- Clicking a section band **enters** that section (Single mode).

**Inside a section — "Single" (cinematic) mode**

- **Scroll is hijacked.** One frame fills the screen; each scroll step advances exactly one frame (≈820 ms lock), with a smooth vertical slide.
- One continuous track flows: Chapter‑1 hero → its frames → Chapter‑2 hero → its frames → … → and on into the next section.
- Chrome: left **chapter rail** (index of the section's chapters; click to jump; red underline on the active one), right **frame dots** (frames within the current chapter), bottom‑left **HUD** counter + chapter caption, top‑right **section marker**, top **progress bar** (position within the section), bottom **prev/next section** pager, **back to Index**, **scroll cue** on heroes.
- Keyboard: ↑/↓ / PageUp / PageDown / Space to move, Esc to exit. Touch: vertical swipe.

**Inside a section — "All" (editorial overview) mode**

- Toggle **Single | All** in the chrome (top centre).
- Shows **one section at a time**, scrollable: left = image column (a full‑width lead per chapter, then frames 2‑up), right = **sticky info panel** (section number, big title, tagline, chapter list with locations/years/counts, technical tags).
- **‹ / ›** arrows switch sections; clicking a chapter in the side list smooth‑scrolls to it; clicking any photo **opens it in Single mode at that exact frame**.

---

### Animations (all CSS‑driven, grain/photo aside)

- **Grain**: subtle animated `feTurbulence` noise, `mix-blend-mode: soft-light`, ~10% opacity, slow stepped shift.
- **Entrance reveals are transform‑only** (never rest at `opacity:0`) and gated behind `@media (prefers-reduced-motion: no-preference)` so print / reduced‑motion / any frozen timeline still show content.
- Frame reveal: incoming frame eases `opacity .4 → 1` (+ a gentle scale on cover heroes).
- Hero caption rises in (staggered). Chapter‑rail active underline draws in. Role‑line links underline on hover. Backdrop crossfade `.9s`.
- Master easing: `cubic-bezier(.76, 0, .24, 1)`. Slide/scroll transitions `.9s`.

---

### Image fit rules (deliberate, keep them)

- **Landing bands + chapter heroes** → `cover` (full‑bleed, immersive; portraits fill the frame).
- **In‑section frames** → `contain`, centred on the dark grainy ground with generous margins (a vertical portrait shows in full — no crop), transparent matte.
- **Overview thumbnails** → frame cells `contain` (no crop); the per‑chapter lead cell `cover` (wide banner).

---

### Components (names match the reference code)

- **Top bar / nav** — brand wordmark + section menu + Contact.
- **Intro** — `intro-bg` (mirrored hero slots + crossfade), `intro-scrim` (dimming), title, role line.
- **Section band** — hero slot, number, title, "N chapters · M frames" view link.
- **Stage** (Single) — `track` of `panel`s, `hero-cap`, `hud`, `rail`, `dots`, `marker`, `progress`, `pager`, `scrollcue`, `vtoggle`.
- **Overview** (All) — `ov-section` (one per section), `ov-main` (scroll column), `ov-grid` / `ov-cell` (`.lead` = chapter hero), `ov-side` (info panel: title, tagline, chapter list, tags), `ov-chrome` (‹ Single|All ›).
- **Contact** — eyebrow, name, email (`mailto:`), location.
- **image-slot** — the fillable photo placeholder (see CMS note).
- **Tweaks panel** (optional) — hero name layout/size, backdrop dimming, accent colour.

---

### Design tokens

Full values in `design-tokens.css` and `design-tokens.json` in this package. Summary:

- **Colours**: ground `#0b0b0c`, ink `#edeae4`, muted `rgba(237,234,228,.52)`, faint `.28`, hairline `.15`, **accent `#ff3b1d`**, slot bg `#161617`.
- **Type**: display/body **Archivo** (weights 400–900, display weight **800**, tracking **‑0.03em**); labels/mono **Space Mono** (400/700). Load both from Google Fonts.
- **Texture**: grain opacity `.10`; photo filter `contrast(1.07) saturate(.94) brightness(.98)`.
- **Motion**: ease `cubic-bezier(.76,0,.24,1)`.
- **Scale/spacing**: fluid `clamp()` throughout — see the CSS for exact ramps (hero name `clamp(30px,6vw,88px)`, section titles up to ~120px, body 13–19px, mono labels 9–13px).

---

### ⭐ What I actually need built: a CMS

Right now photos are added by **dragging an image onto a slot** (the `image-slot`
web component) and stored in a JSON sidecar. That's fine as a stand‑in but I want
to **manage everything myself** without touching code. Requirements:

**Content I must be able to edit**

- **Sections** — add / remove / reorder; fields: `title`, `number`, `tagline`, `tags[]`.
- **Chapters** (within a section) — add / remove / reorder; fields: `title`, `meta` (place · year), and an ordered list of **photos**.
- **Photos** — upload, reorder, set the **chapter hero**, optional caption/alt; the first photo of chapter 1 doubles as the section's landing/backdrop hero.
- **Contact** — name, email, location.
- **(Nice to have)** the Tweaks values (accent colour, hero name layout) as global site settings.

**Behavioural rules the CMS must preserve**

- Section order drives nav order and the `01–0N` numbering.
- A chapter needs 1 hero + N frames (5–7 is the design sweet spot, but allow any).
- Image handling: store an original + generate sized/cropped variants; respect the cover/contain rules above (heroes cover, frames contain).

**Options (pick what fits the stack)**

- **Headless CMS** (Sanity / Payload / Contentful / Strapi) modelling `Section → Chapter → Photo`, the front‑end reads its API/JSON at build or runtime. Lowest effort, best editing UX.
- **Git‑based / file CMS** (Tina, Decap/Netlify CMS, or just a typed `content/*.json` + `/public/images`) — keeps everything in the repo; the existing `SECTIONS` array becomes generated content.
- **Roll my own** — a small admin route with auth + image uploads writing to the same `content` schema. Most work; only if I want full control.

Whichever we choose, **the front‑end should consume one normalized `content`
object with the exact shape of `SECTIONS` today** (plus a `contact` block), so the
reference build keeps working unchanged.

---

### MVP scope

**In**

- Port the existing front‑end to the repo, pixel‑faithful (Single + All modes, all scroll/animation behaviour).
- Wire it to a **CMS/content source** with the `Section → Chapter → Photo` model.
- Image upload + responsive variants honouring the cover/contain rules.
- Editable Contact block.
- Web only, responsive, all the features on desktop should remain on mobile if mobile is not implemented should be in MVP.

**Out (for now)**

- E‑commerce / print sales / cart.
- Multi‑user accounts, comments, client galleries.
- Blog / journal.
- Native mobile apps.
- Advanced per‑photo EXIF / map features.

**Success criteria**

- I can add a new section, chapter and photos end‑to‑end **without editing code**.
- The live site is visually identical to the Claude reference build.
- Lighthouse: images lazy/responsive, no layout shift, smooth 60fps scroll on desktop.
- very good performance on load times
