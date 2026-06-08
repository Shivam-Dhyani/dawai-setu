# DawaiSetu

A medicine supply-chain platform connecting hospitals with external
pharmacies — from stock requests and fulfillment, to prescribing and
dispensing, to near-expiry and expired-stock management on both sides.

## Status

🚧 **Pre-scaffold.** Architecture, stack, and conventions are decided (see
below); application code has not been written yet. Track current state in
[`docs/PROGRESS_LOG.md`](docs/PROGRESS_LOG.md).

## Stack

- **Backend**: NestJS + TypeScript, Prisma ORM, PostgreSQL, Redis + BullMQ
- **Frontend**: React + TypeScript + Vite — two apps (`hospital-portal`,
  `pharmacy-portal`) sharing a UI kit and generated API types
- **Monorepo**: Turborepo

See [`docs/adr/`](docs/adr/) for the reasoning behind these choices.

## Documentation map

| Doc | What it's for |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | The full functional spec — *what* we're building |
| [`CLAUDE.md`](CLAUDE.md) | Engineering conventions, philosophy, domain rules — *how* we build |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records — *why* we chose this stack and structure |
| [`docs/PROGRESS_LOG.md`](docs/PROGRESS_LOG.md) | Running log of what's been built/decided and what's next |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute — branching, commits, PRs, local setup |

## Project structure (target)

```
apps/
  hospital-portal/      # Doctor + Pharmacist roles
  pharmacy-portal/      # Pharmacy operator role
  backend/              # shared NestJS API
packages/
  ui/                   # zero-domain-knowledge component kit (primitives/, patterns/)
  domain-ui/            # shared DawaiSetu-aware components + hooks
  api-types/            # generated from backend OpenAPI spec
  config/               # shared eslint/tsconfig/tailwind config
docs/
```

See `CLAUDE.md` for the full layout, module conventions, and the rules an
agent (or developer) must never violate when touching inventory/order state
machines or RBAC.

## Getting started

> Populate this section once the monorepo is scaffolded — see `CLAUDE.md`
> §"Commands" for the target command set.

```
pnpm install
pnpm dev
```
