---
project: "Marcin Kulbicki — Photography Portfolio"
version: 1
status: draft
created: 2026-06-10
updated: 2026-06-10
prd_version: 1
main_goal: quality
top_blocker: decisions
---

# Roadmap: Marcin Kulbicki — Photography Portfolio

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline (2026-06-10).
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.
>
> **This is a remaining-work roadmap over an already-shipped build.** The PRD's content
> model (FR-001–007) and the "publish without code" loop (US-01) are built, deployed, and
> proven live on `marcinkulbicki.com` — they live in `## Baseline`, not as slices. The slices
> below sequence only what is genuinely broken or unverified: a broken landing-scroll behavior,
> an unbuilt/broken mobile experience, and the guardrail/NFR verification the code probes cannot confirm.

## Vision recap

A self-manageable photography portfolio: the bespoke editorial dark front-end (cinematic Single
mode + editorial All mode + a hijacked-scroll engine) already exists; the product adds a
Section → Chapter → Photo content layer so the owner publishes new work without a developer in
the loop. The desktop site is live and the publish-without-code loop is proven. What remains is
**craft**: the live site must be *visually indistinguishable from the reference build* (the PRD's
guardrail) on **both** desktop and mobile — and today it is not, on mobile or on the landing scroll.

## North star

**S-04: Visitor can browse the full site on mobile — both Single and All modes, via touch, with a faithful layout** — this is the project's own stated #1 risk and the still-open mobile-parity question; the desktop hypothesis is already proven, so mobile parity is the milestone that decides whether the product actually meets its guardrails.

> *North star* here means the smallest end-to-end slice whose successful delivery would prove the
> core product promise — placed as early as its prerequisites allow because everything else only
> matters if this works. It is now **ready** and the active priority: the owner has delivered the
> mobile layouts (2026-06-10) and the engine is already a React island (migrated in S-01), so both
> former gates are cleared. The one remaining open question — which view mode degrades if full parity
> can't hold (FR-009 release valve) — is a `/10x-plan`-time decision, not a blocker. Performance
> verification (S-03) is now sequenced *after* mobile (owner's call: build mobile, then measure).

## At a glance

| ID    | Change ID                     | Outcome (user can …)                                              | Prerequisites | PRD refs                          | Status   |
| ----- | ----------------------------- | ---------------------------------------------------------------- | ------------- | --------------------------------- | -------- |
| F-01  | operational-safety-baseline   | (foundation) rehearsed rollback path + account 2FA before prod changes | —             | infra risk register               | done     |
| S-01  | landing-discrete-section-scroll | scroll the landing and advance one whole section per scroll-step (no free-scroll-then-snap) | —             | US-02, FR-008                     | ready    |
| S-02  | desktop-fidelity-verification | trust the live desktop site renders pixel-faithfully to the reference, all content + both modes | —             | US-01, US-02, FR-001–004, FR-006–009 | done     |
| S-04  | mobile-parity-rework          | browse the full site on mobile — both modes, touch, faithful layout | —             | US-02, FR-008, FR-009, FR-010     | ready    |
| S-03  | performance-nfr-verification  | trust the live site meets its performance & resilience guardrails | —             | FR-005, FR-007, all NFRs          | ready    |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                       | Chain               | Note                                                                                  |
| ------ | --------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| A      | Scroll fidelity & mobile    | `S-01` → `S-04`     | The hijacked-scroll work: landing stepping fixed on desktop (S-01 done), now carry both modes to mobile (north star, `ready` — layouts delivered, engine already React). |
| B      | Guardrail verification      | `S-02` / `S-03`     | The "manual check everything" pass; S-02 done; S-03 `ready` but now sequenced *after* S-04 (mobile first, then measure perf). |
| C      | Operational safety          | `F-01`              | Standalone safety baseline; de-risks shipping the bigger changes (`S-04`) to the live brand-facing site. |

## Baseline

What's already in place in the codebase as of 2026-06-10 (auto-researched + owner-corrected).
Foundations below assume these are present and do NOT re-scaffold them. **The owner's correction
matters: code presence ≠ working behavior** — responsive CSS and touch handlers exist in source,
but mobile is effectively unbuilt and the landing scroll is broken (see Slices).

- **Frontend:** present — Astro page + hijacked-scroll engine, now a **React island** (`src/components/Portfolio.tsx` + `src/components/hooks/usePortfolioEngine.ts`), wired to CMS data from a build-time Sanity fetch (`src/pages/index.astro`). Migrated from the original vanilla `src/scripts/portfolio.ts` in S-01 (ORQ 3 resolved).
- **Backend / API:** present (n/a) — no server; static build, Sanity is the content API.
- **Data:** present — Sanity schema `section`/`chapter`/`photo` complete (all of FR-001–006); GROQ `siteQuery` fetches the full tree at build time (`src/sanity/queries.ts:6`); section numbering + cover/contain fit rules applied (`src/sanity/types.ts:33`, `src/pages/index.astro:10`). FR-007 image variants via `urlFor()`.
- **Auth:** present (per `tech-stack.md`) — Sanity Studio login (Sanity-managed); no hand-built auth. Resolves PRD Open Question 1.
- **Deploy / infra:** present — Workers Static Assets live at `marcinkulbicki.com`; publish-without-code loop (Sanity webhook → Cloudflare rebuild) **proven** (deployment Phase 6). Outstanding: rollback drill + account 2FA (→ F-01).
- **Observability:** partial — `wrangler` observability enabled; no error tracking / metrics (none required by the PRD).

**FR coverage by the existing build:** FR-001 (sections), FR-002 (chapters), FR-003 (photos/hero), FR-004 (landing hero), FR-005 (alt), FR-006 (number override), FR-007 (responsive variants + fit rules) — all have working schema/data/render code and are exercised by the proven publish loop. This roadmap's slices **verify** their faithful rendering (S-02/S-03) and **fix/build** the front-end surface they feed (S-01/S-04); they do not rebuild them.

## Foundations

### F-01: Operational safety baseline

- **Outcome:** (foundation) a rehearsed rollback path (`wrangler deployments list` / `wrangler rollback`) and account 2FA are confirmed, so changes can ship to the live brand-facing site with a known revert net.
- **Change ID:** operational-safety-baseline
- **PRD refs:** — (sourced from `infrastructure.md` risk register: "vendor concentration", rollback; deployment Phase 7 ☐ items)
- **Unlocks:** de-risks the production deploy of S-04 (the major mobile rework) — a verified revert path before the riskiest change hits a site that brands are reviewing. Also the safety net for shipping S-01.
- **Prerequisites:** —
- **Parallel with:** S-01, S-02, S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Minimal scope on purpose — the rollback *command* already exists; this is the unrehearsed *drill* + 2FA from deployment Phase 7. Sequenced eagerly because the goal is `quality` and the site is already public; deferring safety infra behind user-facing fixes is exactly the anti-pattern a quality bias rejects.
- **Status:** done

## Slices

### S-01: Landing scrolls one section per step

- **Outcome:** Visitor scrolling the landing advances exactly one whole section per scroll-step, moving directly to the next section without free-scrolling-then-snapping.
- **Change ID:** landing-discrete-section-scroll
- **PRD refs:** US-02 ("advance one frame per scroll-step"), FR-008 (browse the landing), Guardrail (visual fidelity — "all scroll/animation behaviour intact" vs the reference build)
- **Prerequisites:** —
- **Parallel with:** F-01, S-02, S-03
- **Blockers:** —
- **Unknowns:**
  - Does the same discrete-stepping fix need to behave differently on touch, or is touch deferred to S-04? — Owner: Marcin. Block: no (desktop fix proceeds; mobile behavior is owned by S-04).
- **Risk:** A known, owner-reported fidelity defect — current free-scroll-then-snap diverges from the reference's discrete stepping. First because it's the smallest visible-on-desktop fix and restores a guardrail behavior immediately; low blast radius.
- **Status:** ready

### S-02: Live desktop site verified faithful to the reference

- **Outcome:** The owner can trust that the live desktop site renders pixel-faithfully to the reference build across the landing, Single mode, and All mode — with all CMS content (sections, chapters, photos, landing heroes, derived numbering, cover/contain fit) rendering correctly — and any gap is documented.
- **Change ID:** desktop-fidelity-verification
- **PRD refs:** US-01, US-02, FR-001 (sections render), FR-002 (chapters render), FR-003 (photos/hero render), FR-004 (landing hero crossfade), FR-006 (numbering), FR-007 (fit rules), FR-008 (landing + backdrop crossfade), FR-009 (Single/All toggle + click-to-frame), Guardrail (visually indistinguishable from reference)
- **Prerequisites:** —
- **Parallel with:** F-01, S-01, S-03
- **Blockers:** —
- **Unknowns:**
  - Is there a captured reference (screenshots / the `design-reference/` HTML) to diff against, or is fidelity judged by eye? — Owner: Marcin. Block: no.
- **Risk:** The code probes confirm the pipeline *exists* but cannot confirm it renders *faithfully*; this is the desktop half of "manual check everything". Surfaces any defect like S-01 before it reaches a brand's screen. Verification-only — no build.
- **Status:** done

### S-03: Performance & resilience NFRs verified on the live site

- **Outcome:** The owner can trust the live site meets its performance and resilience guardrails — Lighthouse ≥ 90, LCP < 2.5s, CLS < 0.1, responsive images that don't cause layout shift, ~60fps scroll on desktop, and content readable under reduced-motion / print / frozen-timeline — with any failing metric documented.
- **Change ID:** performance-nfr-verification
- **PRD refs:** FR-005 (alt text present for accessibility), FR-007 (appropriately-sized responsive images, no layout shift), all `## Non-Functional Requirements` (Lighthouse ≥90, LCP, CLS, ~60fps, reduced-motion/print resilience, visual fidelity)
- **Prerequisites:** —
- **Parallel with:** F-01, S-01, S-02
- **Blockers:** —
- **Unknowns:**
  - Which devices/connections define "typical broadband" for the Lighthouse run, and does mobile-perf measurement wait on S-04 (since mobile is unbuilt)? — Owner: Marcin. Block: no (desktop NFRs measurable now).
- **Risk:** NFRs are launch guardrails the build has never been measured against; a craft/quality goal makes this non-optional. Verification-only — but a failing metric (e.g. CLS from un-sized images) spawns a follow-up change, so it gates "is the desktop site actually done".
- **Status:** ready

### S-04: Visitor can browse the full site on mobile

- **Outcome:** Visitor on a phone gets a working, faithful mobile experience — the landing, Single mode, and All mode all usable via touch, with the hijacked-scroll behavior intact and the app no longer breaking on scroll. (North star.)
- **Change ID:** mobile-parity-rework
- **PRD refs:** US-02 (explore a section, on mobile), FR-008 (landing + mobile backdrop equivalent), FR-009 (both modes), FR-010 (touch navigation + full desktop features on mobile), Guardrail (mobile parity is first-class, not a reduced experience), PRD Open Question 2
- **Prerequisites:** —
- **Parallel with:** S-03 (independent)
- **Blockers:** — (owner delivered the mobile layouts/screens, 2026-06-10, at `context/foundation/design-reference/mobile/`; see `context/changes/mobile-parity-rework/change.md`).
- **Unknowns:**
  - **Mobile-parity vs the FR-009 release valve (PRD Open Question 2):** the *release valve* is FR-009's acknowledged permission to ship a simpler mobile treatment of one view mode as a last resort, if full parity can't be reached in time. Are BOTH modes achievable on mobile, or does one degrade — and if so, which one and how far? — Owner: Marcin. Block: no (a `/10x-plan`-time decision per the PRD: "Owner: Marcin, at build time").
  - **Scroll-engine architecture (ORQ 3): RESOLVED (2026-06-10)** — the engine was migrated to a React island in S-01 (`src/components/Portfolio.tsx` + `src/components/hooks/usePortfolioEngine.ts`); the vanilla `src/scripts/portfolio.ts` no longer exists. Mobile work builds on the React island.
  - Why does scroll currently break the app on mobile (touch-gesture handling vs viewport math)? — Owner: Marcin/TBD at plan time. Block: no (a diagnosis for `/10x-plan`, not a roadmap gate).
- **Risk:** The project's stated #1 risk: the cinematic hijacked-scroll and both view modes working faithfully on mobile (touch gestures, viewport math) is the largest unknown. Both former gates (owner layouts, engine architecture) are now cleared, so it is `ready`; the parity-vs-release-valve call is made at plan time. Ship behind F-01's rollback net given it mutates the live brand-facing site.
- **Status:** ready

## Backlog Handoff

| Roadmap ID | Change ID                       | Suggested issue title                                  | Ready for `/10x-plan` | Notes |
| ---------- | ------------------------------- | ------------------------------------------------------ | --------------------- | ----- |
| F-01       | operational-safety-baseline     | Rehearse rollback drill + confirm account 2FA          | yes                   | Quick safety task; run alongside S-01–S-03 |
| S-01       | landing-discrete-section-scroll | Fix landing scroll to discrete one-section stepping    | yes                   | Run `/10x-plan landing-discrete-section-scroll` — recommended first |
| S-02       | desktop-fidelity-verification   | Verify live desktop site is pixel-faithful to reference | yes                   | Manual-check pass; parallel with S-03 |
| S-04       | mobile-parity-rework            | Build the mobile experience (both modes, touch, parity) | yes                   | Layouts delivered; engine already React (ORQ 3 resolved). Release-valve call (ORQ 1) decided at plan time. **Recommended next.** |
| S-03       | performance-nfr-verification    | Verify performance & resilience NFRs on the live site  | yes                   | Lighthouse/LCP/CLS + reduced-motion. Sequenced *after* S-04 — measure perf once mobile is built. |

## Open Roadmap Questions

1. **Mobile-parity vs the FR-009 release valve (PRD Open Question 2).** — FR-010 makes full mobile parity non-negotiable; FR-009 carries an acknowledged *release valve* (a permitted last-resort simplification of one view mode on mobile, to protect delivery). If parity can't hold, which mode degrades and how far? **No longer a roadmap blocker** — resolved at `/10x-plan` time per the PRD ("Owner: Marcin, at build time"). Owner: Marcin.
2. ~~**Owner-supplied mobile layouts are pending delivery.**~~ **RESOLVED (2026-06-10):** the owner delivered the mobile layouts/screens, so S-04 can now be planned.
3. ~~**Scroll-engine architecture: React island vs vanilla JS.**~~ **RESOLVED (2026-06-10):** the engine was migrated to a React island in S-01 (`src/components/Portfolio.tsx` + `src/components/hooks/usePortfolioEngine.ts`); the vanilla `src/scripts/portfolio.ts` no longer exists. Mobile work (S-04) builds on the React island.

## Parked

- **Per-photo captions** — Why parked: PRD Non-Goals / Secondary success criteria — deferred to v2 (alt text is in via FR-005).
- **E-commerce / print sales / cart** — Why parked: PRD §Non-Goals — pure portfolio, no selling.
- **Viewer accounts, comments, client galleries** — Why parked: PRD §Non-Goals — single-owner, public-only.
- **Blog / journal** — Why parked: PRD §Non-Goals — no long-form written section.
- **EXIF / map / advanced photo metadata** — Why parked: PRD §Non-Goals — metadata limited to title/place/year/alt.
- **In-page tweak panel (accent colour, hero-name layout)** — Why parked: PRD §Non-Goals — removed entirely.
- **Drag-and-drop photo slots** — Why parked: PRD §Non-Goals — all content comes from the CMS.
- **Self-editable Contact** — Why parked: PRD §Non-Goals — hardcoded for v1 (Marcin Kulbicki · marcin.kulbicki@gmail.com · Switzerland · Poland).
- **Native mobile apps** — Why parked: PRD §Non-Goals — web only, responsive.

## Done

- **F-01: (foundation) a rehearsed rollback path (`wrangler deployments list` / `wrangler rollback`) and account 2FA are confirmed, so changes can ship to the live brand-facing site with a known revert net** — Archived 2026-06-10 → `context/archive/2026-06-10-operational-safety-baseline/`. Lesson: —.
- **S-02: The owner can trust that the live desktop site renders pixel-faithfully to the reference build across the landing, Single mode, and All mode — with all CMS content (sections, chapters, photos, landing heroes, derived numbering, cover/contain fit) rendering correctly — and any gap is documented** — Archived 2026-06-10 → `context/archive/2026-06-10-desktop-fidelity-verification/`. Lesson: a captured reference whose images are empty drop-slots can't be pixel-diffed — fidelity is judged on layout/chrome/motion/fit, and the one "creep" gap turned out to match the reference (spawned `landing-full-height-bands` as a deliberate design change).
