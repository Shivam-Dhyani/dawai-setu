# Contributing to DawaiSetu

This doc covers the *mechanics* of contributing — branching, commits, PRs,
local setup, review expectations. For *what* we're building, read
[`docs/PRD.md`](docs/PRD.md); for *how* we build it (philosophy,
conventions, domain rules), read [`CLAUDE.md`](CLAUDE.md).

## Before you start

1. Read `docs/PROGRESS_LOG.md`'s "Current State" summary — know what exists
   and what's already been decided before you touch anything.
2. Skim [`docs/adr/`](docs/adr/) for the reasoning behind the architecture.
   If you think a recorded decision is wrong, propose a new ADR that
   supersedes it — don't silently work around it; that's how conventions
   rot.

## Branching

- Branch off `main`. Name branches `<type>/<short-description>` —
  e.g. `feat/order-accept-flow`, `fix/inventory-batch-locking`,
  `chore/update-eslint-config`.
- One feature/fix per branch. A branch that touches both the inventory
  state machine and an unrelated UI tweak is two branches.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):
`<type>(<scope>): <description>`.

- **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- **Scope**: the module/package touched — e.g. `orders`, `inventory`,
  `hospital-portal`, `domain-ui`
- Examples:
  - `feat(orders): add sub-order accept transaction with row locking`
  - `fix(inventory): prevent negative stock on concurrent dispense`
  - `docs(adr): record decision to use Prisma over TypeORM`

Put the *why* in the commit body when it isn't obvious from the diff —
same rule as code comments (see `CLAUDE.md` §"Core philosophy": comments
and commit bodies carry the "why," not a restatement of the "what").

## Pull requests

- The description states **what changed and why**, with links to the
  relevant PRD section(s) — it should not narrate the diff; the diff
  already shows that.
- Keep PRs reviewable: a PR that scaffolds one module end-to-end is fine;
  a PR that touches twelve unrelated modules is not.
- Run `pnpm lint` and `pnpm test` locally before requesting review (see
  `CLAUDE.md` §"Commands").
- If the change touches the inventory or order state machines, RBAC, or a
  shared frontend module, say in the description that the relevant audit
  agent has run — `state-machine-guardian`, `rbac-auditor`,
  `portal-consistency-auditor`, or `money-display-auditor`.
- As the **last step** before merging, append an entry to
  `docs/PROGRESS_LOG.md` via the `log-progress` skill. This is part of the
  definition of done, not an afterthought — it's what lets the next person
  (or agent) pick up where you left off without re-deriving your context.

## Code review expectations

- Reviewers check correctness *and* alignment with `CLAUDE.md`: module
  structure, naming, the "comments explain why" rule, RBAC
  data-drivenness, transactional inventory moves.
- The domain rules in `CLAUDE.md` §"Domain rules an agent must never
  violate" (PRD §8 inventory states, §9 order lifecycle, §15
  transactionality) are non-negotiable — a PR that violates them goes back
  for rework regardless of how clean the rest of the code is.
- Disagree with a convention? Raise it as a discussion. If the team agrees
  to change it, update `CLAUDE.md` *and* record the change as a new ADR
  (superseding the old one if one exists) — conventions should change
  through visible decisions, not silent exceptions that accumulate.

## Local setup

> Populate this section once the monorepo is scaffolded — see `CLAUDE.md`
> §"Commands" for the target command set (`pnpm install`, `pnpm dev`,
> `pnpm test`, `pnpm lint`, `pnpm db:migrate`).
