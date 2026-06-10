---
change_id: landing-discrete-section-scroll
title: Landing scrolls one whole section per scroll-step (discrete stepping)
status: implementing
created: 2026-06-10
updated: 2026-06-10
archived_at: null
---

## Notes

Roadmap S-01 (`context/foundation/roadmap.md`). Owner-reported fidelity defect: the
landing currently free-scrolls then snaps, diverging from the reference build's discrete
one-section-per-scroll-step behavior.

- **Outcome:** Visitor scrolling the landing advances exactly one whole section per
  scroll-step, moving directly to the next section without free-scrolling-then-snapping.
- **PRD refs:** US-02 ("advance one frame per scroll-step"), FR-008, Guardrail (visual
  fidelity vs the reference build).
- **Scope note:** Desktop fix. Touch behavior is owned by S-04 (mobile-parity-rework) —
  see ORQ 3 (scroll-engine architecture: React island vs vanilla JS), which informs the
  approach here. Engine lives at `src/scripts/portfolio.ts` (vanilla JS).
