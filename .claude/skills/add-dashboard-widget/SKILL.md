---
name: add-dashboard-widget
description: Scaffold a dashboard card+chart widget with the day/week/month/quarter/year period filter pattern shared by both portals' dashboards (PRD §10.3, §11.3), using Recharts + TanStack Query. Use when adding or adjusting a dashboard metric.
---

# Add Dashboard Widget

Both portal dashboards follow the same shape per the PRD: role-scoped cards
and charts, each filterable by **day / week / month / quarter / year**
(§10.3 for Hospital, §11.3 for Pharmacy — note the dashboards add a
**quarter** option that the Patient Case List filter does not have; don't
copy the wrong filter set from `add-data-list-view`).

## When to use

The user wants to add or change a dashboard metric — a count card (e.g.
"Total Medicines", "Total Patients", "Total Expired Medicines", "Total
Orders") or its accompanying chart.

## Steps

1. **Confirm the metric is role-scoped correctly.** Per `CLAUDE.md` and PRD
   §10.3/§11.3: a Doctor sees patient/prescribing metrics, a Pharmacist sees
   inventory/expiry/order metrics, a Pharmacy operator sees its own
   inventory/order/expiry metrics. Don't surface a metric to a role that
   shouldn't see it — cross-check against the module access matrix (§6.3)
   the same way `rbac-auditor` would on the backend side.

2. **Backend aggregation first.** Per `CLAUDE.md`'s NFR note, "dashboards
   aggregate server-side" — the widget must consume a pre-aggregated
   endpoint (grouped by the requested period), not fetch raw rows and
   group them in the browser. If the aggregation endpoint doesn't exist yet,
   say so explicitly rather than working around it client-side.

3. **Scaffold**:
   - `api/use<Metric>Query.ts` — TanStack Query hook taking a `period`
     param (`day | week | month | quarter | year`)
   - `components/<Metric>Card.tsx` — the count/summary card, using the
     shared card shell from `packages/ui`
   - `components/<Metric>Chart.tsx` — a Recharts component (bar/line per
     what best communicates a time-series count — match what's already used
     for similar metrics rather than introducing a new chart type per
     widget)
   - Wire both to the shared `<PeriodFilter>` so switching the period
     re-queries rather than re-slicing cached data

4. **Empty/loading/error states** — every widget needs all three; a
   dashboard with five cards silently failing one query should show that one
   card's error, not blank space or a crash.

## Output

Summary of the widget added, which role(s) see it (and why, per §6.3), the
backend aggregation endpoint it depends on, and confirmation that period
filtering is server-driven rather than client-side slicing.
