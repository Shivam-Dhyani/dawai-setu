# DawaiSetu — Project Memory

DawaiSetu is a medicine supply-chain platform connecting hospitals with
external pharmacies. Full functional spec lives in `docs/PRD.md` — read it
before making domain-level decisions; this file covers *how we build*, not
*what we build*.

## Picking up work

Before starting any non-trivial task, read `docs/PROGRESS_LOG.md` — its
"Current State" summary and recent entries give you, in one read, what's
been built and decided so far (and why), so you don't burn tokens
re-deriving it from the codebase or re-litigating settled decisions. As the
**last step** of any task that changes code or records a decision, use the
`log-progress` skill to append an entry — it knows the format and keeps the
log bounded so it stays worth reading for the life of the project.

## Core philosophy

1. **Clean & modular** — one feature = one module, end to end (backend module
   ↔ frontend feature folder ↔ shared types). No cross-feature reach-arounds.
   Small, single-responsibility services/hooks/components over multi-purpose
   ones.
2. **Readable through naming first, comments second** — names and structure
   carry the "what." Comments exist only to carry the "why": invariants,
   non-obvious domain rules, the reason a lock/transaction/edge-case exists.
   Never write a comment that just restates the line below it.
3. **No premature abstraction** — three similar lines beat a speculative
   helper. Don't build for hypothetical phase-3 requirements.
4. **Trust internal boundaries** — validate at system edges (DTOs at the API
   boundary, form schemas at the UI boundary). Don't re-validate internal
   data that's already guaranteed by the type system or DB constraints.

## Tech stack

- **Backend:** NestJS + TypeScript, Prisma ORM, PostgreSQL, Redis + BullMQ
- **Frontend:** React + TypeScript + Vite, two apps (`hospital-portal`,
  `pharmacy-portal`) sharing a UI kit and generated API types
- **Monorepo:** Turborepo
- See git history / PR discussion for the full library list and rationale.

## Repository layout (target)

```
apps/
  hospital-portal/      # Doctor + Pharmacist roles
  pharmacy-portal/      # Pharmacy operator role
  backend/              # shared NestJS API
packages/
  ui/                   # zero-domain-knowledge component kit (shadcn/ui based)
    primitives/         #   Button, Input, Card, Badge, Modal, Toast
    patterns/           #   DataTable, ConfirmDialog, FormFieldGroup, EmptyState
                        #   (generic composites built FROM primitives — see
                        #   "Component organization" below)
  domain-ui/            # shared DawaiSetu-aware components + hooks that the
                        # PRD describes identically in both portals — see
                        # "Sharing components between the two portals" below.
  api-types/            # generated from backend OpenAPI spec
  config/               # shared eslint/tsconfig/tailwind config
docs/
  PRD.md
```

## Sharing components between the two portals

Hospital Portal and Pharmacy Portal are separate apps but the PRD describes
large parts of them — auth, profile, geography, money display, status
vocabulary, dashboards — as deliberately mirroring each other (e.g. §11.1's
pharmacy signup is the doctor signup "minus Specialization, plus Pharmacy
Name"). Use this three-tier model to decide where something belongs:

1. **`packages/ui`** — pure presentational primitives with no domain
   knowledge. If it could be reused by a completely unrelated product,
   it belongs here.
2. **`packages/domain-ui`** — components and hooks that *are* DawaiSetu-aware
   but the PRD specifies identically for both portals:
   `<StateCityPicker>` + `useStatesQuery`/`useCitiesQuery` (signup + profile,
   both portals), `<MoneyDisplay>` + the cost-calculation utilities backing
   PRD §12 (the single source of truth `money-display-auditor` checks
   against), `<StatusBadge>` (order/inventory status → label/color),
   `<PeriodFilter>` (day/week/month/[quarter]/year), the OTP-input and
   password-reset flow shells.
3. **Portal-local `features/`** — anything the PRD scopes to one role:
   Request Medicine Stock cart, My Orders accept/reject, Patient Case
   consultation form, Manage Default Rx. Do not pre-share these just because
   they look similar today — a shared abstraction here becomes a
   straitjacket as the two diverge.

**Composition over duplication for "mostly the same, not identical" forms.**
Signup is the canonical example: build *one* shared form shell in
`packages/domain-ui` driven by a role-specific field config/slot (Doctor adds
Specialization; Pharmacy swaps in Pharmacy Name), rather than two near-copies
that silently drift apart the moment someone tweaks validation in only one.

**Drift is the real risk, not under-sharing.** The failure mode is sharing a
component once and then letting one portal's copy evolve while the other
doesn't. The `portal-consistency-auditor` agent exists specifically to catch
this — run it after any change to a shared-shape module.

## Component organization (within `packages/ui`)

We deliberately **do not use the full Atomic Design taxonomy** (atoms /
molecules / organisms / templates / pages). It organizes components by
*abstraction level* rather than by *domain*, which fights this project's
core philosophy of "one feature = one module, end to end" — in practice it
produces endless "is this a molecule or an organism?" debates and scatters
domain-related components across complexity-tiered folders instead of
keeping them together by feature. Use this flatter, two-tier split instead:

- **`packages/ui/primitives/`** — the shadcn/ui-based building blocks
  (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Toast`). Pure, no
  composition of other components, no domain knowledge.
- **`packages/ui/patterns/`** — generic composites *built from* primitives
  that still carry zero domain knowledge (`DataTable`, `ConfirmDialog`,
  `FormFieldGroup`, `EmptyState`). They could ship in a component library
  for an unrelated product.

**Decision rule** for "where does this component go" (apply top to bottom,
stop at the first match):
1. Could it exist in a design system for a completely unrelated product, and
   composes nothing else? → `packages/ui/primitives`
2. Same as above, but composed from other primitives? → `packages/ui/patterns`
3. Does the PRD describe it identically in both portals (see "Sharing
   components" above)? → `packages/domain-ui`
4. Otherwise → portal-local `features/<feature>/components`

This gets you the genuine benefit people reach for Atomic Design for —
a clear primitive → composite → screen hierarchy and consistent reuse —
without forcing a five-level taxonomy onto a codebase that's organized by
domain module everywhere else.

## Domain rules an agent must never violate

These come straight from the PRD and are load-bearing — breaking them breaks
the product, not just a test:

- **Inventory state machine** (PRD §8): batches only move
  `RECEIVED_PENDING → READY_TO_USE → (NEAR_EXPIRY | EXPIRED)`. Only
  `READY_TO_USE` + non-expired stock is prescribable/dispensable. Near-expiry
  and expired are *derived* from `expiry_date`, never stored as a terminal
  transition that overwrites readiness.
- **Order lifecycle** (PRD §9): `PENDING → ACCEPTED → COMPLETED` or
  `PENDING → REJECTED` (optionally `CANCELLED` while `PENDING`). Sub-orders
  are accepted/rejected **whole** — no partial fulfillment, ever.
- **Inventory moves are transactional** (PRD §15): accept-order,
  mark-ready-to-use, and dispense must run inside a DB transaction with row
  locking. Stock must never go negative. Concurrent acceptance of the same
  sub-order must be handled safely.
- **RBAC is data-driven** (PRD §6): permissions come from `role_permissions`
  rows, not `if (role === 'doctor')` checks scattered in code. Every
  controller route is guarded by the role→module/action check.

## Module structure convention (backend)

Each feature module (e.g. `orders`, `inventory`, `patient-cases`) contains:
`*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `guards or
decorators it needs`. Business/domain logic lives in the service layer —
controllers stay thin (validate → delegate → respond).

## Module structure convention (frontend)

Each feature folder (e.g. `features/orders`) contains: `api/` (typed query
hooks via TanStack Query), `components/`, `pages/`, and co-located tests.
Server state goes through React Query; client-only state (cart, session)
through Zustand — don't mix the two.

## Commands

> Populate this section as the project is scaffolded — keep it accurate, an
> agent will run these verbatim.

```
pnpm install
pnpm dev            # run all apps
pnpm test           # run all test suites
pnpm lint           # lint + format check
pnpm db:migrate     # apply Prisma migrations
```

## Out of scope (do not build)

Payment gateway integration, PDF invoice generation, admin portal/UI, partial
order fulfillment, shipment/logistics tracking. Money figures are computed
and displayed only.
