import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groups.api';
import type { MemberInput } from '../api/groups.api';
import { groupKey, groupsKey } from './queryKeys';

export function useAddMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberInput) => groupsApi.addMember(groupId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKey(groupId) });
      qc.invalidateQueries({ queryKey: groupsKey });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => groupsApi.removeMember(groupId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKey(groupId) });
      qc.invalidateQueries({ queryKey: groupsKey });
    },
  });
}
