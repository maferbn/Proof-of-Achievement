import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../api/health.api';
import { healthKey } from './queryKeys';
import type { HealthResponse } from '../types/api';

/**
 * GET /health — polled every 30s. Isolated from the rest of the UI: a failure
 * simply surfaces as `isError` (backend offline) without breaking the page.
 */
export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: healthKey,
    queryFn: () => healthApi.get(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 10_000,
  });
}
