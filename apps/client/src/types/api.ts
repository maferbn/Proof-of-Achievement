/**
 * Frontend types mirroring the *actual* Express + Prisma API responses.
 *
 * NOTE: `@repo/shared-types` describes an older, different data model
 * (Organization/Project/Achievement) that does not match the live API,
 * so we define the real shapes here instead. Dates arrive as ISO strings.
 */

export type Address = `0x${string}`;

/** BadgeAward.status values used across the API. */
export type BadgeAwardStatus = 'pending' | 'confirmed' | 'failed' | 'revoked';

/** On-chain verification outcome returned by verify-receipt. */
export type VerifyStatus = 'pending' | 'confirmed' | 'failed';

export interface Admin {
  id: string;
  walletAddress: string;
  displayName: string | null;
}

export interface RelayerStatus {
  relayerAddress: string;
  isActive: boolean;
  hasRoleOnChain: boolean;
  minterRoleGrantedAt: string | null;
  minterRoleRevokedAt: string | null;
  createdAt: string;
}

export interface SiweMessageResponse {
  message: string;
  nonce: string;
}

export interface SiweVerifyResponse {
  token: string;
  admin: Admin;
  relayerStatus: RelayerStatus | null;
}

export interface InitializeMinterResponse {
  message: string;
  transactionHash: string;
  relayerAddress: string;
}

/** Counters included on list/detail responses. */
export interface GroupCount {
  members: number;
  badgeDefinitions: number;
}

export interface Group {
  id: string;
  adminId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: GroupCount;
  members?: Member[];
  badgeDefinitions?: BadgeDefinition[];
}

export interface Member {
  id: string;
  groupId: string;
  walletAddress: string;
  displayName: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  badgeAwards?: BadgeAward[];
}

export interface BadgeDefinition {
  id: string;
  adminId: string;
  groupId: string;
  name: string;
  description: string | null;
  imageURI: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { badgeAwards: number };
  badgeAwards?: BadgeAward[];
  group?: Group;
}

export interface BadgeAward {
  id: string;
  badgeDefinitionId: string;
  memberId: string;
  /** BigInt on-chain; serialized defensively as string | number | null. */
  onChainTokenId: string | number | null;
  transactionHash: string | null;
  status: BadgeAwardStatus;
  failureReason: string | null;
  awardedAt: string;
  confirmedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  badgeDefinition?: BadgeDefinition;
}

/** POST /badge-definitions/:id/award */
export interface AwardResponse {
  badgeAward: BadgeAward;
  message: string;
}

/** POST /badge-awards/:id/verify-receipt */
export interface VerifyReceiptResponse {
  status: VerifyStatus;
  message: string;
  badgeAward: BadgeAward;
}

/** POST /badge-awards/:id/revoke */
export interface RevokeResponse {
  message: string;
  transactionHash: string;
  badgeAward: BadgeAward;
}

/** GET /members/:memberId/badges */
export interface MemberBadgesResponse {
  member: Pick<Member, 'id' | 'walletAddress' | 'displayName'>;
  badges: BadgeAward[];
}
