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

- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Astro components** for static content/layout; **React components** only when interactivity is needed.
- **Tailwind class merging**: use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional/merged class names. Do not concatenate class strings manually.
- **shadcn/ui**: components live in `src/components/ui/`, "new-york" style variant. Install new ones with `npx shadcn@latest add [name]`.
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

## 10xDevs AI Toolkit - Module 2, Lesson 1

Move from sprint-zero setup to project orchestration with the **roadmap chain**:

```
(Module 1 foundation docs) -> /10x-roadmap -> backlog-ready roadmap items
```

`/10x-roadmap` is the lesson focus. `/10x-new` is intentionally introduced in Module 2, Lesson 2, when a selected roadmap item becomes an implementation change folder.

### Task Router - Where to start

| Skill | Use it when |
| --- | --- |
| **Roadmap (lesson focus)** | |
| `/10x-roadmap` | You have `context/foundation/prd.md` and a scaffolded project baseline, and you need a vertical-first MVP roadmap. The skill reads the PRD, inspects the code baseline, uses available foundation docs such as `tech-stack.md`, `infrastructure.md`, and `deploy-plan.md`, then writes `context/foundation/roadmap.md`. Use it BEFORE creating per-change folders or implementation plans. |
| **Re-run upstream if needed** | |
| `/10x-shape` / `/10x-prd` / `/10x-tech-stack-selector` / `/10x-bootstrapper` / `/10x-agents-md` / `/10x-infra-research` | Bundled from Module 1 so foundation contracts can be fixed before roadmap sequencing. If roadmap generation exposes a PRD gap, repair the PRD before pretending the backlog is ready. |

### How the chain hands off

- `/10x-roadmap` bridges product and implementation. It does not choose frameworks, design schemas, or write a per-change implementation plan.
- The output is `context/foundation/roadmap.md`: ordered milestones, vertical slices, bounded foundations, dependencies, unknowns, risk, and backlog handoff fields.
- Roadmap items should receive stable human-readable identifiers in backlog tools. The actual `context/changes/<change-id>/` folder is created in Lesson 2 with `/10x-new`.

### Roadmap boundaries

- Default to vertical slices: user-visible outcomes that cross UI, data, business logic, and integrations.
- Horizontal work is allowed only as a bounded enabler that names the downstream vertical milestone it unlocks.
- Avoid orphan horizontal work such as "build the whole database", "build all API endpoints", or "design the whole UI" before the first user-visible flow.
- Roadmap is not a calendar estimate. Do not invent dates, story points, or sprint velocity unless the user explicitly asks for a separate planning artifact.

### Foundation paths used by this lesson

- `context/foundation/prd.md` - input
- `context/foundation/tech-stack.md` - optional input
- `context/foundation/infrastructure.md` - optional input
- `context/deployment/deploy-plan.md` - optional input
- `context/foundation/roadmap.md` - output
- `context/foundation/lessons.md` - recurring rules and pitfalls
- `docs/reference/contract-surfaces.md` - load-bearing names registry

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
