import { env } from '../config/env';

/**
 * Resolve an ipfs:// URI (or http/https URL) to an HTTP URL that a browser can
 * fetch. Handles `ipfs://CID`, `ipfs://CID/path`, and a redundant
 * `ipfs://ipfs/CID` form. Returns null for empty or unknown schemes.
 */
export function resolveIpfsUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const v = uri.trim();
  if (!v) return null;

  if (v.startsWith('ipfs://')) {
    const path = v.slice('ipfs://'.length).replace(/^ipfs\//, '');
    return `${env.ipfsGateway}${path}`;
  }
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  return null;
}

export function isIpfsUri(uri: string | null | undefined): boolean {
  return !!uri && uri.trim().startsWith('ipfs://');
}

/** File extensions we can safely treat as a direct image without fetching. */
export const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i;
