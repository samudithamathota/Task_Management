# TaskBoard — Full-Stack Task Management Application

A Trello-like task management application with projects, a drag-and-drop task
board, priorities, due dates, search, dashboard statistics, and a
normal-user/administrator permission model.


## 1. Project Overview

TaskBoard organizes work into **projects**, each holding zero or more
**tasks**. Every task moves across three status columns — **To Do**,
**Doing**, **Done** — using drag-and-drop, and every status change is
persisted immediately.

There are two roles:

- **Normal users** register themselves, create projects they own, and create
  tasks inside a project they own. A task they create is automatically
  assigned to themselves. They can edit or delete projects/tasks they
  created, and change the status of anything created by or assigned to them.
  They cannot assign tasks to other people.
- **Administrators** (created only via a seed script) can see every user,
  every project, and every task system-wide; can create a task in *any*
  project and must choose who it's assigned to; and can assign, reassign, or
  unassign any task between any users. They can also edit, reset the
  password of, or delete any **normal user's** account (not another admin's).

The frontend and backend are two independent projects that communicate over
a versioned REST API.


## 2. Features

- Email/password registration and login with hashed passwords (bcrypt) and
  JWT-based sessions.
- Role-based access control enforced on the **backend** (the actual security
  boundary), with the frontend hiding actions a user isn't expected to use.
- **Projects** as a parent container for tasks — create/edit/delete your own
  projects; a project can't be deleted while it still holds tasks.
- A project-switcher sidebar on the dashboard: pick a project to see just its
  tasks, or "All Tasks" for everything you can see across every project.
- Drag-and-drop task board (`@dnd-kit`) with optimistic UI updates and
  automatic rollback if the backend rejects a status change.
- Task CRUD with an explicit, documented ownership model (see Section 6),
  including an optional start/due date pair and a priority level (`LOW` /
  `MEDIUM` / `HIGH` / `URGENT`).
- Due-date status indicators (no due date / upcoming / due today / overdue)
  computed on calendar days, not exact instants, so timezone offsets can't
  misclassify a task due "today."
- Debounced task search across title/description, scoped to whatever tasks
  the current user is already authorized to see.
- Dashboard statistics — total/by-status/overdue counts for everyone, plus
  total users, unassigned tasks, and a by-priority breakdown for admins —
  computed with a single MongoDB aggregation, not by loading every task.
- Full assign/reassign/unassign flow, restricted to administrators.
- Admin dashboard with a user directory (edit, reset password, or delete a
  normal user's account) and a system-wide task-assignment table.
- Centralized error handling, consistent API response shapes, and
  request-body validation (Zod) on every mutating endpoint.
- Responsive layout; loading, error, and empty states throughout.


## 3. Technology Stack

| Layer          | Technology                                    |
|----------------|------------------------------------------------|
| Frontend       | Next.js 14 (App Router), React 18, TypeScript |
| Backend        | Express.js, TypeScript                        |
| Database       | MongoDB + Mongoose                            |
| Authentication | JWT + bcrypt (bcryptjs)                       |
| Validation     | Zod                                           |
| Drag and drop  | `@dnd-kit/core`                               |
| Deployment     | Vercel (frontend) + Render/Railway (backend) + MongoDB Atlas |

### Why these technologies were chosen

- **Next.js + TypeScript**: App Router gives clean route-based code
  splitting for `login`, `register`, `dashboard`, `projects`, `summary`, and
  `admin`, and TypeScript catches API-contract mismatches between frontend
  and backend at compile time.
- **Express + TypeScript**: a minimal, well-understood framework that keeps
  the request pipeline (route → middleware → controller → service → model)
  explicit and easy to reason about.
- **MongoDB + Mongoose**: tasks reference their project, creator, and
  assignee (`project`, `createdBy`, `assignedTo`); Mongoose's `populate`
  resolves all three in one query. A single `$facet` aggregation computes
  every dashboard statistic in one round-trip instead of loading tasks into
  application memory.
- **JWT + bcrypt**: stateless authentication that's simple to verify in
  middleware, with industry-standard password hashing — reused as-is when an
  admin resets a normal user's password.
- **Zod**: schema-based validation that doubles as a single source of truth
  for what a valid request body looks like, with TypeScript types inferred
  from the same schema.
- **`@dnd-kit`**: a modern, accessible, actively-maintained drag-and-drop
  library with no legacy HTML5 drag-and-drop quirks.


## 4. Architecture

Next.js Frontend  ──HTTPS/JSON──▶  Express Backend  ──Mongoose──▶  MongoDB
  (Vercel)                          (Render/Railway)                (Atlas)

Backend request flow:

Route → Middleware (auth/validate) → Controller → Service → Model/Database

- **Routes** only wire up URLs, middleware, and controllers — no business logic.
- **Controllers** parse the (already-validated) request and call a service.
- **Services** hold all business rules, including every authorization check
  described in Section 6. `project.service.ts` reuses a visibility predicate
  exported from `task.service.ts` (rather than re-implementing it) to decide
  which projects a user may see — a project is visible if it contains a task
  the user can already see, even if they don't own the project itself.
- **Middleware** handles authentication, role authorization, validation, and
  centralized error formatting.

The frontend never makes an authorization decision that matters for
security — it only hides buttons a user isn't expected to need. Every rule
is re-checked on the backend.


## 5. Project Structure

task-management-app/
├── backend/     # Express + TypeScript + MongoDB API
├── frontend/    # Next.js + TypeScript client
├── docs/
│   └── screenshots/
├── README.md
└── submission.txt

Backend: `src/{constants,controllers,services,models,middleware,routes,schemas,scripts}`.

Frontend pages: `src/app/{login,register,dashboard,projects,projects/[id],summary,admin}`.
`dashboard` is the "all my tasks" board with the project-switcher sidebar;
`projects/[id]` is the same board pre-scoped to one project (also reachable
by picking it in the sidebar); `summary` is a normal user's statistics-only
page; `admin` is the admin-only dashboard (Project Summary / Tasks / Users
tabs).

See `backend/src` and `frontend/src` for the full internal structure.


## 6. User Roles and Permissions

### Tasks

| Action                                   | Normal User                          | Administrator |
|-------------------------------------------|---------------------------------------|----------------|
| Create a task                             | ✅ (in a project they own; auto-assigned to themselves) | ✅ (in any project; must specify an assignee) |
| View a task                               | Only if creator or assignee            | ✅ (all)   |
| Edit a task (fields, priority, due date, move to another project) | Only if creator | ✅ (any) |
| Delete a task                             | Only if creator                       | ✅ (any)       |
| Change a task's status                    | Only if creator or assignee           | ✅ (any)       |
| Assign / reassign / unassign a task       | ❌                                     | ✅             |
| Search tasks                              | ✅ (scoped to tasks they can see)      | ✅ (all)       |
| View dashboard statistics                 | ✅ (scoped to tasks assigned to them)  | ✅ (system-wide, plus total users, unassigned count, priority breakdown) |

### Projects

| Action                                   | Normal User                          | Administrator |
|-------------------------------------------|---------------------------------------|----------------|
| Create a project                          | ✅ (becomes its owner)                 | ✅             |
| View a project / project list             | Own projects, plus any project containing a task visible to them | ✅ (all) |
| Edit or delete a project                  | Only if creator                       | ✅ (any)       |
| Delete a project that still has tasks     | ❌ (blocked until tasks are moved/deleted) | ❌ (same rule, no exception) |

### User accounts

| Action                                   | Normal User | Administrator |
|--------------------------------------------|-------------|----------------|
| Register                                   | ✅           | ❌ (seed script only) |
| View all users                             | ❌           | ✅             |
| Edit a normal user's name/email, or reset their password | ❌ | ✅ (never another admin's account) |
| Delete a normal user's account             | ❌           | ✅ (only if they neither created nor are assigned any task; never their own account, never another admin's) |

### Clarified rules

**Tasks** — every task has `createdBy`, `assignedTo`, and `project`, and is
always assigned to someone (there is no "unassigned, claimable" state).

1. **Creation** — a normal user's task is auto-assigned to themselves and
   must belong to a project they own. An admin's task must specify an
   `assignedTo` (a `USER`-role account) and may go into any project.
2. **Visibility** — a task is visible if `createdBy === me` OR
   `assignedTo === me`. Administrators bypass this.
3. **Edit/delete** — only if `createdBy === me`. Moving a task to a
   different project additionally requires owning (or being admin over)
   *that* destination project.
4. **Status change** — only if `createdBy === me` OR `assignedTo === me`.
5. **Assign/reassign/unassign** — administrator only, via a dedicated
   endpoint; there is no self-service claiming.

**Projects** — there is no membership/sharing concept, only ownership plus
task-visibility spillover:

1. A user always sees a project they created.
2. A user also sees a project they didn't create, if at least one task
   inside it is visible to them (e.g. an admin created the project and
   assigned them a task in it).
3. Only the owner or an admin may rename/describe or delete a project.
4. A project can't be deleted while it still has any tasks in it — move or
   delete them first.


## 7. Database Schema

### User

{
  _id: ObjectId,
  name: string,
  email: string,        // unique, lowercase
  password: string,     // bcrypt hash, never returned by the API
  role: "USER" | "ADMIN",
  createdAt: Date,
  updatedAt: Date
}

### Project

{
  _id: ObjectId,
  name: string,          // required, trimmed, max 150 chars
  description: string,   // trimmed, max 2000 chars
  createdBy: ObjectId,    // ref: User — the owner
  createdAt: Date,
  updatedAt: Date
}

### Task

{
  _id: ObjectId,
  title: string,          // required, trimmed, max 150 chars
  description: string,    // trimmed, max 2000 chars
  status: "TODO" | "DOING" | "DONE",
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT", // default MEDIUM
  startDate: Date,        // required
  dueDate: Date | null,   // optional deadline; null = no due date
  createdBy: ObjectId,     // ref: User
  assignedTo: ObjectId,    // ref: User — always set (see Section 6)
  project: ObjectId,       // ref: Project — required
  createdAt: Date,
  updatedAt: Date
}

Indexes exist on `status`, `assignedTo`, `createdBy`, and `project` (Task),
and on `createdBy` (Project), to support the board's filtering queries.

> **Migrating an existing database**: `project` was added after tasks
> already existed in some deployments. Run `npm run migrate:tasks-to-projects`
> (see Section 9) once, before deploying this schema — it backfills a
> "Legacy Tasks" project per affected user so no existing task is left
> without one.


## 8. API Endpoints

Base URL: `/api`

All responses use a consistent envelope:

{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "...", "errors": { } }

| Method | Endpoint                  | Auth        | Description                                   |
|--------|-----------------------------|-------------|------------------------------------------------|
| POST   | `/auth/register`            | Public      | Registers a new **normal** user               |
| POST   | `/auth/login`                | Public      | Logs in, returns a JWT                         |
| GET    | `/auth/me`                    | Required    | Returns the current authenticated user         |
| GET    | `/users`                      | Admin only  | Lists all users (no password field)             |
| PATCH  | `/users/:id`                  | Admin only  | Updates a normal user's name/email/password     |
| DELETE | `/users/:id`                  | Admin only  | Deletes a normal user (only if they neither created nor are assigned any task) |
| POST   | `/projects`                    | Required    | Creates a project (caller becomes the owner)    |
| GET    | `/projects`                    | Required    | Lists projects visible to the current user, with each one's visible task count |
| GET    | `/projects/:id`                | Required    | Gets a single project (if authorized)           |
| PATCH  | `/projects/:id`                | Required    | Updates name/description (owner/admin)          |
| DELETE | `/projects/:id`                | Required    | Deletes a project (owner/admin; blocked if it has tasks) |
| POST   | `/tasks`                       | Required    | Creates a task in a project (`createdBy`/`status` server-set; `assignedTo` required for admins) |
| GET    | `/tasks`                       | Required    | Lists tasks visible to the current user; `?search=` (title/description) and `?projectId=` filters |
| GET    | `/tasks/statistics`            | Required    | Role-scoped dashboard counts (see Section 6)    |
| GET    | `/tasks/:id`                    | Required    | Gets a single task (if authorized)              |
| PATCH  | `/tasks/:id`                    | Required    | Updates title/description/dates/priority/project (creator/admin) |
| DELETE | `/tasks/:id`                    | Required    | Deletes a task (creator/admin)                  |
| PATCH  | `/tasks/:id/status`             | Required    | Changes status (creator/assignee/admin)         |
| PATCH  | `/tasks/:id/assign`             | Admin only  | Assigns, reassigns, or unassigns a task          |

Full request/response bodies and status codes are documented inline in the
backend's route/schema files (`backend/src/schemas`).


## 9. Local Setup

### Prerequisites

- Node.js 18+
- A MongoDB connection string (local `mongod` or a MongoDB Atlas cluster)

### Backend Setup

cd backend
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, etc.
npm install
npm run dev                # starts the API on http://localhost:5000

To create the administrator account:

npm run seed:admin         # uses ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD from .env

If you're bringing over a database that has tasks from before the Projects
feature existed, run this **once**, before relying on task/project data:

npm run migrate:tasks-to-projects

It creates (or reuses) a "Legacy Tasks" project per affected user and files
their project-less tasks into it. It's idempotent — running it again with
nothing left to migrate is a no-op.

### Frontend Setup

cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev                        # starts the app on http://localhost:3000


## 10. Environment Variables

### Backend (`backend/.env`)

| Variable          | Description                                       |
|--------------------|-----------------------------------------------------|
| `PORT`             | Port the API listens on (default `5000`)            |
| `NODE_ENV`          | `development` or `production`                        |
| `MONGODB_URI`       | MongoDB connection string                            |
| `JWT_SECRET`        | Secret used to sign JWTs — a long random string, kept private |
| `JWT_EXPIRES_IN`    | Token lifetime, e.g. `1d`                             |
| `CLIENT_URL`        | Frontend origin, used to configure CORS               |
| `ADMIN_NAME`        | Used only by `npm run seed:admin`                     |
| `ADMIN_EMAIL`       | Used only by `npm run seed:admin`                     |
| `ADMIN_PASSWORD`    | Used only by `npm run seed:admin`                     |

### Frontend (`frontend/.env.local`)

| Variable                | Description                          |
|---------------------------|----------------------------------------|
| `NEXT_PUBLIC_API_URL`     | Base URL of the backend API, e.g. `http://localhost:5000/api` |

Neither `.env` file is committed — only the `*.example` templates are (see
the root, `backend/`, and `frontend/` `.gitignore` files).


## 11. Admin Seed Instructions

Administrators are **never** created through `/api/auth/register`. To
create one:

1. Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`.
2. Run `npm run seed:admin` from the `backend/` directory.
3. The script connects to MongoDB, skips creation if that email already
   exists, hashes the password, creates the `ADMIN` user, and disconnects.
   It never prints the password to the console.


## 12. Testing Instructions

This project was tested manually against the following checklist.

**Authentication**
- Register a normal user → succeeds, role is always `USER`.
- Login with correct/incorrect password.
- Duplicate email registration is rejected (`409`).
- Accessing a protected route without a token returns `401`.

**Authorization — tasks & projects**
- Normal user → `GET /users` → `403`.
- Normal user creates a task in a project they own → succeeds, auto-assigned
  to themselves.
- Normal user creates a task in another user's project → `403`.
- Normal user → `PATCH /tasks/:id/assign` → `403` (admin only now).
- Normal user edits/deletes a task they didn't create → `403`.
- Admin creates a task without `assignedTo` → `400`.
- Admin reassigns any task, in any project → succeeds.
- Deleting a project that still has tasks → `400`; move/delete its tasks,
  then delete succeeds.
- A user assigned a task inside an admin-owned project can see that project
  in their project list, with a task count matching only what's visible to
  them (not the project's full total).

**Task attributes**
- Create/edit a task's priority; the board and admin table show a
  color-plus-icon-plus-text badge, never color alone.
- Set a due date before the start date → rejected with a clear message.
- Leave a due date blank, then clear an existing one → both persist as
  expected.
- A task due "today" is never shown as overdue regardless of the viewer's
  timezone.

**Search & statistics**
- Typing in the task search box debounces before issuing a request and
  narrows results to title/description matches within tasks the user can
  already see.
- `GET /tasks/statistics` as a normal user never includes `totalUsers`,
  `unassignedTasks`, or `byPriority` in the raw response.
- `GET /tasks/statistics` as an admin includes all of the above, system-wide.

**Persistence**
- Drag a task `TODO → DOING`, refresh the page, confirm it stayed in `DOING`.
- Drag `DOING → DONE`, refresh again, confirm it stayed in `DONE`.


## 13. Deployment Information

Suggested (and used) deployment path:

Next.js frontend  → Vercel
Express backend   → Render or Railway
MongoDB           → MongoDB Atlas

Backend production environment variables:

NODE_ENV=production
MONGODB_URI=<your Atlas connection string>
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=1d
CLIENT_URL=https://<your-frontend-domain>

Frontend production environment variable:

NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api

Before final submission, verify in production: CORS, login, admin login,
project/task creation, task loading, drag-and-drop persistence, admin
assignment, and (if migrating an existing database) that
`migrate:tasks-to-projects` has been run.

> **Deployed URLs and credentials for this submission are in `submission.txt`.**


## 14. Screenshots

Screenshots live in `docs/screenshots/` and are referenced here once added:

1. `login.png` — Login page
2. `register.png` — Registration page
3. `dashboard.png` — Dashboard with the project sidebar and board
4. `board-columns.png` — TODO / DOING / DONE columns
5. `create-task.png` — Create task modal (project, priority, due date)
6. `drag-drop.png` — Task moved to another column
7. `projects.png` — Project list / management page
8. `summary.png` — Statistics panel (normal user view)
9. `admin-dashboard.png` — Admin dashboard (Project Summary tab)
10. `admin-users.png` — User management tab (edit / reset password / delete)
11. `admin-assignment.png` — Task assignment/reassignment table


## 15. Known Limitations

- No project membership/sharing — visibility is ownership plus task-level
  spillover only (Section 6); there's no way to explicitly share a project
  with a collaborator who has no task in it.
- No password-reset or email-verification flow for self-service users (an
  admin can reset a normal user's password; users can't reset their own).
- No pagination on the task/user/project lists.
- No automated test suite.
- Drag-and-drop reordering *within* a column is not implemented; only
  cross-column status changes are supported.
