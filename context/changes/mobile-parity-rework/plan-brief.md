# Mobile Parity Rework — Plan Brief

> Full plan: `context/changes/mobile-parity-rework/plan.md`

## What & Why

Build a first-class mobile experience for the photography portfolio to the owner's 8 reference mockups — full parity on **both** Single (cinematic) and All (overview) modes via touch. This is roadmap slice **S-04**, the north star and the project's stated #1 risk: the hijacked-scroll engine and both view modes working faithfully on a phone. The desktop site is live and verified (S-02); mobile is the milestone that decides whether the product meets its mobile-parity guardrail.

## Starting Point

The scroll engine is already a React island (`Portfolio.tsx` + `usePortfolioEngine.ts`). The **stage already has working touch handlers**, but the **landing has none** — touch was explicitly deferred to this slice — and with `scroll-snap-type: y mandatory` and nothing driving touch, native swipe fights the engine: this is "scroll breaks on mobile." There is essentially no mobile CSS (one media query just reflows the overview); the reference build never had a mobile design, so the mockups are a **new design to build to, not a port**.

## Desired End State

On a phone (`≤768px`), a visitor lands on the intro, opens a hamburger menu overlay to navigate, swipes through full-bleed bands one section per gesture, enters a section, swipes Single mode with right-side frame dots and bottom-left meta, toggles to All and taps any cell to open it at that exact frame — all via touch, nothing breaking. Desktop renders identically to today.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| FR-009 release valve | **Full parity**, valve = fallback only | Mockups show both modes on mobile; FR-010 makes parity non-negotiable | Plan |
| Breakpoint architecture | New `≤768px` phone breakpoint; keep `880px` for tablet overview | Mockups differ structurally (hamburger, repositioned dots) — clamps alone can't express it | Plan |
| Mobile viewport height | CSS `100dvh`/`100svh` | Pure CSS, no JS; fixes address-bar jump on the full-bleed mockups | Plan |
| FR-008 backdrop on touch | Per-band heroes ARE the equivalent; drop intro hover-crossfade on mobile | Already what `04` shows; the band is the backdrop; zero new interaction | Plan |
| Mobile chapter nav (Single) | Via All mode + sequential swipe; hide rail | Matches mockups `06`/`07`; All already maps tapped cell → exact frame | Plan |
| Mobile single-hero text | **Omit** the descriptive sentence; title + meta only | Owner's call; `chapter.description` stays dropped — no data plumbing | Plan |
| Mobile menu | Mobile-only full-screen overlay; desktop inline nav untouched | Matches `03`; isolates mobile behind the breakpoint; reuses nav handlers | Plan |
| Verification | Devtools emulation (primary) + real-phone spot-check at gates | Fast iteration vs mockups; real device catches touch/viewport quirks | Plan |

## Scope

**In scope:** phone breakpoint (`≤768px`) layouts for landing/Single/All; landing touch gestures; hamburger menu overlay; dynamic viewport units; viewport-meta fix.

**Out of scope:** landscape-specific layouts; tablet redesign (641–880px keeps desktop layout + existing overview reflow); performance/Lighthouse measurement (that's S-03); new CMS fields / schema changes; any desktop layout/behavior change.

## Architecture / Approach

A new `@media (max-width: 768px)` layer carries purpose-built mobile layouts over the existing verbatim-class DOM; the existing `880px` overview reflow stays for tablets. Full-screen surfaces move to `dvh`/`svh`. The engine gains two small additions — landing touch listeners (reusing `landingStep`, so clamping/lock/reduced-motion carry over) and a `menuOpen` state. The component gains a hamburger + overlay DOM, both CSS-gated to mobile so SSR/hydration stays deterministic and desktop is untouched.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Foundation + landing touch | Mobile scroll fixed (the #1 risk), `dvh` units, breakpoint scaffold, viewport meta | Touch vs `mandatory` scroll-snap fighting — must neutralize native landing scroll |
| 2. Hamburger menu overlay | Mobile nav (`03`); `menuOpen` state; compact wordmark | New overlay/state must not leak into desktop |
| 3. Landing layout | Intro (`01`/`02`), bands (`04`), contact (`05`) | Section-dots indicator may need engine position state |
| 4. Single mode layout | Toggle/dots/meta repositioned, rail hidden (`06`/`07`) | Cramped chrome on small viewport |
| 5. All mode layout | Overview phone layout (`08`) on top of 880px reflow | Two breakpoints composing cleanly |
| 6. Integration & fidelity sweep | End-to-end on-device; reduced-motion/print; desktop no-regression | Cross-surface z-index / mode-toggle glitches |

**Prerequisites:** none (F-01 rollback net already in place; mockups delivered; engine already React).
**Estimated effort:** ~4–6 sessions across 6 phases; Phases 1–2 carry the engine/state risk, 3–5 are mostly CSS, 6 is verification.

## Open Risks & Assumptions

- **Landing touch vs scroll-snap** is the load-bearing unknown: the mobile layer should neutralize native landing scroll (disable mandatory snap and/or `overflow:hidden` at `≤768px`) so the touch handler drives `landingStep`. **Owner-approved fallback:** if this fights momentum scroll and can't be cleanly resolved, leave native scroll on mobile (keep CSS `scroll-snap-type: y mandatory` for per-band snapping, skip the landing touch handler). That degrades discrete one-step-per-gesture to native-scroll-that-snaps, but still removes the breakage and keeps full-bleed section browsing. Decided in-build in Phase 1; not a blocker.
- **Full parity is committed**; the FR-009 valve is only invoked if a specific mode proves infeasible mid-build — that would be surfaced and decided in-phase, not assumed now.
- Mockups settle layout but not exact spacing tokens; fidelity is judged by eye against the 8 screens (consistent with S-02's approach).
- `dvh`/`svh` assumes modern mobile Safari/Chrome (fine for this audience); no old-browser `--vh` fallback is planned.

## Success Criteria (Summary)

- A visitor can browse the full site on a phone — landing, both modes, menu — entirely via touch, with the app no longer breaking on scroll.
- The mobile experience matches mockups `01`–`08`; the desktop site is unchanged (no S-02 regression).
- Resilient under reduced-motion and print.
