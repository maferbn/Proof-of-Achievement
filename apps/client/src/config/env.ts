/**
 * Centralized runtime configuration derived from Vite env vars.
 * The backend listens on :3000 by default and its CORS default origin
 * is http://localhost:3001, so the client dev server runs on 3001.
 */

const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';

export const env = {
  /** Base URL of the Express API (no trailing slash). */
  apiUrl: rawApiUrl.replace(/\/+$/, ''),
  /** Deployed ReputationBadge contract address (display / explorer only). */
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || '',
  /** Target chain id — Sepolia (11155111) by default. */
  chainId: Number(import.meta.env.VITE_CHAIN_ID) || 11155111,
  /** WalletConnect project id (falls back to a public demo id). */
  walletConnectProjectId:
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim() || 'proof_of_achievement_demo',
} as const;

/** Block explorer base per chain id (used for tx / address links). */
const EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
};

export function explorerTxUrl(hash: string): string {
  const base = EXPLORERS[env.chainId];
  return base ? `${base}/tx/${hash}` : '';
}

export function explorerAddressUrl(address: string): string {
  const base = EXPLORERS[env.chainId];
  return base ? `${base}/address/${address}` : '';
}

export function explorerTokenUrl(tokenId: string | number): string {
  const base = EXPLORERS[env.chainId];
  if (!base || !env.contractAddress) return '';
  return `${base}/token/${env.contractAddress}?a=${tokenId}`;
}
