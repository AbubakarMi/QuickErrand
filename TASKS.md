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
- [x] 2.8 Surface a runner's own category as primary, without hiding or blocking anything else. Revised after discussion: a hard restriction (runner literally cannot see or accept out-of-category tasks) is the wrong model, real errand marketplaces let a runner take on adjacent work if they choose to, it's their call. `/runner/dashboard` now fetches the runner's own `category` alongside the (unchanged) task query and does a stable sort in JS: matching-category tasks first, everything else after in the same createdAt-desc order it already had, plus a small "Your specialty" badge on the matches. No change to `updateTaskStatus()` or the tasks API, accepting any `PENDING` task, in or out of category, stays a plain role check, so this carries no risk to anything Phase 2 already verified. Verified against the live Neon DB: seeded one plumbing, one electrical, one cleaning task for a plumbing-specialist runner, confirmed the plumbing task rendered first with the badge (and only it had the badge) while the other two kept their relative recency order, then confirmed accepting the electrical (out-of-category) task still succeeded with a 200. Test data deleted after.
- [x] **Phase 2 complete**. Verified over real HTTP against the live Neon DB with two logged-in sessions: posted two tasks as the requester, confirmed the category filter correctly narrows the pool (both via the API and the rendered page), accepted one task (confirmed it leaves the pending pool, shows the runner's name and "Accepted" on the requester's dashboard, and its Cancel button disappears), cancelled the other while still pending. Build and lint clean. 2.8 is additive polish on top of an already-complete phase, not a blocker.

## Phase 3: Tracking & Rating

Expanded per user feedback (a "searching for a runner" state for the poster,
detail pages for both sides, a live-polling mode for the runner dashboard).
**Judgment call, flagged rather than silently decided:** the request also
described something closer to "runner requests it, poster confirms, then
it locks." That's a different matching model than the plan specifies, the
plan's §8 explicitly scopes matching down to "browse and accept, not
automated assignment," and it's what 2.1/2.2/2.6 already built and verified
(first runner to accept is atomically assigned, instantly removed from the
pool). Keeping the atomic-accept model and reading the rest of that request
as "the poster should be able to see who has it, and it should already be
off the market," which is true today. If an actual two-sided
confirm-before-lock flow is wanted, flag it back and it becomes its own
task, it's a real data-model change (something has to represent "requested
but not yet assigned"), not a small addition.

- [x] 3.1 `/user/tasks/[id]/page.tsx`, poster's task detail: full task info,
  `SearchingIndicator` (pulsing radar rings, new shared component, respects
  `useReducedMotion`) while `PENDING`, the assigned runner's name + phone
  via `ContactCard` once accepted, cancel button while still `PENDING`
- [x] 3.2 `/runner/tasks/[id]/page.tsx`, runner's task detail: full task info,
  the poster's name + phone via `ContactCard`, status controls (`ACCEPTED →
  IN_PROGRESS → COMPLETED`, plus "back out" from `ACCEPTED`) via the
  existing `TaskStatusActionButton`. Also previewable by any runner while
  the task is still `PENDING` (that's what browsing is), but the poster's
  contact stays hidden until someone is actually assigned, **caught and
  fixed a real leak here**: the first draft of `GET /api/tasks/[id]` and
  this page's initial server fetch both included the phone number
  regardless of entitlement, relying on the page to just not render it,
  the API response (and the client-side props payload, which serializes
  regardless of what's rendered) doesn't work that way. Both now mask
  `poster.phone` to `null` server-side unless the requester is the poster
  or the assigned runner.
- [x] 3.3 Linked both dashboards' list rows to their respective detail pages
- [x] 3.4 Client-side polling (6s) on both detail pages while a task is still
  open (`PENDING`/`ACCEPTED`/`IN_PROGRESS`), stops on its own once
  `COMPLETED`/`CANCELLED`, so a status change made by the other party shows
  up without a manual refresh
- [x] 3.5 Runner dashboard "go live" mode (`LiveTaskFeed`): a toggle button
  that starts polling `GET /api/tasks` every 6s, shows a pulsing "watching
  live" indicator, and animates arrivals/departures with `AnimatePresence`
  + `layout` (still specialty-sorted via the new shared
  `sortTasksBySpecialty()`, used both here and in the initial server
  render so the two stay consistent). Off by default, current
  server-rendered list unchanged when it's off. Local list state
  re-syncs off the server-provided list whenever it changes (category
  filter navigation, or `router.refresh()` after an accept) using React's
  documented "adjust state during render" pattern rather than a `useEffect`
  (the effect version cascades an extra render and the lint rule flags it).
  - Verified over real HTTP against the live Neon DB (couldn't verify the
    client-side polling loop or its animations directly, that needs an
    actual browser with JS running, none is attached in this environment):
    posted a task, confirmed the poster's detail page shows the searching
    state and no phone; confirmed a previewing runner's `GET
    /api/tasks/:id` response has `poster.phone: null`; accepted it and
    confirmed both detail pages now show the correct `ContactCard` with
    the real phone number; advanced `ACCEPTED → IN_PROGRESS`, confirmed
    the button set changed to "Mark complete", advanced to `COMPLETED`;
    confirmed both dashboards' rows link to the right detail page.
    Build and lint clean. Test accounts and tasks deleted after.
Further expansion, per user request: price, payment coordination,
negotiation, and history/earnings. **Explicit scope boundary, confirmed
with the user:** no payment processing, ever, nothing moves money and
nothing will. The plan's §8 already ruled this out ("no in-app payments or
wallet") and that stands. What this actually is: a price the poster
states, a payment method (cash or bank transfer), the runner's account
number visible to the poster once assigned for an off-platform transfer
(same "reveal contact info only once entitled" pattern as phone numbers),
and a two-step **record**, poster marks it paid after paying off-platform,
runner confirms they received it. Two booleans with timestamps, not a
transaction. Also scoped down on request: "negotiation" is one structured
counter-offer, not an open-ended chat/multi-round thread, that's a
materially bigger feature (a real message thread model) and can become its
own task if actually wanted after trying this.

- [x] 3.6 Schema: add `price` (`Int`, whole currency units, no
  multi-currency or decimals, there's no real transaction to be precise
  about) and `paymentMethod` (new enum `CASH | BANK_TRANSFER`) to `Task`,
  both set by the poster at creation. Add `paidAt` / `paymentConfirmedAt`
  (nullable `DateTime`s) to `Task` for the mark-paid / confirm-received
  record. Add `bankAccountNumber` / `bankName` (nullable strings) to
  `User`, a runner's own payout details, set once and reused across tasks
  rather than re-entered every time.
- [x] 3.7 Post-a-task form: price input + payment method choice; task detail
  pages and dashboard rows show both.
- [x] 3.8 Bank details: a runner is prompted to add theirs (if missing) when
  accepting a `BANK_TRANSFER` task; visible to the poster on the task
  detail page via `ContactCard`, once assigned, exactly like the phone
  number already works. Never shown for `CASH` tasks, there's nothing to
  show.
- [x] 3.9 Price negotiation (single counter-offer, see the scope note above; superseded by bidding in 3.19):
  a runner can propose one counter-price instead of accepting outright,
  while the task is still `PENDING`. The poster sees it (via the existing
  6s poll on the detail page, "live" the same way status already is) and
  can accept it (finalizes the task to that runner at that price, through
  the same concurrency-safe atomic assignment `updateTaskStatus()` already
  uses for a normal accept) or decline it (clears the offer, task stays
  open at the original price for anyone, including that same runner
  deciding to accept at the original price instead).
- [x] 3.10 Mark-paid / confirm-received record, new guard functions
  (`src/lib/taskPayment.ts`, same single-guard-function discipline as
  `taskStatus.ts`): once a task is `COMPLETED`, the poster can mark it paid
  (sets `paidAt`), then the assigned runner can confirm they received it
  (sets `paymentConfirmedAt`, only allowed once `paidAt` is already set).
  Shown on both detail pages as a small two-step record, not a payment
  flow, no amount changes hands inside the app.
- [x] 3.11 Runner "My earnings": history of completed runs, total earned
  (and how much of that is payment-confirmed vs. still awaiting it).
- [x] 3.12 Poster's errand history: every posted errand regardless of
  status, total spent on the completed ones.
  - Done and verified over real HTTP against the live Neon DB (build and
    lint clean, test data deleted). Details worth knowing:
    - 3.6/3.7: `price` and `paymentMethod` on `Task`, both required, set in
      the post form; the API rejects a missing price with "Enter a price".
      `formatPrice()` prints a plain comma-separated number with no
      currency symbol, on purpose.
    - 3.8: bank details are enforced in `updateTaskStatus()`, not just the
      accept button (a hand-built PATCH used to be able to assign a runner
      the poster couldn't pay). Same rule on `proposeCounterOffer()`.
      Bank details only ever reach the poster, and only via the assigned
      runner's `ContactCard`.
    - 3.9: `acceptCounterOffer()` lives in `taskStatus.ts` (it writes
      status, and that file is the only place allowed to), propose/decline
      in `taskNegotiation.ts`. The poster's accept sends the price it was
      looking at and the server refuses on mismatch, so a runner replacing
      their offer mid-click can't get the wrong price or runner assigned.
      Other runners get `negotiatedPrice`, `negotiatedByRunnerId`, and
      `negotiatedByRunner` masked to null in both the API and the page
      props. A plain accept clears any pending offer.
    - 3.10: `taskPayment.ts`, `PATCH /api/tasks/[id]/payment`. Poster only
      for mark-paid (needs `COMPLETED`), assigned runner only for
      confirm-received (needs `paidAt` first), each settable once. Detail
      pages keep polling a `COMPLETED` errand until the record is finished.
    - 3.11/3.12: `/runner/earnings` and `/user/history`, with totals
      derived from `paidAt`/`paymentConfirmedAt`. Added nav links to
      `RoleShell` (there were none) so they're reachable.
    - Not verified: the client-side UI interactions themselves (button
      clicks, the inline bank-details form, live polling repaint), no
      browser attached here. The pages render the right server-side
      content and every endpoint they call is verified.
    - Known simplification: the earnings/history lists order by
      `updatedAt` since there's no `completedAt` column; ordering shifts
      slightly when a payment step updates the row.
- [x] 3.15 Follow-up to 3.6 to 3.12, from user feedback. Verified over real
  HTTP against the live Neon DB (two runners, one poster), build and lint
  clean, test data deleted.
  - **Live mode is a page**, `/runner/live`: a `BroadcastHeader` (rings
    pinging outward from a radio icon, reduced-motion safe) over the same
    `LiveTaskFeed` in `live` mode, polling every 4s and tagging errands that
    arrived after the page opened as "New". The dashboard's toggle is now a
    "Go live" link into it.
  - **Backing out**: the errand still goes `CANCELLED` (as asked), but the
    poster is now told why. A poster can only cancel while `PENDING` (no
    runner yet), so a cancelled errand that has a runner means the runner
    backed out, no new column needed. The poster sees "{name} backed out"
    with a "Post it again" link, the dashboard row says so too, and a
    cancelled errand no longer exposes either side's phone or bank details
    (API and page props both).
  - **Account number only when the runner accepts the price.** Making an
    offer no longer needs bank details. To make that coherent the
    negotiation is now three steps: runner offers, poster *agrees* (new
    `offerAgreedAt` column), runner *confirms* with a normal accept. Agreeing
    reserves the errand for that runner, so it drops out of the pool for
    everyone else (pool, direct URL, offering, accepting all blocked), which
    is also the "take it off so another runner won't accept" behavior asked
    for earlier. Bank details are required at the confirm step. The runner
    can release a reserved errand, the poster can take the agreement back.
    `acceptCounterOffer()` is gone, `agreeToCounterOffer()` /
    `withdrawCounterOffer()` are in `taskNegotiation.ts` (neither writes
    status), and a runner's confirm is the ordinary `updateTaskStatus`
    accept.
  - Accepts now carry the price the client displayed and the server refuses
    a mismatch, and the accept's `where` pins the negotiation state it
    validated against, so a poster withdrawing mid-click can't leave a
    runner assigned at terms that no longer exist.
  - **Fixed a leak from 3.9**: `GET /api/tasks` returned raw rows to
    runners, including other runners' counter-offers. The pool is now
    built through `runnerPool.ts`, an explicit whitelist.
  - Not verified: the pages' client-side interactions and animations (no
    browser attached here). The endpoints and server-rendered content are.
- [x] 3.16 Multi-round negotiation and notifications, from user feedback.
  Verified over real HTTP (production build on its own port, since a dev
  server of the user's already held port 3000) against the new database,
  build and lint clean, test data deleted.
  - **The poster can counter.** New `offerBy` column (`RUNNER | POSTER`,
    who put the current price on the table); the other side responds and
    either can counter, so it goes back and forth. Runner offers, poster
    agrees or declines or *counters*; runner then accepts the counter,
    declines it, or counters again. A runner accepting the poster's counter
    is just a plain accept priced at the counter (`priceFor()` in
    `taskStatus.ts`), so that is the moment bank details are required, same
    as accepting an agreed price. While a poster's counter is aimed at one
    runner, other runners can't cut in with offers (they can still accept at
    the asking price, which supersedes it). Runner pool rows carry the
    counter so their Accept button uses the right price.
  - **Notifications.** No table: `GET /api/notifications` derives "something
    is waiting on you" from the negotiation state (poster: a runner's open
    offer; runner: the poster's counter, or an agreed price to confirm), so
    it can't go stale or pile up and clears when answered. The id includes
    the price, so a new counter is a new notification. `NotificationBell`
    in the header polls it every 8s, shows a count and a dropdown, and
    toasts when something new arrives (never for what was already waiting
    at page load). The poster's dashboard rows also show "Offer: N".
- [x] 3.17 Signed-in users stay off the guest pages, from user feedback.
  `src/proxy.ts` (Next 16's name for middleware) redirects a signed-in
  visitor of `/`, `/login`, `/register` to their own dashboard, so typing
  `localhost:3000` or following a back link can't drop them on a guest page
  and the Sign out button is the only way out of a session. It also turns
  signed-out visitors away from `/user`, `/runner`, `/admin` before
  anything renders (previously the page threw a `TypeError` in parallel
  with the layout's redirect; harmless to the response but noisy).
  `requireRole()` now guards the role layouts and also sends a session
  whose user no longer exists (wiped DB, deleted account) to the sign-out
  page, otherwise that session would be a trap now that the guest pages
  are closed to it. Role-vs-area checks are still each layout's job.
- [x] 3.18 Database moved to a new Neon project, from user request. Applied
  all four migrations to the empty new database with `prisma migrate
  deploy`, copied every row (`User`, `Task`, `Rating`, in foreign-key
  order, one transaction) and verified the two databases row-for-row
  identical, not just counts. Test rows were cleaned out of the old
  database first so only real data moved. `.env` now points at the new
  database, the old URL is kept in it as a commented `OLD_DATABASE_URL`
  for rollback (`.env` is gitignored). The old database was not modified
  beyond removing my test rows. **A running `npm run dev` keeps the old
  connection until restarted.**
- [x] 3.13 Ratings, two-way and in stars, from user feedback (the plan had
  the poster rating the runner only). Once an errand is `COMPLETED` each side
  rates the other in stars with optional written feedback, one rating each
  (`Rating` is now unique on `(taskId, ratedById)`, `ratings` on `Task`).
  `rateCounterpart()` in `taskRating.ts`; the unique index is the real
  guarantee (two simultaneous submits: exactly one wins, verified). Both
  detail pages show a `RatingCard`: the form until you've rated, then the
  stars and feedback you gave and the ones you received.
- [x] 3.14 Overall ratings, shown as stars never as a bare number
  (`StarRating` fills fractionally, with the count beside it): on the runner
  dashboard and earnings, on each side's contact card for the other, and on a
  **profile page** for every user (`/user/profile/[id]` for runners,
  `/runner/profile/[id]` for posters, and your own): stars, errands
  completed, member since, and the feedback received with who left it. No
  phone or bank details on a profile. A poster reaches a runner's profile
  from the errand page and from each bid, a runner reaches a poster's the
  same way, plus a "Profile" link in the nav.
- [x] 3.19 **Bidding replaces first-come accept**, from user feedback:
  multiple runners bid, the poster reviews and awards. New `Bid` table (one
  live bid per runner, `OPEN | AWARDED | NOT_AWARDED`, optional
  `counterPrice`). Runners bid the asking price in one tap or name another;
  can change or withdraw. The poster sees every bid with the runner's stars,
  rating count, errands completed, category, price against their ask and how
  long ago, opens the profile, can counter a bid (the runner accepts or
  ignores) and awards one. `awardBid()` (in `taskStatus.ts`, it writes
  status) assigns that runner at their bid price and marks the other open
  bids `NOT_AWARDED` in one transaction, pinned to the price the poster saw;
  two simultaneous awards for different bids: exactly one wins (verified).
  Nobody can move an errand to `ACCEPTED` any other way. This supersedes the
  single-offer negotiation of 3.9 and 3.16 (columns and `taskNegotiation.ts`
  removed; the one real open offer in the database was migrated into a bid).
  Bank details are not asked for to bid; a bank transfer errand needs them
  before the runner can start it, enforced in `updateTaskStatus`, collected
  inline by `StartErrandButton`. A runner who bid and lost still sees how it
  ended ("awarded to another runner" / "cancelled").
- [x] 3.20 Stored notifications and "posted X ago", from user feedback. A
  `Notification` table with read/unread, written by the guards on: a bid or a
  changed bid (poster), a counter (runner), a counter accepted (poster), an
  award (winner) and "awarded to another runner" (each other bidder), a
  cancellation with open bids (bidders), a runner backing out, starting and
  finishing (poster), payment marked paid and confirmed, and being rated. The
  header bell shows the unread count, highlights unread, marks read on click
  or "Mark all read", and toasts new arrivals (not what was waiting at load).
  A user can only mark their own notifications read (verified). Errands and
  bids show how long ago they were posted ("just now", "5 min ago", "2 hours
  ago") via `timeAgo()` and a small `TimeAgo` that keeps itself fresh.
- [x] 3.21 Favicon: a custom brand icon in place of the default (teal tile,
  white location pin holding a check, coral dot). `src/app/icon.svg`, plus a
  rendered `favicon.ico` (16/32/48) and `apple-icon.png`.
- [x] 3.22 Fixed: the "Create your account" button on the landing page banner
  was unreadable. Cause: the `cn` package did not actually resolve Tailwind
  conflicts, and `buttonVariants` used directly on a `Link` never went
  through any merge, so a button carried both `bg-primary` and the intended
  `bg-primary-foreground` and the wrong one won. `cn` is now `clsx` +
  `tailwind-merge`, and `buttonVariants` merges, so a `className` reliably
  overrides a variant everywhere (this had also been quietly affecting the
  hero's coral button). Label uses a new `brand-teal-deep` token for 4.5:1+
  contrast (plain teal was 4.0:1).
- [x] 3.23 Database SSL: connection strings now say `sslmode=verify-full`
  explicitly, which is what `require` already meant to the driver, silencing
  the pg "SECURITY WARNING" overlay in dev.
- [x] 3.24 Mobile responsiveness, from user feedback ("very extensive").
  Measured, not eyeballed: a headless-Chrome audit of every page (20 pages,
  poster and runner views in every errand state, seeded with awkward content:
  a 130-character title, a very long address, a 25,000,000 price, a
  47-character single-word name, long feedback) at 320, 360, 390, 768 and
  1280px, each in an isolated session, checking horizontal overflow and tap
  targets, plus reading screenshots of the hardest pages. First run: every
  signed-in page overflowed 240px sideways on a phone (the header put the
  logo, nav, name, badge, bell and sign out in one row). Now **0 of 120 page
  checks overflow and no tap target is under 36px** on a phone.
  What changed: the header is logo and actions on one row with the nav as a
  scrollable tab row beneath (current page highlighted), sign out is
  icon-only on phones, name and role badge appear when there's room; buttons
  are 36 to 44px tall on phones and compact from `sm` up; list rows, bid
  cards, the notification panel and toast stack or go full width on small
  screens; the logo and name links have larger tap areas; and `body` sets
  `overflow-wrap: break-word` so one long unbroken word wraps instead of
  widening the page. (`anywhere` was tried first and rejected: it let the
  logo shrink and split mid-word.)
  Harness lessons worth keeping: cookies persist across pages in one browser
  session, so guest pages were silently audited as signed-in until each page
  got its own context; and sections that fade in on scroll need a scroll
  pass before a full-page screenshot or they look blank.
  Also fixed while reading the screenshots: the landing page copy still
  described first-come accepting ("A runner accepts it") and now describes
  bidding.
- [x] **Phase 3 complete**, full lifecycle demoable: post → bids → award →
  start → complete → rate both ways → mark paid, with notifications at each
  step. Verified over real HTTP against the live Neon DB and, for layout, in
  headless Chrome; build and lint clean.

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
