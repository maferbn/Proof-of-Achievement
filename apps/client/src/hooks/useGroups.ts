import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groups.api';
import type { GroupInput } from '../api/groups.api';
import { useAuth } from '../providers/auth-context';
import { groupKey, groupsKey } from './queryKeys';
import type { Group } from '../types/api';

/** GET /groups — admin's groups with counters. */
export function useGroups() {
  const { isAuthenticated } = useAuth();
  return useQuery<Group[]>({
    queryKey: groupsKey,
    queryFn: () => groupsApi.list(),
    enabled: isAuthenticated,
  });
}

/** GET /groups/:id — public detail (members + badge definitions). */
export function useGroup(id: string | undefined) {
  return useQuery<Group>({
    queryKey: groupKey(id ?? ''),
    queryFn: () => groupsApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupInput) => groupsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupsKey }),
  });
}

export function useUpdateGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GroupInput) => groupsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsKey });
      qc.invalidateQueries({ queryKey: groupKey(id) });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: groupsKey });
      qc.removeQueries({ queryKey: groupKey(id) });
    },
  });
}
