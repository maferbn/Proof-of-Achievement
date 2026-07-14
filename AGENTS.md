# AGENTS.md — Proof-of-Achievement

## Repo layout (important: not a working monorepo)

The root `apps/` and `packages/` directories are empty Turborepo stubs. All real code lives in a single dir:

```
reputacion-dapp/
  contracts/   ← Hardhat project (Phase 1)
  backend/     ← Express + Prisma API (Phase 2)
```

Each has its own `package.json`, `node_modules`, and lockfile. Run all commands from the appropriate subdirectory — there is no root `package.json`.

## Contracts (`reputacion-dapp/contracts/`)

| Command | What it does |
|---------|-------------|
| `npm run compile` | `hardhat compile` → regenerates `typechain-types/` |
| `npm test` | `hardhat test` (19 tests, local Hardhat network) |
| `npm run node` | Start a local Hardhat node (`http://127.0.0.1:8545`) |
| `npm run deploy:localhost` | Deploy to local Hardhat node |
| `npm run deploy:sepolia` | Deploy to Sepolia (chainId 11155111) |

- **Solidity 0.8.24** (optimizer enabled, 200 runs)
- Uses **Hardhat Toolbox** and **Hardhat Viem** (`@nomicfoundation/hardhat-viem`)
- Contract: `contracts/ReputationBadge.sol` — ERC721 + AccessControl, soulbound (non-transferable via `_beforeTokenTransfer` override)
- OpenZeppelin **v4.0.0** (old; do not upgrade without checking breaking changes)
- Deploy script: `scripts/deploy.ts`
- Env vars required: `SEPOLIA_RPC_URL`, `PRIVATE_KEY` (see `.env.example`)
- Test runner is Hardhat's built-in Chai matchers, NOT Jest

## Backend (`reputacion-dapp/backend/`)

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 (ts-node, no hot reload) |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | Run compiled server (`node dist/server.js`) |
| `npm test` | Jest via ts-jest (29 tests across 4 suites) |
| `npm run test:watch` | Jest watch mode |
| `npm run lint` | `eslint src --ext .ts` |
| `npm run db:migrate` | `prisma migrate dev` (create/apply migrations) |
| `npm run db:generate` | `prisma generate` (regenerate Prisma client) |
| `npm run db:push` | `prisma db push` (push schema without migrations) |
| `npm run db:reset` | `prisma migrate reset --force` |

- **Database must exist before running migrations.** Create the PostgreSQL DB manually first.
- Tests use SQLite (`file:./test.db`) via `.env.test`. No PostgreSQL needed for test runs.
- ESLint is installed but **no `.eslintrc.*` or `eslint.config.*` exists**. The lint command will fail until you create a config.
- No Prettier, Solhint, or pre-commit hooks are configured.
- No CI pipelines exist (no `.github/workflows/`).
- Env vars: see `.env.example` — requires `DATABASE_URL`, `SEPOLIA_RPC_URL`, `REPUTATION_BADGE_CONTRACT_ADDRESS`, `DEPLOYER_PRIVATE_KEY`, `ENCRYPTION_MASTER_KEY`, `JWT_SECRET`.

### Backend architecture notes

- **Relayer wallet pattern:** Each admin gets a generated relayer wallet whose private key is AES-256-GCM encrypted with a master key. The deployer wallet grants `MINTER_ROLE` to relayer wallets on-chain.
- Auth uses **SIWE** (Sign-In with Ethereum) + JWT. Routes are protected by `auth.middleware.ts`.
- Entry point: `src/server.ts` (port 3000, CORS for `CORS_ORIGIN`).
- Prisma schema has 7 models: `SiweNonce`, `Admin`, `RelayerWallet`, `Group`, `Member`, `BadgeDefinition`, `BadgeAward`.

## Order of operations for a full local run

1. Start PostgreSQL, create the database
2. `cd reputacion-dapp/contracts` → `npm install` → `npm run compile` → `npm run node` (separate terminal)
3. Deploy contract to localhost, copy the deployed address
4. `cd reputacion-dapp/backend` → `npm install` → configure `.env` → `npm run db:migrate` → `npm run dev`
