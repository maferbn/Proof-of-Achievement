import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'SEPOLIA_RPC_URL',
  'REPUTATION_BADGE_CONTRACT_ADDRESS',
  'DEPLOYER_PRIVATE_KEY',
  'ENCRYPTION_MASTER_KEY',
  'JWT_SECRET',
];

const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Blockchain
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL!,
  reputationBadgeContractAddress: process.env.REPUTATION_BADGE_CONTRACT_ADDRESS!,
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY!,

  // Encryption (for relayer wallet private keys)
  encryptionMasterKey: process.env.ENCRYPTION_MASTER_KEY!,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // IPFS (Pinata) — optional, IPFS features skip gracefully if not set
  pinataJwt: process.env.PINATA_JWT || undefined,
  pinataGateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',

  // Event Indexer
  indexerPollingIntervalMs: parseInt(process.env.INDEXER_POLLING_INTERVAL_MS || '30000', 10),
};
