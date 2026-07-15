# AGENTS.md — Proof-of-Achievement

## Repo layout (Turborepo monorepo)

```
proof-of-achievement/
  apps/
    api/          ← Express + Prisma backend (Phase 2)
    client/       ← Vite + React + Wagmi frontend
  packages/
    contracts/    ← Hardhat project (Phase 1)
    shared-types/ ← Shared TypeScript types
```

All commands run from the **repo root** using Turbo filters or npm workspaces. There is a single root `package.json` and `package-lock.json`.

## Root commands

| Command | What it does |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev` | Start all apps in parallel (turbo) |
| `npm run build` | Build all packages and apps |
| `npm run compile` | Compile contracts only (`--filter=@repo/contracts`) |
| `npm run test` | Run all tests across workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run db:generate` | Generate Prisma client (`--filter=api`) |
| `npm run db:push` | Push Prisma schema (`--filter=api`) |

## Contracts (`packages/contracts/`)

| Command | What it does |
|---------|-------------|
| `npx turbo compile --filter=@repo/contracts` | `hardhat compile` → regenerates `typechain-types/` |
| `npx turbo test --filter=@repo/contracts` | `hardhat test` (local Hardhat network) |
| `npm run node -w packages/contracts` | Start a local Hardhat node (`http://127.0.0.1:8545`) |
| `npm run deploy:localhost -w packages/contracts` | Deploy to local Hardhat node |
| `npm run deploy:sepolia -w packages/contracts` | Deploy to Sepolia (chainId 11155111) |

- **Solidity 0.8.24** (optimizer enabled, 200 runs)
- Uses **Hardhat Toolbox** and **Hardhat Viem** (`@nomicfoundation/hardhat-viem`)
- Contract: `contracts/ReputationBadge.sol` — ERC721 + AccessControl, soulbound (non-transferable via `_beforeTokenTransfer` override)
- OpenZeppelin **v4.9.6** (do not upgrade without checking breaking changes)
- Deploy script: `scripts/deploy.ts`
- Env vars required: `SEPOLIA_RPC_URL`, `PRIVATE_KEY` (see `.env.example`)
- Test runner is Hardhat's built-in Chai matchers, NOT Jest

## API Backend (`apps/api/`)

| Command | What it does |
|---------|-------------|
| `npx turbo dev --filter=api` | Start dev server on port 3000 (ts-node, no hot reload) |
| `npx turbo build --filter=api` | `tsc` → `dist/` |
| `npm start -w apps/api` | Run compiled server (`node dist/server.js`) |
| `npx turbo test --filter=api` | Jest via ts-jest (7 suites, 66 tests) |
| `npm run test:watch -w apps/api` | Jest watch mode |
| `npx turbo lint --filter=api` | `eslint .` (uses root flat config) |
| `npm run db:migrate -w apps/api` | `prisma migrate dev` (create/apply migrations) |
| `npx turbo db:generate --filter=api` | `prisma generate` (regenerate Prisma client for PostgreSQL) |
| `npm run db:generate:test -w apps/api` | `prisma generate` for test SQLite client (run once) |
| `npx turbo db:push --filter=api` | `prisma db push` (push schema without migrations) |
| `npm run db:reset -w apps/api` | `prisma migrate reset --force` |

- **Database must exist before running migrations.** Create the PostgreSQL DB manually first.
- Tests use SQLite (`file:./test.db`) via a separate `prisma/schema.test.prisma` that generates to `prisma/test-client/` (separate output directory, avoids DLL conflicts on Windows). Jest's `moduleNameMapper` redirects `@prisma/client` imports to the test client during tests. Run `npm run db:generate:test -w apps/api` once to generate it.
- ESLint uses the root flat config (`eslint.config.js`). The `jest.config.cjs` is ignored.
- No CI pipelines exist (no `.github/workflows/`).
- Env vars: see `apps/api/.env.example` — requires `DATABASE_URL`, `SEPOLIA_RPC_URL`, `REPUTATION_BADGE_CONTRACT_ADDRESS`, `DEPLOYER_PRIVATE_KEY`, `ENCRYPTION_MASTER_KEY`, `JWT_SECRET`.

### Backend architecture notes

- **Relayer wallet pattern:** Each admin gets a generated relayer wallet whose private key is AES-256-GCM encrypted with a master key. The deployer wallet grants `MINTER_ROLE` to relayer wallets on-chain.
- Auth uses **SIWE** (Sign-In with Ethereum) + JWT. Routes are protected by `auth.middleware.ts`.
- Entry point: `src/server.ts` (port 3000, CORS for `CORS_ORIGIN`).
- Prisma schema has 7 models: `SiweNonce`, `Admin`, `RelayerWallet`, `Group`, `Member`, `BadgeDefinition`, `BadgeAward`.
- Contract interaction uses a **hardcoded minimal ABI** in `relayer.service.ts` (does not import from `@repo/contracts`).

## Order of operations for a full local run

1. Start PostgreSQL, create the database
2. From repo root: `npm install`
3. `npx turbo compile --filter=@repo/contracts` → `npm run node -w packages/contracts` (separate terminal)
4. Deploy contract to localhost, copy the deployed address
5. Configure `apps/api/.env` with the deployed address
6. `npx turbo db:generate --filter=api` → `npm run db:migrate -w apps/api`
7. `npm run dev` (starts both api and client)
