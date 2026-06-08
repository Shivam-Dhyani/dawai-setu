# ADR-0002: Frontend stack and monorepo — React, TypeScript, Vite, Turborepo

**Status**: Accepted
**Date**: 2026-06-08

## Context

The PRD describes **two separate web frontends** — Hospital Portal (Doctor
+ Pharmacist roles) and Pharmacy Portal (Pharmacy operator role) — served
by one shared backend (§5). A large fraction of their functionality is
described identically or near-identically: auth, profile, geography
pickers, OTP flows, money/total display, status vocabulary, and dashboards
(§10, §11). Both need paginated data tables, multi-step forms with
multi-select fields, dashboards with charts filterable by time period, and
consistent computed-money displays (§12).

## Decision

We will build both portals as **React + TypeScript + Vite** apps, using
**TanStack Query** for server state and **Zustand** for client-only state
(cart, session/UI flags), **Tailwind CSS + shadcn/ui (Radix primitives)**
for components, **Recharts** for dashboard charts, and **react-hook-form +
zod** for forms — all inside a **Turborepo monorepo** that also houses the
backend and shared packages (`packages/ui`, `packages/domain-ui`,
`packages/api-types`, `packages/config`).

## Alternatives considered

- **Two independent repositories/apps** — rejected. Given how much the
  PRD's portals deliberately mirror each other, separate repos would
  either duplicate that shared surface (guaranteeing drift — exactly the
  failure mode `portal-consistency-auditor` exists to catch) or require a
  separately-versioned shared-component package, which is more operational
  overhead than a monorepo for a two-app project.
- **Next.js** — rejected. These are internal, authenticated B2B portals
  with no SEO requirement and no need for server-side rendering; Next's
  routing/SSR machinery would add complexity (build config, server
  runtime) without solving a problem we actually have. Vite's dev server
  and build are simpler and faster for this shape of app.
- **Redux Toolkit instead of Zustand** — both are reasonable; we chose
  Zustand for less boilerplate on the relatively small slice of genuinely
  client-only state (cart contents, session/UI flags). The bulk of "state"
  in this app is server state, which TanStack Query owns regardless of
  which client-state library sits beside it.

## Consequences

- Shared packages (`packages/ui`, `packages/domain-ui`,
  `packages/api-types`) mean a backend contract change or a
  shared-component fix propagates to both portals through the type system
  and the build graph — not through manual copy-paste-and-hope.
- Turborepo's task graph and caching keep `pnpm dev` / `pnpm test` /
  `pnpm lint` fast as the codebase grows across multiple apps and packages.
- Cost: monorepo tooling (workspace protocol, shared configs, build
  ordering) has a learning curve and requires discipline — see
  `CLAUDE.md` for the established conventions, and
  `portal-consistency-auditor` for the agent that polices the
  shared-vs-local boundary on an ongoing basis.
