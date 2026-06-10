# Desktop Fidelity Verification — Plan Brief

> Full plan: `context/changes/desktop-fidelity-verification/plan.md`

## What & Why

Prove — and durably document — that the **live desktop site** renders pixel-faithfully to the captured reference build across the landing, Single (cinematic) mode, and All (overview) mode, with all CMS-driven content correct. This is roadmap **S-02**: the code probes confirm the rendering pipeline *exists* but cannot confirm it renders *faithfully*. **Verification-only — no code changes.** Surfaces any defect before it reaches a brand's screen.

## Starting Point

The live site (`marcinkulbicki.com`) is a faithful React-island port (`src/components/Portfolio.tsx` + `usePortfolioEngine.ts`) literally derived from the reference source (`context/foundation/design-reference/portfolio.js` / `portfolio.css`) — same tokens, same 820ms lock / 0.9s slide, same numbering and fit rules. It has never been audited against the reference, and S-01 (discrete landing stepping) intentionally diverged from it.

## Desired End State

A committed `fidelity-report.md` in the change folder: a per-surface checklist with PASS/FAIL/N/A verdicts (audited locally, confirmed live), a gap log with severities, a pre-seeded "expected divergences" section, and an overall verdict — with follow-up `/10x-new` changes filed for any real defect.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Verification method | Side-by-side, layout-focused manual audit | A literal photo pixel-diff is impossible (reference slots render empty), so compare layout/chrome/type/motion/fit and judge photo content separately | Plan |
| Target | Local build first, then confirm live | Fast iteration with devtools, then prove the deployed artifact (not just source) matches | Plan |
| Deliverable | `fidelity-report.md` (checklist + gap log) | Durable sign-off that makes gaps actionable | Plan |
| Gap handling | Log & triage, don't fix here | Keeps the change verification-only with zero blast radius; defects spawn follow-ups | Plan |
| Reference is captured? | Yes — `context/foundation/design-reference/` | Resolves the change's only open unknown (eye-only vs reference) | Plan |

## Scope

**In scope:** Desktop visual fidelity of Landing, Single, All; CMS content rendering (sections/chapters/photos/heroes/numbering); cover/contain fit matrix; tokens/typography/motion; reduced-motion; local audit + live confirmation; report + gap triage.

**Out of scope:** Any code fix (verification-only); performance/Lighthouse/LCP/CLS (S-03); mobile/touch (S-04); automated screenshot-diff pipeline; dropping photos into the reference; re-verifying the Sanity publish loop.

## Architecture / Approach

Open the reference HTML beside the local build; walk a checklist derived from the reference inventory, surface by surface, recording verdicts into `fidelity-report.md`. Reference is used for layout/chrome/type/motion/fit-geometry (its photo slots are empty by design); photo content correctness is judged on the live site. Audit local → confirm on `marcinkulbicki.com` → finalize verdict and file follow-ups.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Desktop fidelity audit (local build) | `fidelity-report.md` with every checkpoint verdicted on local | Conflating the reference's empty image slots with a live defect |
| 2. Live confirmation + verdict & triage | Live-matches-local confirmation, overall verdict, follow-ups filed | Stale live build masking source-level state |

**Prerequisites:** None (S-02 has no prereqs). Need: local dev environment, a browser, and access to `marcinkulbicki.com`.
**Estimated effort:** ~1 focused session across 2 phases.

## Open Risks & Assumptions

- Fidelity is judged by eye on layout/chrome/motion/fit — not a literal photo pixel-diff (not achievable; reference renders empty slots).
- Assumes the live build is current with `main`; if stale, confirm against the `workers.dev` fallback and note it.
- The S-01 landing-stepping divergence is *expected* — pre-recorded so it is never re-filed as a gap.

## Success Criteria (Summary)

- `fidelity-report.md` exists with every Landing / Single / All / cross-cutting checkpoint verdicted on local **and** confirmed live.
- Overall verdict written; every real-defect gap has a follow-up `/10x-new` change-id (or accepted/won't-fix note).
- No source files modified — git diff limited to the change folder.
