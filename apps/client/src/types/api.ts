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
  validationRule?: ValidationRule;
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

/* ---------------- New backend capabilities (develop) ---------------- */

/** POST /badges/metadata — uploads image + metadata JSON to IPFS (Pinata). */
export interface BadgeMetadataUploadResponse {
  /** ipfs:// URI of the metadata JSON — stored as BadgeDefinition.imageURI. */
  metadataUri: string;
  /** HTTP gateway URL for the metadata JSON. */
  gatewayUrl: string;
  /** ipfs:// URI of the uploaded image, if one was provided. */
  imageUri?: string;
}

/** ERC-721-style metadata JSON that a BadgeDefinition.imageURI may point to. */
export interface BadgeMetadataJson {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

/** Evidence payload validated dynamically by the backend oracle. */
export interface Evidence {
  /** Free-form label chosen by the organization (e.g. "Certificado de curso"). */
  type: string;
  data: Record<string, unknown>;
}

/** Supported field types for dynamic evidence schemas. */
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';

/** Constraints applied to a field value depending on its type. */
export interface FieldConstraint {
  /** Number: inclusive minimum. */
  min?: number;
  /** Number: inclusive maximum. */
  max?: number;
  /** Date: must be in the past. */
  past?: boolean;
  /** Date: must be in the future. */
  future?: boolean;
  /** Text: regex pattern the value must match. */
  pattern?: string;
}

/** A field that makes up a dynamic evidence schema. */
export interface FieldDefinition {
  /** Machine name used as key in `Evidence.data`. */
  name: string;
  /** Human-readable label shown in forms. */
  label: string;
  type: FieldType;
  required: boolean;
  constraints?: FieldConstraint;
}

/** Dynamic validation rule: a list of fields with optional constraints. */
export interface ValidationRuleConfig {
  fields: FieldDefinition[];
}

export interface ValidationRule {
  id: string;
  badgeDefinitionId: string;
  /** Free-form label (e.g. "Aprobar examen", "Ganar partida"). */
  evidenceType: string;
  rules: ValidationRuleConfig;
  externalVerifierUrl?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateValidationRuleInput {
  evidenceType: string;
  rules: ValidationRuleConfig;
  externalVerifierUrl?: string;
}

export interface UpdateValidationRuleInput {
  evidenceType?: string;
  rules?: ValidationRuleConfig;
  externalVerifierUrl?: string | null;
  enabled?: boolean;
}

/** POST /badge-definitions/:id/validate */
export interface ValidationResponse {
  valid: boolean;
  reason?: string;
  validatedAt?: string;
  memberId: string;
  badgeDefinitionId: string;
  message: string;
}

/** GET /health — public. Fields beyond `status` may be absent on older servers. */
export interface HealthResponse {
  status: string;
  timestamp?: string;
  eventIndexer?: string;
  ipfs?: string;
}
