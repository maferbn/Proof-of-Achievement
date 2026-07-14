import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import { sepolia, localhost } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import App from './App.tsx';

import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

// Build-safe configurations using fallback values if env vars are not set yet
const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || undefined;

const config = getDefaultConfig({
  appName: 'SBT Platform',
  projectId: 'YOUR_PROJECT_ID_OR_DEFAULT', // Normally obtained from WalletConnect
  chains: [sepolia, localhost],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrl),
    [localhost.id]: http(),
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
