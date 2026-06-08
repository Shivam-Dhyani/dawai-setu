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

- **Stack chosen** (not yet scaffolded): NestJS + Prisma + PostgreSQL +
  Redis/BullMQ backend; React + TypeScript + Vite frontend, two apps
  (`hospital-portal`, `pharmacy-portal`) in a Turborepo monorepo sharing
  `packages/ui`, `packages/domain-ui`, `packages/api-types`.
- **Repo bootstrap done**: `CLAUDE.md` (conventions + domain rules + sharing
  strategy), `docs/PRD.md` (full spec). **No application code exists yet.**
- **`.claude/` agentic dev setup in place**: 4 read-only review agents
  (`state-machine-guardian`, `rbac-auditor`, `portal-consistency-auditor`,
  `money-display-auditor`) and 5 workflow skills (`new-feature-module`,
  `db-schema-change`, `add-data-list-view`, `add-dashboard-widget`,
  `log-progress`).
- **Frontend architecture decided**: 3-tier component sharing
  (`packages/ui` primitives/patterns → `packages/domain-ui` →
  portal-local `features/`); explicitly rejected full Atomic Design for a
  flatter primitives/patterns split — see `CLAUDE.md` §"Sharing components
  between the two portals" and §"Component organization".
- **Not started**: any actual application code — monorepo skeleton, backend
  modules, frontend apps, Prisma schema, auth, etc.

## Recent entries

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
