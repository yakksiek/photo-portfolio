# Rollback Runbook — marcinkulbicki.com (Cloudflare Workers Static Assets)

> Rehearsed 2026-06-10 against the live `photo-portfolio` Worker. Commands below are the exact ones run during the drill.
> Time-to-revert: **seconds** (static assets only — no DB/state to unwind). The drill's ~2 min gap was manual verification, not command latency.

## When to use

The live site is broken or showing a bad deploy and you need to revert to the last known-good build **now**. This is a manual, human-driven revert net — there is no automated rollback.

## Prerequisites

- `wrangler` authenticated as `marcin.kulbicki@gmail.com` (OAuth), account `b2e5f91cf1c4b7f738e355c30242776a`. Check with `npx wrangler whoami`.
- Run from the repo root (`wrangler.jsonc` present, Worker name `photo-portfolio`).

## Procedure

### 1. Find the version to roll back to

```
npx wrangler deployments list
```

Each block is a deployment; the **newest** (bottom of the list) is currently live at 100%. Note two version ids:
- **current** (newest) — your roll-forward target, in case you need to restore.
- **prior good** — the version you want to revert *to* (the deployment from before the bad one).

### 2. Roll back to the prior good version

```
npx wrangler rollback <prior-good-version-id> -y -m "rollback: <reason>"
```

- `-y` auto-accepts the two confirmation prompts (rollback message + "deploy to 100%?").
- `-m` records why — shows up as the deployment Message in `deployments list`.
- This creates a **new** deployment pointing at the existing prior version. Nothing is deleted; the history stays intact and auditable.
- The command prints `Current Version ID: <prior-good-version-id>` on success — that line is the proof the active version flipped.

### 3. Verify the revert took effect

```
npx wrangler deployments list   # newest entry should now show <prior-good-version-id> at 100%
curl -sS -o /dev/null -w "%{http_code}\n" https://marcinkulbicki.com   # expect 200
```

Note: consecutive builds often look visually identical (content is fetched from Sanity at build time, so an unchanged content tree renders the same). **The active version-id is the real evidence — not a visible page difference.**

### 4. Roll forward / restore current (after the incident, or to undo a drill)

```
npx wrangler rollback <current-version-id> -y -m "roll forward: restore current"
npx wrangler deployments list   # newest entry should be <current-version-id> again
curl -sS -o /dev/null -w "%{http_code}\n" https://marcinkulbicki.com   # expect 200
```

Alternative roll-forward: `npm run deploy` (rebuilds from current source + Sanity and deploys). Use this when you want the *latest* source/content rather than re-pinning a specific past version id.

## Drill record (2026-06-10)

| Time (UTC) | Command | Active version after |
| --- | --- | --- |
| 08:08:25 | `wrangler rollback 03229d5d… -y -m "rollback drill"` (no-op — id was already current) | `03229d5d` |
| 08:09:42 | `wrangler rollback 223642e6… -y -m "rollback drill"` (real revert to 06-09 build) | `223642e6` |
| 08:11:54 | `wrangler rollback 03229d5d… -y -m "roll forward after drill"` (restore current) | `03229d5d` ✓ |

- current/live: `03229d5d-9bee-49fd-b0a2-e0fe6a6d8522` (built 2026-06-10 07:47)
- prior good used for the drill: `223642e6-6892-4097-a125-4819cf620c72` (built 2026-06-09 17:11)
- Final state verified: live site `200`, active version restored to current.
- **Gotcha observed:** rolling back to the *current* version id is a no-op — double-check you're targeting the **prior** version, not the one already live.

## Account security (vendor-concentration mitigation)

- **2FA: Active** on the Cloudflare account (Mobile App / TOTP), enabled 2026-06-10. Was `Inactive` before this change.
- **Recovery codes:** generated and stored off-platform in a password manager; download cleared. Backup Code Reminders enabled.
- Why it matters: DNS + CDN + hosting + CI all live on this one account — a lockout would have a wide blast radius. Keep the recovery codes outside any account/device that the 2FA itself protects.
