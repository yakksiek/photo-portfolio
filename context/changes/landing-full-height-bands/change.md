---
change_id: landing-full-height-bands
title: Make landing section bands fill the full viewport height (drop the 88vh creep)
status: new
created: 2026-06-10
updated: 2026-06-10
archived_at: null
---

## Notes

Surfaced by S-02 (`desktop-fidelity-verification`) — see `context/changes/desktop-fidelity-verification/fidelity-report.md` gap log.

This is a **deliberate design change**, not a fidelity fix: the live site faithfully reproduces the reference's `.band { height: 88vh }` (`context/foundation/design-reference/portfolio.css:168` == `src/styles/portfolio.css:408`), which leaves ~12vh where the next section "creeps" into view at the bottom of each landing band. In the reference this was an editorial scroll-onward cue under free-scroll; with S-01's discrete one-section-per-step landing, the owner wants each band to fill the full viewport instead — so it sits cleanly at rest with no peek.

Intended change: landing section bands fill the full viewport height (account for the fixed top nav bar so the band isn't clipped). This intentionally diverges from the reference design; record it so it is not re-flagged as a fidelity regression by future audits. Verify discrete stepping still lands each band flush at the top. Scope: landing bands only — intro is already 100vh; contact band (`min-height:80vh`) and Single/All modes are unaffected.
