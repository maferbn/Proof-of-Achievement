import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './auth-context';
import type { AuthStatus } from './auth-context';
import type { Admin } from '../types/api';
import { authApi } from '../api/auth.api';
import { configureApi } from '../api/client';
import { getSiweErrorMessage } from '../utils/errors';
import { relayerStatusKey } from '../hooks/queryKeys';

const STORAGE_KEY = 'poa.session';

interface StoredSession {
  token: string;
  admin: Admin;
  walletAddress: string;
}

/** Decode the `exp` (seconds) claim from a JWT without verifying it. */
function decodeExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const exp = decodeExp(token);
  return exp !== null && exp * 1000 <= Date.now();
}

function restoreSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || isExpired(parsed.token)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, status: accountStatus } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<StoredSession | null>(() => restoreSession());
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // Refs give the (mount-once) API config access to the latest values.
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const statusRef = useRef(status);
  statusRef.current = status;

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    queryClient.removeQueries({ queryKey: relayerStatusKey });
  }, [queryClient]);

  // Called by the HTTP client on any 401.
  const endSessionRef = useRef<() => void>(() => {});
  endSessionRef.current = () => {
    if (!sessionRef.current) return;
    clearSession();
    setStatus('expired');
  };

  useEffect(() => {
    configureApi({
      getToken: () => sessionRef.current?.token ?? null,
      onUnauthorized: () => endSessionRef.current(),
    });
  }, []);

  // Auto-expire exactly when the JWT lapses (nice "expired" UX without a request).
  useEffect(() => {
    if (!session) return;
    const exp = decodeExp(session.token);
    if (exp === null) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      endSessionRef.current();
      return;
    }
    const t = window.setTimeout(() => endSessionRef.current(), ms);
    return () => window.clearTimeout(t);
  }, [session]);

  // Reconcile session with wallet connection state.
  useEffect(() => {
    // Never clobber an in-flight sign-in.
    if (statusRef.current === 'authenticating') return;

    if (session) {
      if (accountStatus === 'connected') {
        if (address && address.toLowerCase() === session.walletAddress.toLowerCase()) {
          setStatus('authenticated');
        } else {
          // Wallet switched to a different account — end this session.
          clearSession();
          setStatus('unauthenticated');
        }
      } else if (accountStatus === 'disconnected') {
        clearSession();
        setStatus('disconnected');
      } else {
        // connecting / reconnecting: keep showing authenticated optimistically
        setStatus('authenticated');
      }
      return;
    }

    // No session
    if (accountStatus === 'connected') {
      setStatus((s) => (s === 'expired' ? 'expired' : 'unauthenticated'));
    } else if (accountStatus === 'disconnected') {
      setStatus((s) => (s === 'expired' ? 'expired' : 'disconnected'));
    } else {
      setStatus('loading');
    }
  }, [session, address, accountStatus, clearSession]);

  const signIn = useCallback(async () => {
    if (!address) {
      setError('Conecta tu wallet antes de iniciar sesión.');
      return;
    }
    setError(null);
    setStatus('authenticating');
    try {
      const { message } = await authApi.requestSiweMessage(address);

      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch {
        setStatus('unauthenticated');
        setError('Rechazaste la firma. Debes firmar el mensaje para iniciar sesión.');
        return;
      }

      const res = await authApi.verifySiwe(message, signature);
      const next: StoredSession = { token: res.token, admin: res.admin, walletAddress: address };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
      queryClient.setQueryData(relayerStatusKey, res.relayerStatus);
      setStatus('authenticated');
    } catch (e) {
      setStatus('unauthenticated');
      // Surface the real backend reason (nonce reuse/expiry, address mismatch,
      // service down…) instead of a blanket "signature failed" message.
      setError(getSiweErrorMessage(e));
    }
  }, [address, signMessageAsync, queryClient]);

  const logout = useCallback(() => {
    clearSession();
    setError(null);
    setStatus('disconnected');
    // Fully reset the wallet state so the user returns to Step 1 in a clean state.
    void disconnect();
  }, [clearSession, disconnect]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      status,
      admin: session?.admin ?? null,
      token: session?.token ?? null,
      address,
      isConnected: accountStatus === 'connected',
      isAuthenticated: status === 'authenticated' && !!session,
      error,
      signIn,
      logout,
      clearError,
    }),
    [status, session, address, accountStatus, error, signIn, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
