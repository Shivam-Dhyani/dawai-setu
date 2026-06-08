---
name: add-data-list-view
description: Scaffold a paginated data list screen — flat or nested/expandable (medicine → batch rows) — using TanStack Table + TanStack Query, matching the recurring list pattern across DawaiSetu's modules (Orders, Inventory, Near-Expiry, Expired, Patient Cases, My Orders). Use when adding any "browse/filter a list of records" screen.
---

# Add Data List View

The PRD describes the *same* list-screen shape over and over — a paginated,
sometimes filterable, sometimes nested table — across both portals:
Patient Case List (§10.4), Track Inventory (§10.7), Near-Expiry / Expired
Stock (§10.9–10.10, §11.6–11.7), My Orders (§11.4). Building each from
scratch invites inconsistency; this skill scaffolds the shared shape.

## When to use

The user wants to add a screen that lists records from an API with any of:
pagination, column-based display, status badges, row actions (e.g.
"Mark Ready-to-Use", "Reorder", "Accept/Reject"), date-range filters
(Day/Week/Month/Year), or **expandable nested rows** (medicine row expands to
show its batch breakdown — Batch Number, Expiry Date, Quantity).

## Steps

1. **Identify the shape from the PRD spec for that screen** — read the
   relevant subsection of `docs/PRD.md` (§10.x / §11.x) for the exact column
   list, actions, and whether it's flat or nested. Don't guess columns; the
   PRD specifies them per screen.

2. **Flat list** (e.g. My Orders, Patient Case List):
   - `api/use<Thing>ListQuery.ts` — TanStack Query hook wrapping the typed
     list endpoint, accepting pagination + filter params
   - `components/<Thing>Table.tsx` — `@tanstack/react-table` column
     definitions matching the PRD's column spec; status values render via a
     shared `<StatusBadge>` from `packages/ui` (don't invent a new badge
     style per screen)
   - Row actions call mutation hooks that invalidate the list query on
     success — never mutate local state and hope it matches the server

3. **Nested/expandable list** (e.g. Near-Expiry, Expired, Track Inventory):
   - Same query/table setup, plus an `expanded` row renderer showing the
     batch sub-table (Batch Number, Expiry Date, Quantity, [Price per unit
     for pharmacy inventory per §11.5])
   - Keep the parent-row aggregate (e.g. "Near-Expiry Quantity") and the
     per-batch breakdown derived from one query response — don't issue a
     second request per expanded row unless the API genuinely requires it

4. **Date-range filters** (Day/Week/Month/Year — §10.4, and Day/Week/Month/
   Quarter/Year on dashboards): use a shared `<PeriodFilter>` component and
   pass the selected period as a query param; default to the value the PRD
   specifies for that screen (e.g. Patient Case List defaults to Day).

5. **Pagination**: server-side, per `CLAUDE.md`'s NFR note that list
   endpoints are paginated — don't fetch-all-and-slice client-side.

## Output

Summary of files created/modified, the columns implemented (cross-checked
against the PRD subsection), and a note on any action (Accept/Reject,
Mark Ready-to-Use, Reorder) that needs its mutation hook wired to a specific
backend endpoint.
