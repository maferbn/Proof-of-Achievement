import { createContext, useContext } from 'react';
import type { Admin } from '../types/api';

export type AuthStatus =
  | 'loading' // resolving wallet / restoring session
  | 'disconnected' // no wallet connected
  | 'unauthenticated' // wallet connected, no valid session
  | 'authenticating' // SIWE flow in progress
  | 'authenticated' // valid JWT + admin
  | 'expired'; // session expired (JWT invalid / 401)

export interface AuthContextValue {
  status: AuthStatus;
  admin: Admin | null;
  token: string | null;
  /** Connected wallet address (from wagmi). */
  address?: string;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
