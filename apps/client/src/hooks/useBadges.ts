import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { badgesApi } from '../api/badges.api';
import type { AwardInput, BadgeDefinitionInput, MetadataUploadInput } from '../api/badges.api';
import {
  badgeDefinitionKey,
  groupBadgesKey,
  groupKey,
  groupsKey,
  memberBadgesKey,
} from './queryKeys';
import type {
  BadgeAward,
  BadgeDefinition,
  Evidence,
  MemberBadgesResponse,
  UpdateValidationRuleInput,
  ValidationRule,
} from '../types/api';

/** Poll interval (ms) used while at least one award is still pending. */
const PENDING_POLL_MS = 5_000;

function anyPending(awards: BadgeAward[] | undefined): boolean {
  return !!awards?.some((a) => a.status === 'pending');
}

/** GET /groups/:groupId/badges — public. Polls while any award is pending. */
export function useGroupBadges(groupId: string | undefined) {
  return useQuery<BadgeDefinition[]>({
    queryKey: groupBadgesKey(groupId ?? ''),
    queryFn: () => badgesApi.listByGroup(groupId as string),
    enabled: !!groupId,
    refetchInterval: (query) => {
      const data = query.state.data as BadgeDefinition[] | undefined;
      const pending = data?.some((def) => anyPending(def.badgeAwards));
      return pending ? PENDING_POLL_MS : false;
    },
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

/** GET /members/:memberId/badges — public. Polls while any award is pending. */
export function useMemberBadges(memberId: string | undefined) {
  return useQuery<MemberBadgesResponse>({
    queryKey: memberBadgesKey(memberId ?? ''),
    queryFn: () => badgesApi.listByMember(memberId as string),
    enabled: !!memberId,
    refetchInterval: (query) => {
      const data = query.state.data as MemberBadgesResponse | undefined;
      return anyPending(data?.badges) ? PENDING_POLL_MS : false;
    },
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

/** POST /badges/metadata — uploads image + metadata JSON to IPFS. */
export function useUploadMetadata() {
  return useMutation({
    mutationFn: (input: MetadataUploadInput) => badgesApi.uploadMetadata(input),
  });
}

  /** GET /badge-definitions/:id/validation-rule — protected. */
  export function useValidationRule(badgeDefinitionId: string | undefined) {
    return useQuery<ValidationRule>({
      queryKey: ['validationRule', badgeDefinitionId ?? ''],
      queryFn: () => badgesApi.getValidationRule(badgeDefinitionId as string),
      enabled: !!badgeDefinitionId,
    });
  }

  /** PUT /badge-definitions/:id/validation-rule — protected. */
  export function useUpdateValidationRule() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({
        badgeDefinitionId,
        input,
      }: {
        badgeDefinitionId: string;
        input: UpdateValidationRuleInput;
      }) => badgesApi.updateValidationRule(badgeDefinitionId, input),
      onSuccess: (_, { badgeDefinitionId }) => {
        qc.invalidateQueries({ queryKey: ['validationRule', badgeDefinitionId] });
        qc.invalidateQueries({ queryKey: badgeDefinitionKey(badgeDefinitionId) });
      },
    });
  }

  /** POST /badge-definitions/:id/validate — oracle eligibility check (no state change). */
  export function useValidateEvidence() {
    return useMutation({
      mutationFn: ({
        badgeDefinitionId,
        memberId,
        evidence,
      }: {
        badgeDefinitionId: string;
        memberId: string;
        evidence: Evidence;
      }) => badgesApi.validate(badgeDefinitionId, { memberId, evidence }),
    });
  }

/** Invalidate everything touched when a badge is awarded/verified/revoked. */
function invalidateAwardScopes(
  qc: ReturnType<typeof useQueryClient>,
  groupId?: string,
  memberId?: string,
) {
  if (groupId) {
    qc.invalidateQueries({ queryKey: groupBadgesKey(groupId) });
    qc.invalidateQueries({ queryKey: groupKey(groupId) });
  } else {
    // Group unknown: refresh all group-badge queries.
    qc.invalidateQueries({ queryKey: ['groups'] });
  }
  // Refresh the specific member's public profile when we know who it is.
  if (memberId) qc.invalidateQueries({ queryKey: memberBadgesKey(memberId) });
  else qc.invalidateQueries({ queryKey: ['members'] });
}

export function useAwardBadge(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      badgeDefinitionId,
      memberId,
      evidence,
    }: {
      badgeDefinitionId: string;
      memberId: string;
      evidence: Evidence;
    }) => badgesApi.award(badgeDefinitionId, { memberId, evidence } as AwardInput),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: badgeDefinitionKey(res.badgeAward.badgeDefinitionId) });
      invalidateAwardScopes(qc, groupId, res.badgeAward.memberId);
    },
  });
}

export function useVerifyReceipt(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (badgeAwardId: string) => badgesApi.verifyReceipt(badgeAwardId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: badgeDefinitionKey(res.badgeAward.badgeDefinitionId) });
      invalidateAwardScopes(qc, groupId, res.badgeAward.memberId);
    },
  });
}

export function useRevokeBadge(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (badgeAwardId: string) => badgesApi.revoke(badgeAwardId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: badgeDefinitionKey(res.badgeAward.badgeDefinitionId) });
      invalidateAwardScopes(qc, groupId, res.badgeAward.memberId);
    },
  });
}
