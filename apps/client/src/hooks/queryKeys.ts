/** Centralized React Query keys for consistent caching & invalidation. */

export const relayerStatusKey = ['relayer-status'] as const;

export const groupsKey = ['groups'] as const;
export const groupKey = (id: string) => ['groups', id] as const;

/** Public badges of a group (definitions + awards). */
export const groupBadgesKey = (groupId: string) => ['groups', groupId, 'badges'] as const;

export const badgeDefinitionKey = (id: string) => ['badge-definitions', id] as const;

export const memberBadgesKey = (memberId: string) => ['members', memberId, 'badges'] as const;

/** Backend health / service status. */
export const healthKey = ['health'] as const;

/** Resolved badge image for a given imageURI (metadata JSON or direct image). */
export const ipfsMetadataKey = (uri: string) => ['ipfs-metadata', uri] as const;
