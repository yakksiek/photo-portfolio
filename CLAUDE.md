# Marcin Kulbicki — Photography Portfolio

This file provides guidance to AI agents working with code in this repository. The project was scaffolded from the **10x Astro Starter** (Astro 6 + React 19 + TypeScript + Tailwind 4 + Cloudflare), but **the bundled Supabase backend was removed and replaced with Sanity** (headless CMS) — see `context/foundation/tech-stack.md` § "Post-selection decision" for why. The product goal is a self-manageable photography portfolio: a content layer (Section → Chapter → Photo) behind an existing bespoke editorial front-end with a custom scroll engine (Single/All view modes). See `context/foundation/prd.md` for the full product spec.

## Commands

Scripts are in `@package.json` (`dev`, `build`, `preview`, `lint`, `lint:fix`, `format`). Two things you can't infer from the script names:

- `npm run build` produces a **static** `./dist` (no adapter, no SSR runtime). `npm run deploy` = `astro build && wrangler deploy` (Workers Static Assets); `npm run cf:tail` streams live logs.
- `npm run format` applies `prettier-plugin-astro` + `prettier-plugin-tailwindcss` (Astro syntax + Tailwind class sorting).

Pre-commit hooks (husky + lint-staged) are configured in `@package.json`.

## Architecture

**Astro 6 app** with React 19 islands, Tailwind 4, shadcn/ui components, and **Sanity** as the content backend. Deployed to Cloudflare. The bespoke scroll engine and cinematic Single/All modes live as interactive React islands; static content/layout stays in Astro components.

### Rendering mode

`output: "static"` in astro.config.mjs. The public site is a **static build** (content fetched from Sanity at build time, so the live site has no runtime dependency on the backend), and the embedded Studio at `/admin` is client-rendered via `studioRouterHistory: "hash"` — no adapter, no SSR. Served by **Cloudflare Workers Static Assets** (`wrangler` serves `./dist` directly; no `@astrojs/cloudflare` adapter).

### Content backend (Sanity)

There is **no hand-built auth** — Marcin logs into Sanity Studio (Sanity-managed). The public site is read-only via a public token.

- `src/sanity/env.ts` — public project coordinates (`projectId`, `dataset`, `apiVersion`) from `PUBLIC_SANITY_*` env vars.
- `src/sanity/client.ts` — read-only `@sanity/client` for fetching content + `urlFor()` image-URL builder (on-the-fly responsive transforms, FR-007).
- `src/sanity/schema/{section,chapter,photo}.ts` — the content model. `section` and `chapter` are documents; `photo` (image + alt) is an embedded object. Chapter `photos` are an ordered array; first photo is the hero.
- `sanity.config.ts` (repo root) — Studio config, mounted by `@sanity/astro` at `/admin`.
- The `@sanity/astro` integration in `astro.config.mjs` is **conditional** on `PUBLIC_SANITY_PROJECT_ID` being set, so the build stays green before the Sanity project exists.

### Key conventions

- **Local imports**: use **relative paths** (`./`, `../`) for files under `src/`. The `@/` alias is **banned** for local files and enforced by ESLint (`@typescript-eslint/no-restricted-imports`). The `@/* → ./src/*` mapping is retained in `tsconfig.json` only so shadcn/ui tooling resolves — after `npx shadcn add`, convert any generated `@/` import to a relative path.
- **Import order**: group imports separated by a blank line, each group preceded by a comment header (include only the groups a file actually has):
  1. `// core` — framework and library imports (react, astro, supabase, zod)
  2. `// components` — component imports (Astro and React components, UI primitives)
  3. `// others` — types, hooks, constants, utilities, services
- **Naming**: code must be self-descriptive — prefer full, intention-revealing names over cryptic abbreviations (e.g. `section` not `s`, `groupIndex` not `gi`, `panel` not `p`). Avoid single-letter identifiers except trivial throwaway indices.
- **Astro components** for static content/layout; **React components** only when interactivity is needed.
- **Tailwind class merging**: use the `cn()` helper from `src/lib/utils` (clsx + tailwind-merge), imported via a relative path, for conditional/merged class names. Do not concatenate class strings manually.
- **shadcn/ui**: components live in `src/components/ui/`, "new-york" style variant. Install new ones with `npx shadcn@latest add [name]`, then convert the generated `@/` imports to relative paths (see **Local imports**).
- **API routes** (if any are added): use uppercase `GET`, `POST` exports; validate input with zod.
- **Sanity content**: schema lives in `src/sanity/schema/`; query the public site via `sanityClient` (GROQ) and build image URLs with `urlFor()`. Editing is done in Studio (`/admin`) — content is data, not code.
- **React**: no Next.js directives ("use client" etc.). Extract hooks to `src/components/hooks/`.
- **Services/helpers** go in `src/lib/` (or `src/lib/services/` for extracted business logic).
- **Shared types** (entities, DTOs) go in `src/types.ts`.

### Environment

- Node.js v22.14.0 (see `.nvmrc`)
- Sanity project: `photo-portfolio`, projectId `bp1ecwdp`, dataset `production`. These are **public, non-secret** coordinates baked in as defaults in `src/sanity/env.ts`, `astro.config.mjs`, and `sanity.cli.ts` — no `.env` required to run. Override via `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` / `PUBLIC_SANITY_API_VERSION` if ever needed.
- `sanity.cli.ts` carries the same coordinates for CLI commands (`npx sanity dataset …`, `npx sanity cors …`, `npx sanity deploy`).
- CORS: `http://localhost:4321` (Astro dev) is allowed. Add the Cloudflare production URL before deploying (`npx sanity cors add <url> --credentials`).
- Deploy: Cloudflare Builds (build + deploy on push to `main`). No Sanity env vars needed there — the public coordinates are in code.

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs **lint only** (ESLint) on every push and PR to `main` — build + deploy are handled by **Cloudflare Builds**, so the workflow no longer builds (avoids a redundant double-build). Husky pre-commit also runs `eslint --fix` on staged files locally.

---

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 2, Lesson 2

Turn one roadmap item into the first implementation cycle with the **change planning chain**:

```
/10x-roadmap -> /10x-new -> /10x-plan -> /10x-plan-review -> /10x-implement
```

`/10x-new`, `/10x-plan`, `/10x-plan-review`, and `/10x-implement` are the lesson focus. `/10x-frame` and `/10x-research` are not required rituals here; they are escalation paths introduced in the next lesson.

### Task Router - Where to start

| Skill | Use it when |
| --- | --- |
| **Change setup (lesson focus)** | |
| `/10x-new <change-id>` | You selected a roadmap item and need a stable change folder. Creates `context/changes/<change-id>/change.md` so planning, implementation, progress, commits, and later review all share one identity. Use AFTER roadmap selection, BEFORE `/10x-plan`. |
| **Planning (lesson focus)** | |
| `/10x-plan <change-id>` | You have a change folder and need a reviewable implementation plan. Reads roadmap context, foundation docs, codebase evidence, and any existing change notes; writes `plan.md` and `plan-brief.md` with phases, file contracts, success criteria, and `## Progress`. |
| **Plan readiness (lesson focus)** | |
| `/10x-plan-review <change-id>` | You have `plan.md` and need a light pre-code readiness check. Use it to catch missing end state, weak contracts, malformed progress, scope drift, or blind spots before code changes begin. |
| **Implementation (lesson focus)** | |
| `/10x-implement <change-id> phase <n>` | You have an approved plan and want to execute one phase with verification, manual gate, commit ritual, and SHA write-back to `## Progress`. |
| **Lifecycle closure** | |
| `/10x-archive <change-id>` | A change is merged or intentionally closed. Move it out of active `context/changes/` into archive state. |

### How the chain hands off

- `/10x-new` creates the durable change identity.
- `/10x-plan` turns that identity into an implementation contract.
- `/10x-plan-review` checks the plan before the agent mutates code.
- `/10x-implement` executes one planned phase, verifies, asks for manual confirmation when needed, commits, and records progress.

### Lesson boundaries

- Plan is the default router after roadmap selection. Start with `/10x-plan` unless the problem is unclear or external evidence is blocking.
- Do not run `/10x-frame + /10x-research` as ceremony for every change.
- Do not turn this lesson into a full end-to-end product build. A checkpoint with a planned and partially or fully implemented stream is valid.
- Code review of the implemented diff belongs to Lesson 3 via `/10x-impl-review`.
- Lifecycle closure via `/10x-archive` after a change is merged or intentionally closed.

### Paths used by this lesson

- `context/foundation/roadmap.md` - upstream roadmap
- `context/changes/<change-id>/change.md` - change identity
- `context/changes/<change-id>/plan.md` - implementation contract
- `context/changes/<change-id>/plan-brief.md` - compressed handoff
- `context/foundation/lessons.md` - recurring rules and pitfalls
- `docs/reference/contract-surfaces.md` - load-bearing names registry

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
