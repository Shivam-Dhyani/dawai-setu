# DawaiSetu — Progress Log

> **Read this first** when picking up work on this project — the "Current
> State" summary plus the recent entries below give full situational
> awareness in a single read. Detailed history beyond the recent window
> lives in `docs/logs/YYYY-MM.md` (read on demand only — see `docs/logs/README.md`).
>
> Append a terse entry as the **last step** of any task that changes code or
> records a decision. Use the `log-progress` skill — it knows the format and
> handles rotation so this file stays small and worth reading.

## Current State

- **Stack chosen and scaffolded**: NestJS + Prisma + PostgreSQL + Redis/BullMQ
  backend; React + TypeScript + Vite frontend (two apps: `hospital-portal`,
  `pharmacy-portal`) in a Turborepo monorepo sharing `packages/ui`,
  `packages/domain-ui`, `packages/api-types`.
- **Backend fully scaffolded**: Prisma schema, all 11 feature modules written
  (`geography`, `medicines`, `inventory`, `orders`, `pharmacy-orders`,
  `patient-cases`, `default-rx`, `profile`, `dashboard`, `roles`,
  `notifications`), plus `auth` (JWT, OTP, password reset), common guards
  (`JwtAuthGuard`, `PermissionsGuard`), decorators, and interceptors. Prisma
  client not yet generated — run `pnpm db:migrate` before first boot.
- **Domain invariants enforced in code**: inventory NEAR_EXPIRY/EXPIRED derived
  at query time (never stored); all stock mutations in `$transaction` with
  atomic `updateMany` decrement; PRD §12 cost formula (medicine_cost +
  consultation_fee + tax) computed in `patient-cases` service from
  `TAX_RATE_PERCENT` env.
- **RBAC**: data-driven via `role_permissions` rows; no hardcoded role-name
  checks anywhere; `PermissionsGuard` queries DB at request time.
- **Repo/agentic setup**: `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `docs/PRD.md`,
  `docs/adr/` (4 ADRs), 4 review agents, 5+ workflow skills — all in place.
- **Not started**: frontend apps, `packages/ui`/`domain-ui`, Prisma seed,
  BullMQ job workers, email/OTP transport wiring.

## Recent entries

### 2026-06-09 — All backend feature modules scaffolded
Done:
- Created `orders`, `pharmacy-orders`, `patient-cases`, `default-rx`,
  `profile`, `dashboard`, `roles`, `notifications` (module + controller +
  service + dto/ each); `geography`, `medicines`, `inventory` were pre-built
- `pharmacy-orders` accept: single `$transaction` with atomic `updateMany`
  check-and-decrement across FIFO pharmacy batches + hospital batch creation
- `patient-cases` create: FIFO `$transaction` dispense across READY_TO_USE
  batches + PRD §12 cost formula (`TAX_RATE_PERCENT` env)
- `dashboard`: doctor vs pharmacist branch resolved by querying
  `role_permissions` at runtime — no hardcoded role names
- Notifications created on sub-order accept/reject
Decided (why): dashboard role-branch via DB permission query (not
`role === 'DOCTOR'`) — consistent with PRD §6's data-driven RBAC rule;
avoids a code change if roles are renamed or split later.
Next: generate Prisma client (`pnpm db:migrate`), seed roles/permissions,
scaffold frontend apps
Status: done

### 2026-06-08 — README, CONTRIBUTING, and ADRs
Done:
- Added `README.md` (repo entry point: stack summary, status, doc map) and
  `CONTRIBUTING.md` (branching, Conventional Commits, PR/review
  expectations, definition-of-done incl. running audit agents + logging)
- Added `docs/adr/` with a template, an index `README.md`, and four ADRs:
  0001 backend stack, 0002 frontend stack & monorepo, 0003 cross-portal
  component sharing, 0004 component organization (primitives/patterns)
- Pointed `CLAUDE.md` §"Picking up work" at `docs/adr/`
Decided (why): formalized reasoning that was previously scattered as prose
across `CLAUDE.md` sections and chat into permanent, numbered ADR records
(Context/Decision/Alternatives/Consequences) — that reasoning would
otherwise be expensive for a future contributor to reconstruct, or worse,
get silently re-litigated from scratch.
Status: done

### 2026-06-08 — Logging system for agent context continuity
Done:
- Added hybrid log model: `docs/PROGRESS_LOG.md` (rolling summary + recent
  entries) + `docs/logs/YYYY-MM.md` (monthly archives, read on demand)
- Added `log-progress` skill to append entries and rotate the log
Decided (why): hybrid over a single ever-growing file or a pure date-keyed
folder — keeps the default read cost roughly constant regardless of project
age (a single file grows unbounded; a pure date-folder forces the reader to
guess which files matter).
Next: scaffold monorepo skeleton + initial Prisma schema (PRD §13)
Status: done

### 2026-06-08 — Component organization: primitives/patterns over Atomic Design
Done:
- Added "Component organization" section to `CLAUDE.md`: flat
  `primitives/`/`patterns/` split inside `packages/ui` plus a top-to-bottom
  component-placement decision rule
- Aligned `portal-consistency-auditor`, `add-data-list-view`,
  `add-dashboard-widget` to route generic composites (DataTable, card
  shells, dialogs) through `packages/ui/patterns`
Decided (why): rejected full Atomic Design (atoms/molecules/organisms/
templates/pages) — it organizes by abstraction level, which fights this
project's feature-module philosophy and invites endless "is this a molecule
or organism?" debates.
Status: done

### 2026-06-08 — Cross-portal component sharing strategy
Done:
- Added "Sharing components between the two portals" section to `CLAUDE.md`:
  3-tier model (`packages/ui` → `packages/domain-ui` → portal-local
  `features/`) plus composition-over-duplication guidance for near-identical
  forms (e.g. signup: Doctor adds Specialization, Pharmacy swaps in
  Pharmacy Name)
- Updated `portal-consistency-auditor`, `money-display-auditor`,
  `new-feature-module` to consistently point shared-shape modules at
  `packages/domain-ui`
Decided (why): the PRD describes auth/profile/geography/money-display/
status-vocab identically across both portals — sharing them prevents the
two portals from silently drifting apart; portal-scoped features (cart,
dispensing, prescriptions) stay local so sharing doesn't become a
straitjacket as they diverge.
Status: done

### 2026-06-08 — Frontend agents and skills
Done:
- Added `portal-consistency-auditor` (flags duplicated shared-shape modules
  and divergence between the two portals) and `money-display-auditor`
  (verifies PRD §12 money formulas, single source of truth, no payment-
  gateway/PDF scope creep) agents
- Added `add-data-list-view` and `add-dashboard-widget` skills to scaffold
  the recurring list-screen and dashboard-widget shapes from the PRD
Decided (why): targeted the two highest-risk frontend areas specific to
this PRD — drift between hospital-portal/pharmacy-portal, and correctness
of the display-only money calculations — rather than generic React agents.
Status: done

### 2026-06-08 — Stack analysis, .claude agentic setup, PRD into repo
Done:
- Analyzed the PRD and recommended the stack: NestJS + Prisma + PostgreSQL +
  Redis/BullMQ backend; React + TS + Vite + TanStack Query monorepo frontend
  with shadcn/ui, Turborepo
- Created `CLAUDE.md` (philosophy, conventions, domain rules), copied the
  PRD into `docs/PRD.md`
- Built the first two domain-aware agents (`state-machine-guardian`,
  `rbac-auditor`) and skills (`new-feature-module`, `db-schema-change`)
Decided (why):
- NestJS over Django: end-to-end TypeScript types shared across 2 frontends
  + 1 backend remove a class of integration bugs, and Nest's Guards/Modules
  map directly onto the PRD's module-based RBAC matrix (§6.3)
- PostgreSQL over NoSQL: the domain is heavily relational and transactional
  (Orders → SubOrders → LineItems → Batches), needs row locking, FK
  integrity, and aggregate queries for dashboards — Postgres is the natural
  fit, a document store would fight the domain
Status: done
