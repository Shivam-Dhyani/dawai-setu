# DawaiSetu — Project Memory

DawaiSetu is a medicine supply-chain platform connecting hospitals with
external pharmacies. Full functional spec lives in `docs/PRD.md` — read it
before making domain-level decisions; this file covers *how we build*, not
*what we build*.

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
  ui/                   # shared component kit (shadcn/ui based)
  api-types/            # generated from backend OpenAPI spec
  config/               # shared eslint/tsconfig/tailwind config
docs/
  PRD.md
```

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
