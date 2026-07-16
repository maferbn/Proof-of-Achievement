import { apiClient } from './client';
import type { HealthResponse } from '../types/api';

export const healthApi = {
  /** GET /health — public. */
  get: () => apiClient.get<HealthResponse>('/health', { auth: false }),
};
