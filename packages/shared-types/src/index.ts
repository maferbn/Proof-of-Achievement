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

export type EvidenceType =
  | 'course_completion'
  | 'game_win'
  | 'exam_pass'
  | 'contribution'
  | 'generic';

export interface Evidence {
  type: EvidenceType;
  data: Record<string, unknown>;
  signature?: string;
}

export interface ValidationRuleConfig {
  /** Generic / fallback rule. */
  requireData?: boolean;
  /** Course completion: require completion date to be in the past. */
  requirePastDate?: boolean;
  /** Game win: minimum score to pass. */
  minScore?: number;
  /** Game win: require a matchId field. */
  requireMatchId?: boolean;
  /** Exam pass: minimum passing score. */
  minPassingScore?: number;
  /** Exam pass: maximum allowed attempts (future). */
  maxAttempts?: number;
  /** Contribution: list of required field names. */
  requiredFields?: string[];
  /** External verifier API URL (future). */
  [key: string]: unknown;
}

export interface ValidationRule {
  id: string;
  badgeDefinitionId: string;
  evidenceType: EvidenceType;
  rules: ValidationRuleConfig;
  externalVerifierUrl?: string | null;
  enabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateValidationRuleInput {
  evidenceType: EvidenceType;
  rules: ValidationRuleConfig;
  externalVerifierUrl?: string;
}

export interface UpdateValidationRuleInput {
  evidenceType?: EvidenceType;
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
