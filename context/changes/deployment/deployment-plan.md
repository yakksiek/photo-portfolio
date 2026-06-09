# Cloudflare Integration & First Deployment

## Context

`context/foundation/infrastructure.md` confirmed **Cloudflare** as the deploy platform for this Astro 6 photography portfolio, but flagged four wiring gaps that must close before the PRD's "publish without code" promise is real. This plan executes the five "Getting Started" steps from that doc, resolving each risk in the register.

**Current state (verified):**
- `astro.config.mjs` is `output: "server"` with the `@astrojs/cloudflare` adapter → the live site depends on the edge Node-compat runtime (the `nodejs_compat` 500 risk).
- `wrangler.jsonc` already deploys as a **Worker with a static-assets binding** (name `10x-astro-starter`, server entrypoint) — so "Workers, not Pages" is effectively already chosen; it's just still in SSR mode.
- Only `/admin` (the embedded Sanity Studio) needs anything beyond static. The public `/` route already has `export const prerender = true` and fetches Sanity once at build time; the scroll engine (`src/scripts/portfolio.ts`) is vanilla JS fed via a `data-portfolio` attribute — fully static-friendly.
- `ci.yml` watches `master`; the repo uses `main` / `sanity-cms-portfolio` (branch mismatch — deploys would silently never fire).
- **No GitHub remote exists yet** — only local branches `main` + `sanity-cms-portfolio`. `gh` is authenticated as `yakksiek` (SSH). Cloudflare Builds needs the repo on GitHub before it can be connected.
- **No deploy hook / Sanity webhook exists** (the #1 pre-launch risk).

**Intended outcome:** a fully static public site (no adapter, no runtime backend dependency) deployed to **Workers Static Assets**, with the Studio client-rendered at `/admin`, and a Sanity-publish → Cloudflare-rebuild loop wired and tested.

**Key research findings driving the approach (verified via Cloudflare + Sanity docs, June 2026):**
- The `@astrojs/cloudflare` adapter **no longer supports Pages** and is **not needed at all for a static site** — `wrangler` serves `./dist` directly. → drop the adapter.
- `@sanity/astro` supports a fully static embedded Studio via **`studioRouterHistory: "hash"`** (client-rendered, prerenderable, no adapter, no server rewrites needed).
- **Workers Builds deploy hooks are GA** and explicitly support Sanity: a unique URL, POST-to-trigger, branch chosen at creation, no auth header. (An earlier "Workers Builds has no deploy hooks" claim is outdated.)

**Decisions (confirmed with user):** embed Studio at `/admin` (hash routing) · production branch = `main` · ship on `*.workers.dev` for now (custom domain later).

---

## Phase 1 — Static migration (code)  ☑

Convert the public site to a pure static build with no adapter.

- ☑ **`astro.config.mjs`**
  - `output: "server"` → `output: "static"`
  - Remove `import cloudflare from "@astrojs/cloudflare"` and the `adapter: cloudflare()` line.
  - Add `studioRouterHistory: "hash"` to the `sanity({ … })` integration (keeps Studio prerenderable, no adapter). Keep `react()` before `sanity()` (Studio is a React app).
  - Add `site: "https://<worker-name>.<account>.workers.dev"` (placeholder `https://photo-portfolio.workers.dev` now; finalize in Phase 7 once the real URL is known). `@astrojs/sitemap` needs `site` to emit a sitemap — it's currently silently producing nothing.
- ☑ **`wrangler.jsonc`**
  - `name`: `10x-astro-starter` → `photo-portfolio` (this becomes the `*.workers.dev` subdomain).
  - Remove `"main": "@astrojs/cloudflare/entrypoints/server"` → assets-only Worker (no server code).
  - Remove `"compatibility_flags": ["nodejs_compat"]` (only needed for Worker runtime code; gone with the adapter — this is what closes the `nodejs_compat` 500 risk).
  - Keep `compatibility_date`, `assets` (`directory: "./dist"`, `not_found_handling: "404-page"`), `observability`.
  - Note: static build outputs to `dist/` root (not `dist/client` + `dist/server`); `directory: "./dist"` stays correct.
- ☑ **`package.json`**
  - Remove `@astrojs/cloudflare` from dependencies (now unused). Keep `wrangler` (devDep) for deploy/rollback/tail.
  - Add scripts: `"deploy": "astro build && wrangler deploy"` and `"cf:tail": "wrangler tail"` for the manual/rollback loop.
- ☑ Run `npm install` to drop the removed adapter from the lockfile. *(0 refs to `@astrojs/cloudflare` left in lockfile.)*

## Phase 2 — Local verification  ☑

Prove the static build + client-rendered Studio work before touching Cloudflare.

- ☑ `npm run build` → emits static `dist/index.html` (`data-portfolio` baked in) + prerendered `dist/admin/index.html`; no server/`_worker.js` output; sitemap created. No adapter/SSR warnings.
- ☑ `npm run preview` → `/` (200, portfolio data) and `/admin` (200, Studio shell) both serve. *(Automated smoke test; visual scroll-engine interaction + Studio login prompt still need a human eyeball.)*
- ☑ `npm run lint` stays green (CI gate).

## Phase 3 — Branch & doc consistency  ◑  *(code done; merge gate open)*

Close the `master` mismatch (Risk: "Production branch mismatch").

- ☑ **`.github/workflows/ci.yml`** — `branches: [master]` → `branches: [main]` in both `push` and `pull_request`.
- ☑ **`CLAUDE.md`** — rendering-mode note now says static is applied (`studioRouterHistory: "hash"`); "Cloudflare Pages" → "Cloudflare Workers Static Assets"; deploy branch `master` → `main`; stale "workerd SSR" Commands note replaced with the static/deploy-script note.
- ☑ **`context/foundation/tech-stack.md`** — `deployment_target: cloudflare-pages` → `cloudflare-workers`; prose "Cloudflare Pages … on merge" → "Workers Static Assets … on merge to `main`".
- ☑ Merge `sanity-cms-portfolio` → `main` (production branch) once the above lands. *(Fast-forward; `main` now at `5bdbf2c`.)*

## Phase 4 — Create the GitHub remote  ☑  *(prerequisite for Cloudflare Builds)*

The repo is local-only; Cloudflare Builds (Phase 5) and the publish loop (Phase 6) both require it on GitHub.

- ☑ **Commit outstanding work** on `sanity-cms-portfolio` (the Phase 1–3 changes), then ensure `main` holds the merge from Phase 3.
- ☑ **Create the remote (CLI):** created **public** as `yakksiek/photo-portfolio` (`gh repo create photo-portfolio --public --source=. --remote=origin`).
- ☑ **Push the production branch:** `git push -u origin main` → `origin/main` at `5bdbf2c` (user ran it; SSH host-key trust added locally).
- ☑ **Verify** `origin` set; `https://github.com/yakksiek/photo-portfolio` (PUBLIC). Unblocks Phase 5's "connect the repo" step.

## Phase 5 — First deploy to Cloudflare  ☑

- ☑ **Auth (manual):** `wrangler` already logged in as marcin.kulbicki@gmail.com (OAuth), account `b2e5f91cf1c4b7f738e355c30242776a` — login gate already satisfied.
- ☑ **Validation deploy (CLI):** `npm run deploy` live at **https://photo-portfolio.marcin-kulbicki.workers.dev** (Version `82a686ca`). `/` 200 w/ portfolio data, `/admin/` 200 Studio shell, sitemap 200. *Two config fixes were needed mid-deploy: removed stale `.wrangler/deploy/config.json` (orphaned adapter redirect), and removed `assets.binding` from `wrangler.jsonc` (invalid on an assets-only Worker).*
- ☑ **Connect Git for auto-deploys (manual, dashboard):** repo `yakksiek/photo-portfolio` connected, production branch `main`. *(Required extending the Cloudflare GitHub App's repo access on GitHub — it was scoped to one repo.)* **Verified:** push of `811e3c7` auto-built and redeployed in ~30s (live sitemap flipped to the real `marcin-kulbicki.workers.dev` URL). The Git→Cloudflare auto-deploy half of the publish loop is proven.

## Phase 6 — Publish-without-code loop  ☐  *(the #1 risk — do not skip)*

Make a Studio publish rebuild the live site.

- ☐ **Create a Workers deploy hook (manual, dashboard):** the Worker → Settings → Builds → Deploy Hooks → name it, **branch = `main`** → copy the unique URL. (Treat the URL as a secret — anyone with it can trigger a build.)
- ☐ **Add the Sanity webhook (manual, manage.sanity.io → API → Webhooks):** point it at the deploy-hook URL, method **POST**, dataset filter `production`, trigger on create/update/delete (and publish). No projection/secret needed — the deploy hook authenticates via its URL.
- ☐ **Test end-to-end:** edit a photo/section in Studio → Publish → confirm a Workers build fires (dashboard build log) → confirm the change appears on the live URL after the rebuild. This is the gate that proves "self-manageable."
- ☐ **Edge case — debounce:** Sanity fires a webhook per publish; rapid edits could nibble the Workers Builds minute quota. Acceptable for an occasionally-updated portfolio; note it, don't over-engineer. If it becomes noisy, add a Sanity webhook filter/delay later.

## Phase 7 — Post-deploy hardening  ☐

- ☑ **Custom domain (brought forward from "later"):** bought `marcinkulbicki.com` via Cloudflare Registrar; attached apex `marcinkulbicki.com` + `www.marcinkulbicki.com` as **Custom Domains** on the Worker (auto DNS + SSL). Both live over HTTPS (200, valid cert). `*.workers.dev` still works alongside.
- ☑ **Finalize `site`:** `astro.config.mjs` `site:` set to the canonical apex `https://marcinkulbicki.com` → next deploy emits a correct absolute sitemap.
- ☑ **Sanity CORS for the Studio origins:** added `https://photo-portfolio.marcin-kulbicki.workers.dev`, `https://marcinkulbicki.com`, and `https://www.marcinkulbicki.com` (all `--credentials`). *(Needed because the embedded Studio is a browser app hitting the Sanity API from these origins. The public site fetches at build time and needs no runtime CORS.)*
- ☐ **Rollback drill:** `wrangler deployments list`, then practice `wrangler rollback` so the revert path is known before it's needed (seconds to revert — static assets only).
- ☐ **Account 2FA** (vendor-concentration mitigation) — confirm enabled.

---

## Critical files

| File | Change |
|---|---|
| `astro.config.mjs` | `output: "static"`, drop adapter, add `studioRouterHistory: "hash"` + `site` |
| `wrangler.jsonc` | rename worker, drop `main` + `nodejs_compat`, keep `assets` |
| `package.json` | remove `@astrojs/cloudflare`, add `deploy`/`cf:tail` scripts |
| `.github/workflows/ci.yml` | `master` → `main` |
| `CLAUDE.md`, `context/foundation/tech-stack.md` | doc consistency (Pages→Workers, master→main, static applied) |

No application code changes — `src/pages/index.astro`, `src/sanity/*`, and `src/scripts/portfolio.ts` are already static-ready.

## Verification (end-to-end)

1. **Local:** `npm run build && npm run preview` — `/` renders the portfolio + scroll engine; `/admin` loads the Studio (hash routing, login prompt). `npm run lint` green.
2. **Deploy:** live `*.workers.dev` URL serves the static site; `/admin` Studio loads and authenticates.
3. **Publish loop (the real test):** edit + publish in Studio → Workers build fires automatically → change is live after rebuild.
4. **Rollback:** `wrangler deployments list` shows history; `wrangler rollback` reverts in seconds.

## Risk register → resolution map

- *Sanity edits never reach the live site* → **Phase 6** (deploy hook + webhook, tested) — gated on **Phase 4** (remote exists) + **Phase 5** (Git connected).
- *Production branch mismatch* → **Phase 3** (`main` everywhere) + **Phase 4** (push `main` as the remote production branch).
- *`nodejs_compat` 500s on `output:"server"`* → **Phase 1** (static, adapter + compat flag removed).
- *Pages maintenance-mode forces later migration* → already on **Workers Static Assets** (Phase 1 confirms).
- *Vendor concentration / quota* → **Phase 7** (2FA; debounce note in Phase 6).
