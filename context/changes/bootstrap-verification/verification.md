---
bootstrapped_at: 2026-06-08T14:29:57Z
starter_id: 10x-astro-starter
starter_name: "10x Astro Starter (Astro + Supabase + Cloudflare)"
project_name: marcin-kulbicki
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

Verbatim from `context/foundation/tech-stack.md`:

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: marcin-kulbicki
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: cloudflare-builds
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

**Why this stack** (from hand-off body): A solo hobbyist shipping a photography
portfolio MVP in one week needs a battle-tested, agent-friendly starter that
supplies owner auth, a content database, and image storage out of the box — so
the week is spent porting the existing React + TypeScript front-end (custom
scroll engine, Single/All modes) and building the Section → Chapter → Photo
content layer, not assembling infrastructure. 10x-astro-starter is the
recommended default for `(web, js)` and clears all four agent-friendly gates.
Supabase resolves the PRD's open auth question (single owner-editor, no public
sign-up), backs the CMS content model in PostgreSQL, and serves photo uploads
with on-the-fly responsive variants (FR-003/004/007) — fitting the edge runtime
better than heavy background jobs. The existing React UI hydrates as Astro
islands, keeping the public site fast while the cinematic modes stay
interactive. Auth is the only feature flag set; payments, realtime, AI, and
background jobs are out of scope per PRD non-goals. Deploys to Cloudflare Pages
via Cloudflare Builds with auto-deploy on merge — the starter's native,
lowest-friction path. Bootstrapper confidence is first-class.

## Pre-scaffold verification

| Signal      | Value                                          | Severity | Notes                                                        |
| ----------- | ---------------------------------------------- | -------- | ------------------------------------------------------------ |
| npm package | not run                                        | —        | cmd_template is a `git clone`, not a `create-*` CLI — skipped |
| GitHub repo | przeprogramowani/10x-astro-starter last pushed 2026-05-17 | fresh    | from card.docs_url; within 3 months of bootstrap date         |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone
**Exit code**: 0
**Files moved**: 18 (.env.example, .github, .husky, .nvmrc, .prettierrc.json, .vscode, README.md, astro.config.mjs, components.json, eslint.config.js, node_modules, package-lock.json, package.json, public, src, supabase, tsconfig.json, wrangler.jsonc)
**Conflicts (.scaffold siblings)**: CLAUDE.md.scaffold (existing root CLAUDE.md preserved; starter's copy sidelined)
**.gitignore handling**: append-merged — added `.env.production`, `.dev.vars`, `.wrangler/` under a `# from 10x-astro-starter` separator; existing cwd lines kept in order
**Cloned .git/ history**: discarded before move-up (existing cwd `.git/` untouched)
**.bootstrap-scaffold cleanup**: left in place — `rm -rf` blocked by environment permissions. Leftover contents: `.git/` (discarded clone history), `.gitignore` (already merged). Manual cleanup: `rm -rf .bootstrap-scaffold`.

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: 0 CRITICAL, 1 HIGH, 9 MODERATE, 0 LOW
**Direct vs transitive**: 0/0/0/0 direct of total 0/1/9/0 — every finding is transitive; no direct dependency is flagged.

#### CRITICAL findings

none

#### HIGH findings

- **devalue** (transitive) — DoS via sparse array deserialization (advisory: "Svelte devalue: DoS via sparse array deserialization"). Pulled in transitively; advisory until upstream ships a fix. Not directly actionable from a direct-dependency bump.

#### MODERATE findings

- **@astrojs/check** (direct) — via @astrojs/language-server
- **@astrojs/language-server** (transitive) — via volar-service-yaml
- **@cloudflare/vite-plugin** (transitive) — via miniflare; wrangler; ws
- **miniflare** (transitive) — via ws
- **volar-service-yaml** (transitive) — via yaml-language-server
- **wrangler** (direct) — via miniflare
- **ws** (transitive) — uninitialized memory disclosure
- **yaml** (transitive) — Stack Overflow via deeply nested YAML collections
- **yaml-language-server** (transitive) — via yaml

#### LOW / INFO findings

none

Note: bootstrapper does not auto-fix. `npm audit fix` (and `--force` for breaking changes) are available if you choose to address these.

## Hints recorded but not acted on

| Hint                    | Value               |
| ----------------------- | ------------------- |
| bootstrapper_confidence | first-class         |
| quality_override        | false               |
| path_taken              | standard            |
| self_check_answers      | null                |
| team_size               | solo                |
| deployment_target       | cloudflare-pages    |
| ci_provider             | cloudflare-builds   |
| ci_default_flow         | auto-deploy-on-merge |
| has_auth                | true                |
| has_payments            | false               |
| has_realtime            | false               |
| has_ai                  | false               |
| has_background_jobs     | false               |

v1 surfaces these but takes no automated action. CI/CD scaffolding (Cloudflare
Builds, auto-deploy-on-merge) and agent-context generation are deferred to later
skills. `has_auth: true` is satisfied natively by the starter's Supabase auth
flow.

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- Your repo already has a `.git/` — no `git init` needed. The starter's cloned history was discarded.
- Clear the leftover temp directory: `rm -rf .bootstrap-scaffold`.
- Review `CLAUDE.md.scaffold` (the starter's agent guide) against your existing `CLAUDE.md` and merge anything useful — it documents the starter's commands, auth flow, and conventions.
- Copy `.env.example` to `.env` and set `SUPABASE_URL` / `SUPABASE_KEY` before running `npm run dev`.
- Address audit findings per your project's risk tolerance — the full breakdown is above.
