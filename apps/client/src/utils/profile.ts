/** Helpers for public member-profile links (/profile/:memberId). */

export function profilePath(memberId: string): string {
  return `/profile/${memberId}`;
}

/** Absolute URL an organization can share with a recipient. */
export function profileUrl(memberId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${profilePath(memberId)}`;
}

/**
 * Extracts a memberId from user input: a full profile URL, a "/profile/<id>"
 * (or "/perfil/<id>") path, or a raw id. Returns null if nothing usable.
 */
export function parseProfileInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const match = value.match(/\/(?:profile|perfil)\/([^/?#\s]+)/i);
  if (match) return match[1];

  // A bare id: no scheme, no slashes, no whitespace.
  if (!/[\s/]/.test(value) && !value.includes('://')) return value;

  return null;
}
