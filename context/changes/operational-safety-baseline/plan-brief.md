# Operational Safety Baseline — Plan Brief

> Full plan: `context/changes/operational-safety-baseline/plan.md`

## What & Why

Before the next user-facing changes (`S-01` landing-scroll fix, `S-04` mobile rework) ship to the live brand-facing site at `marcinkulbicki.com`, prove the rollback path works and lock down the Cloudflare account. The rollback *command* already exists — this change **rehearses** it (runs a real rollback, not a read-through) and confirms account 2FA, so the riskier changes ship with a known revert net. Closes roadmap item **F-01** and the two open ☐ items in `deployment-plan.md` Phase 7.

## Starting Point

The site is live on Cloudflare Workers Static Assets via `npm run deploy`; `wrangler` is authenticated and rollback is near-instant (static assets, no DB). But the rollback drill has never been run and 2FA status is unconfirmed — so the revert net is theoretical and the vendor-concentrated account (DNS + CDN + host + CI all on it) has unverified lockout protection.

## Desired End State

A real `wrangler rollback` has been executed against production and rolled forward, a written runbook captures the exact verified steps, and account 2FA is confirmed on with recovery codes saved off-platform. The owner can revert in seconds following a procedure that's already been rehearsed, and the account can't be silently lost.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Drill depth | Real rollback + immediate roll-forward | A dry-run wouldn't actually rehearse the net; static assets flip back in seconds so the live window is trivial | Plan |
| Deliverable | Short runbook + tick Phase 7 boxes | A durable, followable procedure satisfies the F-01 outcome literally | Plan |
| 2FA scope | Confirm enabled + save recovery codes | Recovery codes prevent a catastrophic lockout on the single vendor-concentrated account | Plan |
| Roll-forward | `npm run deploy` or rollback to pre-captured current version id | Build is deterministic from Sanity at build time — no content/state drift | Plan |

## Scope

**In scope:** real production rollback drill; 2FA + recovery-codes confirmation; a runbook; checking the two Phase 7 ☐ items; change status flip.

**Out of scope:** any application/config/pipeline code; automated rollback or alerting; multi-region/DR; API-token audit or second account owner; the Sanity publish loop (already proven).

## Architecture / Approach

Three small sequential phases. **Phase 1** (agent-runnable but live-mutating): `wrangler deployments list` → `wrangler rollback` → verify prior build served → roll forward. **Phase 2** (human-only): confirm 2FA + save recovery codes in the Cloudflare dashboard. **Phase 3** (record-keeping): write the runbook, check the Phase 7 boxes, flip change status.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Rehearse the rollback | A proven, run-for-real revert path + captured commands/version ids | Brief window where the live site serves the prior build — keep rollback→roll-forward back-to-back |
| 2. Confirm 2FA + recovery codes | Lockout-proofed vendor-concentrated account | Agent can't verify — fully depends on owner's dashboard confirmation |
| 3. Capture runbook & close out | Durable runbook + closed Phase 7 items + status flip | Runbook drifting from what was actually run — write it straight from Phase 1 output |

**Prerequisites:** `wrangler` authenticated (already true); owner available for the live-drill confirmation and the dashboard 2FA check.
**Estimated effort:** ~1 short session across 3 phases.

## Open Risks & Assumptions

- Phase 1 momentarily serves the prior build on a brand-facing site; mitigated by running at a low-traffic moment and keeping the two steps back-to-back.
- 2FA status is unverifiable by the agent — Phase 2 success rests entirely on the owner's confirmation.
- Assumes the static build is deterministic so roll-forward restores an identical site (true: content fetched from Sanity at build time).

## Success Criteria (Summary)

- The owner has watched a real rollback take effect and revert — the net is proven, not assumed.
- A runbook exists with the exact verified commands; the two Phase 7 ☐ items are checked.
- 2FA is confirmed enabled with recovery codes saved off-platform.
