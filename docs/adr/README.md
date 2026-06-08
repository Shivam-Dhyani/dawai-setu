# Architecture Decision Records

ADRs are short, numbered documents that each record **one** significant
architectural or technical decision — the *why*, not just the *what*.

Unlike `docs/PROGRESS_LOG.md` (a chronological journal of activity — "what
happened, in order"), an ADR is a **permanent reference for a single
decision** — written once, revisited rarely, and *superseded*, never
silently edited, when circumstances change.

## When to write one

Write an ADR when a decision would be expensive for a future contributor
(human or agent) to reverse-engineer from the code alone: choice of
framework/database/major library, a cross-cutting structural convention
(monorepo layout, component organization, cross-portal sharing strategy),
or deliberately rejecting a commonly-expected approach in favor of another.

Don't write one for routine implementation choices that the code and
`CLAUDE.md` already make obvious — that's noise, and noise is what makes
people stop reading ADRs.

## Format

Copy [`template.md`](template.md), number it sequentially
(`000N-short-title.md`), and fill in **Context / Decision / Alternatives
considered / Consequences**. "Alternatives considered" is usually what
future readers value most — it pre-answers "did we think about X?" and
prevents a decision from being relitigated for the same reasons it was
already rejected.

## Changing a decision

Don't edit an Accepted ADR's decision after the fact. Write a new ADR, and
set the old one's status to `Superseded by ADR-000N`. The history of *why
we changed our minds* is as valuable as the original reasoning — deleting
it just guarantees the next person reopens the same debate from scratch.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-backend-stack.md) | Backend stack — NestJS, Prisma, PostgreSQL, Redis + BullMQ | Accepted |
| [0002](0002-frontend-stack-and-monorepo.md) | Frontend stack and monorepo — React, TypeScript, Vite, Turborepo | Accepted |
| [0003](0003-cross-portal-component-sharing.md) | Cross-portal component sharing — three-tier model | Accepted |
| [0004](0004-component-organization-not-atomic-design.md) | Component organization within `packages/ui` — primitives/patterns, not Atomic Design | Accepted |
