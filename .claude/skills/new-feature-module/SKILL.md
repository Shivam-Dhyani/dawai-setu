---
name: new-feature-module
description: Scaffold a new end-to-end feature module (NestJS backend module + matching React frontend feature folder + shared types) following DawaiSetu's established conventions. Use when adding a new module from the PRD's module list (e.g. a future module beyond the current scope) or splitting an existing one.
---

# New Feature Module

Scaffolds a feature consistently across the stack so it looks and feels like
every other module in DawaiSetu — see `CLAUDE.md` for the philosophy
(clean, modular, comments explain "why" not "what").

## When to use

The user wants to add a new feature module — something that needs its own
API routes, its own DB entities or queries, and its own UI screens. Examples
from the PRD: Patient Cases, Request Medicine Stock, Near-Expiry Stock.

## Steps

1. **Clarify scope before writing anything.** Ask (or infer from context):
   - Module name and which role(s) can access it (cross-check PRD §6.3 — this
     determines the guard's permission check, not a hardcoded role string).
   - Which entities it reads/writes (cross-reference PRD §13's data model —
     don't invent new entities if an existing one covers the need).
   - Whether it participates in the inventory or order state machines (if
     yes, route the relevant logic through the existing state-machine
     services rather than duplicating transition logic).

2. **Backend** — create `apps/backend/src/<module-name>/`:
   - `<module-name>.module.ts` — registers controller + service, imports
     `PrismaModule` and the permission guard
   - `<module-name>.controller.ts` — thin: validate via DTO → call service →
     return. Decorate every route with the permission guard
     (`@RequirePermission(module, action)` or equivalent — resolved against
     `role_permissions` at request time, never `if (role === ...)`)
   - `<module-name>.service.ts` — business logic; wrap any read-then-write
     sequence touching inventory/orders in a Prisma transaction with row
     locking
   - `dto/` — `class-validator`-annotated request/response DTOs
   - `<module-name>.service.spec.ts` — unit tests for the service, especially
     edge cases (insufficient stock, wrong state, wrong role)

3. **Frontend** — create `apps/<portal>/src/features/<module-name>/`:
   - `api/` — TanStack Query hooks (`use<Thing>Query`, `use<Thing>Mutation`)
     calling the typed client from `packages/api-types`
   - `components/` — presentational pieces, built from `packages/ui`
     primitives and (where the PRD describes the same component for both
     portals — geography pickers, money display, status badges, period
     filters) `packages/domain-ui` — see `CLAUDE.md`'s "Sharing components
     between the two portals". Don't duplicate something that belongs there;
     equally, don't push something into `packages/domain-ui` just because it
     looks similar today if the PRD scopes it to one role only
   - `pages/` — route-level components wired into the router
   - Co-locate `*.test.tsx` files

4. **Shared types** — if the module introduces new request/response shapes,
   regenerate `packages/api-types` from the backend's OpenAPI spec rather
   than hand-writing duplicate interfaces.

5. **Wire up RBAC** — add/confirm the `(role, module, action)` rows the new
   routes need exist in the permissions seed data. Never ship a guarded route
   whose permission row doesn't exist yet (it would be unreachable by design,
   which is safe, but should be intentional and documented in the PR).

6. **Verify** — run the backend unit tests and the relevant frontend tests;
   for anything touching state machines or RBAC, mention to the user that
   the `state-machine-guardian` / `rbac-auditor` agents are available for a
   focused review before merging.

## Output

A short summary of what was created (paths only — the diff speaks for
itself), and a note on anything the user needs to decide (permission rows to
seed, entity additions to the Prisma schema, etc.).
