# Landing Discrete Section Scroll — Plan Brief

> Full plan: `context/changes/landing-discrete-section-scroll/plan.md`

## What & Why

Make the landing advance **exactly one whole section per scroll-step** — no free-scroll-then-snap — restoring the reference build's discrete stepping feel (US-02, FR-008, Guardrail). Per the owner's resolution of roadmap ORQ 3, the fix is delivered by **migrating the vanilla scroll engine to a React island** (the CLAUDE.md convention) and building the new landing stepping on that foundation. The migrated engine becomes the base S-04 (mobile parity) will consume.

## Starting Point

The portfolio is driven by a vanilla engine (`src/scripts/portfolio.ts`) that builds the entire DOM client-side from a `data-portfolio` JSON blob (`index.astro:68`). The cinematic `.stage` already has a discrete scroll-hijack (`step`/`lock`/`goTo`), but the `.landing` has **no scroll engine at all** — it relies on native `scroll-snap-type: y proximity` (`portfolio.css:183`), which is exactly the reported "free-scroll then snap" defect. React 19 + `@astrojs/react` are installed but no island is mounted anywhere yet.

## Desired End State

The scroll engine is a React island (`src/components/Portfolio.tsx` + hooks) mounted via `client:only="react"`, behaviorally identical to today everywhere — except the landing now advances one target per wheel/keyboard step (intro → bands → contact), clamped at both ends, honoring reduced motion, with touch left native (S-04's domain). The old script and `data-portfolio`/`boot()` path are gone.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Engine architecture (ORQ 3) | Migrate to a React island | Aligns with CLAUDE.md convention and lays the engine foundation S-04 needs | Plan (owner) |
| Migration scope | Full rewrite of the engine | A clean React foundation, not a half-converted seam | Plan (owner) |
| Roadmap overlap with S-04 | Proceed under S-01 | Deliver the React migration now; S-04 consumes it later | Plan (owner) |
| Landing input scope | Wheel + keyboard; touch native | Matches S-01's desktop scope; touch is owned by S-04 | Plan (owner) |
| Scroll-snap CSS | `proximity` → `mandatory` | Discrete snap even without JS; back-stops near-miss drift | Plan (owner) |
| Reduced motion | Instant under `reduce`, else smooth | Honors the existing reduced-motion NFR | Plan (owner) |
| Boundary behavior | Clamp (no-op at both ends) | Mirrors the stage's clamp semantics | Plan (owner) |
| Hydration mode | `client:only="react"` | Matches today's 100% client-rendered model; no hydration-mismatch risk | Plan |
| Verification | Manual side-by-side vs reference + lint/typecheck | Scroll feel isn't unit-testable; reference HTML is local | Plan (owner) |

## Scope

**In scope:** React-island migration of the full engine at parity; discrete landing stepping (wheel + keyboard); CSS snap-mode change; reduced-motion handling; type extraction to `src/types.ts`; hooks under `src/components/hooks/`.

**Out of scope:** Mobile/touch landing behavior (S-04); any feature/visual redesign; Sanity query/data/image changes; `index.astro` data-shaping; CSS beyond the one snap line; adding a test framework.

## Architecture / Approach

`index.astro` keeps its data-shaping and passes `portfolioData` as a typed prop to `<Portfolio client:only="react" data={…} />`. The island reproduces the vanilla DOM in JSX with **verbatim class names** (so `portfolio.css` applies unchanged), with engine state/behavior in hooks (`usePortfolioEngine`). The landing gains a wheel/keyboard step handler mirroring the stage's `step`/`lock` pattern, driving `landing.scrollTo({ top: target.offsetTop, behavior })`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Island scaffold + static structure | React island renders the full DOM (identical classes), mounted via `client:only`; vanilla boot retired | Class-name divergence silently breaking `portfolio.css` |
| 2. Port behavior to parity | All interactivity (stage hijack, nav, overview, keyboard, animations) in hooks; vanilla script deleted | Subtle behavior regressions vs the imperative original |
| 3. Discrete landing stepping | Wheel + keyboard one-section stepping, `mandatory` snap, reduced-motion | Lock/snap fighting an in-flight smooth scroll; key-handler overlap with stage |

**Prerequisites:** None (F-01 rollback net already in place). Reference HTML available locally for side-by-side.
**Estimated effort:** ~2–3 sessions across 3 phases; Phase 1–2 are the bulk (full engine rewrite), Phase 3 is small.

## Open Risks & Assumptions

- The biggest risk is regression in the parity rewrite (phases 1–2), not the feature — mitigated by keeping those phases behavior-neutral and verifying against the live/reference build before Phase 3.
- Assumes class-name + DOM-nesting fidelity keeps `portfolio.css` fully applicable; any unavoidable gap is a documented CSS exception.
- Assumes `client:only` is acceptable (it matches today's client-only rendering — no SEO/LCP delta).
- This pulls the ORQ-3 engine decision forward into S-01; a desktop-only migration may still need mobile-specific rework when S-04's owner layouts arrive.

## Success Criteria (Summary)

- Scrolling the landing advances exactly one section per wheel-notch / key-press, no free-scroll drift, matching the reference feel.
- Everything else (Single, All, nav, keyboard, animations) is indistinguishable from today.
- `npm run lint`, `npx astro check`, and `npm run build` all pass; engine runs as a React island.
