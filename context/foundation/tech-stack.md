---
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
---

## Why this stack

A solo hobbyist shipping a photography portfolio MVP in one week needs a
battle-tested, agent-friendly starter that supplies owner auth, a content
database, and image storage out of the box — so the week is spent porting the
existing React + TypeScript front-end (custom scroll engine, Single/All modes)
and building the Section → Chapter → Photo content layer, not assembling
infrastructure. 10x-astro-starter is the recommended default for `(web, js)`
and clears all four agent-friendly gates. Supabase resolves the PRD's open auth
question (single owner-editor, no public sign-up), backs the CMS content model
in PostgreSQL, and serves photo uploads with on-the-fly responsive variants
(FR-003/004/007) — fitting the edge runtime better than heavy background jobs.
The existing React UI hydrates as Astro islands, keeping the public site fast
while the cinematic modes stay interactive. Auth is the only feature flag set;
payments, realtime, AI, and background jobs are out of scope per PRD non-goals.
Deploys to Cloudflare Pages via Cloudflare Builds with auto-deploy on merge —
the starter's native, lowest-friction path. Bootstrapper confidence is
first-class.

## Post-selection decision (2026-06-08)

The Astro 6 + Cloudflare scaffold is kept, but the **content backend was changed
from Supabase to Sanity** (headless CMS) after scaffolding. Rationale: the owner
needs no auth code (Sanity Studio provides the editor login), the Supabase
free-tier inactivity pause is unacceptable for an occasionally-visited portfolio,
and Sanity's free tier (100GB assets, 10k docs, built-in image CDN) comfortably
covers a photography portfolio while enabling a fully static public site built at
deploy time. The scaffold's Supabase pieces (auth middleware, auth pages,
`src/lib/supabase.ts`) are removed/unused. `hints.has_auth: true` in the
frontmatter above no longer implies self-built auth. This resolves Open Question 1
in the PRD.
