import { useQuery } from '@tanstack/react-query';
import { ipfsMetadataKey } from './queryKeys';
import { resolveIpfsUri, IMAGE_EXTENSION } from '../utils/ipfs';
import type { BadgeMetadataJson } from '../types/api';

/**
 * Resolves a BadgeDefinition.imageURI to a displayable image URL.
 *
 * The URI can be a direct image (ipfs://CID or https://…/x.png) OR an ERC-721
 * metadata JSON (ipfs://CID) whose `image` field points to the real image. We
 * do NOT assume every ipfs:// is an image: URIs without an image extension are
 * fetched once and, if they parse as JSON with an `image`, that image is used.
 *
 * Cached forever (IPFS content is immutable) so it never re-fetches or loops.
 */
async function resolveBadgeImage(uri: string): Promise<string | null> {
  const url = resolveIpfsUri(uri);
  if (!url) return null;

  // Clear image extension → use directly, no network needed.
  const withoutQuery = url.split('?')[0];
  if (IMAGE_EXTENSION.test(withoutQuery)) return url;

  // Otherwise fetch once and inspect: metadata JSON vs. raw image.
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    // Network/CORS issue — let the <img> try the URL and fall back on error.
    return url;
  }
  if (!res.ok) return url;

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.startsWith('image/')) return url;

  let text: string;
  try {
    text = await res.text();
  } catch {
    return url;
  }

  try {
    const json = JSON.parse(text) as BadgeMetadataJson;
    if (json && typeof json.image === 'string' && json.image.trim()) {
      return resolveIpfsUri(json.image) ?? url;
    }
  } catch {
    // Not JSON — treat the URL itself as the image.
  }
  return url;
}

/** Returns the resolved image `src` for a badge imageURI (or null). */
export function useResolvedBadgeImage(uri: string | null | undefined) {
  return useQuery<string | null>({
    queryKey: ipfsMetadataKey(uri ?? ''),
    queryFn: () => resolveBadgeImage(uri as string),
    enabled: !!uri,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
