---
change_id: operational-safety-baseline
title: Operational safety baseline — rehearsed rollback drill + account 2FA before prod changes
status: implementing
created: 2026-06-10
updated: 2026-06-10
archived_at: null
---

## Notes

Roadmap item F-01 (`context/foundation/roadmap.md`). Foundation safety task: confirm a
rehearsed rollback path (`wrangler deployments list` / `wrangler rollback`) and account 2FA, so
later changes can ship to the live brand-facing site (`marcinkulbicki.com`) with a known revert net.
De-risks shipping S-01 and the major S-04 mobile rework. Source: deployment Phase 7 ☐ items +
`infrastructure.md` risk register (vendor concentration, rollback). The rollback *command* already
exists — this is the unrehearsed *drill* + 2FA, intentionally minimal scope.
