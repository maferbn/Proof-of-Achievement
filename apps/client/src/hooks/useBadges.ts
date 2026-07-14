import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { badgesApi } from '../api/badges.api';
import type { BadgeDefinitionInput } from '../api/badges.api';
import {
  badgeDefinitionKey,
  groupBadgesKey,
  groupKey,
  groupsKey,
  memberBadgesKey,
} from './queryKeys';
import type { BadgeDefinition, MemberBadgesResponse } from '../types/api';

/** GET /groups/:groupId/badges — public. */
export function useGroupBadges(groupId: string | undefined) {
  return useQuery<BadgeDefinition[]>({
    queryKey: groupBadgesKey(groupId ?? ''),
    queryFn: () => badgesApi.listByGroup(groupId as string),
    enabled: !!groupId,
  });
}

/** GET /badge-definitions/:id — public. */
export function useBadgeDefinition(id: string | undefined) {
  return useQuery<BadgeDefinition>({
    queryKey: badgeDefinitionKey(id ?? ''),
    queryFn: () => badgesApi.getDefinition(id as string),
    enabled: !!id,
  });
}

/** GET /members/:memberId/badges — public. */
export function useMemberBadges(memberId: string | undefined) {
  return useQuery<MemberBadgesResponse>({
    queryKey: memberBadgesKey(memberId ?? ''),
    queryFn: () => badgesApi.listByMember(memberId as string),
    enabled: !!memberId,
  });
}

export function useCreateBadgeDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BadgeDefinitionInput) => badgesApi.createDefinition(input),
    onSuccess: (badge) => {
      qc.invalidateQueries({ queryKey: groupBadgesKey(badge.groupId) });
      qc.invalidateQueries({ queryKey: groupKey(badge.groupId) });
      qc.invalidateQueries({ queryKey: groupsKey });
    },
  });
}

/** Invalidate everything touched when a badge is awarded/verified/revoked. */
function invalidateAwardScopes(qc: ReturnType<typeof useQueryClient>, groupId?: string) {
  if (groupId) {
    qc.invalidateQueries({ queryKey: groupBadgesKey(groupId) });
    qc.invalidateQueries({ queryKey: groupKey(groupId) });
  } else {
    // Group unknown: refresh all group-badge queries.
    qc.invalidateQueries({ queryKey: ['groups'] });
  }
  qc.invalidateQueries({ queryKey: ['members'] });
}

export function useAwardBadge(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      badgeDefinitionId,
      memberId,
    }: {
      badgeDefinitionId: string;
      memberId: string;
    }) => badgesApi.award(badgeDefinitionId, memberId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: badgeDefinitionKey(res.badgeAward.badgeDefinitionId) });
      invalidateAwardScopes(qc, groupId);
    },
  });
}

export function useVerifyReceipt(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (badgeAwardId: string) => badgesApi.verifyReceipt(badgeAwardId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: badgeDefinitionKey(res.badgeAward.badgeDefinitionId) });
      invalidateAwardScopes(qc, groupId);
    },
  });
}

export function useRevokeBadge(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (badgeAwardId: string) => badgesApi.revoke(badgeAwardId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: badgeDefinitionKey(res.badgeAward.badgeDefinitionId) });
      invalidateAwardScopes(qc, groupId);
    },
  });
}
