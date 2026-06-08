---
name: db-schema-change
description: Safely change the Prisma schema and ship a migration for DawaiSetu's PostgreSQL database. Use whenever a task requires adding/modifying entities, columns, indexes, or relations — especially anything touching inventory batches, orders, or RBAC tables, where a careless migration can corrupt live state-machine data.
---

# Database Schema Change

DawaiSetu's data model (PRD `docs/PRD.md` §13) is the backbone of two state
machines and a cross-portal order pipeline. A bad migration here doesn't just
break a build — it can desync hospital and pharmacy inventories. Move
deliberately.

## Steps

1. **Locate the authoritative model first.** Read the relevant section of
   `docs/PRD.md` §13 and the existing `apps/backend/prisma/schema.prisma`
   before changing anything — confirm the entity/field doesn't already exist
   under a different name, and that the change doesn't contradict a
   documented invariant (e.g. `readiness_state` must remain one of the four
   defined enum values; don't loosen it to a free-text field).

2. **Prefer additive changes.** New optional column > renamed column > type
   change > dropped column, in that order of safety. If a destructive change
   (drop/rename/type-narrowing) is genuinely required, call it out explicitly
   to the user before writing the migration — this is the kind of change that
   needs a human sign-off, not a silent agent decision.

3. **Edit `schema.prisma`**, keeping naming consistent with existing models
   (snake_case columns via `@map`, PascalCase model names, explicit relation
   names where ambiguity is possible — e.g. `Order.created_by` vs.
   `SubOrder.pharmacy_id`).

4. **Generate the migration**: `pnpm --filter backend prisma migrate dev
   --name <descriptive_name>`. Use a name that describes the *domain* change
   ("add_sub_order_cancelled_status"), not the mechanical one
   ("update_schema").

5. **Update seed data** (`apps/backend/prisma/seed.ts`) if the change affects
   reference data — roles/permissions, medicine master data, states/cities.
   RBAC changes in particular must come with corresponding
   `role_permissions` seed rows, or the new functionality will be
   unreachable.

6. **Check Prisma Client usages.** Search for the model/field across
   `apps/backend/src` — a renamed or retyped field needs every call site
   updated, and TypeScript will catch most of these once the client is
   regenerated (`prisma generate` runs automatically with `migrate dev`).

7. **Verify**: run backend tests, and if the change touches inventory,
   orders, or RBAC tables, suggest the user run the `state-machine-guardian`
   or `rbac-auditor` agent against the resulting service-layer changes.

## Output

Summarize: what changed in the schema and why, the migration file name, any
seed data updated, and — critically — flag any destructive operation that
was applied so the user can verify it against their actual data before
deploying.
