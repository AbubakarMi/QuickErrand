# QuickErrand — Software Implementation Plan

A real-time errand matching and tracking web platform connecting people who need errands or basic services done with nearby freelance runners and artisans.

**Stack:** Next.js (App Router, TypeScript) · PostgreSQL · Prisma ORM · NextAuth (credentials) · Tailwind CSS · Pusher or WebSockets for real-time status updates

---

## 1. User Roles

Keep it to three roles. No need for more at this stage.

| Role | Who they are | Core capability |
|---|---|---|
| **User (Requester)** | Posts an errand/service request | Creates tasks, tracks status, rates runners |
| **Runner** | Freelancer/artisan who fulfills tasks | Browses & accepts tasks, updates status, gets rated |
| **Admin** | You, the platform owner | Views users, tasks, resolves disputes |

A single account can only hold one role at a time (`role` field on the `User` table). Simpler than a multi-role permission system, and enough for a school project.

---

## 2. Database Schema (PostgreSQL via Prisma)

```prisma
// schema.prisma

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  phone         String?
  role          Role     @default(USER)
  createdAt     DateTime @default(now())

  // Runner-only fields (null for USER/ADMIN)
  category      Category?
  bio           String?
  isAvailable   Boolean  @default(true)

  tasksPosted   Task[]   @relation("PostedTasks")
  tasksRunning  Task[]   @relation("RunnerTasks")
  ratingsGiven  Rating[] @relation("RatingsGiven")
  ratingsReceived Rating[] @relation("RatingsReceived")
}

enum Role {
  USER
  RUNNER
  ADMIN
}

enum Category {
  GENERAL_ERRAND
  PLUMBING
  CARPENTRY
  ELECTRICAL
  CLEANING
  OTHER
}

model Task {
  id           String     @id @default(cuid())
  title        String
  description  String
  category     Category
  location     String
  status       TaskStatus @default(PENDING)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  posterId     String
  poster       User       @relation("PostedTasks", fields: [posterId], references: [id])

  runnerId     String?
  runner       User?      @relation("RunnerTasks", fields: [runnerId], references: [id])

  rating       Rating?
}

enum TaskStatus {
  PENDING       // posted, waiting for a runner
  ACCEPTED      // a runner has taken it
  IN_PROGRESS   // runner marked as started
  COMPLETED     // runner marked as done
  CANCELLED     // poster or runner cancelled
}

model Rating {
  id         String   @id @default(cuid())
  score      Int      // 1–5
  comment    String?
  createdAt  DateTime @default(now())

  taskId     String   @unique
  task       Task     @relation(fields: [taskId], references: [id])

  ratedById  String
  ratedBy    User     @relation("RatingsGiven", fields: [ratedById], references: [id])

  ratedUserId String
  ratedUser   User    @relation("RatingsReceived", fields: [ratedUserId], references: [id])
}
```

That is the whole schema. Four models: `User`, `Task`, `Rating`, plus two enums. Nothing more is needed to satisfy the four objectives in the proposal.

---

## 3. Role-Based Actions

### User (Requester)
- Register / log in
- Post a task (title, description, category, location)
- View list of own tasks with live status
- Cancel a task (only while status is `PENDING`)
- Rate the runner once a task is `COMPLETED`

### Runner
- Register / log in, set category and availability
- Browse `PENDING` tasks (optionally filtered by category)
- Accept a task → status becomes `ACCEPTED`
- Update status: `ACCEPTED → IN_PROGRESS → COMPLETED`
- View own task history and average rating

### Admin
- View all users and all tasks (read-only dashboard)
- Deactivate a misbehaving user (simple boolean flag, optional stretch feature)

---

## 4. Task Status Flow

```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
   |
   └──────────→ CANCELLED (from PENDING or ACCEPTED only)
```

Enforce this transition order in **one server function** (e.g. `updateTaskStatus(taskId, newStatus, actingUserId)`), not scattered across routes. It checks:
1. Is the acting user allowed to make this transition? (poster can cancel; runner can advance)
2. Is the transition legal per the diagram above?

This single guard function is the core of "real-time tracking" — keep all status logic here so it can't drift out of sync.

---

## 5. Application Structure (Next.js App Router)

```
/app
  /(auth)/login/page.tsx
  /(auth)/register/page.tsx
  /(user)/dashboard/page.tsx        → list of own posted tasks
  /(user)/tasks/new/page.tsx        → post a task
  /(runner)/dashboard/page.tsx      → available tasks + own accepted tasks
  /(runner)/tasks/[id]/page.tsx     → task detail + status update controls
  /(admin)/dashboard/page.tsx       → users + tasks overview
  /api/auth/[...nextauth]/route.ts
  /api/tasks/route.ts               → GET (list/filter), POST (create)
  /api/tasks/[id]/route.ts          → GET, PATCH (status update)
  /api/tasks/[id]/rate/route.ts     → POST (submit rating)

/lib
  prisma.ts                         → Prisma client singleton
  auth.ts                           → NextAuth config
  taskStatus.ts                     → the single status-transition guard function

/prisma
  schema.prisma
```

Route grouping with `(user)`, `(runner)`, `(admin)` lets each area have its own layout with role-specific navigation, without middleware complexity — just check `session.user.role` in each layout and redirect if it doesn't match.

---

## 6. Real-Time Status Tracking

Two options, pick based on time available:

- **Simple (recommended for a school project):** Poll `/api/tasks/[id]` every 5–10 seconds from the client while a task is open. No extra service needed, easy to demo, good enough for the "real-time" claim in the proposal.
- **True real-time (stretch goal):** Use Pusher (free tier) — trigger an event from the status-update API route, subscribe on the client. Add this only after the polling version works end-to-end.

Build the polling version first. Swap in Pusher later if time allows; the UI code barely changes either way.

---

## 7. Build Order (matches the 4-phase timeline in the proposal)

**Phase 1 — Foundation**
- Next.js project setup, Prisma + PostgreSQL connection, run first migration
- Auth: register/login for USER and RUNNER roles
- Basic layouts per role

**Phase 2 — Core Task Flow**
- User: post task, view own tasks
- Runner: browse pending tasks, accept task
- `taskStatus.ts` guard function + PATCH endpoint

**Phase 3 — Tracking & Rating**
- Status update buttons for runner (Accepted → In Progress → Completed)
- Live polling on task detail page
- Rating form after completion, average rating shown on runner profile

**Phase 4 — Polish & Deploy**
- Basic admin dashboard (read-only)
- Error handling, form validation, empty states
- Deploy (Vercel for the app, a managed Postgres like Neon or Supabase for the database)

---

## 8. What's Deliberately Left Out (matches "In Scope" on the proposal)

- No in-app payments or wallet
- No native mobile app
- No AI-based route optimization or matching algorithm — matching is just "browse and accept," not automated assignment

Keeping these out is what makes the four-week phases realistic. Add them later if the platform continues past graduation.
