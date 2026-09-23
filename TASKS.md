# QuickErrand: Execution Checklist

Derived from `QuickErrand Implementation Plan.md`. Work top to bottom, one box
at a time. **Do not start a task until the one above it is checked off and
verified**, see the sequential-execution rule in `CLAUDE.md`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done & verified

---

## Phase 1: Foundation

- [x] 1.1 Scaffold Next.js 16 app (TypeScript, App Router, ESLint, Tailwind v4) at repo root
- [x] 1.2 Install & configure shadcn/ui + lucide-react; verify one sample component renders
- [x] 1.3 Define brand design tokens (colors, fonts, spacing rhythm) from `CLAUDE.md` in `globals.css` / Tailwind theme
- [x] 1.3b Public guest landing page at `/` (no auth required), brand intro, CTAs into register/login, links to browse as guest
- [x] 1.4 Install Prisma; write `prisma/schema.prisma` per plan §2 (User, Task, Rating, Role, Category, TaskStatus), schema validated with `prisma validate`, client generates cleanly
- [x] 1.5 Wire up PostgreSQL connection (`DATABASE_URL` env var, Neon) and run first migration, `init` migration applied, verified with a live query
- [x] 1.6 `lib/prisma.ts`, Prisma client singleton (Prisma 7 driver-adapter pattern: `@prisma/adapter-pg` + `pg.Pool`, cached on `globalThis` in dev), verified against live Neon DB (`user count: 0`)
- [x] 1.7 Install & configure NextAuth v4 (credentials provider); `src/lib/auth.ts`, JWT session, `authorize()` checks against `User` via Prisma
- [x] 1.8 Build `/(auth)/register/page.tsx`, role toggle (User/Runner, + category for Runner), bcrypt password hashing via a server action
- [x] 1.9 Build `/(auth)/login/page.tsx`, NextAuth credentials sign-in, error/registered-banner via query params
- [x] 1.10 Per-role layouts with session + role guard, **deviated from the plan's literal `(user)`/`(runner)`/`(admin)` route-group paths**: those three groups all resolve to the same URL (`/dashboard`) since parenthesized groups don't add a path segment, which Next.js rejects as a route collision. Used real segments instead, `/user`, `/runner`, `/admin`, each with its own `layout.tsx` doing the same `session.user.role` guard the plan describes; only the folder naming changed, not the mechanism. `/post-login` added as the single place that decides where a session belongs (used after sign-in and as the bounce target from a wrong-role layout).
- [x] 1.11 UI polish pass (post-Phase-1 feedback): added `motion` for animation; register flow restructured into two real steps (role selection screen, then the form, was previously a single form with a role toggle); login/register inputs got icons + placeholders; auth card gets an entrance animation.
- [x] 1.12 Landing page rebuild (first pass rated 20/100 by user, "looks AI generated," "animation is old and bad"): replaced the generic badge-hero-3-card-grid template with an asymmetric hero (blurred drifting gradient fields, bold two-line headline, sticky blurred header), a `LiveActivityCard` hero visual (3 simultaneously live-updating task rows with independent phase-offset status cycling and mouse-tilt via spring-smoothed `rotateX/rotateY`, replacing the old single dashed-line-and-bike-icon progress bar), a CSS marquee ticker of example task categories, and a numbered "How it works" scroll-reveal section replacing the plain feature grid. Also: **removed every em dash from the codebase** (UI copy, comments, this file, CLAUDE.md) per an explicit standing rule now in CLAUDE.md. Verified via rendered HTML over curl (no attached browser in this environment): all new sections present, 0 em dashes on any page, build and lint clean, no console errors in dev log.
- [x] **Phase 1 complete**, verified for real against the live Neon DB: registered a USER and a RUNNER through the actual server action (progressive-enhancement form POST, not mocked), logged in through NextAuth's real credentials callback, confirmed `/post-login` routes each role to its own dashboard, confirmed a USER session gets bounced out of `/runner/dashboard`, confirmed an unauthenticated request gets sent to `/login`. `npm run build` clean. Test accounts deleted after verification.

## Phase 2: Core Task Flow

- [x] 2.1 `src/lib/taskStatus.ts`, the single status-transition guard function (plan §4). Resolved an ambiguity between plan §3 ("poster can only cancel while PENDING") and §4's diagram (CANCELLED reachable from PENDING or ACCEPTED): poster cancels from PENDING, the assigned runner can back out from ACCEPTED, nobody cancels from IN_PROGRESS. Uses `updateMany` with a status guard in the `where` clause (not a plain `update`) so two concurrent transitions can't both win, e.g. two runners accepting the same task at once. Verified against the live Neon DB with a throwaway script exercising all 12 paths: every legal transition, every role/ownership rejection, the terminal-state rejection, and the concurrent-accept race (exactly one of two simultaneous accepts succeeds, the other gets a typed `TaskStatusError`, not a crash or silent double-assignment). Script and its test rows deleted after the run.
- [x] 2.2 `POST /api/tasks` + `GET /api/tasks`. GET is role-branched rather than a generic filter API: USER gets their own posted tasks (any status), RUNNER gets the open PENDING pool with an optional `?category=` filter. Verified over real HTTP against the live Neon DB with logged-in sessions (one account seeded directly, one registered through the real form): unauthenticated GET returns 401, POST as USER creates and returns 201, POST as RUNNER is rejected with 403, POST with an empty title is rejected with 400 and the zod message, GET as USER returns only their task, GET as RUNNER returns the pool and correctly filters to empty for a non-matching category. Test accounts and tasks deleted after.
- [x] 2.3 `/user/tasks/new/page.tsx`, post-a-task form (title, description, category, location), client form posting to `/api/tasks`
- [x] 2.4 `/user/dashboard/page.tsx`, list of own posted tasks with live status badges (`StatusBadge`, new shared component)
- [x] 2.5 `/runner/dashboard/page.tsx`, browse `PENDING` tasks, filter by category via `CategoryFilter`
- [x] 2.6 `GET` + `PATCH /api/tasks/[id]`, single-task fetch (poster or assigned runner only) and status update, routed through `updateTaskStatus()`
- [x] 2.7 User: cancel task action (only while `PENDING`), also through `updateTaskStatus()`. 2.5, 2.6, and 2.7 were built and verified together, same as the Phase 1 auth batch, since browsing without an accept endpoint (or a cancel button without a PATCH route) can't be meaningfully tested in isolation. New shared `TaskStatusActionButton` drives both accept and cancel (and will drive the advance/complete actions in Phase 3).
- [x] **Phase 2 complete**, verified over real HTTP against the live Neon DB with two logged-in sessions: posted two tasks as the requester, confirmed the runner's category filter correctly narrows the pool (both via the API and the rendered page), accepted one task (confirmed it leaves the pending pool, shows the runner's name and "Accepted" on the requester's dashboard, and its Cancel button disappears), cancelled the other while still pending. Build and lint clean. Test accounts and tasks deleted after.

## Phase 3: Tracking & Rating

- [ ] 3.1 `/runner/tasks/[id]/page.tsx`, task detail + status update controls (`ACCEPTED → IN_PROGRESS → COMPLETED`)
- [ ] 3.2 Client-side polling (5–10s) on task detail views while task is open
- [ ] 3.3 `POST /api/tasks/[id]/rate` + rating form shown to poster after `COMPLETED`
- [ ] 3.4 Average rating computed and shown on runner profile/dashboard
- [ ] **Phase 3 complete**, full lifecycle demoable: post → accept → progress → complete → rate

## Phase 4: Polish & Deploy

- [ ] 4.1 `/admin/dashboard/page.tsx` (already a shell from Phase 1), read-only users + tasks overview
- [ ] 4.2 Admin: deactivate-user boolean flag (stretch, optional)
- [ ] 4.3 Error handling + form validation (zod) across all mutating routes
- [ ] 4.4 Empty states, loading states, and responsive pass across all pages
- [ ] 4.5 Deploy: Vercel (app) + Neon or Supabase (Postgres), **needs user's deploy target decision**
- [ ] **Phase 4 complete**, deployed, demoable end-to-end on a real URL

---

## Explicitly out of scope (plan §8)

Do not add: in-app payments/wallet, native mobile app, AI-based matching or
route optimization. If asked to add one of these mid-project, flag it, don't just build it.
