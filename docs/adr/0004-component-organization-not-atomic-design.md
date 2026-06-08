# ADR-0004: Component organization within `packages/ui` — primitives/patterns, not Atomic Design

**Status**: Accepted
**Date**: 2026-06-08

## Context

`packages/ui` needed an internal organizing scheme. Atomic Design (atoms /
molecules / organisms / templates / pages) is the most commonly
reached-for taxonomy for component libraries, and was the initial
direction considered.

## Decision

We will use a **flat, two-tier split** inside `packages/ui`:

- **`primitives/`** — the shadcn/ui-based building blocks (`Button`,
  `Input`, `Card`, `Badge`, `Modal`, `Toast`); pure, no composition of
  other components, no domain knowledge.
- **`patterns/`** — generic composites *built from* primitives that still
  carry zero domain knowledge (`DataTable`, `ConfirmDialog`,
  `FormFieldGroup`, `EmptyState`).

Combined with the tiers established in ADR-0003 (`packages/domain-ui`,
portal-local `features/`), this produces one **top-to-bottom placement
rule**: could it exist in an unrelated product's design system and
composes nothing else → `primitives`; same, but composed from primitives →
`patterns`; does the PRD describe it identically in both portals →
`domain-ui`; otherwise → feature-local.

## Alternatives considered

- **Full Atomic Design taxonomy (atoms/molecules/organisms/templates/
  pages)** — rejected. In practice the boundaries between these tiers are
  subjective — "is `<OrderTable>` an organism or a template? Is
  `<StateCityPicker>` a molecule or an organism?" — and teams spend real
  time on these debates instead of shipping. More fundamentally, it
  organizes components by *abstraction level* rather than by *domain*,
  which directly fights this project's stated philosophy of "one feature =
  one module, end to end" (`CLAUDE.md` §"Core philosophy"): a strict
  Atomic Design layout would scatter `OrderTable`, `OrderCard`, and
  `OrderStatusBadge` across three different complexity-tiered folders
  instead of keeping order-related UI together.
- **No internal organization at all (flat `components/`)** — rejected; at
  the scale this project will reach (two portals' worth of shared UI), an
  undifferentiated flat folder makes "is this safe to reuse, or does it
  carry hidden assumptions?" an expensive question to answer by reading
  source every time.

## Consequences

- We get the genuine benefit people reach for Atomic Design for — a clear
  primitive → composite → screen hierarchy and predictable reuse — without
  forcing a five-level taxonomy onto a codebase that's organized by domain
  everywhere else.
- The placement rule is short enough to state in one paragraph and apply
  mechanically, which keeps "where does this go" from becoming a
  recurring debate.
- This also matches how shadcn/ui itself ships (flat `components/ui/`) —
  we're going with the grain of the ecosystem rather than against it.
