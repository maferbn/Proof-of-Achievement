import { apiClient } from './client';
import type { Group, Member } from '../types/api';

export interface GroupInput {
  name: string;
  description?: string;
}

export interface MemberInput {
  walletAddress: string;
  displayName?: string;
}

export const groupsApi = {
  /** GET /groups — protected. Includes _count. */
  list: () => apiClient.get<Group[]>('/groups'),

  /** GET /groups/:id — public. Includes members[] + badgeDefinitions[]. */
  get: (id: string) => apiClient.get<Group>(`/groups/${id}`, { auth: false }),

  /** POST /groups — protected. */
  create: (input: GroupInput) => apiClient.post<Group>('/groups', input),

  /** PUT /groups/:id — protected. */
  update: (id: string, input: GroupInput) => apiClient.put<Group>(`/groups/${id}`, input),

  /** DELETE /groups/:id — protected. */
  remove: (id: string) => apiClient.delete<{ message: string }>(`/groups/${id}`),

  /** POST /groups/:id/members — protected. */
  addMember: (groupId: string, input: MemberInput) =>
    apiClient.post<Member>(`/groups/${groupId}/members`, input),

  /** DELETE /groups/:id/members/:memberId — protected. */
  removeMember: (groupId: string, memberId: string) =>
    apiClient.delete<{ message: string }>(`/groups/${groupId}/members/${memberId}`),
};
