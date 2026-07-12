# ReputationBadge Smart Contract

Soulbound ERC721 tokens (non-transferible) for reputation achievements in a multi-tenant Web3 social recognition system.

## Architecture Overview

- **Contract**: `ReputationBadge.sol` — ERC721 + AccessControl (OpenZeppelin v4.0.0)
- **Soulbound**: Badges cannot be transferred after minting, only burned.
- **Access Control**: Only addresses with `MINTER_ROLE` can mint badges.
- **Design Approach**: All business logic (group membership, permission validation) is handled off-chain in the backend. The contract only enforces on-chain access control and the soulbound nature.
- **One relayer wallet per admin**: Each admin's backend relayer gets `MINTER_ROLE` for their own minting operations.

## Setup

### Prerequisites

- Node.js ≥ 18
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` and fill in your Sepolia RPC endpoint and private key:

```bash
cp .env.example .env
```

Edit `.env`:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=0x... (your deployer private key)
```

**Security**: Never commit `.env` with real keys. Use `.env.local` for local development.

## Commands

### Compile Contracts

```bash
npm run compile
```

Generates TypeChain types in `typechain-types/`.

### Run Tests

```bash
npm run test
```

Tests cover:
- MINTER_ROLE grant/revoke
- Minting with proper events and sequential token IDs
- Soulbound enforcement (blocking transfers)
- Unauthorized access attempts
- Metadata storage

All tests use a local Hardhat network (no external RPC needed).

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

**Output**:
- Deployed contract address
- Network confirmation
- Next steps for granting MINTER_ROLE to relayer wallets

### Run Local Node (for manual testing)

```bash
npm run node
```

In another terminal:

```bash
npm run deploy:localhost
```

## Contract Interface

### Public Functions

#### `mint(to: address, uri: string) -> uint256`

Mint a new badge to a recipient. Only callable by addresses with `MINTER_ROLE`.

- **Parameters**:
  - `to`: Recipient address
  - `uri`: Token URI (IPFS link to metadata JSON, e.g., `ipfs://Qm...`)
- **Returns**: The minted token ID
- **Reverts**: If caller lacks `MINTER_ROLE` or `to` is zero address

#### `grantMinter(minter: address)`

Grant `MINTER_ROLE` to a relayer wallet. Only callable by the owner/DEFAULT_ADMIN_ROLE.

- **Parameters**:
  - `minter`: Address to grant minting rights
- **Emits**: `MinterGranted(minter)`

#### `revokeMinter(minter: address)`

Revoke `MINTER_ROLE` from a relayer wallet. Only callable by the owner/DEFAULT_ADMIN_ROLE.

- **Parameters**:
  - `minter`: Address to revoke minting rights
- **Emits**: `MinterRevoked(minter)`

### Read-Only Functions

#### `getTokenURI(tokenId: uint256) -> string`

Get the metadata URI for a badge.

#### `hasRole(role: bytes32, account: address) -> bool`

Check if an address has a specific role (from AccessControl).

#### `balanceOf(owner: address) -> uint256`

Get the badge count for an owner.

#### `ownerOf(tokenId: uint256) -> address`

Get the owner of a specific badge.

## Key Design Decisions

### OpenZeppelin v4.0.0

- Uses the stable `_beforeTokenTransfer` hook for validation.
- Mature, battle-tested library with wide tool support.
- Note: v4.0.0 was chosen due to local registry constraints; modern versions (4.9.x+) are recommended for production.

### One Relayer per Admin (On-Chain Access Control)

- Each admin's backend gets its own relayer wallet with `MINTER_ROLE`.
- The contract doesn't know about groups or membership — that's purely in the database.
- Backend validates: "Does admin X have permission to mint for group Y?" before calling `mint()`.
- **Advantage**: Simple contract, flexible backend logic, no gas wasted on on-chain group management.

### Soulbound Implementation

- Override `_update(to, tokenId, auth)` to allow only minting (`from == address(0)`) and burning (`to == address(0)`).
- Any other transfer is blocked with a clear error message.
- Burning is theoretically allowed by the soulbound rule (though there's no public burn function).

### Metadata Storage

- Token URIs point to IPFS via Pinata or Web3.Storage (free tiers available).
- JSON format on IPFS contains name, description, image, and custom attributes.
- Backend generates and pins the metadata before calling `mint()`.

## Integration with Backend

The backend (Fastify + Prisma) does the following before minting:

1. **Authenticate** the admin via SIWE (Sign-In with Ethereum).
2. **Validate** that the user is in the admin's group (check PostgreSQL).
3. **Validate** that the badge exists and is appropriate for this group.
4. **Generate** and pin badge metadata to IPFS (name, description, image).
5. **Call** `badge.mint(userAddress, ipfsURI)` via the admin's relayer wallet (gasless from user perspective).
6. **Record** the minting event in the database for auditing and frontend display.

## Gas Optimization Notes

- Token counter is a simple uint256 increment (no fancy ID schemes).
- No redundant storage of group/admin data on-chain.
- Minimal role checks (AccessControl is already optimized in OZ v5).
- URI storage uses a simple mapping (no ERC721URIStorage overhead).

For production, consider:
- Batching mint operations to reduce transaction overhead.
- Using cheaper IPFS providers or alternative metadata storage.

## Troubleshooting

### "Soulbound: badges cannot be transferred"

This is expected. Badges are non-transferible by design. If a user tries to transfer their badge to someone else, it will revert.

### "AccessControlUnauthorizedAccount"

The caller doesn't have the required role. Only addresses with `MINTER_ROLE` can mint, and only the owner can grant/revoke roles.

### Deploy fails with "Invalid private key"

Ensure your `.env` has a valid Sepolia private key (0x-prefixed, 64 hex characters).

### Deploy fails with "missing RPC URL"

Check your `.env` — `SEPOLIA_RPC_URL` is either missing or invalid. Use Alchemy, Infura, or another public provider.

## References

- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x/)
- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Soulbound Tokens Concept](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4105763)
- [Sepolia Testnet Faucet](https://sepoliafaucet.com/)
- [Pinata IPFS Hosting](https://www.pinata.cloud/) (Free tier available)
