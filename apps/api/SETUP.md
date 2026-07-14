# Backend Setup Guide — Phase 2

Complete guide to set up and deploy the Reputation Badge backend.

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Sepolia testnet ETH in your deployer wallet (for gas)
- Alchemy or Infura account (for RPC access)

## 1. Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE reputation_badge_db ENCODING 'UTF8';

# Create user
CREATE USER badge_user WITH PASSWORD 'your-secure-password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE reputation_badge_db TO badge_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO badge_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO badge_user;

# Exit
\q
```

### Verify Connection

```bash
psql -U badge_user -d reputation_badge_db -h localhost -c "SELECT 1;"
# Should return: 1
```

## 2. Environment Configuration

### Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

### Fill in required variables

#### 2.1 Database

```env
DATABASE_URL="postgresql://badge_user:your-secure-password@localhost:5432/reputation_badge_db"
```

#### 2.2 Blockchain (Sepolia Testnet)

Get **Sepolia RPC URL** from:
- [Alchemy](https://www.alchemy.com/) — Free tier available
- [Infura](https://infura.io/) — Free tier available

```env
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
```

#### 2.3 Contract Address

Use the address from Phase 1 deployment:

```env
REPUTATION_BADGE_CONTRACT_ADDRESS="0x..." # From deploy.ts output
```

#### 2.4 Deployer Private Key

Use the private key of the wallet that deployed ReputationBadge.sol:

```bash
# ⚠️  CRITICAL: Never commit this to version control!
# Store securely: environment variable, secrets manager, or encrypted file
DEPLOYER_PRIVATE_KEY="0x..."
```

#### 2.5 Encryption Master Key

Generate a random 32-byte hex string:

```bash
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
# Output: 0x7d3f8e2a9b1c4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e
```

Store this **securely**:

```env
ENCRYPTION_MASTER_KEY="0x7d3f8e2a9b1c4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e"
```

**WARNING**: Losing this key = losing ability to decrypt admin relayer private keys

#### 2.6 JWT Secret

Generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 7d3f8e2a9b1c4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e
```

```env
JWT_SECRET="7d3f8e2a9b1c4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e"
JWT_EXPIRATION="7d"
```

#### 2.7 Server Configuration

```env
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="https://your-frontend-domain.com"  # Update to your frontend URL
LOG_LEVEL="info"
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Database Migrations

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Migrations

```bash
npx prisma migrate deploy
```

This creates all 7 tables:
- `SiweNonce` — SIWE replay-protection
- `Admin` — Admin accounts
- `RelayerWallet` — Encrypted relayer wallets
- `Group` — Groups managed by admins
- `Member` — Members in groups
- `BadgeDefinition` — Badge templates
- `BadgeAward` — Badge awards to members

### Verify Migrations

```bash
npx prisma db execute --stdin < prisma/migrations/*/migration.sql
psql -U badge_user -d reputation_badge_db -c "\dt"
# Should show all 7 tables
```

## 5. Run Tests

```bash
# Test against SQLite (for quick verification)
npm test

# Expected output:
# Test Suites: 4 passed, 4 total
# Tests:       29 passed, 29 total
```

## 6. Start Development Server

```bash
npm run dev
```

Expected output:
```
Reputation Badge backend listening on port 3000
Environment: development
CORS origin: http://localhost:3001
```

## 7. Test API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-07-13T..."}
```

### SIWE Message Request

```bash
curl -X POST http://localhost:3000/auth/siwe-message \
  -H "Content-Type: application/json" \
  -d '{"address":"0x8ba1f109551bD432803012645Ac136ddd64DBA72"}'

# Response:
# {
#   "message": "reputation-badges.local wants you to sign in...",
#   "nonce": "abc123def456"
# }
```

## Production Deployment Checklist

- [ ] PostgreSQL database created and accessible
- [ ] All environment variables set (use secrets manager)
- [ ] `ENCRYPTION_MASTER_KEY` stored securely (NOT in repo)
- [ ] `DEPLOYER_PRIVATE_KEY` stored securely (NOT in repo)
- [ ] `JWT_SECRET` changed from default
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Tests passing: `npm test`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set to production frontend domain
- [ ] Logs monitored and stored
- [ ] Database backups configured
- [ ] SSL/TLS enabled (reverse proxy with HTTPS)
- [ ] Rate limiting configured (if using production load)
- [ ] Monitoring/alerting set up

## Troubleshooting

### Can't connect to database

```bash
# Check connection string
psql -U badge_user -d reputation_badge_db -h localhost -c "SELECT 1;"

# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check user has permissions
psql -U postgres -d reputation_badge_db -c "GRANT ALL ON SCHEMA public TO badge_user;"
```

### Migrations fail

```bash
# Reset database (DESTRUCTIVE - only for dev!)
npx prisma migrate reset --force

# Or deploy only (don't reset):
npx prisma migrate deploy
```

### Tests fail with "Database connection failed"

Ensure `.env.test` has correct `DATABASE_URL` (can be SQLite for testing):
```env
DATABASE_URL="file:./test.db"
# Or PostgreSQL test DB:
DATABASE_URL="postgresql://badge_user:password@localhost:5432/reputation_badge_test"
```

### Encryption errors

If you get "Failed to decrypt relayer private key":
- Check `ENCRYPTION_MASTER_KEY` matches the one used to encrypt
- If lost, generated keys are unrecoverable — recreate relayer wallets

## Security Notes

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive values
3. **Encrypt at rest**: Consider AWS KMS or HashiCorp Vault for production
4. **Rotate keys regularly** (JWT_SECRET, JWT tokens)
5. **Monitor logs** for unauthorized access attempts
6. **Rate limit** API endpoints (nginx, CloudFlare, etc.)
7. **Use HTTPS** in production (TLS/SSL)
8. **Backup database** regularly

## Useful Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Generate Prisma types
npx prisma generate

# Check database schema
npx prisma studio  # Opens UI at localhost:5555

# Reset database (DEV ONLY)
npx prisma migrate reset --force
```

## Next: Frontend (Phase 3)

Once backend is running, proceed to frontend setup at:
`/reputacion-dapp/frontend/SETUP.md`

---

**Ready?** Test the API:

```bash
curl http://localhost:3000/health
```

If you see `{"status":"ok",...}`, you're good to go! 🚀
