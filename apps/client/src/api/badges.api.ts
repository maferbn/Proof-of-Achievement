import { apiClient } from './client';
import type {
  AwardResponse,
  BadgeDefinition,
  MemberBadgesResponse,
  RevokeResponse,
  VerifyReceiptResponse,
} from '../types/api';

export interface BadgeDefinitionInput {
  groupId: string;
  name: string;
  description?: string;
  imageURI?: string;
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

  /** POST /badge-definitions/:id/award — protected. */
  award: (badgeDefinitionId: string, memberId: string) =>
    apiClient.post<AwardResponse>(`/badge-definitions/${badgeDefinitionId}/award`, { memberId }),

  /** POST /badge-awards/:id/verify-receipt — protected. */
  verifyReceipt: (badgeAwardId: string) =>
    apiClient.post<VerifyReceiptResponse>(`/badge-awards/${badgeAwardId}/verify-receipt`),

  /** POST /badge-awards/:id/revoke — protected. */
  revoke: (badgeAwardId: string) =>
    apiClient.post<RevokeResponse>(`/badge-awards/${badgeAwardId}/revoke`),
};
