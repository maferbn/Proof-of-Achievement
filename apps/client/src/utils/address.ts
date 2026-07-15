import { isAddress, getAddress } from 'viem';
import type { Address } from '../types/api';

/** True if the string is a valid Ethereum address. */
export function isValidAddress(value: string): value is Address {
  return isAddress(value.trim());
}

/** Checksum an address; returns the original trimmed value if invalid. */
export function toChecksum(value: string): string {
  const v = value.trim();
  try {
    return getAddress(v);
  } catch {
    return v;
  }
}

/** 0x1234…abcd — shortens an address for display. */
export function truncateAddress(value: string | null | undefined, chars = 4): string {
  if (!value) return '—';
  if (value.length <= chars * 2 + 2) return value;
  return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`;
}

/** Shortens a tx hash for display. */
export function truncateHash(value: string | null | undefined, chars = 6): string {
  if (!value) return '—';
  if (value.length <= chars * 2 + 2) return value;
  return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`;
}
