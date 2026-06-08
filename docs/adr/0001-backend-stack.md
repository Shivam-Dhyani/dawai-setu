# ADR-0001: Backend stack — NestJS, Prisma, PostgreSQL, Redis + BullMQ

**Status**: Accepted
**Date**: 2026-06-08

## Context

`docs/PRD.md` describes a backend that must:

- enforce a **data-driven RBAC model** with a permission check on every
  route, and support adding new roles later without code changes (§6)
- run **transactional, row-locked inventory moves** — accept-order,
  mark-ready-to-use, dispense — with "no negative stock" and safe
  concurrent acceptance of the same sub-order (§15)
- model a heavily **relational domain**: Users → Roles/Permissions,
  Orders → SubOrders → LineItems → Batches, PatientCases →
  PatientCaseMedicines, with foreign-key integrity throughout (§13)
- compute **server-side dashboard aggregations** across
  day/week/month/quarter/year (§10.3, §11.3)
- support **OTP with expiry** and **async notification digests** for
  near-expiry/expired alerts (§14)
- serve **two separate frontends from one shared backend** (§5)

## Decision

We will build the backend with **NestJS + TypeScript**, **Prisma** as the
ORM, **PostgreSQL** as the database, and **Redis + BullMQ** for
caching/OTP storage and async job processing.

## Alternatives considered

- **Django + DRF + PostgreSQL + Celery/Redis (Python)** — an equally
  credible choice; Django's permission framework and ORM transactions cover
  the same domain needs, and Celery covers the async digest jobs. We didn't
  pick it because it forfeits **end-to-end TypeScript types** between the
  shared backend and two separate React frontends — and given how much the
  PRD's two portals deliberately overlap (auth, profile, geography,
  medicine master data, money display), that shared-type story removes a
  whole class of integration bugs that would otherwise need hand-written
  contracts or contract tests to catch.
- **Express/Fastify (unopinionated Node)** — would work, but we'd end up
  hand-rolling the module/guard/DI structure NestJS provides out of the
  box — and that structure maps unusually well onto the PRD's own
  module-based RBAC matrix (§6.3). Reinventing it would be pure cost with
  no corresponding benefit.
- **MongoDB / a document store** — rejected outright. The domain is
  fundamentally relational and transactional (orders splitting into
  sub-orders, batches moving through state machines, FK-heavy RBAC), and a
  document store would fight every one of those requirements rather than
  support them.

## Consequences

- NestJS's `Guards` / `Interceptors` / `Modules` give us the
  permission-check and audit-logging machinery the PRD requires (§6, §15)
  without bespoke infrastructure, and the module boundaries mirror the
  PRD's module list directly — "where does this code live" stays trivial.
- Prisma's `$transaction` plus raw-query escape hatches give us the
  row-locking primitives the inventory/order state machines need
  (`SELECT ... FOR UPDATE`).
- PostgreSQL's relational integrity, transactions, and
  aggregate/window-function support cover the dashboard and state-machine
  requirements directly, with no workaround layer needed.
- Cost: the team needs to be comfortable in the Node/TypeScript ecosystem;
  if the team's core strength is Python, this decision should be
  revisited — the Django alternative above remains a credible fallback.
- BullMQ adds an operational dependency (Redis) beyond the database —
  justified by the PRD's explicit need for OTP-expiry and
  digest-notification infrastructure (§14), which request/response code
  alone serves poorly.
