# Desktop Fidelity Verification Implementation Plan

## Overview

Verify — and document a durable sign-off — that the **live desktop site** renders pixel-faithfully to the captured reference build, across the landing, Single (cinematic) mode, and All (overview) mode, with all CMS-driven content (sections, chapters, photos, landing heroes, derived numbering, cover/contain fit) rendering correctly. This is **verification-only: no code changes are produced by this change.** Any divergence is logged and triaged; real defects spawn separate follow-up changes.

This is roadmap slice **S-02** (`context/foundation/roadmap.md:108`). It is the desktop half of "manually check everything" — the code probes confirm the rendering pipeline *exists*, but cannot confirm it renders *faithfully*. Perf/NFRs belong to **S-03** and mobile belongs to **S-04**; both are out of scope here.

## Current State Analysis

**There is a captured reference build** at `context/foundation/design-reference/`:
- `Marcin Kulbicki - Portfolio.html` — the reference entry point
- `portfolio.js` — the original vanilla scroll engine + view modes
- `portfolio.css` — the original styling
- `design-tokens.css` / `design-tokens.json` — colors, fonts, durations, fit rules
- `image-slot.js` — the (removed) drag-and-drop photo-placeholder custom element
- `tweaks-app.jsx` / `tweaks-panel.jsx` — the (removed) tweak panel

**The live build is a faithful React-island port** literally derived from those reference source files:
- `src/pages/index.astro` — build-time Sanity fetch → `PortfolioData` → React island (`client:only="react"`, `index.astro:76`); image-fit decided at build time (`index.astro:15-17`, `45-62`).
- `src/components/Portfolio.tsx` — the single island covering landing + stage (Single) + overview (All).
- `src/components/hooks/usePortfolioEngine.ts` — the ported engine; same constants as the reference: `LOCK_MS = 820`, `WHEEL_DEADZONE = 6`, `TOUCH_THRESHOLD = 46` (`usePortfolioEngine.ts:7-9`).
- `src/styles/portfolio.css` — ported tokens: `--accent: #ff3b1d`, Archivo/Space Mono, `--grain-opacity: 0.1`, `--ease: cubic-bezier(.76,0,.24,1)`, `--photo-filter: contrast(1.07) saturate(.94) brightness(.98)`.
- `src/sanity/types.ts:33-35` — `sectionNumber()` = `String(numberOverride ?? order).padStart(2,"0")`.

**Live URLs** (`context/changes/deployment/`): `https://marcinkulbicki.com` (primary, custom domain) and `https://photo-portfolio.marcin-kulbicki.workers.dev` (Workers fallback). Static build on Cloudflare Workers Static Assets; auto-deploy on push to `main`; Sanity webhook triggers rebuilds.

**No test framework exists** — lint + typecheck + manual verification is the project model (`context/changes/bootstrap-verification/`). So "automated verification" for this change is thin (lint/typecheck/build green + both targets load); the substance is the structured manual audit.

### Key Discoveries:

- **A literal photo pixel-diff is impossible.** The reference's `<image-slot>` elements are empty drag-and-drop placeholders persisted to localStorage (`context/foundation/design-reference/image-slot.js:4-44`); there are **no real image URLs baked into the reference** (only `data:` URLs present are the grain SVG and a dropdown arrow). Opened fresh, the reference shows "Drop an image" placeholders. The live site renders real Sanity photos. → **Fidelity here = layout, structure, typography, color tokens, motion/timing, chrome, and the cover/contain *fit behavior*** — judged against the reference's layout; photo *content* is judged separately (right photo, right place, right fit, no layout shift).
- **One known *intentional* divergence: the landing scroll.** S-01 (`landing-discrete-section-scroll`, shipped) deliberately made the landing advance one section per wheel-notch. The *original reference free-scrolls then snaps* (it has no landing wheel handler; `landing-discrete-section-scroll/plan.md:11`). On the landing scroll the live site **intentionally does not match** the old reference — this is an expected divergence, not a defect, and must be recorded as such so it is never re-filed as a gap.
- **The reference's default backdrop is the "Portraits" section** (`portfolio.js:115-118`); crossfade is 0.9s `cubic-bezier(.76,0,.24,1)`.
- **Fit-rule matrix to verify** (`portfolio.js` + `design-tokens.json:50-56`): landing bands = cover, chapter hero (stage) = cover, in-section frames = contain (with letterbox padding), overview lead cell = cover, overview thumbnails = contain.
- **Reduced-motion** is honored in both: CSS gates `nameRise`/`fadeUp`/`cuepulse`/hero-caption `rise`/`grainshift` behind `prefers-reduced-motion: no-preference`; the engine uses instant scroll when reduced-motion is set (`usePortfolioEngine.ts:272-273`).

## Desired End State

A committed `context/changes/desktop-fidelity-verification/fidelity-report.md` exists that:
1. Enumerates every fidelity checkpoint across **landing**, **Single mode**, and **All mode** (plus cross-cutting: tokens, typography, motion/timing, numbering, fit rules, reduced-motion).
2. Records a **pass/fail verdict per checkpoint**, audited on the local build and confirmed on the live site.
3. Carries a **gap log** with severity for any divergence found, plus an explicit **"expected divergences"** section (the S-01 landing stepping) so known-intentional differences are never re-filed.
4. States an **overall verdict** ("faithful" / "faithful with N logged gaps").
5. Has follow-up `/10x-new` changes filed for any real defect (referenced by id in the gap log).

**Verification of done:** the report exists and is complete; every checklist item has a verdict; the live confirmation pass is recorded; gaps (if any) have follow-up change ids.

## What We're NOT Doing

- **No code changes / no fixes.** This is verification-only. Trivial CSS divergences are *logged*, not patched (fixing here would contradict the roadmap's "no build" and balloon scope). Real defects become separate changes.
- **No performance / NFR measurement** — Lighthouse, LCP, CLS, ~60fps, image-weight: that is **S-03** (`performance-nfr-verification`).
- **No mobile / touch verification** — that is **S-04** (`mobile-parity-rework`).
- **No automated screenshot-diff pipeline.** A literal photo pixel-diff is not viable (reference renders empty slots) and no test harness exists; building one is out of scope for a tight verification pass.
- **No dropping photos into the reference** to force a true side-by-side — rejected as hours of fiddly localStorage setup whose result still wouldn't pixel-match (Sanity crop + `--photo-filter`).
- **No re-verification of the Sanity publish loop** — proven in deployment Phase 6.

## Implementation Approach

A **structured manual side-by-side audit**, layout-focused. Open the reference (`context/foundation/design-reference/Marcin Kulbicki - Portfolio.html`) in one window and the live build in another; walk a checklist derived from the reference, surface by surface, recording verdicts into `fidelity-report.md`. Audit first on the **local build** (`npm run dev` / `npm run preview`) with devtools available for computed-style spot-checks, then **confirm on `marcinkulbicki.com`** that the deployed artifact matches the local result. Divergences are logged with severity; the known S-01 landing-stepping difference is pre-recorded as expected.

The reference HTML is opened for **layout / chrome / typography / motion / fit-framing** comparison (its photo slots will be empty — that is expected); photo **content** correctness (right Sanity photo in the right place, correct cover/contain, no load-time layout shift) is judged on the live site directly.

## Critical Implementation Details

- **Reference rendering caveat:** the reference HTML, opened fresh, shows empty "Drop an image" placeholders (`image-slot.js`). Do **not** treat empty slots as a live-site defect — compare the *frame/letterbox geometry, aspect ratios, and fit mode* around the slot, not the slot's pixels. The live site is where photo content is judged.
- **Expected divergence (must pre-seed in the report):** landing wheel/touch behavior. Reference = free-scroll-then-snap; live = discrete one-section-per-step (S-01, intentional). Verify the live landing behaves as S-01 specified, **not** as the reference.
- **Backdrop default:** confirm the live intro backdrop defaults to the **Portraits** section and crossfades on hover of nav buttons + role links, resetting to default on mouseleave (`portfolio.js:108,159`).

## Phase 1: Desktop fidelity audit (local build)

### Overview

Stand up the side-by-side harness, derive the fidelity checklist from the reference, and execute it surface-by-surface on the local build — writing every verdict and gap into `fidelity-report.md`.

### Changes Required:

#### 1. Fidelity report scaffold

**File**: `context/changes/desktop-fidelity-verification/fidelity-report.md` (new)

**Intent**: Create the durable audit artifact: a header (date, build SHA, target, method), an "Expected divergences" section pre-seeded with the S-01 landing-stepping difference, then a checklist organized by surface, and an empty gap log + overall-verdict slot.

**Contract**: Markdown sections in this order — `## Method & targets`, `## Expected divergences (not defects)`, `## Landing`, `## Single mode`, `## All mode`, `## Cross-cutting (tokens, type, motion, numbering, fit)`, `## Gap log`, `## Overall verdict`. Each checklist item is a `- [ ]`-style line with a verdict cell (`PASS` / `FAIL` / `N/A`) and a notes column. The checkpoint set is derived from the reference inventory:
- **Landing**: intro title sequence (name rise → ~1.5–2s hold → collapse to compact role), four section bands in order with `NN / 04` numbering + "C chapters · F frames" labels, contact band (name/email/location), **backdrop crossfade** (default = Portraits, hover nav/role links → 0.9s crossfade, reset on leave), scroll cue, **landing stepping = discrete (S-01 expected divergence)**.
- **Single mode**: enter from band click + role-link, frame-by-frame stepping with 820ms lock + 0.9s slide, hero panel full-bleed **cover**, in-section frames **contain** with letterbox padding, hero caption `NN — Section · Chapter NN / NN` + rise animation, HUD/marker/progress-bar/rail/dots, Single|All toggle, Escape/back exits to landing.
- **All mode**: lazy overview grid per section, chapter blocks with `## chead` (number/title/place·count), 2-col grid with **lead cell cover (16/9)** + **thumbnails contain (4/5)**, sticky side column (number/title/tagline/chapter buttons/tags), prev/next section arrows, **click any cell → Single at that exact frame**, All|Single toggle.
- **Cross-cutting**: color tokens (`--accent #ff3b1d`, bg/fg/muted/line), fonts (Archivo display, Space Mono mono), grain (0.10, soft-light) + vignette, `--photo-filter`, easing `cubic-bezier(.76,0,.24,1)`, section numbering format + manual-override behavior, the full cover/contain fit matrix, **reduced-motion** (animations off, instant scroll, content still visible).

#### 2. Side-by-side harness (no file change — environment setup)

**Intent**: Have both surfaces viewable together: the reference HTML and the local build.

**Contract**: `npm run dev` (or `npm run build && npm run preview`) serving the live build locally; `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html` opened in a second window. No repo change — this is the audit setup.

#### 3. Execute the audit and record verdicts

**File**: `context/changes/desktop-fidelity-verification/fidelity-report.md` (fill in)

**Intent**: Walk every checklist item on the local build against the reference, marking PASS/FAIL/N/A with notes; append any divergence to the gap log with a severity (`blocker` / `major` / `minor` / `cosmetic`) and the surface it appears on. Use devtools to spot-check computed tokens/timings where the eye is ambiguous.

**Contract**: Every checklist line gets a verdict. Gap-log rows: `severity · surface · expected (reference ref) · observed (live ref) · note`. The S-01 landing-stepping difference stays in "Expected divergences," never the gap log.

### Success Criteria:

#### Automated Verification:

- Local build serves: `npm run dev` (or `npm run build && npm run preview`) starts and `/` returns the portfolio with content.
- Repo still green (no accidental edits): `npm run lint` passes.
- Reference opens: `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html` loads in a browser.

#### Manual Verification:

- `fidelity-report.md` exists with all sections and the checklist fully enumerated from the reference.
- Every checklist item across Landing / Single / All / Cross-cutting has a PASS/FAIL/N/A verdict recorded on the local build.
- The S-01 discrete-landing-stepping divergence is recorded under "Expected divergences," and the live landing is confirmed to behave discretely (not free-scroll-then-snap).
- Cover/contain fit matrix verified at all five contexts; numbering format verified; reduced-motion behavior verified.
- Any divergence is in the gap log with a severity and reference/live line refs.

**Implementation Note**: After Phase 1's automated checks pass, pause for manual confirmation that the local audit is complete and the verdicts are trustworthy before proceeding to the live confirmation pass.

---

## Phase 2: Live confirmation + verdict & triage

### Overview

Confirm the deployed artifact on `marcinkulbicki.com` matches the local audit (proving the live site, not just local source, is faithful), write the overall verdict, and file follow-up changes for any real defect.

### Changes Required:

#### 1. Live confirmation pass

**File**: `context/changes/desktop-fidelity-verification/fidelity-report.md` (update)

**Intent**: Re-run the audit's key checkpoints against the live production URL and record that the live result matches local (or note any live-only delta, e.g. a stale build). Focus on the surfaces most likely to differ between local and deployed: backdrop crossfade, both view modes rendering real Sanity content, image fit on real photos, numbering from live CMS data.

**Contract**: Add a `## Live confirmation` subsection (target URL + deploy version if visible) recording, per surface, "matches local" or a delta. If the live build is stale relative to `main`, note it and confirm against the fallback `workers.dev` URL.

#### 2. Overall verdict + gap triage

**File**: `context/changes/desktop-fidelity-verification/fidelity-report.md` (finalize) and, per real defect, new change folders via `/10x-new`.

**Intent**: Write the overall verdict ("faithful" or "faithful with N logged gaps"). For each gap-log entry that is a genuine defect (not an expected divergence), open a follow-up change with `/10x-new` and reference its change-id back in the gap-log row. Do not fix anything in this change.

**Contract**: `## Overall verdict` filled with the conclusion and a count of open gaps; each defect gap-log row annotated with its follow-up `change-id` (or "won't-fix / accepted" with a one-line rationale). `change.md` status updated to reflect completion.

### Success Criteria:

#### Automated Verification:

- Live site reachable: `https://marcinkulbicki.com/` returns HTTP 200 with portfolio content (e.g. `curl -sSI https://marcinkulbicki.com/` shows `200`).
- Repo still green: `npm run lint` passes (confirming verification-only — no source changed).

#### Manual Verification:

- The live site's Landing / Single / All render and behave consistently with the local audit; deltas (if any) are recorded with cause.
- `## Overall verdict` is written with the faithful/gaps conclusion.
- Every defect gap-log row has a follow-up `/10x-new` change-id (or an explicit accepted/won't-fix note).
- No source files were modified by this change (git diff limited to `context/changes/desktop-fidelity-verification/`).

**Implementation Note**: After Phase 2, pause for manual confirmation that the live pass is trustworthy and the verdict + triage are complete before considering S-02 done.

---

## Testing Strategy

This change produces no executable code; "testing" is the audit itself. The verification rigor lives in the two phases' Manual Verification sections.

### Manual Testing Steps:

1. Serve the live build locally and open the reference HTML beside it.
2. Walk the `fidelity-report.md` checklist surface-by-surface (Landing → Single → All → Cross-cutting), recording verdicts; spot-check ambiguous tokens/timings in devtools.
3. Exercise the fit matrix on real photos: hero cover, frame contain, overview lead cover, overview thumb contain, landing band cover.
4. Toggle OS reduced-motion and confirm content stays visible with animations disabled and scrolling instant.
5. Repeat the key checkpoints against `marcinkulbicki.com`; record matches/deltas.
6. Finalize verdict; file follow-ups for real defects.

## Migration Notes

None — no code, data, or schema changes.

## References

- Roadmap slice: `context/foundation/roadmap.md:108` (S-02)
- Change identity: `context/changes/desktop-fidelity-verification/change.md`
- Reference build: `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html`, `portfolio.js`, `portfolio.css`, `design-tokens.json`
- Live implementation: `src/pages/index.astro`, `src/components/Portfolio.tsx`, `src/components/hooks/usePortfolioEngine.ts`, `src/styles/portfolio.css`, `src/sanity/types.ts:33`
- Known intentional divergence: `context/changes/landing-discrete-section-scroll/plan.md:11`
- Live URLs + deploy model: `context/changes/deployment/deployment-plan.md`
- PRD guardrail: `context/foundation/prd.md:102`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Desktop fidelity audit (local build)

#### Automated

- [x] 1.1 Local build serves: `npm run dev` (or `build && preview`) starts and `/` returns portfolio with content — audit performed against the live deployed build (real Sanity content)
- [x] 1.2 Repo still green (no accidental edits): `npm run lint` passes
- [x] 1.3 Reference opens: design-reference HTML loads in a browser
- [x] 1.4 `fidelity-report.md` exists with all sections and the checklist fully enumerated from the reference
- [x] 1.5 Every checklist item (Landing / Single / All / Cross-cutting) has a PASS/FAIL/N/A verdict — all PASS
- [x] 1.6 S-01 discrete-landing-stepping recorded under "Expected divergences"; live landing confirmed discrete (not free-scroll-then-snap)
- [x] 1.7 Cover/contain fit matrix verified at all five contexts; numbering format verified; reduced-motion verified
- [x] 1.8 Divergence triage complete — single observation (band creep) logged; confirmed faithful to reference

### Phase 2: Live confirmation + verdict & triage

#### Automated

- [x] 2.1 Live site reachable: `https://marcinkulbicki.com/` returns HTTP 200 with portfolio content
- [x] 2.2 Repo still green: `npm run lint` passes (verification-only — no source changed)

#### Manual

- [x] 2.3 Live Landing / Single / All render and behave consistently — "rest as expected" per manual review
- [x] 2.4 `## Overall verdict` written — faithful, 0 fidelity defects
- [x] 2.5 Gap-log disposition recorded — band creep matches reference (not a defect); owner's full-height redesign tracked in follow-up `landing-full-height-bands`
- [x] 2.6 No source files modified (git status shows only the two `context/changes/` folders)
