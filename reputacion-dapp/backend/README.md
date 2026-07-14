# Reputation Badge Backend — Phase 2

Backend for the Soulbound Reputation Badges DApp. Handles admin authentication (SIWE), relayer wallet management, group/member administration, and badge minting orchestration.

## Architecture Overview

### Key Components

1. **Authentication (SIWE)**: Admins sign messages with their Ethereum wallet to log in, receive JWT tokens.
2. **Relayer Wallets**: One encrypted wallet per admin, used to sign blockchain mint transactions.
3. **Hybrid Model**:
   - **On-chain** (ReputationBadge.sol): Soulbound ERC721, access control via MINTER_ROLE.
   - **Off-chain** (PostgreSQL): Group membership, admin-group ownership, badge definitions, award history.
4. **Blockchain Interactions** (ethers.js v6): Mint badges and manage MINTER_ROLE via relayer wallets.

### Database Schema (7 Models)

- **SiweNonce**: Replay-protection for SIWE (nonce stored server-side, 10-min expiry, marked as used after verification)
- **Admin**: Login wallet + profile
- **RelayerWallet**: Encrypted private key (1:1 with Admin), MINTER_ROLE status
- **Group**: Managed by an Admin
- **Member**: User in a Group (can receive badges)
- **BadgeDefinition**: Badge template (Admin creates for their groups)
- **BadgeAward**: Record of a badge given to a member (links on-chain tokenId + tx hash, status tracking for pending/confirmed/failed)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Sepolia RPC endpoint (Alchemy, Infura, or other provider)
- Deployed ReputationBadge contract address

### 1. Install Dependencies

```bash
cd /path/to/backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SEPOLIA_RPC_URL`: Sepolia JSON-RPC endpoint
- `REPUTATION_BADGE_CONTRACT_ADDRESS`: Deployed contract address
- `DEPLOYER_PRIVATE_KEY`: Private key of wallet that deployed the contract
- `ENCRYPTION_MASTER_KEY`: 32-byte hex key for encrypting relayer private keys (generate with: `node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"`)
- `JWT_SECRET`: Secret for JWT signing

### 3. Set Up Database

```bash
npx prisma migrate dev --name init
```

This creates the PostgreSQL schema and generates Prisma client.

### 4. Start the Server

**Development (watch mode)**:
```bash
npm run dev
```

**Production**:
```bash
npm run build
npm start
```

Server listens on `http://localhost:3000` by default.

## API Endpoints

### Authentication

#### `POST /auth/siwe-message`
Request a SIWE message to sign.

**Request:**
```json
{ "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0" }
```

**Response:**
```json
{
  "message": "reputation-badges.local wants you to sign in...",
  "nonce": "abc123def456"
}
```

#### `POST /auth/siwe-verify`
Verify signed message and get JWT token (auto-creates admin & relayer wallet on first login).

**Request:**
```json
{
  "message": "reputation-badges.local wants you to sign in...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": { "id": "...", "walletAddress": "0x...", "displayName": null },
  "relayerStatus": {
    "relayerAddress": "0x...",
    "isActive": false,
    "hasRoleOnChain": false,
    "createdAt": "2024-..."
  }
}
```

#### `POST /auth/initialize-minter-role`
Grant MINTER_ROLE to the admin's relayer wallet on-chain (deployer pays gas).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "message": "MINTER_ROLE granted successfully",
  "transactionHash": "0x...",
  "relayerAddress": "0x..."
}
```

#### `GET /auth/relayer-status`
Check relayer wallet status.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "relayerAddress": "0x...",
  "isActive": true,
  "hasRoleOnChain": true,
  "minterRoleGrantedAt": "2024-...",
  "minterRoleRevokedAt": null
}
```

### Groups

#### `POST /groups`
Create a group (protected, admin only).

**Request:**
```json
{ "name": "Developers", "description": "Web3 devs" }
```

#### `GET /groups`
List all groups for the authenticated admin.

#### `GET /groups/:id`
Get group details (public).

#### `PUT /groups/:id`
Update group (owner only).

#### `DELETE /groups/:id`
Delete group and cascade (owner only).

### Members

#### `POST /groups/:id/members`
Add a member to a group (owner only).

**Request:**
```json
{
  "walletAddress": "0x...",
  "displayName": "John Doe"
}
```

#### `DELETE /groups/:id/members/:memberId`
Remove member from group (off-chain; badges remain soulbound).

### Badges

#### `POST /badge-definitions`
Create a badge template for a group (owner only).

**Request:**
```json
{
  "groupId": "group-id",
  "name": "Contributor",
  "description": "Awarded to project contributors",
  "imageURI": "ipfs://QmXxxx"
}
```

#### `GET /badge-definitions/:id`
Get badge definition (public).

#### `POST /badge-definitions/:id/award`
**CRITICAL ENDPOINT**: Award a badge to a member.

**Validation flow:**
1. Admin owns this badge's group
2. Member belongs to that group
3. Relayer wallet is active (MINTER_ROLE granted)
4. Member hasn't already received this exact badge
5. If all pass: mint on-chain, then save to DB

**Request:**
```json
{ "memberId": "member-id" }
```

**Response:**
```json
{
  "badgeAward": {
    "id": "award-id",
    "badgeDefinitionId": "badge-id",
    "memberId": "member-id",
    "onChainTokenId": 42,
    "transactionHash": "0x...",
    "status": "pending",
    "awardedAt": "2024-...",
    "confirmedAt": null
  },
  "message": "Badge awarded successfully (pending on-chain confirmation)"
}
```

#### `POST /badge-awards/:id/verify-receipt`
**Receipt Verification**: Check if a pending badge mint was confirmed or reverted on-chain.

**Usage**: Admin can manually verify the status of a `pending` badge award.

**Behavior:**
- If tx not mined yet: returns `pending` (try again later)
- If tx confirmed: updates status to `confirmed`, sets `confirmedAt`
- If tx reverted: updates status to `failed`, allows re-award (removes uniqueness constraint violation)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (pending):**
```json
{
  "status": "pending",
  "message": "Transaction not yet mined. Please try again later.",
  "badgeAward": { ... }
}
```

**Response (confirmed):**
```json
{
  "status": "confirmed",
  "message": "Transaction confirmed on-chain",
  "badgeAward": {
    "status": "confirmed",
    "confirmedAt": "2024-...",
    ...
  }
}
```

**Response (failed/reverted):**
```json
{
  "status": "failed",
  "message": "Transaction reverted on-chain. You can now re-award this badge to the member.",
  "badgeAward": {
    "status": "failed",
    "failureReason": "Transaction reverted on-chain",
    ...
  }
}
```

#### `GET /groups/:groupId/badges`
List all badges for a group (public).

#### `GET /members/:memberId/badges`
List all badges awarded to a member (public).

## Security Considerations

### Private Key Management

⚠️ **Critical**: Relayer private keys are encrypted at rest using AES-256-GCM with a master key from `ENCRYPTION_MASTER_KEY`.

- **Never log** plaintext private keys
- **Never expose** encrypted keys in API responses
- **Master key** must be stored securely (environment variables only, never in code)
- **Production upgrade** (future): Migrate to AWS KMS, HashiCorp Vault, or similar

### Validation

- **Admin ownership**: Every endpoint checks that the authenticated admin owns the resource
- **Member membership**: Badge awards validate member belongs to the badge's group
- **Ethereum addresses**: All addresses are validated and checksummed via ethers.js
- **Unique constraints**: Badges can only be awarded once per member

### JWT Tokens

- Stateless, signed with `JWT_SECRET`
- Expire after `JWT_EXPIRATION` (default: 7 days)
- Included in `Authorization: Bearer` header

### Database

- Uses Prisma for type-safe queries
- Cascade deletes for data integrity (delete group → deletes members, badges)
- Unique constraints prevent duplicate group names, members, badges

## Testing

```bash
npm test
```

### Test Coverage

- **permissions.test.ts**: Admin ownership, group membership, badge uniqueness, address validation
- **auth.service.test.ts**: SIWE message generation, JWT verification, token expiration
- **encryption.test.ts**: Private key encryption/decryption, tampering detection

To run a specific test file:
```bash
npm test permissions.test.ts
```

To watch mode:
```bash
npm run test:watch
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Blockchain SDK** | ethers.js v6 | Consolidation, stable, best for backend integrations |
| **Authentication** | JWT (stateless) | Scalable, standard for APIs, compatible with frontend |
| **SIWE Nonce** | Persist + validate server-side | Replay-protection; nonce stored in DB, marked used after verification, 10-min expiry |
| **Tx Confirmation** | Optimistic (save on send) + manual verify | Fast endpoint response, can verify receipts later with `/badge-awards/:id/verify-receipt` |
| **Private Key Encryption** | AES-256-GCM + PBKDF2 | Strong symmetric encryption; master key in env only |
| **Relayer Model** | 1 per admin | Each admin has isolated wallet, clear key management scope |

## Known Limitations & Future Work

1. **No batch minting**: Each badge is a separate transaction (gas-intensive for bulk operations)
2. **Manual tx verification**: Admin calls `/badge-awards/:id/verify-receipt` to check status (could be automated with background job)
3. **No event indexing**: Badge awards are stored in DB, not read from blockchain events
4. **No pause mechanism**: If relayer is compromised, admin must revoke MINTER_ROLE manually
5. **Production KMS**: Current AES-256-GCM encryption sufficient for testnet; production should use AWS KMS or Vault
6. **No automatic nonce cleanup**: Expired SIWE nonces must be cleaned up via `authService.cleanupExpiredNonces()` (can be scheduled job)

## Deployment Checklist

- [ ] `.env` configured with production values
- [ ] PostgreSQL database created and migrated
- [ ] ReputationBadge contract deployed on Sepolia
- [ ] Deployer wallet has ETH for gas
- [ ] `ENCRYPTION_MASTER_KEY` is strong (32 bytes) and stored securely
- [ ] `JWT_SECRET` is changed from default
- [ ] `NODE_ENV` set to `production`
- [ ] CORS origin updated to frontend domain
- [ ] Database backups configured
- [ ] Logs monitored for errors

## Troubleshooting

### "MINTER_ROLE not granted"
Make sure you called `/auth/initialize-minter-role` first. The deployer wallet must have gas.

### "Relayer wallet private key decryption failed"
Check that `ENCRYPTION_MASTER_KEY` matches the one used when the key was encrypted. Regenerating the key will make old keys unrecoverable.

### "Invalid member address"
Addresses must be valid Ethereum addresses. Use `ethers.getAddress(addr)` to checksum.

### "Transaction failed on-chain"
Check RPC endpoint connectivity, deployer wallet gas, and contract address. Check logs for detailed error.

## References

- [ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [SIWE Spec](https://eips.ethereum.org/EIPS/eip-4361)
- [OpenZeppelin AccessControl](https://docs.openzeppelin.com/contracts/4.x/access-control)

## License

MIT
