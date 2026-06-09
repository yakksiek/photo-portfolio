---
project: Marcin Kulbicki — Photography Portfolio
researched_at: 2026-06-09
recommended_platform: Cloudflare (Workers Static Assets / Pages)
runner_up: Netlify
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 6 (+ React 19 islands)
  runtime: Cloudflare workerd
---

## Recommendation

**Deploy on Cloudflare.** For a stateless, build-time-rendered Astro static site whose content and images already live in Sanity, Cloudflare scores 5/5 on the agent-friendly criteria, serves static-asset requests free and unlimited, and puts the site on a global edge — covering the still-undecided geographic reach. It is also the only shortlisted platform already wired into this project (`tech-stack.md`: `deployment_target: cloudflare-pages`, `ci_provider: cloudflare-builds`; CLAUDE.md documents deploy via Cloudflare Builds) and the one the owner is already familiar with. This research confirms the inherited choice consciously rather than by default — and surfaces the wiring gaps that must close for it to deliver the PRD's "publish without code" promise.

## Platform Comparison

Hard filters: the workload is **stateless** (Q1), so no platform was dropped for lack of persistent processes; an Astro static build runs on all six. Interview weights: **cost-first** (Q2) penalizes paid base tiers, **Cloudflare familiarity** (Q3) breaks ties, **unknown reach** (Q4) mildly favors edge, **external services fine** (Q5) gives no credit for co-located databases (content + image CDN are Sanity's).

| Platform | CLI-first | Managed/serverless | Agent-readable docs | Stable deploy API | MCP / integration | Score |
|---|---|---|---|---|---|---|
| **Cloudflare** | Pass | Pass | Pass | Pass | Pass | **5 Pass** |
| **Netlify** | Pass | Pass | Pass | Pass | Pass | **5 Pass** |
| **Render** | Pass | Pass | Pass | Pass | Pass | **5 Pass** |
| Vercel | Pass | Pass | Pass | Pass | Partial | 4 Pass / 1 Partial |
| Fly.io | Pass | Partial | Partial | Pass | Pass | 3 Pass / 2 Partial |
| Railway | Pass | Partial | Partial | Pass | Pass | 3 Pass / 2 Partial |

- **Cloudflare** — `wrangler deploy` / `rollback` / `tail` / `versions` (GA). Fully managed edge static assets — no OS surface. Docs as `llms.txt` + per-page markdown ("Markdown for Agents", Feb 2026). Official `cloudflare/mcp-server-cloudflare`; MCP Server Portals in open beta. Free tier: static-asset requests free and unlimited; Workers free tier is 100k req/**day**; paid Workers from $5/mo. A static Astro build needs **no `@astrojs/cloudflare` adapter** — only SSR/on-demand routes do.
- **Netlify** — `netlify deploy --prod`, instant atomic rollback, `netlify logs` (CLI GA, v22.x). First-class static host; `@astrojs/netlify` only needed for image CDN / on-demand. Docs publish `llms.txt` + AI context files. Official MCP server (GA, 2025-06-03). Free tier ample; **caveat: new credit-based plans *pause* the site when the monthly cap is hit.**
- **Render** — first-class Static Sites product (global CDN, no running server), `render` CLI + deploy hooks + REST API, one-click rollback. Docs available as markdown (`Accept: text/markdown`). Official MCP (GA, Aug 2025). **Genuinely free static tier with no commercial-use restriction** — the strongest cost-safe fallback.
- **Vercel** — technically excellent (zero-config Astro, `vercel --prod`, `llms.txt` docs), but the **Hobby tier prohibits commercial use**; a portfolio shown to brands/orgs to win commissions pushes to Pro ($20/user/mo). MCP is **public beta** (OAuth, launched 2025-08-06). Cost-first weighting drops it below the three free options.
- **Fly.io / Railway** — container/long-running-process model; no native static product and **no free tier** (Fly trial-only since 2024; Railway removed free tier Aug 2023, $5/mo min). Over-engineered for purely static content. Both have GA MCP servers and mature CLIs.

### Shortlisted Platforms

#### 1. Cloudflare (Recommended)

5/5 on every criterion. Free and unlimited static-asset serving fits a cost-first MVP; the global edge hedges the undecided reach; the owner is already familiar with it and the project is already pointed at Cloudflare Builds. `wrangler` gives the agent a complete deploy/rollback/logs loop, and docs are agent-readable. The gap vs a "perfect" pick is purely *wiring* (see risk register), not capability.

#### 2. Netlify

Equal 5/5 and the cleanest pure-static DX with an official GA MCP server. Drops to runner-up only because it is not already wired in and the new credit-based plan *pauses* the site at the cap (a worse failure mode for an occasionally-visited portfolio than Cloudflare's per-day request ceiling on free Workers). The strongest swap target if Cloudflare's Pages-vs-Workers ambiguity becomes painful.

#### 3. Render

Also 5/5, with the most reassuring cost story — a genuinely free static+CDN tier with no commercial-use clause. Third only because it is not edge-first (single-origin CDN vs Cloudflare's edge) and the owner has no familiarity with it. Best fallback if a hard "must stay free forever, commercial use" constraint dominates.

## Anti-Bias Cross-Check: Cloudflare

### Devil's Advocate — Weaknesses

1. **Pages is in maintenance mode.** Cloudflare steers new projects to **Workers Static Assets**; standardizing on Pages risks a forced migration, while moving to Workers means re-wiring the current Cloudflare Builds/Pages setup. The "which product" decision is unresolved.
2. **The repo is still `output: "server"`, not static yet.** Today the live site depends on the `@astrojs/cloudflare` adapter at the edge, exposing it to documented `nodejs_compat` traps (`[object Object]` after a `compatibility_date` bump; `Buffer is not defined`). The "no runtime backend dependency" benefit is aspirational until the planned static migration lands.
3. **The PRD's core promise — "publish without code" — is not wired.** Build-time Sanity fetch + deploy-on-git-push means a Sanity content edit is *not* a git push, so the live site won't update until a rebuild fires. Needs a Sanity webhook → Cloudflare deploy hook that does not yet exist.
4. **Vendor concentration.** DNS, CDN, hosting, and CI on one Cloudflare account — a single misconfig or billing lapse has a wide blast radius.
5. **Cloudflare Builds has its own build-minute quota;** frequent rebuilds of the repo could nibble at it (minor).

### Pre-Mortem — How This Could Fail

The team shipped on Cloudflare but never wired the Sanity→Cloudflare deploy hook. Marcin added a new concert shoot in Sanity Studio, hit publish, and nothing changed on the live site. He assumed it was broken, lost trust in the "self-manageable" promise, and went back to pinging a developer for every update — defeating the entire product goal. Separately, the `output:"server"` → static migration kept getting deferred, so the site stayed on the adapter; a routine `compatibility_date` bump introduced intermittent `[object Object]` 500s, which surfaced the week a brand was reviewing his work. A feature gap in maintenance-mode Pages then forced a mid-crisis migration to Workers Static Assets. None of these were platform-capability failures; all were wiring and sequencing gaps the platform choice quietly assumed away.

### Unknown Unknowns

- **The deploy hook is the load-bearing missing piece.** "Publish without code" only works if a Sanity webhook triggers a Cloudflare rebuild. Wire and test it *first* — not implied by either platform's docs.
- **Branch mismatch:** `tech-stack.md` says deploy triggers on push to `master`, but this repo's branches are `main` / `sanity-cms-portfolio`. If Cloudflare Builds watches `master`, deploys silently never fire. Confirm the production-branch name matches.
- **Pick Pages vs Workers Static Assets deliberately now** — Pages is maintenance-mode; Workers is the forward path.
- **Astro 6's dev server already runs on workerd** — a separate `wrangler dev` is redundant; don't burn setup time on it.

## Operational Story

- **Preview deploys**: Cloudflare Builds produces a preview URL per non-production branch/PR (`*.pages.dev` for Pages, or a Workers preview alias). Fork PRs may not receive secrets — fine here, since the public build needs only the public Sanity coordinates baked into code.
- **Secrets**: none required for the public build — Sanity `projectId` / `dataset` / `apiVersion` are public, non-secret, and live in code (`src/sanity/env.ts`, `astro.config.mjs`, `sanity.cli.ts`). Any future secret (e.g. a deploy-hook token) lives in Cloudflare's dashboard env vars or `wrangler secret put`; the Sanity write/editor token never touches the public site.
- **Rollback**: `wrangler rollback` (Workers) or re-publish a prior deploy in the Cloudflare dashboard / `wrangler deployments list`. Near-instant — static assets only, no DB migration to unwind. Time-to-revert: seconds.
- **Approval**: a human approves (a) the first production deploy, (b) any change to the production branch / build config, and (c) DNS / custom-domain changes. An agent may run preview deploys, `wrangler tail`, and rollbacks unattended.
- **Logs**: `wrangler tail` for runtime logs (read-only); Cloudflare Builds logs via the dashboard or the Cloudflare MCP server. No SSH — there is no server to log into.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Sanity edits never reach the live site (no deploy hook) | Pre-mortem / Unknown unknowns | H | H | Wire a Sanity webhook → Cloudflare deploy hook URL and test "publish in Studio → site rebuilds" before launch. This is the #1 pre-launch task. |
| Production branch mismatch (`master` vs `main`/`sanity-cms-portfolio`) | Unknown unknowns | M | H | Confirm the branch Cloudflare Builds watches matches the repo's real production branch; update `tech-stack.md`/CLAUDE.md to stop saying `master`. |
| `nodejs_compat` 500s while still on `output:"server"` | Devil's advocate / Research | M | H | Complete the planned `output:"server"` → static migration so the public site carries no adapter/edge Node-compat risk; pin `compatibility_date` and test before bumping. |
| Pages maintenance-mode forces later migration to Workers | Devil's advocate | M | M | Decide Pages vs Workers Static Assets explicitly now; prefer Workers Static Assets for a new project to avoid a forced move. |
| Vendor concentration (DNS+CDN+host+CI on one account) | Devil's advocate | L | M | Enable account 2FA; keep the Sanity-side export as the content system of record; document the Render/Netlify fallback (this file). |
| Cloudflare Builds build-minute quota on frequent rebuilds | Devil's advocate / Research | L | L | Monitor build usage; debounce content-driven rebuilds via the deploy hook rather than rebuilding on every minor edit. |
| Free Workers per-day request ceiling exceeded | Research | L | L | Static-asset requests are free/unlimited; only dynamic Worker invocations count — negligible for a static portfolio. Upgrade to $5/mo Workers Paid if ever needed. |

## Getting Started

Validated against this project's pinned versions (Astro 6, `@astrojs/cloudflare` v13, `wrangler` v4) — not generic platform docs.

1. **Decide the product**: target **Workers Static Assets** for a new static project (Pages is maintenance-mode). Confirm the choice in `wrangler.jsonc` / Cloudflare Builds config.
2. **Finish the static migration first**: switch `astro.config.mjs` to a static/prerender configuration so the public site builds to `dist/` with no runtime adapter dependency. Use `astro dev` for local work — it already runs on workerd, so `wrangler dev` is not needed.
3. **Wire the publish loop**: create a Cloudflare deploy hook, then add a Sanity webhook (Studio → API → Webhooks) pointing at it, so a publish in Studio triggers a rebuild. Test it end-to-end — this is what makes "publish without code" real.
4. **Verify the production branch**: ensure Cloudflare Builds watches the actual production branch (not `master` if the repo uses `main`).
5. **Confirm deploy + rollback**: trigger a deploy via push, then practice `wrangler rollback` / `wrangler deployments list` so the revert path is known before launch. Add the production URL to Sanity CORS (`npx sanity cors add <url> --credentials`).

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup (Cloudflare Builds is already chosen; pipeline authoring is separate)
- Production-scale architecture (multi-region failover, HA, DR)
