# Mobile Parity Rework — Implementation Plan

## Overview

Build a first-class mobile experience for the photography portfolio to the owner's 8 reference mockups (`context/foundation/design-reference/mobile/`), achieving full parity on **both** Single (cinematic) and All (overview) view modes via touch. The work adds a phone-breakpoint CSS layer (`≤768px`), wires the missing landing touch gestures (the root cause of mobile scroll breaking), introduces a hamburger menu overlay, and adopts dynamic viewport units — all scoped behind the breakpoint so the proven desktop site (S-02) is untouched.

This is roadmap slice **S-04**, the project's north star and stated #1 risk: the cinematic hijacked-scroll + both modes working faithfully on mobile.

## Current State Analysis

The scroll engine is already a React island — `src/components/Portfolio.tsx` (DOM, verbatim reference class names) + `src/components/hooks/usePortfolioEngine.ts` (state/behavior). Build-time Sanity data flows through `src/pages/index.astro` into `PortfolioData` (`src/types.ts`). The desktop experience is live and verified faithful (S-02).

**Why mobile is effectively unbuilt (code presence ≠ working behavior):**

- **Landing has no touch handler.** The landing drives discrete one-section-per-step scrolling via a `wheel` listener that `preventDefault`s and calls `landingStep` (`usePortfolioEngine.ts:279-292`). Touch was explicitly deferred: _"Touch is NOT handled here (native; S-04 owns it)"_ (`usePortfolioEngine.ts:255`). With `.landing { overflow-y:auto; scroll-snap-type:y mandatory }` (`portfolio.css:178-183`) and nothing driving touch, native swipe + mandatory snap fight each other — **this is the "scroll breaks the app on mobile" symptom.** (The stage, by contrast, already has working touch handlers at `usePortfolioEngine.ts:334-355`.)
- **There is essentially no mobile CSS.** The single width media query (`portfolio.css:1167-1183`) only reflows the overview to a column. Everything else is desktop-first fluid `clamp()`. The reference build itself never had a mobile design — so the owner's mockups are a **new design to build to**, not a port.
- **Full-screen surfaces use `100vh`** (`.intro`, `.band`, `.contact`, `.stage`), which jumps as mobile browser address bars show/hide.
- **The viewport meta is incomplete:** `Layout.astro:14` is `width=device-width` with no `initial-scale=1`.
- **The mockups introduce mobile-only patterns absent from the DOM:** a hamburger → full-screen menu overlay (`03`), right-side vertical frame dots + a top-right SINGLE|ALL toggle in Single (`06`/`07`), a hidden rail, full-bleed bands with a right-side section-dots indicator (`04`), and a compact wordmark at rest (`02`).

### Key Discoveries:

- Engine touch pattern to mirror for the landing: `usePortfolioEngine.ts:334-355` (stage `touchstart`/`move`/`end` → `step`, `TOUCH_THRESHOLD = 46`). The landing equivalent must `preventDefault` (passive:false) and call `landingStep`, mirroring the wheel path at `usePortfolioEngine.ts:282-288`.
- Landing targets are computed fresh each call (`getLandingTargets`, `usePortfolioEngine.ts:182-194`) and `landingIndexRef` tracks position — the touch handler reuses `landingStep` directly, no new navigation logic.
- `section.tagline` flows to the component (`index.astro:59`); `chapter.description` is queried/typed but **dropped** at `index.astro:41-51`. Per the hero-text decision, the mobile hero shows title + meta only — **no description plumbing needed** and the dropped field stays dropped.
- CSS tokens to reuse: `--ease`, `--accent`, `--line`, `--muted`, `--faint`, `--mono` (`portfolio.css` `.theme-a`, lines 49-62). No new tokens required.
- Existing overview reflow to extend, not replace: `portfolio.css:1167-1183`.
- Nav handlers to reuse for the mobile menu: `onBrandIndex`, `onSectionNav`, `onContact` (already exported from the engine).

## Desired End State

On a phone (`≤768px`), a visitor can: land on the intro (`01`/`02`), open the hamburger menu overlay and navigate (`03`), swipe through full-bleed section bands with discrete one-section stepping (`04`), reach contact (`05`), enter a section and swipe through Single mode with right-side frame dots and bottom-left meta (`06`/`07`), toggle to All mode and tap any cell to open it at that exact frame (`08`), and toggle back — all via touch, with the hijacked-scroll behavior intact and the app no longer breaking on scroll. The desktop site renders identically to today (no regression). Verify by exercising the full flow against the 8 mockups in devtools device emulation (~390px) and spot-checking on a real phone.

## What We're NOT Doing

- **No landscape-orientation-specific layouts** — portrait rules apply in landscape; no bespoke landscape tuning.
- **No tablet-specific redesign (641–880px)** — tablets keep today's desktop fluid layout + the existing 880px overview reflow.
- **No performance/Lighthouse measurement** — that is S-03, sequenced after this slice. This change builds mobile; it does not measure it.
- **No new CMS content fields / schema changes** — pure front-end; mobile renders existing content. `chapter.description` stays dropped (mobile hero omits the descriptive sentence).
- **No changes to desktop layout/behavior** — all mobile rules live behind `≤768px`; the inline desktop `.menu` and existing chrome are untouched.
- **No FR-009 release-valve degrade up front** — full parity on both modes is the committed target; the valve is a documented fallback only if a specific mode proves infeasible mid-build (see Open Risks).

## Implementation Approach

A new phone breakpoint (`@media (max-width: 768px)`) carries purpose-built mobile layouts; the existing `@media (max-width: 880px)` overview reflow stays for tablets. Full-screen surfaces move to dynamic viewport units (`100dvh`, `100svh` where stable fill matters). The engine gains two small additions: landing touch listeners (reusing `landingStep`) and a `menuOpen` state for the mobile overlay. The component gains a hamburger button and the overlay DOM (both CSS-gated to mobile). Everything else is CSS layered on the existing verbatim-class DOM.

Phases are ordered to **fix the breakage first** (landing touch + viewport, the #1 risk), then build chrome, then the three surfaces, then an integration/fidelity sweep. Each phase is independently verifiable and must not regress desktop.

## Critical Implementation Details

- **Landing touch vs scroll-snap (Phase 1) — primary approach + fallback.** The landing's discrete stepping is engine-driven via `scrollTo`. On touch, `scroll-snap-type: y mandatory` + native momentum will free-scroll-then-snap — the exact anti-pattern S-01 removed for wheel. **Primary approach:** neutralize native landing scrolling (e.g. disable mandatory snap and/or `overflow:hidden` on the landing at `≤768px`) and let the new touch handler drive `landingStep`, mirroring how the wheel path already `preventDefault`s. The touch listener needs `{ passive: false }` to `preventDefault` (unlike the stage's passive listeners, which work because the stage has `overflow:hidden` and nothing scrolls natively). **Fallback (owner-approved):** if engine-driven touch stepping fights momentum scroll in ways that can't be cleanly resolved, **leave native scroll on mobile** — keep `overflow-y:auto` + CSS `scroll-snap-type: y mandatory` (one band per snap) and do NOT wire the landing touch handler. This degrades the landing from "discrete one-step-per-gesture" to "native scroll that snaps per band," which still gives full-bleed section-by-section browsing and removes the breakage. The stage/Single touch handling is unaffected either way (it already works). This is a Phase-1 in-build decision, not a blocker.
- **Reduced-motion parity.** `landingStep` already honors `prefers-reduced-motion` (`usePortfolioEngine.ts:272-273`); the touch path reuses `landingStep`, so it inherits this — do not branch.
- **Listener cleanup.** New engine listeners (landing touch, any menu key handling) must register in effects with cleanup, per the file's established discipline (`usePortfolioEngine.ts:45-46` rationale) — the island unmounts on HMR.
- **Menu overlay must not clobber desktop.** The hamburger and overlay render in the DOM at all sizes but are `display:none` above the breakpoint; the inline `.menu` is `display:none` below it. No JS size-branching — CSS owns the show/hide so SSR/island hydration stays deterministic.

---

## Phase 1: Mobile foundation — viewport units + landing touch

### Overview

Fix the mobile scroll breakage and establish the mobile substrate: correct the viewport meta, adopt dynamic viewport units on full-screen surfaces, scaffold the `≤768px` breakpoint, and wire landing touch gestures to the existing discrete-stepping engine.

### Changes Required:

#### 1. Viewport meta

**File**: `src/layouts/Layout.astro`

**Intent**: Allow proper mobile scaling — the current meta omits `initial-scale`, which can cause incorrect zoom/layout on phones.

**Contract**: `<meta name="viewport" content="width=device-width, initial-scale=1" />` (line 14).

#### 2. Landing touch handler in the engine

**File**: `src/components/hooks/usePortfolioEngine.ts`

**Intent**: Make touch swipes on the landing advance exactly one section per gesture, reusing the existing `landingStep` so discrete stepping, clamping, lock, and reduced-motion all carry over. This is the core fix for "scroll breaks on mobile."

**Contract**: A new `useEffect` attaching `touchstart`/`touchmove`/`touchend` to `landingRef.current`, mirroring the stage touch effect (`usePortfolioEngine.ts:334-362`) but calling `landingStep(direction)` instead of `step`, and guarded by `if (stageOnRef.current || overviewOnRef.current) return` like the landing wheel handler (`:283`). The `touchmove` listener registers `{ passive: false }` and `preventDefault`s so native landing scroll/snap does not fight the engine. Reuses `touchStartYRef` semantics and `TOUCH_THRESHOLD`. Registered with cleanup.

**Fallback:** if this fights momentum scroll and can't be cleanly resolved, skip this change entirely and rely on native scroll + CSS scroll-snap instead (see Critical Implementation Details → "Landing touch vs scroll-snap"). In that case Change #3's mobile block keeps `scroll-snap-type: y mandatory` on the landing rather than disabling it.

#### 3. Dynamic viewport units + breakpoint scaffold

**File**: `src/styles/portfolio.css`

**Intent**: Make full-screen surfaces fill the mobile viewport stably (no address-bar jump) and create the phone-layout entry point. Neutralize native landing scroll-snap on mobile so the touch engine owns stepping.

**Contract**: Convert `100vh` → `100dvh` (with `svh` where a stable minimum matters, e.g. `.band`/`.intro`) on `.intro` (`:194`), `.band` (`:407`), `.contact` (`:493` min-height), and `.stage`/`.viewport` as needed — applied so desktop behavior is unchanged (dvh ≈ vh on desktop). Add a new `@media (max-width: 768px)` block (the home for Phases 2–5) that, at minimum, disables `scroll-snap-type: mandatory` on `.landing` (and/or sets the landing to engine-driven stepping) so touch doesn't free-scroll-snap. Keep the existing `@media (max-width: 880px)` overview rule intact.

### Success Criteria:

#### Automated Verification:

- Lint passes: `npm run lint`
- Format check clean: `npm run format` (no diff)
- Build succeeds: `npm run build`

#### Manual Verification:

- On a phone / devtools emulation (~390px), swiping up/down on the landing browses the surfaces section-by-section (intro → bands → contact) with **no app breakage** — ideally discrete one-step-per-gesture (primary approach), or native-scroll-that-snaps-per-band if the fallback was taken. The breakage is gone either way.
- Intro, bands, and contact fill the screen with no address-bar gap; surfaces don't jump on scroll.
- Desktop wheel/keyboard landing stepping is unchanged.
- Reduced-motion: landing touch stepping jumps instantly (no smooth animation).

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation that mobile landing scroll works before proceeding.

---

## Phase 2: Mobile chrome — hamburger menu overlay

### Overview

Add the mobile navigation: a hamburger toggle that opens a full-screen menu overlay (mockup `03`), mobile-only, with the inline desktop `.menu` hidden below the breakpoint. Apply the compact-wordmark-at-rest correction (`02`).

### Changes Required:

#### 1. Menu state in the engine

**File**: `src/components/hooks/usePortfolioEngine.ts`

**Intent**: Track whether the mobile menu overlay is open, and expose open/close/toggle. Close on selection and on Escape.

**Contract**: New `menuOpen` state + `toggleMenu`/`closeMenu` (or equivalent) added to the returned API. Escape closes the menu (extend the existing keydown effect, `:365-405`, to handle `menuOpen` first). Selecting a nav target closes the menu. No new listeners beyond extending the existing keydown effect.

#### 2. Hamburger button + overlay DOM

**File**: `src/components/Portfolio.tsx`

**Intent**: Render the hamburger toggle in the top bar and a full-screen overlay listing Index / each section (with `01–0N` numbers, active state) / Contact, matching mockup `03`. Reuse existing nav handlers; each selection navigates and closes the overlay.

**Contract**: A `.menu-toggle` (hamburger) button added to `.bar` and a `.menu-overlay` element (open class driven by `menuOpen`) containing buttons wired to `onBrandIndex` (Index), `onSectionNav(i)` (sections), `onContact` (Contact) — each wrapped to also `closeMenu`. Active section uses the existing `activeSectionKey` derivation. Both new elements carry stable class names for CSS gating.

#### 3. Menu + bar mobile styles

**File**: `src/styles/portfolio.css`

**Intent**: Show the hamburger and full-screen overlay only on mobile; hide the inline `.menu` there; render the wordmark at its compact size at rest (the `02` correction — not the oversized logo shown in that mockup).

**Contract**: Inside `@media (max-width: 768px)`: `.menu { display:none }`, `.menu-toggle { display:flex }` (hidden/`display:none` on desktop by default), `.menu-overlay` full-screen layout per `03` (vertical list, numbered, accent active state, contact email footer). Confirm `.brand` renders compact on mobile (matching `03`–`08`, not the oversized `02` logo).

### Success Criteria:

#### Automated Verification:

- Lint passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- On mobile, the hamburger appears and the inline nav is hidden; on desktop, the inline nav is unchanged and no hamburger appears.
- Tapping the hamburger opens the full-screen overlay matching `03` (Index, four numbered sections with the active one accented, Contact, email footer).
- Selecting any item navigates correctly AND closes the overlay; Escape closes it.
- The at-rest wordmark is the compact size (matches `03`–`08`), not the oversized `02` logo.

**Implementation Note**: Pause for manual confirmation after automated verification passes.

---

## Phase 3: Landing mobile layout — intro, bands, contact

### Overview

Style the landing surfaces for phone: intro title/resting states (`01`/`02`), full-bleed section bands with bottom-left number/title/"N chapters · M frames" and a right-side section-dots indicator (`04`), and the centered contact band (`05`).

### Changes Required:

#### 1. Intro mobile layout

**File**: `src/styles/portfolio.css`

**Intent**: Match `01` (large centered MARCIN/KULBICKI + PHOTOGRAPHER + scroll cue) and `02` (collapsed two-line wordmark top-left, role line, "SCROLL TO EXPLORE" cue), at phone sizing.

**Contract**: `@media (max-width: 768px)` rules for `.intro .name`, `.intro .role`/`.role-links`/`.rolelink`, `.cue` — sizing/spacing per the mockups. The hover-crossfade is intentionally not triggered on touch (per decision: per-band heroes are the mobile backdrop equivalent); the intro keeps its default backdrop.

#### 2. Section bands mobile layout + section dots

**File**: `src/styles/portfolio.css` and `src/components/Portfolio.tsx`

**Intent**: Render bands full-bleed with the `04` label layout (bottom-left `NN / 0N`, large title, "N chapters · M frames", "VIEW ↗") and a right-side vertical dots column indicating section position.

**Contract**: CSS in `@media (max-width: 768px)` for `.band`, `.label`, `.num`, `.ttl`, `.view`. A mobile-only section-dots element (one dot per section, active = current band) added to the landing DOM in `Portfolio.tsx`, driven by current landing position; `display:none` on desktop. If wiring the active dot to live landing scroll position proves to need engine state, expose the current landing index from the engine (it already tracks `landingIndexRef`); otherwise render static dots reflecting section count with the active one derived from the visible band. [Snippet deferred — confirm the cheapest source of "active band" during implementation; prefer reusing engine state over a new scroll listener.]

#### 3. Contact mobile layout

**File**: `src/styles/portfolio.css`

**Intent**: Match `05` — centered eyebrow/name/email/location at phone sizing.

**Contract**: `@media (max-width: 768px)` rules for `.contact`, `.c-eyebrow`, `.c-name`, `.c-mail`, `.c-loc`.

### Success Criteria:

#### Automated Verification:

- Lint passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Intro matches `01` (title state) and `02` (resting state with compact wordmark + role line).
- Bands are full-bleed and match `04` (label block bottom-left, section dots right); swiping advances one band at a time with the active dot updating.
- Contact matches `05`.
- Desktop landing is unchanged.

**Implementation Note**: Pause for manual confirmation after automated verification passes.

---

## Phase 4: Single mode mobile layout

### Overview

Lay out the cinematic Single mode for phone (`06`/`07`): SINGLE|ALL toggle top-right under the bar, right-side vertical frame dots, bottom-left meta (index, chapter/section, meta line), hero-cap = eyebrow + title + meta only, rail hidden.

### Changes Required:

#### 1. Single-mode chrome repositioning

**File**: `src/styles/portfolio.css`

**Intent**: Reposition Single-mode chrome to the mockup layout and hide the desktop rail; chapter navigation on mobile is via All mode + sequential swipe (per decision).

**Contract**: `@media (max-width: 768px)` rules: `.vtoggle` → top-right under the bar (`06`/`07`); `.dots` → right-side vertical, frame dots (already column-flex on desktop — adjust position/sizing); `.hud`/`.idx`/`.cap` and `.marker` → bottom-left meta cluster per `06`/`07`; `.rail { display:none }`; reposition/`display:none` `.pager`, `.backbtn`, `.scrollcue` as the mockups dictate.

#### 2. Hero-cap mobile content

**File**: `src/styles/portfolio.css`

**Intent**: Match `06` hero-cap — eyebrow (`02 — PORTRAITS · STUDIO`), large title, meta (`STUDIO · WARSAW 2021—24`), with the descriptive sentence omitted (per decision). No component/data change — the sentence simply isn't rendered (it never was, since `description` is dropped).

**Contract**: `@media (max-width: 768px)` sizing/positioning for `.hero-cap`, `.eyebrow`, `.big`, `.sub`. The existing `.sub` already shows meta · frames; confirm it reads cleanly at phone size.

### Success Criteria:

#### Automated Verification:

- Lint passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- Single hero matches `06` (eyebrow, title, meta, right-side dots, top-right toggle), in-section frame matches `07`.
- Swiping advances frames; the rail is hidden; right dots reflect the current frame.
- The SINGLE|ALL toggle switches modes; no descriptive sentence appears on the hero.
- Desktop Single mode is unchanged.

**Implementation Note**: Pause for manual confirmation after automated verification passes.

---

## Phase 5: All mode (overview) mobile layout

### Overview

Extend the existing 880px overview reflow into the phone layout (`08`): top SINGLE|ALL toggle with prev/next arrows, section header + tagline, chapter list (numbered, with meta), then the grid (full-width lead cell, 2-col thereafter).

### Changes Required:

#### 1. Overview mobile layout

**File**: `src/styles/portfolio.css`

**Intent**: Match `08` at phone sizing, building on the existing column reflow rather than replacing it.

**Contract**: `@media (max-width: 768px)` rules for `.ov-chrome` (toggle + arrows placement), `.ov-section`/`.ov-main`/`.ov-side` (stacked order: section title + number + tagline, chapter list, then grid), `.ov-chead`, `.ov-grid` (2-col), `.ov-cell` / `.ov-cell.lead` (lead full-width). Reconcile with the existing `@media (max-width: 880px)` rules so the two breakpoints compose cleanly (768px refines what 880px starts).

### Success Criteria:

#### Automated Verification:

- Lint passes: `npm run lint`
- Build succeeds: `npm run build`

#### Manual Verification:

- All mode matches `08` (top toggle + arrows, section header + tagline, numbered chapter list, lead cell full-width + 2-col grid).
- Tapping any cell opens Single at that exact frame (`openSingleAt`); the SINGLE|ALL toggle and prev/next section arrows work.
- Tablet (641–880px) overview still reflows as before; desktop overview unchanged.

**Implementation Note**: Pause for manual confirmation after automated verification passes.

---

## Phase 6: Integration & fidelity sweep

### Overview

Verify the full both-modes flow end-to-end on a real device, validate cross-surface interactions (menu overlay z-index, mode toggles), confirm resilience (reduced-motion, print, frozen timeline), and confirm zero desktop regression. Apply any cross-surface polish surfaced during the sweep.

### Changes Required:

#### 1. Cross-surface polish (as needed)

**File**: `src/styles/portfolio.css` (and `Portfolio.tsx` / `usePortfolioEngine.ts` only if a defect requires it)

**Intent**: Resolve any z-index/stacking conflicts (e.g. menu overlay vs stage/overview), transition glitches, or fidelity gaps found while exercising the complete flow against all 8 mockups on-device.

**Contract**: Targeted fixes only; no new surfaces. Any engine/component change must preserve desktop behavior and follow listener-cleanup discipline.

### Success Criteria:

#### Automated Verification:

- Lint passes: `npm run lint`
- Format clean: `npm run format` (no diff)
- Build succeeds: `npm run build`

#### Manual Verification:

- Full mobile flow on a real phone: intro → menu → bands → enter section → Single (swipe) → All → tap cell → Single at frame → back to Index, all via touch, no breakage.
- Menu overlay layers correctly over every surface (landing, Single, All) and closes on selection/Escape.
- Reduced-motion: all content readable, no stuck-invisible reveals; print renders content.
- Side-by-side desktop check: landing, Single, and All are pixel-identical to pre-change (no regression vs S-02).
- The live experience matches the 8 mockups (allowing for content differences).

**Implementation Note**: Final phase — confirm the complete experience on-device before closing the change.

---

## Testing Strategy

### Manual Testing Steps:

1. In devtools device emulation (~390px) and on a real phone, walk the full flow above against each mockup `01`–`08`.
2. Verify discrete one-section landing stepping on touch (the Phase 1 fix) — no free-scroll-then-snap.
3. Toggle Single↔All repeatedly; confirm `openSingleAt` lands on the exact tapped frame.
4. Open/close the menu overlay from each surface; confirm Escape and selection both close it.
5. Rotate to landscape — confirm content remains usable (portrait rules apply; no bespoke landscape expected).
6. Toggle `prefers-reduced-motion` and print preview — confirm content stays visible/readable.
7. On desktop, diff landing/Single/All against the current live site for regressions.

## Performance Considerations

Performance measurement is explicitly out of scope (S-03). Keep within existing patterns: reuse `landingStep`/`step` (no new per-frame work), CSS-only mobile layout (no JS layout thrash), and dynamic viewport units (no resize listeners). Avoid adding scroll listeners where engine state already tracks position (see Phase 3 section-dots note).

## Migration Notes

None — no schema or data changes. Pure front-end. Rollback is a code revert; F-01's rehearsed `wrangler rollback` path covers the live site.

## References

- Change identity: `context/changes/mobile-parity-rework/change.md`
- Roadmap slice S-04: `context/foundation/roadmap.md:137-150`
- PRD refs: US-02, FR-008, FR-009, FR-010, NFRs, Guardrail (mobile parity first-class) — `context/foundation/prd.md`
- Mockups: `context/foundation/design-reference/mobile/01-intro-title.png` … `08-overview.png`
- Engine: `src/components/hooks/usePortfolioEngine.ts` (landing wheel `:279-292`, stage touch `:334-362`, `landingStep` `:256-276`)
- Component: `src/components/Portfolio.tsx`
- Styles: `src/styles/portfolio.css` (existing overview reflow `:1167-1183`)
- Data shaping: `src/pages/index.astro` (chapter.description dropped `:41-51`)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Mobile foundation — viewport units + landing touch

#### Automated

- [x] 1.1 Lint passes: `npm run lint` — 2aadc8a
- [x] 1.2 Format check clean: `npm run format` (no diff) — 2aadc8a
- [x] 1.3 Build succeeds: `npm run build` — 2aadc8a

#### Manual

- [x] 1.4 Landing browses section-by-section with no breakage (discrete-step primary, or native-scroll-snap fallback) — 2aadc8a
- [x] 1.5 Intro/bands/contact fill the screen with no address-bar gap; no jump on scroll — 2aadc8a
- [x] 1.6 Desktop wheel/keyboard landing stepping unchanged — 2aadc8a
- [x] 1.7 Reduced-motion: landing touch stepping jumps instantly — 2aadc8a

### Phase 2: Mobile chrome — hamburger menu overlay

#### Automated

- [x] 2.1 Lint passes: `npm run lint` — 877504d
- [x] 2.2 Build succeeds: `npm run build` — 877504d

#### Manual

- [x] 2.3 Hamburger shows on mobile / inline nav hidden; desktop nav unchanged, no hamburger — 877504d
- [x] 2.4 Overlay matches `03` (Index, numbered sections, accented active, Contact, email footer) — 877504d
- [x] 2.5 Selecting an item navigates AND closes; Escape closes — 877504d
- [x] 2.6 At-rest wordmark is compact (matches `03`–`08`), not the oversized `02` logo — 877504d

### Phase 3: Landing mobile layout — intro, bands, contact

#### Automated

- [x] 3.1 Lint passes: `npm run lint` — aece0ee
- [x] 3.2 Build succeeds: `npm run build` — aece0ee

#### Manual

- [x] 3.3 Intro matches `01` (title) and `02` (resting) — owner override: hero animation desktop-only; mobile shows resting only (links centred, cue bottom + orange, no active highlight) — aece0ee
- [x] 3.4 Bands full-bleed match `04`; section dots update as you swipe — aece0ee
- [x] 3.5 Contact matches `05` — owner redesign: minimal (eyebrow + email), full-height, name/location removed (desktop too) — aece0ee
- [x] 3.6 Desktop landing unchanged (except owner-requested contact redesign) — aece0ee

### Phase 4: Single mode mobile layout

#### Automated

- [x] 4.1 Lint passes: `npm run lint` — eb2eb20
- [x] 4.2 Build succeeds: `npm run build` — eb2eb20

#### Manual

- [x] 4.3 Single hero matches `06`; in-section frame matches `07` — eb2eb20
- [x] 4.4 Swiping advances frames; rail hidden; right dots reflect current frame — eb2eb20
- [x] 4.5 SINGLE|ALL toggle switches modes; no descriptive sentence on hero — eb2eb20
- [x] 4.6 Desktop Single mode unchanged — eb2eb20

### Phase 5: All mode (overview) mobile layout

#### Automated

- [x] 5.1 Lint passes: `npm run lint`
- [x] 5.2 Build succeeds: `npm run build`

#### Manual

- [x] 5.3 All mode matches `08` (top toggle + arrows, header + tagline, chapter list, lead + 2-col grid) — cell index numbers removed (owner request)
- [x] 5.4 Tapping a cell opens Single at the exact frame; toggle + section arrows work
- [x] 5.5 Tablet (641–880px) overview reflow intact; desktop overview unchanged

### Phase 6: Integration & fidelity sweep

#### Automated

- [ ] 6.1 Lint passes: `npm run lint`
- [ ] 6.2 Format clean: `npm run format` (no diff)
- [ ] 6.3 Build succeeds: `npm run build`

#### Manual

- [ ] 6.4 Full mobile flow on a real phone works end-to-end via touch, no breakage
- [ ] 6.5 Menu overlay layers correctly over every surface; closes on selection/Escape
- [ ] 6.6 Reduced-motion + print: content readable, no stuck-invisible reveals
- [ ] 6.7 Desktop landing/Single/All pixel-identical to pre-change (no S-02 regression)
- [ ] 6.8 Live experience matches mockups `01`–`08`
