// ============================================================
// Shared types for SBT Platform
// Used by both apps/api and apps/client
// ============================================================

// --- Core Entity Types ---

export interface Organization {
  id: string;
  name: string;
  description?: string;
  walletAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  metadataUri?: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssuedAchievement {
  id: string;
  tokenId: number;
  achievementId: string;
  userAddress: string;
  validatorAddress: string;
  txHash: string;
  metadataUri: string;
  issuedAt: Date;
}

export interface User {
  id: string;
  walletAddress: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Oracle Validation Types ---

/** Evidence is any free-form label plus a data payload validated dynamically. */
export interface Evidence {
  /** Free-form label chosen by the organization (e.g. "Certificado de curso"). */
  type: string;
  data: Record<string, unknown>;
  signature?: string;
}

/** Supported field types for dynamic evidence rules. */
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

/** A field that makes up an evidence schema. */
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
  createdAt: Date | string;
  updatedAt: Date | string;
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

// --- API Response Types ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

// --- Contract-related Types ---

export type Address = `0x${string}`;

export interface MintBadgeRequest {
  recipientAddress: Address;
  achievementId: string;
  metadataUri: string;
}

export interface BadgeMintedEvent {
  to: Address;
  tokenId: bigint;
  tokenURI: string;
}

// --- Shared Contract ABI ---

export { REPUTATION_BADGE_ABI } from './abi';
