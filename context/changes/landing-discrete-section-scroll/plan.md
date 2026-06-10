# Landing Discrete Section Scroll (via React-island engine migration) — Implementation Plan

## Overview

Make the landing advance **exactly one whole section per scroll-step** (no free-scroll-then-snap), restoring the reference build's discrete stepping feel (US-02, FR-008, Guardrail).

The owner's resolution of ORQ 3 turns this from a one-file fix into an engine migration: **the vanilla scroll engine (`src/scripts/portfolio.ts`) is fully re-expressed as a React island** (per the CLAUDE.md convention), and the new discrete landing stepping is then built on that React foundation. This migration is delivered under S-01 and becomes the engine foundation that S-04 (mobile parity) will consume.

## Current State Analysis

- **The landing has no scroll engine at all.** The wheel/touch/keyboard hijack — `step()` → `lock` (820ms, matched to the 0.9s track transition) → `goTo()` — exists **only on `.stage`** (`src/scripts/portfolio.ts:625–710`). The landing (`.landing`) relies purely on native scroll with `scroll-snap-type: y proximity` (`src/styles/portfolio.css:183`). `proximity` is "free-scroll, then snap only when already near a boundary" — precisely the reported defect.
- **The reference build is identical here.** `context/foundation/design-reference/portfolio.js` also has no landing wheel handler and the same `proximity` CSS. So the "discrete stepping" the roadmap references is the *desired* behavior to build, not a literal diff. The fix is additive behavior plus a CSS snap-mode change.
- **Landing targets are a clean ordered list**, each already carrying `scroll-snap-align: start`: `.intro` (100vh, `portfolio.css:194–201`) → each `.band` (88vh — the intentional "peek", `portfolio.css:406–411`) → `.contact` (`portfolio.css:495–496`). Nav buttons jump to them via instant `landing.scrollTop = t.offsetTop` (`portfolio.ts:449, 594, 599`, etc.).
- **The whole portfolio already renders client-side today.** `index.astro:68` ships an empty `#stageRoot` carrying a `data-portfolio` JSON blob; the inline `<script>` calls `boot()` (`portfolio.ts:715`) which `JSON.parse`s it and builds the entire DOM in-browser via `mount()`. So there is no server-rendered portfolio content today — a `client:only="react"` island preserves this exact rendering model (no SEO/LCP regression vs current, no hydration-mismatch risk on a layout-measuring engine).
- **React is installed and configured but unused as islands.** `@astrojs/react` v5 + React 19 are in `astro.config.mjs:5,26` and `package.json`; `tsconfig.json` has `jsx: react-jsx`, `jsxImportSource: react`, `@/*` → `./src/*`. But there are **no `client:*` directives anywhere** in `src/`, and `src/components/hooks/` does not exist yet. `src/components/ui/button.tsx` is the only `.tsx` and is unused. This island will be the app's first.
- **`prefers-reduced-motion: reduce` is already honored** in CSS (`portfolio.css:1190`), so JS-driven scrolling must honor it too.
- **CI is lint-only** (`.github/workflows/ci.yml`); Cloudflare Builds does build+deploy. Husky pre-commit runs `eslint --fix` on staged files. Type checking is via `@astrojs/check` (`astro check`), not wired into a script — run `npx astro check` manually.

## Desired End State

- The portfolio scroll engine is a React island (`src/components/Portfolio.tsx`), mounted in `index.astro` via `client:only="react"`, receiving the portfolio data as a typed prop. The old `src/scripts/portfolio.ts` + `data-portfolio` + `boot()` path is removed.
- The site is **behaviorally indistinguishable from today** across the landing, Single mode, All mode, nav, keyboard, and the hero-name/intro-bg animations — except for the one intended improvement below.
- Scrolling the landing with the wheel (or Arrow/Page/Space keys) advances **exactly one landing target per step** — intro → band 0 → band 1 → … → contact — with no free-scroll drift. Clamped at both ends (up at intro = no-op; down at contact = no-op). Honors reduced motion (instant jump) vs smooth scroll otherwise. Touch on the landing remains native (owned by S-04).
- `src/styles/portfolio.css` uses `scroll-snap-type: y mandatory` on `.landing` so that even without JS the landing snaps discretely.

**How to verify:** `npm run lint` and `npx astro check` pass; `npm run build` produces a clean `./dist`; and a manual side-by-side of `npm run dev` against `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html` confirms one wheel-notch = one section on the landing and full parity everywhere else.

### Key Discoveries:

- Engine entry: `src/scripts/portfolio.ts:715` (`boot()`) → `mount()` at `:71`. The whole DOM is built imperatively here.
- Stage discrete-step pattern to mirror onto the landing: `portfolio.ts:625–658` (`step`/`armLock`/`lock` + `wheel` listener with `e.preventDefault()` and the `Math.abs(deltaY) < 6` deadzone).
- Landing target jump idiom already in use: `landing.scrollTop = t.offsetTop` (e.g. `portfolio.ts:449`).
- CSS snap line to change: `src/styles/portfolio.css:183` (`scroll-snap-type: y proximity`).
- Data is plain-serializable (`index.astro:28–64`) → safe to pass as an Astro island prop.
- Class-name contract: every class consumed by `portfolio.css` (`.bar`, `.menu`, `.landing`, `.intro`, `.band`, `.contact`, `.stage`, `.track`, `.panel`, `.hero-cap`, `.rail`, `.dots`, `.overview`, `.ov-*`, state classes `.on`/`.live`/`.gone`/`.compact`/`.active`, etc.) must be reproduced verbatim by the React tree.

## What We're NOT Doing

- **Not touching mobile/touch behavior.** Landing touch stays native; the cinematic stage's existing touch handlers are ported as-is (parity only). Mobile parity, touch-gesture rework, and viewport math are S-04.
- **Not redesigning the engine's data flow or features.** No new view modes, no new nav, no visual restyle. The migration is a faithful re-expression; the only behavioral change is discrete landing stepping.
- **Not changing the Sanity query, types of CMS data, image pipeline, or `index.astro`'s data-shaping logic** (`index.astro:10–64` stays; only the mount mechanism at `:67–73` changes).
- **Not editing `portfolio.css` beyond the single `scroll-snap-type` line** unless a class-name parity gap forces a documented exception.
- **Not adding a test framework.** None exists; verification is lint + typecheck + build + manual (per the project's lint-only CI).

## Implementation Approach

Three phases, each independently verifiable:

1. **Scaffold the island and reproduce the static DOM** in JSX with identical class names, mounted via `client:only="react"`, retiring the vanilla boot path. After this, the page renders the correct structure (styled by the unchanged CSS) even before interactivity is wired.
2. **Port all interactivity to behavioral parity** with today's vanilla site, with engine logic living in hooks under `src/components/hooks/`. After this, nothing has changed for the user — the React site behaves exactly like the vanilla one.
3. **Add the discrete landing stepping** (the actual S-01 feature) plus the CSS snap-mode change and reduced-motion handling.

This sequencing isolates the risky rewrite (phases 1–2, "change nothing the user sees") from the feature (phase 3, "the one intended change"), so any regression is attributable to the migration, not the feature, and vice versa.

## Critical Implementation Details

- **`client:only="react"` is the deliberate hydration choice.** The engine reads layout (`offsetTop`, `scrollHeight`) and manipulates the DOM directly; it has no meaningful server-rendered form, and the current site is already 100% client-rendered. `client:only` matches today's model and avoids hydration mismatch. Provide a minimal fallback (e.g. an empty styled `.viewport`) so there's no layout flash.
- **Lock vs in-flight smooth scroll (phase 3).** The landing step must use the same lock idiom as the stage (`portfolio.ts:626–630`) so one wheel gesture (which fires many `wheel` events) advances only one target. Because the step is now a real scroll animation rather than a CSS transform, the lock also prevents `mandatory` snap from fighting an in-flight `scrollTo`. Keep the 820ms lock as a starting point; it should comfortably exceed the smooth-scroll settle on a one-viewport jump.
- **Class-name fidelity is load-bearing.** `portfolio.css` (1190+ lines) is keyed entirely on the current class names and DOM nesting. Any divergence silently breaks styling. The React tree must reproduce the structure from `mount()` (`portfolio.ts:71–334`) and `buildOverview()` (`:454–549`) faithfully, including state-class toggles now expressed as conditional `className`s.
- **Imperative→declarative seams to watch:** the `track` transform (`translateY(-idx*100%)`) becomes a style derived from `idx`; lazy overview build (`gridBuilt`) becomes conditional render; the hero-name `setTimeout` (`portfolio.ts:179–194`) becomes an effect with cleanup; `enter()`'s transition-suppression trick (`portfolio.ts:436–440`: set `transition:none`, force reflow, restore) must be preserved to avoid an animated jump when entering a section.

## Phase 1: Island scaffold + static structure

### Overview

Stand up the React island, wire data flow, and render the full DOM tree as JSX with identical class names — replacing the vanilla `boot()` path. Interactivity is deferred to Phase 2; this phase is about structure-on-screen and a green build.

### Changes Required:

#### 1. Shared engine types

**File**: `src/types.ts`

**Intent**: Give the island typed props by relocating the engine's data interfaces out of the script. The `Photo`/`Group`/`Section`/`PortfolioData`/`Panel` interfaces currently inlined at `portfolio.ts:11–47` move here so both `index.astro` and the island share one contract.

**Contract**: Export `Photo`, `Group`, `Section`, `PortfolioData` (and `Panel`, used internally by the engine). Field shapes are exactly as defined at `portfolio.ts:11–47`. Note: this `Photo` (`{full, thumb, alt}`) is the *engine* photo, distinct from the Sanity `Photo` in `src/sanity/types.ts` — keep them separate; do not merge.

#### 2. Portfolio island component

**File**: `src/components/Portfolio.tsx` (new)

**Intent**: A React component that takes `{ data: PortfolioData }` and renders the complete static DOM the vanilla `mount()` builds — overlays, top bar + menu, landing (intro with intro-bg crossfade layer, name, role links, cue; section bands; contact), stage shell (progress, track of panels, HUD, marker, rail, dots, back, pager, scrollcue, view toggle), and the overview container — all with **verbatim class names**. No event handlers or stateful behavior yet (Phase 2), but the structure and data-driven content (section/chapter/photo mapping, numbering, `data-section`/`data-si`/`data-key` attributes) must be complete and correct.

**Contract**: Default export `Portfolio(props: { data: PortfolioData })`. DOM structure mirrors `portfolio.ts:71–334` (mount) and the per-section/-panel loops at `:246–288`. Image elements reproduce `makeImg()` (`portfolio.ts:56–65`): `class="slot"`, `loading="lazy"`, `decoding="async"`, `data-fit="contain"` for contain images. Use `cn()` from `@/lib/utils` for any conditional class composition. Keep the overview tree out of the initial render (it's lazily built today) — a Phase-2 concern; in Phase 1 it's acceptable to render nothing for it.

#### 3. Mount the island; retire the vanilla path

**File**: `src/pages/index.astro`

**Intent**: Replace the empty `#stageRoot` + `data-portfolio` JSON + inline `boot()` script (`:67–73`) with the React island, passing the already-computed `portfolioData` as a prop. Keep all data-shaping logic (`:10–64`) and the `portfolio.css` import (`:8`) unchanged.

**Contract**: Render `<Portfolio client:only="react" data={portfolioData} />` inside `Layout`. Provide a minimal fallback via the island's slot to avoid a flash (e.g. an empty `<div class="viewport theme-a" />`). Remove the `<script>import { boot }…</script>` block and the `data-portfolio` attribute.

#### 4. Remove the obsolete script

**File**: `src/scripts/portfolio.ts`

**Intent**: Once the island renders structure and the boot path is gone, the vanilla engine is dead code. Delete it at the **end of Phase 2** (not Phase 1) — it stays as the reference to port behavior from. (Listed here for traceability; the deletion step is gated in Phase 2 success criteria.)

**Contract**: File deleted only after Phase 2 parity is confirmed. No import of it may remain.

### Success Criteria:

#### Automated Verification:

- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npx astro check`
- [ ] Production build succeeds: `npm run build`

#### Manual Verification:

- [ ] `npm run dev` renders the landing (intro, all section bands, contact) and the page is styled correctly — class names resolve against `portfolio.css` with no unstyled/misstyled elements.
- [ ] Section bands show correct numbering, titles, chapter/frame counts, and landing-hero images, matching the current live structure.
- [ ] No console errors; the island mounts (no SSR/hydration warnings).

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: Port interactive behavior to parity

### Overview

Bring the engine's full interactivity into the island via hooks, reaching behavioral parity with today's vanilla site. No user-visible change versus current behavior — including that the landing still uses native scroll at the end of this phase (discrete stepping is Phase 3).

### Changes Required:

#### 1. Engine hook(s)

**File**: `src/components/hooks/usePortfolioEngine.ts` (new; split into focused hooks if it grows unwieldy)

**Intent**: House the engine state and behavior currently in `mount()`: current panel `idx`, section/group index maps (`sectionStart`/`sectionLen`/`groupStart`, `portfolio.ts:241–288`), `goTo`/`enter`/`exit`/`openSingleAt`, the stage scroll-hijack (`step`/`armLock`/`lock` + `wheel`/`touch`/`keyboard` listeners, `:625–710`), overview state (`showOverview`/`updateOvArrows`, lazy build), the HUD/rail/dots/progress derivations (`updateUI`, `:381–426`), nav wiring (`:592–622`), and the hero-name timer + intro-bg crossfade (`:173–194`). Expose state + handlers the component binds to.

**Contract**: Per the CLAUDE.md hooks convention (`src/components/hooks/`). The hook owns refs to the scroll containers (stage/track/landing) and registers listeners in effects with cleanup (the current code never removes listeners; the React version must, to survive island unmount/HMR). Preserve the exact constants and behaviors: 820ms lock, `Math.abs(deltaY) < 6` wheel deadzone, 46px touch threshold, 2000ms hero-name delay, the `enter()` transition-suppression reflow trick (`:436–440`), and Single/All toggle semantics.

#### 2. Wire behavior into the component

**File**: `src/components/Portfolio.tsx`

**Intent**: Replace static markup with state-driven rendering: `track` `translateY` from `idx`; `.live`/`.on`/`.gone`/`.compact`/`.active` class toggles from state; conditional render of the overview on first open (replacing the lazy `gridBuilt` build); all click/hover/focus handlers (bar/menu/role links/bands/rail/dots/pager/back/toggles) bound to the hook's handlers.

**Contract**: Visible behavior equals the current site. The stage continues to scroll-hijack; the landing continues to use **native** scroll (unchanged) at the end of this phase. Touch handlers on the stage are ported verbatim.

#### 3. Delete the vanilla engine

**File**: `src/scripts/portfolio.ts`

**Intent**: Remove the now-fully-superseded vanilla engine.

**Contract**: File deleted; `grep -rn "scripts/portfolio" src` returns nothing.

### Success Criteria:

#### Automated Verification:

- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npx astro check`
- [ ] Production build succeeds: `npm run build`
- [ ] No references to the deleted script remain: `grep -rn "scripts/portfolio" src` is empty

#### Manual Verification:

- [ ] Stage scroll-hijack works: wheel/Arrow/Page/Space advance one panel per step with the lock; Escape/back returns to the landing band.
- [ ] Nav parity: brand/Index reset to top + replay hero name; section menu buttons enter the section (or switch overview when All is open); Contact scrolls to the contact band.
- [ ] Single/All toggle, overview grid, overview prev/next arrows, chapter-rail and frame-dot navigation, and click-to-frame all behave as today.
- [ ] Hero-name collapses after ~2s and intro-bg crossfades on role-link/menu hover, as today.
- [ ] No regressions vs the current live site across landing, Single, and All.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 3: Discrete landing stepping (the S-01 feature)

### Overview

Add the one intended behavioral change: the landing advances exactly one whole section per scroll-step, mirroring the stage's discrete engine, plus the CSS snap fallback and reduced-motion handling.

### Changes Required:

#### 1. Landing step engine

**File**: `src/components/hooks/usePortfolioEngine.ts` (and binding in `Portfolio.tsx`)

**Intent**: Add a discrete-stepping handler for the landing that mirrors the stage's `step`/`lock` pattern. Build an ordered list of landing targets (the `.intro`, each `.band`, the `.contact` element — by ref or query within the landing container), track a `landingIdx`, and on wheel/keyboard advance to the next/previous target via `landing.scrollTo({ top: target.offsetTop, behavior })`. Clamp at both ends (up at index 0 = no-op; down at last = no-op). Use the same lock to collapse a single wheel gesture into one step.

**Contract**: Wheel listener on the landing with `{ passive: false }` + `e.preventDefault()` and the `Math.abs(deltaY) < 6` deadzone, mirroring `portfolio.ts:650–658`. Keyboard: ArrowDown/PageDown/Space → +1, ArrowUp/PageUp → −1, active only when the landing is the visible surface (stage/overview not `on`) — coordinate with the existing `onKey` so the two engines don't both fire. `behavior` is `"auto"` when `matchMedia("(prefers-reduced-motion: reduce)").matches`, else `"smooth"`. **Touch is NOT handled here** — the landing keeps native touch scroll (S-04 owns it). Keep `landingIdx` in sync when nav buttons jump the landing (brand/Index/Contact set scroll position directly) so a subsequent wheel step continues from the right place.

#### 2. CSS snap fallback

**File**: `src/styles/portfolio.css`

**Intent**: Make the no-JS landing snap discretely and back-stop the JS engine against near-miss drift.

**Contract**: Change `.landing` `scroll-snap-type: y proximity` → `scroll-snap-type: y mandatory` (line ~183). No other CSS changes.

### Success Criteria:

#### Automated Verification:

- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npx astro check`
- [ ] Production build succeeds: `npm run build`

#### Manual Verification:

- [ ] On `npm run dev`, one wheel-notch on the landing advances **exactly one** target (intro → band 0 → … → contact) with no free-scroll-then-snap drift; a fast flick still advances only one (lock holds).
- [ ] Arrow/Page/Space keys step the landing one target at a time; clamped at intro (up) and contact (down) with no-op at the ends.
- [ ] Side-by-side against `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html`, the landing stepping feel matches the intended discrete behavior.
- [ ] With OS "reduce motion" on, landing steps jump instantly (no smooth animation) while still advancing one target.
- [ ] Touch scroll on the landing still works (native) and the stage/overview behaviors from Phase 2 are unregressed.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation. This is the final phase.

---

## Testing Strategy

### Automated:

- `npm run lint` (ESLint — matches CI), `npx astro check` (types), `npm run build` (SSG output) after every phase. No unit/integration framework exists in the repo; not introducing one.

### Manual Testing Steps:

1. **Phase 1:** Load `npm run dev`; confirm the landing and stage structure render and are correctly styled (class-name parity with `portfolio.css`).
2. **Phase 2:** Exercise stage scroll, nav, Single/All, overview, keyboard, hero-name, intro-bg — confirm parity with the current live site.
3. **Phase 3:** Wheel and keyboard step the landing one section at a time; verify clamp, reduced-motion, native touch, and side-by-side feel vs the reference HTML.

### Edge cases to verify manually:

- Fast/inertial wheel flick advances only one landing target (lock).
- Entering a section from the landing and returning (`Escape`/back) lands on the correct band; subsequent landing wheel continues from there.
- Reduced-motion users get instant discrete jumps, not animation.
- Resizing the window keeps target offsets correct (offsets read at step time, not cached stale).

## Performance Considerations

No new perf budget concerns: the island is `client:only`, matching today's client-only render, so initial payload and LCP characteristics are unchanged. The landing step is a single `scrollTo` per gesture (cheaper than continuous native momentum). Listeners are registered once with cleanup. ~60fps scroll (NFR) is unaffected — the stage transform path is unchanged and the landing now animates one viewport jump rather than free momentum.

## Migration Notes

- This replaces the vanilla `src/scripts/portfolio.ts` with `src/components/Portfolio.tsx` + hook(s). The `data-portfolio` attribute and `boot()` entry point are removed; data flows as a typed island prop.
- Rollback net: F-01's rehearsed `wrangler rollback` path covers a bad deploy. Because phases 1–2 are parity-only, a regression is bisectable to the migration vs the Phase-3 feature.
- This migrated engine is intended as the foundation S-04 (mobile parity) builds on (resolves ORQ 3 in favor of React).

## References

- Change identity: `context/changes/landing-discrete-section-scroll/change.md`
- Roadmap slice S-01 + ORQ 3: `context/foundation/roadmap.md:95–106, 159–163`
- Vanilla engine being migrated: `src/scripts/portfolio.ts` (mount `:71`, stage step `:625–658`, boot `:715`)
- Reference build: `context/foundation/design-reference/portfolio.js`, `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html`
- Data shaping (unchanged): `src/pages/index.astro:10–64`
- CSS snap line: `src/styles/portfolio.css:183`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Island scaffold + static structure

#### Automated

- [x] 1.1 Linting passes: `npm run lint` — 80f6a06
- [x] 1.2 Type checking passes: `npx astro check` — 80f6a06
- [x] 1.3 Production build succeeds: `npm run build` — 80f6a06

#### Manual

- [x] 1.4 Landing (intro, bands, contact) renders and is correctly styled — class names resolve against `portfolio.css` — 80f6a06
- [x] 1.5 Section bands show correct numbering, titles, counts, and hero images — 80f6a06
- [x] 1.6 No console errors; island mounts cleanly — 80f6a06

### Phase 2: Port interactive behavior to parity

#### Automated

- [x] 2.1 Linting passes: `npm run lint` — 433059b
- [x] 2.2 Type checking passes: `npx astro check` — 433059b
- [x] 2.3 Production build succeeds: `npm run build` — 433059b
- [x] 2.4 No references to the deleted script remain: `grep -rn "scripts/portfolio" src` is empty — 433059b

#### Manual

- [x] 2.5 Stage scroll-hijack works (wheel/Arrow/Page/Space one-panel step + lock; Escape/back returns to landing band) — 433059b
- [x] 2.6 Nav parity (brand/Index reset + hero replay; section enter / overview switch; Contact scroll) — 433059b
- [x] 2.7 Single/All toggle, overview grid, prev/next arrows, rail + dots, click-to-frame behave as today — 433059b
- [x] 2.8 Hero-name collapse (~1.5s — owner-tweaked from 2s) and intro-bg hover crossfade as today — 433059b
- [x] 2.9 No regressions vs current site across landing, Single, All — 433059b

### Phase 3: Discrete landing stepping (the S-01 feature)

#### Automated

- [x] 3.1 Linting passes: `npm run lint` — dfd5d25
- [x] 3.2 Type checking passes: `npx astro check` — dfd5d25
- [x] 3.3 Production build succeeds: `npm run build` — dfd5d25

#### Manual

- [x] 3.4 One wheel-notch = exactly one landing target, no free-scroll drift; fast flick still advances one (lock) — dfd5d25
- [x] 3.5 Arrow/Page/Space step one target at a time, clamped at intro (up) and contact (down) — dfd5d25
- [x] 3.6 Side-by-side vs reference HTML: landing stepping feel matches — dfd5d25
- [x] 3.7 Reduced-motion: landing steps jump instantly, still one target — dfd5d25
- [x] 3.8 Native touch scroll on landing still works; Phase-2 stage/overview behaviors unregressed — dfd5d25
