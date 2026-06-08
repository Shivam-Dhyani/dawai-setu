# ADR-0003: Cross-portal component sharing — three-tier model

**Status**: Accepted
**Date**: 2026-06-08

## Context

The PRD doesn't just *happen* to describe similar screens in both
portals — it explicitly frames one as a mirror of the other (e.g. §11.1:
"pharmacy signup is the doctor signup minus Specialization, plus Pharmacy
Name"). Left unmanaged, two portal codebases evolving independently will
duplicate these mirrored modules, and the duplicates will silently drift
apart the first time someone fixes a validation bug or tweaks a field in
only one copy.

## Decision

We will use a **three-tier model** to decide where a frontend component or
hook belongs:

1. **`packages/ui`** — pure presentational primitives with no domain
   knowledge (could ship in any product's design system).
2. **`packages/domain-ui`** — DawaiSetu-aware components/hooks that the
   **PRD specifies identically for both portals**: `<StateCityPicker>`,
   `<MoneyDisplay>` + the PRD §12 cost-calculation utilities,
   `<StatusBadge>`, `<PeriodFilter>`, the OTP-input and password-reset flow
   shells, and a shared signup/profile form shell.
3. **Portal-local `features/`** — anything the PRD scopes to a single
   role: Request Medicine Stock cart, My Orders accept/reject, Patient Case
   consultation form, Manage Default Rx.

For "mostly the same, not identical" cases (the canonical example being
signup), we use **composition over duplication**: one shared form shell in
`packages/domain-ui` driven by a role-specific field config/slot, rather
than two near-copies that drift the moment someone edits only one.

## Alternatives considered

- **Duplicate everything per portal** — rejected; this is precisely the
  drift failure mode described above, and the PRD's own "mirroring"
  language signals the spec author expects these to stay in sync.
- **Share everything that looks similar today** — rejected; some PRD
  modules only *coincidentally* look alike right now (e.g. the cart UI and
  the accept/reject UI both involve lists of medicines with quantities)
  but are scoped to a single role and will diverge as each role's workflow
  matures. Forcing them into a shared abstraction now creates a
  straitjacket later.
- **One shared "components" package with no internal tiering** — rejected;
  without the primitives / domain-ui / portal-local distinction, "should
  this be shared?" becomes a fresh judgment call every time, and
  inconsistent judgment calls compound across a team into exactly the kind
  of drift this decision exists to prevent.

## Consequences

- A clear, repeatable answer to "where does this component go" — see
  `CLAUDE.md` §"Sharing components between the two portals" for the full
  decision rule.
- The `portal-consistency-auditor` agent exists specifically to audit this
  boundary on an ongoing basis — flagging both under-sharing (duplicated
  mirrored modules) and over-sharing (portal-scoped features forced into a
  shared package).
- Cost: requires occasional judgment at the boundary ("is this still 'the
  same' across portals, or has it diverged enough to localize?"). We
  accept this as cheaper than either extreme — duplicate-everything or
  share-everything — would be over the project's lifetime.
