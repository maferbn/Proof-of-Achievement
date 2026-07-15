import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { ApiError } from '../api/client';
import { useAuth } from '../providers/auth-context';
import { relayerStatusKey } from './queryKeys';
import type { RelayerStatus } from '../types/api';

/** GET /auth/relayer-status — returns null when the relayer wallet is missing. */
export function useRelayerStatus() {
  const { isAuthenticated } = useAuth();
  return useQuery<RelayerStatus | null>({
    queryKey: relayerStatusKey,
    queryFn: async () => {
      try {
        return await authApi.getRelayerStatus();
      } catch (e) {
        if (e instanceof ApiError && e.isNotFound) return null;
        throw e;
      }
    },
    enabled: isAuthenticated,
  });
}

/** POST /auth/initialize-minter-role — grants MINTER_ROLE on-chain. */
export function useInitializeMinter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.initializeMinterRole(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: relayerStatusKey });
    },
  });
}
