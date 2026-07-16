import { apiClient } from './client';
import type {
  AwardResponse,
  BadgeDefinition,
  BadgeMetadataUploadResponse,
  CreateValidationRuleInput,
  Evidence,
  MemberBadgesResponse,
  RevokeResponse,
  UpdateValidationRuleInput,
  ValidationResponse,
  ValidationRule,
  VerifyReceiptResponse,
} from '../types/api';

export interface BadgeDefinitionInput {
  groupId: string;
  name: string;
  description?: string;
  imageURI?: string;
  validationRule: CreateValidationRuleInput;
}

export interface MetadataUploadInput {
  name: string;
  description?: string;
  image?: File;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface AwardInput {
  memberId: string;
  evidence: Evidence;
}

export const badgesApi = {
  /** POST /badge-definitions — protected. */
  createDefinition: (input: BadgeDefinitionInput) =>
    apiClient.post<BadgeDefinition>('/badge-definitions', input),

  /** GET /badge-definitions/:id — public. */
  getDefinition: (id: string) =>
    apiClient.get<BadgeDefinition>(`/badge-definitions/${id}`, { auth: false }),

  /** GET /groups/:groupId/badges — public. Definitions + awards(member). */
  listByGroup: (groupId: string) =>
    apiClient.get<BadgeDefinition[]>(`/groups/${groupId}/badges`, { auth: false }),

  /** GET /members/:memberId/badges — public. */
  listByMember: (memberId: string) =>
    apiClient.get<MemberBadgesResponse>(`/members/${memberId}/badges`, { auth: false }),

  /** POST /badges/metadata — protected, multipart. Uploads image + metadata to IPFS. */
  uploadMetadata: (input: MetadataUploadInput) => {
    const fd = new FormData();
    fd.append('name', input.name);
    if (input.description) fd.append('description', input.description);
    if (input.attributes && input.attributes.length > 0) {
      fd.append('attributes', JSON.stringify(input.attributes));
    }
    if (input.image) fd.append('image', input.image);
    return apiClient.post<BadgeMetadataUploadResponse>('/badges/metadata', fd);
  },

  /** GET /badge-definitions/:id/validation-rule — protected. */
  getValidationRule: (badgeDefinitionId: string) =>
    apiClient.get<ValidationRule>(`/badge-definitions/${badgeDefinitionId}/validation-rule`),

  /** PUT /badge-definitions/:id/validation-rule — protected. */
  updateValidationRule: (badgeDefinitionId: string, input: UpdateValidationRuleInput) =>
    apiClient.put<ValidationRule>(
      `/badge-definitions/${badgeDefinitionId}/validation-rule`,
      input,
    ),

  /** POST /badge-definitions/:id/validate — protected. Oracle eligibility check. */
  validate: (badgeDefinitionId: string, input: AwardInput) =>
    apiClient.post<ValidationResponse>(
      `/badge-definitions/${badgeDefinitionId}/validate`,
      input,
    ),

  /** POST /badge-definitions/:id/award — protected. Evidence is mandatory. */
  award: (badgeDefinitionId: string, input: AwardInput) =>
    apiClient.post<AwardResponse>(`/badge-definitions/${badgeDefinitionId}/award`, input),

  /** POST /badge-awards/:id/verify-receipt — protected (manual fallback). */
  verifyReceipt: (badgeAwardId: string) =>
    apiClient.post<VerifyReceiptResponse>(`/badge-awards/${badgeAwardId}/verify-receipt`),

  /** POST /badge-awards/:id/revoke — protected. */
  revoke: (badgeAwardId: string) =>
    apiClient.post<RevokeResponse>(`/badge-awards/${badgeAwardId}/revoke`),
};
