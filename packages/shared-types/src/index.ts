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
