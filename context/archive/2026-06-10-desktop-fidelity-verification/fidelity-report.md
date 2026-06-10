# Desktop Fidelity Report — S-02

> Plan: `context/changes/desktop-fidelity-verification/plan.md`

## Method & targets

- **Method:** structured manual side-by-side audit, layout-focused (reference renders empty image slots by design; photo content judged on the live site).
- **Reference:** `context/foundation/design-reference/Marcin Kulbicki - Portfolio.html` (+ `portfolio.css` / `portfolio.js`).
- **Targets:** live build (local) + `https://marcinkulbicki.com`.
- **Build SHA at audit:** `d608c4c`.
- **Auditor:** Marcin (manual review), 2026-06-10.

## Expected divergences (not defects)

- **Landing scroll = discrete one-section-per-step.** S-01 (`landing-discrete-section-scroll`) intentionally replaced the reference's free-scroll-then-snap landing with discrete stepping. Confirmed working correctly. This is the desired behavior, not a gap.

## Landing

- **Verdict: PASS** — intro title sequence, four section bands (order + `NN / 04` numbering + "C chapters · F frames" labels), contact band, backdrop crossfade, and scroll cue all render and behave as expected.
- Discrete landing stepping confirmed correct (see Expected divergences).
- **Observation — section-band "creep" (resolved, PASS):** at rest, a landing band fills ~88% of the viewport with ~12% of the next section peeking at the bottom (see screenshot 2026-06-10 13.40.45 — LIFESTYLE band with LANDSCAPE creeping in). **Root cause:** `.band { height: 88vh }` — and the **reference is identical** (`context/foundation/design-reference/portfolio.css:168` = `height:88vh`; live `src/styles/portfolio.css:408` = `height: 88vh`). The peek is the reference's intended editorial "scroll-onward" cue, faithfully reproduced. **Not a fidelity defect.** Whether to change to full-height (100vh) bands is a *design decision*, not a fidelity fix — see Gap log disposition.
- **Incidental note (no visible effect):** snap type differs — reference `scroll-snap-type: y proximity` (`portfolio.css:90`) vs live `y mandatory` (`portfolio.css:183`). Because the engine scrolls programmatically to each target's `offsetTop`, this has no visible effect on the discrete stepping. Not a gap.

## Single mode

- **Verdict: PASS** — "rest as expected" per manual review: enter from band/role-link, frame-by-frame stepping (820ms lock / 0.9s slide), hero full-bleed cover, in-section frames contain with letterbox, hero caption + rise, HUD/marker/progress/rail/dots, Single|All toggle, Escape/back to landing.

## All mode

- **Verdict: PASS** — "rest as expected" per manual review: overview grid per section, chapter blocks, lead cell cover (16/9) + thumbnails contain (4/5), sticky side column, prev/next arrows, click-to-frame opens Single at the exact frame, All|Single toggle.

## Cross-cutting (tokens, type, motion, numbering, fit)

- **Verdict: PASS** — color tokens (`--accent #ff3b1d` etc.), Archivo/Space Mono, grain + vignette, `--photo-filter`, easing, numbering format, and the full cover/contain fit matrix all match the reference. Reduced-motion behavior as expected.

## Gap log

| Severity | Surface | Expected (reference) | Observed (live) | Disposition |
| --- | --- | --- | --- | --- |
| — | Landing | `.band` 88vh, next section peeks (`portfolio.css:168`) | `.band` 88vh, next section peeks (`portfolio.css:408`) | **Matches reference — not a fidelity defect.** Owner opted to redesign to full-height bands → deliberate design change tracked in follow-up `landing-full-height-bands`. |

No fidelity defects found. The single flagged observation is faithful to the reference; the owner's decision to move to full-height bands is a deliberate design change (not a fidelity fix), tracked separately in `context/changes/landing-full-height-bands/`.

## Overall verdict

**Faithful — 0 fidelity defects.** The live desktop site renders faithfully to the reference across Landing, Single, and All modes, with all CMS content correct. The one item flagged in manual review (landing band "creep") is the reference's intended 88vh design, reproduced exactly. Disposition of whether to redesign to full-height bands is a separate product decision (not part of S-02's fidelity scope).
