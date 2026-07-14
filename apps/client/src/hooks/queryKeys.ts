/** Centralized React Query keys for consistent caching & invalidation. */

export const relayerStatusKey = ['relayer-status'] as const;

export const groupsKey = ['groups'] as const;
export const groupKey = (id: string) => ['groups', id] as const;

/** Public badges of a group (definitions + awards). */
export const groupBadgesKey = (groupId: string) => ['groups', groupId, 'badges'] as const;

export const badgeDefinitionKey = (id: string) => ['badge-definitions', id] as const;

export const memberBadgesKey = (memberId: string) => ['members', memberId, 'badges'] as const;
