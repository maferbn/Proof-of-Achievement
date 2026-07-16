import { apiClient } from './client';
import type {
  InitializeMinterResponse,
  RelayerStatus,
  SiweMessageResponse,
  SiweVerifyResponse,
} from '../types/api';

export const authApi = {
  /** POST /auth/siwe-message — public. */
  requestSiweMessage: (address: string) =>
    apiClient.post<SiweMessageResponse>('/auth/siwe-message', { address }, { auth: false }),

  /** POST /auth/siwe-verify — public. Returns JWT + admin + relayer status. */
  verifySiwe: (message: string, signature: string) =>
    apiClient.post<SiweVerifyResponse>(
      '/auth/siwe-verify',
      { message, signature },
      { auth: false },
    ),

  /** GET /auth/relayer-status — protected. */
  getRelayerStatus: () => apiClient.get<RelayerStatus>('/auth/relayer-status'),

  /** POST /auth/initialize-minter-role — protected. */
  initializeMinterRole: () =>
    apiClient.post<InitializeMinterResponse>('/auth/initialize-minter-role'),
};
