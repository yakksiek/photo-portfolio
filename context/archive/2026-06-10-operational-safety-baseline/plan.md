# Operational Safety Baseline — Implementation Plan

## Overview

Before the next user-facing changes (`S-01` landing-scroll fix, `S-04` mobile rework) ship to the live brand-facing site at `marcinkulbicki.com`, establish a **rehearsed** rollback path and confirm **account 2FA**. This closes the two open ☐ items in `context/changes/deployment/deployment-plan.md` Phase 7 (lines 92–93) and resolves the "vendor concentration" mitigation in the infrastructure risk register (`context/foundation/infrastructure.md:87`).

This is an **operational/verification** change. It builds no features and changes no application code. Its deliverables are: a proven rollback (run live, not just read about), a confirmed 2FA + saved recovery codes, and a durable runbook so the revert net is followable under pressure.

## Current State Analysis

- The live site is **Cloudflare Workers Static Assets** (`name: photo-portfolio`), deployed via `npm run deploy` (`astro build && wrangler deploy`), live at `marcinkulbicki.com` + `*.workers.dev`. (`deployment-plan.md:72–93`)
- Rollback is **near-instant** — static assets only, no DB migration to unwind; time-to-revert is seconds. (`infrastructure.md:75`)
- The rollback *command* (`wrangler rollback`, `wrangler deployments list`) already exists and `wrangler` v4 is authenticated as `marcin.kulbicki@gmail.com` (OAuth), account `b2e5f91cf1c4b7f738e355c30242776a`. (`deployment-plan.md:74`)
- **What's missing is the rehearsal, not the capability** — the drill has never been run, so the first real rollback would be untested under pressure. (`deployment-plan.md:92`)
- **Approval policy:** an agent may run rollbacks unattended; 2FA is a human-only dashboard action the agent cannot perform — only verify and record. (`infrastructure.md:76`)
- The Cloudflare account carries **concentrated blast radius**: DNS + CDN + hosting + CI all sit on it. A 2FA lockout with no recovery codes would be catastrophic. (`infrastructure.md:57,87`)

### Key Discoveries:

- Rollback target is a **Worker**, so `wrangler rollback [version-id]` is the correct mechanism (not a Pages re-publish). (`infrastructure.md:75`, `deployment-plan.md:9`)
- Because the build is fully static and deterministic from Sanity content at build time, "roll forward" after the drill = re-run `npm run deploy` (or `wrangler rollback` back to the latest version id) — no content or state drift. (`deployment-plan.md:107`)
- The live exposure window during the drill is only the seconds between rollback and roll-forward; static assets flip instantly. (`infrastructure.md:75`)

## Desired End State

The owner can revert the live site in seconds using a written, already-rehearsed procedure, and the Cloudflare account cannot be silently lost: 2FA is on and recovery codes are saved off-platform. Concretely, when this plan is done:

- A real `wrangler rollback` has been executed against production and verified to serve the prior build, then rolled forward — so the procedure is proven, not theoretical.
- A `rollback-runbook.md` exists in this change folder with the exact verified commands and the "what good looks like" checks.
- Cloudflare account 2FA is confirmed enabled and recovery codes are saved; the status is recorded.
- The two ☐ items in `deployment-plan.md` Phase 7 are checked, and roadmap item F-01 can be cleanly archived.

## What We're NOT Doing

- Not changing any application code, `astro.config.mjs`, `wrangler.jsonc`, or the deploy pipeline.
- Not automating rollback (no CI rollback job, no alerting) — this is a manual revert net, matching the PRD's scope.
- Not building a full disaster-recovery / multi-region story (explicitly out of scope in `infrastructure.md:103–106`).
- Not auditing API-token scope or adding a second account owner (that was the broader 2FA option the owner declined — kept to F-01's minimal intent).
- Not touching the Sanity webhook / publish loop (proven in Phase 6).

## Implementation Approach

Three small, sequential phases. Phase 1 is agent-runnable (rollback is permitted unattended) but mutates the live site, so it carries a manual confirmation gate. Phase 2 is human-only (dashboard 2FA). Phase 3 records the outcomes durably and closes the roadmap item. Run Phase 1 at a low-traffic moment to keep the brief live window inconsequential.

## Critical Implementation Details

- **Timing & lifecycle (drill window):** between `wrangler rollback` and the roll-forward the live site serves the *previous* build. Keep the two steps back-to-back and run them in one sitting; do not pause for unrelated work mid-drill. Capture the current/latest version id from `wrangler deployments list` *before* rolling back so roll-forward is unambiguous.
- **Roll-forward correctness:** prefer rolling forward by re-running `npm run deploy` (rebuilds from current source + Sanity) OR `wrangler rollback <latest-version-id>` to the id captured pre-drill. Both land the same static assets; pick whichever the runbook documents and verify the live site matches current `main` after.

## Phase 1: Rehearse the rollback

### Overview

Run the real revert path against production: list deployments, roll back to the immediately prior version, verify the live site serves the old build, then roll forward to current. Capture the exact commands and output for the runbook.

### Changes Required:

#### 1. Production rollback drill (no files changed — live-site operation)

**File**: none (operational; `wrangler` CLI against the deployed `photo-portfolio` Worker)

**Intent**: Prove the revert net works end-to-end and gather the verified command sequence + version ids for the runbook. List deployments to capture the current version id, roll back one version, confirm the prior build is served, then roll forward to current.

**Contract**: Uses `wrangler deployments list` (read) and `wrangler rollback [version-id]` (mutating, production). Roll-forward via `npm run deploy` or `wrangler rollback <captured-latest-id>`. Record the current version id captured *before* rollback so roll-forward is unambiguous. No repo files change in this phase.

### Success Criteria:

#### Automated Verification:

- `wrangler deployments list` returns deploy history with version ids: `npx wrangler deployments list`
- Live site responds 200 after roll-forward: `curl -sS -o /dev/null -w "%{http_code}" https://marcinkulbicki.com`

#### Manual Verification:

- After `wrangler rollback`, the live site visibly served the *prior* build (observed difference or confirmed version id), proving the revert took effect.
- After roll-forward, the live site matches current `main` (current content/build restored).
- The exact commands run, the two version ids (prior + current), and observed time-to-revert were captured for the runbook.

**Implementation Note**: This mutates the live brand-facing site. After automated verification passes, pause for the owner's manual confirmation that the drill behaved as expected (prior build served, then current restored) before proceeding to Phase 2.

---

## Phase 2: Confirm account 2FA + recovery codes

### Overview

Human-only dashboard step: verify Cloudflare account 2FA is enabled and save the recovery/backup codes off-platform, mitigating the lockout risk on the vendor-concentrated account.

### Changes Required:

#### 1. 2FA verification (manual, Cloudflare dashboard — no files changed)

**File**: none (manual dashboard action by the owner; agent records the result in Phase 3)

**Intent**: Confirm 2FA is active on the Cloudflare account holding DNS + CDN + hosting + CI, and that recovery codes are saved somewhere safe and off-platform, so a lost authenticator can't lock the account.

**Contract**: Cloudflare dashboard → My Profile → Authentication: 2FA shows enabled; recovery/backup codes generated and saved off-platform. Owner reports back enabled-yes/no + codes-saved-yes/no; the agent does not access the dashboard.

### Success Criteria:

#### Automated Verification:

- (none — 2FA state is not inspectable via `wrangler`/CLI; this is a dashboard-only fact)

#### Manual Verification:

- Owner confirms 2FA is enabled on the Cloudflare account.
- Owner confirms recovery/backup codes are saved off-platform (e.g. password manager).

**Implementation Note**: Agent cannot perform or verify this directly — it depends entirely on the owner's dashboard confirmation. Pause for that confirmation before Phase 3 records the status.

---

## Phase 3: Capture runbook & close out

### Overview

Persist the rehearsed procedure as a durable runbook, record the 2FA status, check the two ☐ items in the deployment plan, and flip the change status so F-01 can be archived.

### Changes Required:

#### 1. Rollback runbook

**File**: `context/changes/operational-safety-baseline/rollback-runbook.md` (new)

**Intent**: Capture the exact verified rollback procedure from Phase 1 so the revert net is followable under pressure without re-deriving it. Include the command sequence, how to capture the current version id first, the roll-forward step, the "what good looks like" checks, observed time-to-revert, and the recorded 2FA + recovery-codes status.

**Contract**: A short markdown runbook with: (1) `wrangler deployments list` → capture current version id; (2) `wrangler rollback [prior-version-id]`; (3) verification check (`curl` + visual); (4) roll-forward (`npm run deploy` or rollback to captured current id); (5) account-security note (2FA enabled, recovery codes saved). Commands match what was actually run in Phase 1.

#### 2. Close the deployment-plan Phase 7 items

**File**: `context/changes/deployment/deployment-plan.md`

**Intent**: Mark the rollback drill and 2FA items done now that they're rehearsed/confirmed, with a pointer to the runbook.

**Contract**: Lines 92–93 `☐ Rollback drill` / `☐ Account 2FA` → `☑`, each with a brief note (e.g. "rehearsed 2026-06-10 — see operational-safety-baseline/rollback-runbook.md" / "2FA confirmed enabled + recovery codes saved"). Phase 7 header (`◑`) updated to `☑` if both now complete.

#### 3. Update change status

**File**: `context/changes/operational-safety-baseline/change.md`

**Intent**: Reflect that the change is implemented.

**Contract**: Frontmatter `status: planned` → `status: done` (or `implemented`), `updated: 2026-06-10`.

### Success Criteria:

#### Automated Verification:

- Runbook exists: `test -f context/changes/operational-safety-baseline/rollback-runbook.md`
- Both Phase 7 items are checked (no remaining `☐` on those lines): `grep -n "Rollback drill\|Account 2FA" context/changes/deployment/deployment-plan.md`

#### Manual Verification:

- The runbook's commands match exactly what was run in Phase 1 (no aspirational/untested steps).
- The recorded 2FA + recovery-codes status reflects the owner's Phase 2 confirmation.

**Implementation Note**: Documentation/record-keeping only; no live-site impact. Safe to complete once Phases 1–2 are confirmed.

---

## Testing Strategy

### Manual Testing Steps:

1. Run `npx wrangler deployments list`; confirm history and capture the current version id.
2. `wrangler rollback [prior-version-id]`; load `marcinkulbicki.com` and confirm the prior build is served.
3. Roll forward (`npm run deploy` or `wrangler rollback <current-id>`); confirm current build restored and site is 200.
4. In the Cloudflare dashboard, confirm 2FA enabled and recovery codes saved.
5. Open the runbook and confirm each step matches what was actually run.

## References

- Source items: `context/changes/deployment/deployment-plan.md:92-93` (Phase 7 ☐ rollback drill + 2FA)
- Risk register: `context/foundation/infrastructure.md:75` (rollback), `:76` (approval policy), `:87` (vendor concentration → 2FA)
- Roadmap item: `context/foundation/roadmap.md` F-01 (operational-safety-baseline)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Rehearse the rollback

#### Automated

- [x] 1.1 `wrangler deployments list` returns deploy history with version ids — 3df75ca
- [x] 1.2 Live site responds 200 after roll-forward (`curl` marcinkulbicki.com) — 3df75ca

#### Manual

- [x] 1.3 After rollback, live site served the prior build (revert proven) — 3df75ca
- [x] 1.4 After roll-forward, live site matches current `main` — 3df75ca
- [x] 1.5 Commands, both version ids, and time-to-revert captured for the runbook — 3df75ca

### Phase 2: Confirm account 2FA + recovery codes

#### Manual

- [x] 2.1 Owner confirms 2FA enabled on the Cloudflare account — 52b6ccb
- [x] 2.2 Owner confirms recovery/backup codes saved off-platform — 52b6ccb

### Phase 3: Capture runbook & close out

#### Automated

- [x] 3.1 Runbook exists at `context/changes/operational-safety-baseline/rollback-runbook.md` — d09dc66
- [x] 3.2 Both Phase 7 items checked in `deployment-plan.md` — d09dc66

#### Manual

- [x] 3.3 Runbook commands match exactly what was run in Phase 1 — d09dc66
- [x] 3.4 Recorded 2FA + recovery-codes status reflects Phase 2 confirmation — d09dc66
