import { http } from 'wagmi';
import { sepolia, localhost } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { env } from './env';

const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL?.trim() || undefined;

/**
 * Wagmi + RainbowKit configuration.
 * Only used for wallet connection and SIWE message signing — the client
 * never writes to the contract directly (all writes go through the backend).
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Proof of Achievement',
  projectId: env.walletConnectProjectId,
  chains: [sepolia, localhost],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
    [localhost.id]: http(),
  },
  ssr: false,
});
