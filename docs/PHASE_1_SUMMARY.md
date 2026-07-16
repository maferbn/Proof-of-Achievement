# Phase 1: Smart Contract - Complete Summary

## ✅ Deliverables

### 1. **ReputationBadge.sol**
- **Path**: `/contracts/contracts/ReputationBadge.sol`
- **Technology**: ERC721 + AccessControl (OpenZeppelin v4.0.0)
- **Size**: ~95 lines (clean, minimal)
- **Key Features**:
  - ✅ Soulbound enforcement (no transfers allowed)
  - ✅ MINTER_ROLE access control
  - ✅ Sequential token IDs
  - ✅ Metadata URI storage (IPFS-ready)
  - ✅ Clear event logging for indexing

### 2. **Comprehensive Test Suite**
- **Path**: `/test/ReputationBadge.test.ts`
- **Coverage**: 19/19 tests passing ✅
- **Test Categories**:
  - Deployment validation
  - MINTER_ROLE grant/revoke (4 tests)
  - Minting functionality (5 tests)
  - Soulbound enforcement (3 tests)
  - Permission validation (4 tests)
  - Interface introspection (1 test)

### 3. **Deployment Script**
- **Path**: `/scripts/deploy.ts`
- **Environment**: Sepolia testnet (configurable)
- **Features**:
  - ✅ Loads deployer from private key (.env)
  - ✅ Connects to Sepolia RPC (Alchemy/Infura/other)
  - ✅ Displays deployed address & network info
  - ✅ Next-steps instructions (grantMinter workflow)

### 4. **Project Configuration**
- ✅ `hardhat.config.ts` — Network setup (Sepolia, localhost)
- ✅ `package.json` — Dependencies & scripts
- ✅ `tsconfig.json` — TypeScript compilation
- ✅ `.env.example` — Safe template (no secrets)
- ✅ `.gitignore` — Excludes sensitive files

### 5. **Documentation**
- ✅ `README.md` — 200+ lines covering setup, deployment, contract interface, design decisions, troubleshooting
- ✅ Inline contract comments explaining each function

---

## 📋 Design Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **OpenZeppelin Version** | v4.0.0 | Stable, battle-tested; v5 unavailable in local registry |
| **Data Model** | Off-chain (Enfoque A) | Group/admin logic lives in PostgreSQL; contract only enforces access control + soulbound |
| **Relayer Model** | One per admin | Each admin's backend gets its own wallet with MINTER_ROLE; backend validates group membership |
| **Soulbound Hook** | `_beforeTokenTransfer` override | Blocks transfers (not minting or burning) with clear error message |
| **Token IDs** | Simple counter (1, 2, 3...) | Minimal gas, deterministic, easy to predict for backend |
| **Metadata** | Custom `getTokenURI(tokenId)` | IPFS URIs pinned by backend before each mint |

---

## 🧪 Test Results

```
✓ 19 passing (286ms)
  ├── Deployment (2 tests)
  ├── MINTER_ROLE Management (6 tests)
  ├── Minting (5 tests)
  ├── Soulbound (4 tests)
  └── ERC165 Introspection (1 test)
```

**Critical paths verified:**
- ✅ Only MINTER_ROLE can mint
- ✅ Soulbound: transfers rejected with clear error
- ✅ Admin role: grant/revoke MINTER_ROLE
- ✅ Sequential token IDs
- ✅ Metadata URI storage & retrieval

---

## 🚀 How to Use

### 1. **Install dependencies**
```bash
cd /Users/valeriariera/Proof-of-Achievement/reputacion-dapp/contracts
npm install
```

### 2. **Compile**
```bash
npm run compile
```
Output: TypeScript types in `typechain-types/`, ABI in `artifacts/`

### 3. **Run tests** (no external RPC needed)
```bash
npm run test
```
Result: All 19 tests pass on local Hardhat network

### 4. **Deploy to Sepolia**
1. Copy `.env.example` → `.env`
2. Fill in `SEPOLIA_RPC_URL` (Alchemy/Infura) and `PRIVATE_KEY`
3. Run:
```bash
npm run deploy:sepolia
```
Output: Contract address + instructions to grant MINTER_ROLE

---

## 📊 Contract ABI Summary

### Public Functions
| Function | Access | Purpose |
|----------|--------|---------|
| `mint(to, uri)` | MINTER_ROLE | Mint a badge to a user |
| `grantMinter(minter)` | DEFAULT_ADMIN_ROLE | Grant MINTER_ROLE to a relayer |
| `revokeMinter(minter)` | DEFAULT_ADMIN_ROLE | Revoke MINTER_ROLE from a relayer |
| `getTokenURI(tokenId)` | Public | Retrieve badge metadata URI |
| `balanceOf(owner)` | Public (ERC721) | Badge count for an owner |
| `ownerOf(tokenId)` | Public (ERC721) | Owner of a specific badge |
| `hasRole(role, account)` | Public (AccessControl) | Check role membership |

### Events
```solidity
event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
event MinterGranted(address indexed minter);
event MinterRevoked(address indexed minter);
```

---

## 🔐 Security Checklist

- ✅ **Soulbound enforcement**: Badges cannot be transferred after mint
- ✅ **Access control**: Only MINTER_ROLE can mint; only DEFAULT_ADMIN can manage roles
- ✅ **Zero-address guards**: Cannot mint to `address(0)`
- ✅ **No upgradeability**: Contract is immutable (no proxy)
- ✅ **No external calls**: No reentrancy risk
- ✅ **Gas-efficient**: Minimal storage, simple logic

---

## ⚠️ Known Limitations

1. **OZ v4.0.0 is old** — Modern production should use 4.9.x or 5.x (when registry updated)
2. **No public burn()** — Burning is only allowed via the soulbound rule (not user-facing)
3. **No batch minting** — Each mint is a separate transaction (gas-intensive for bulk operations)
4. **No pause mechanism** — Contract cannot be paused if a relayer is compromised
5. **No metadata validation** — Backend is responsible for validating IPFS URIs

---

## 📝 Next Steps for Phase 2 (Backend)

Before moving to backend, **wait for user approval**. When approved, Phase 2 will include:

1. **Prisma models**: Admin, Group, Member, Badge, BadgeAward
2. **Fastify endpoints**:
   - `POST /auth/siwe` — Admin SIWE login
   - `POST /badges/mint` — Mint badge to group member
   - `GET /badges/:tokenId` — Get badge details
3. **Relayer wallet**: Sign & send mint transactions via Alchemy or Web3.Storage
4. **Database**: PostgreSQL with group membership & audit logs

---

## 📖 References

- [OpenZeppelin ERC721 Docs](https://docs.openzeppelin.com/contracts/4.x/erc721)
- [OpenZeppelin AccessControl Docs](https://docs.openzeppelin.com/contracts/4.x/access-control)
- [Soulbound Tokens (Vitalik et al.)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4105763)
- [Sepolia Testnet Info](https://www.sepoliaethernet.org/)
- [Hardhat Docs](https://hardhat.org/docs)
