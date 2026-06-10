---
change_id: mobile-parity-rework
title: Build the mobile experience — landing, Single, and All usable via touch with a faithful layout
status: implementing
created: 2026-06-10
updated: 2026-06-10
archived_at: null
---

## Notes

Roadmap slice **S-04** (north star) — see `context/foundation/roadmap.md`. Carry both view modes to mobile via touch, with the hijacked-scroll behavior intact and the app no longer breaking on scroll. Builds on the React island (`src/components/Portfolio.tsx` + `src/components/hooks/usePortfolioEngine.ts`); the old vanilla `portfolio.ts` is gone (ORQ 3 resolved). PRD refs: US-02, FR-008, FR-009, FR-010, Guardrail (mobile parity is first-class, not a reduced experience).

### Mobile layouts (owner-supplied reference)

The intended mobile layouts live at **`context/foundation/design-reference/mobile/`** (siblings of the desktop reference). Build mobile to these screens:

| File | Surface / state |
| --- | --- |
| `01-intro-title.png` | Landing intro — title state (large centered MARCIN / KULBICKI) |
| `02-intro-resting.png` | Landing intro — resting state after the title collapses |
| `03-menu.png` | Nav menu (open) |
| `04-landing-bands.png` | Landing section bands (number, title, "N chapters · M frames", dots) |
| `05-contact.png` | Contact band |
| `06-single-hero.png` | Single mode — chapter hero frame |
| `07-single-frame.png` | Single mode — in-section frame |
| `08-overview.png` | All mode — overview grid |

### Known correction to apply (do NOT reproduce the mockup verbatim here)

**`02-intro-resting.png` has the wrong logo size.** The top-bar wordmark is drawn oversized in that screen; at rest it should be the **same compact top-bar wordmark used on all the other screens** (e.g. `03-menu`, `04-landing-bands`, `05`–`08`). This matches the desktop reference behavior — the big centered intro name collapses after the intro and only the small `.brand` persists. Build to the small size, not the size shown in `02`.

### Open decision for `/10x-plan` (not a blocker)

**FR-009 release valve (PRD Open Question 2):** full parity on mobile is the target, but if both view modes can't hold parity, FR-009 permits simplifying ONE mode on mobile as a last resort. Which mode degrades, and how far? — Owner: Marcin, at plan time. Also diagnose at plan time *why* scroll currently breaks the app on mobile (touch-gesture handling vs viewport math).
