import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Farm, RoleRequest, FarmAssignment, AuditLog, Profile } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Type for tables that exist in new schema but haven't been added to the
// generated Supabase types yet. This is an intentional, documented escape
// hatch (not a stray `any`) — remove once `supabase gen types` is re-run
// against the current schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// Farm CRUD hooks
export function useFarms() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['farms', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as SupabaseAny)
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Farm[];
    },
    enabled: !!user,
  });
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: ['farm', id],
    queryFn: async () => {
      const { data, error } = await (supabase as SupabaseAny)
        .from('farms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Farm;
    },
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (farm: { name: string; location?: string; description?: string }) => {
      const { data, error } = await (supabase as SupabaseAny)
        .from('farms')
        .insert({
          ...farm,
          owner_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Farm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success('Farm created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create farm');
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Farm> & { id: string }) => {
      const { data, error } = await (supabase as SupabaseAny)
        .from('farms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Farm;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['farm', data.id] });
      toast.success('Farm updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update farm');
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as SupabaseAny).from('farms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast.success('Farm deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete farm');
    },
  });
}

// Role Requests hooks
export function useRoleRequests(farmId?: string) {
  return useQuery({
    queryKey: ['role-requests', farmId],
    queryFn: async () => {
      let query = (supabase as SupabaseAny)
        .from('role_requests')
        .select(`
          *,
          profiles:user_id (id, user_id, full_name, role)
        `)
        .order('created_at', { ascending: false });
      
      if (farmId) {
        query = query.eq('farm_id', farmId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RoleRequest[];
    },
  });
}

export function usePendingRoleRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pending-role-requests', user?.id],
    queryFn: async () => {
      // First get farms owned by user
      const { data: farms, error: farmsError } = await (supabase as SupabaseAny)
        .from('farms')
        .select('id')
        .eq('owner_id', user?.id);
      
      if (farmsError) throw farmsError;
      
      const farmIds = farms?.map((f: Farm) => f.id) || [];
      
      if (farmIds.length === 0) return [];
      
      const { data, error } = await (supabase as SupabaseAny)
        .from('role_requests')
        .select(`
          *,
          profiles:user_id (id, user_id, full_name, role)
        `)
        .in('farm_id', farmIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RoleRequest[];
    },
    enabled: !!user,
  });
}

export function useApproveRoleRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      // SECURITY: reviewer_id removed - server uses auth.uid() directly
      const { data, error } = await (supabase as SupabaseAny)
        .rpc('approve_role_request', {
          request_id: requestId,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-role-requests'] });
      queryClient.invalidateQueries({ queryKey: ['farm-assignments'] });
      toast.success('Role request approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
}

export function useRejectRoleRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      // SECURITY: reviewer_id removed - server uses auth.uid() directly
      const { data, error } = await (supabase as SupabaseAny)
        .rpc('reject_role_request', {
          request_id: requestId,
          reason: reason,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-role-requests'] });
      toast.success('Role request rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
}

// Farm Assignments hooks
export function useFarmAssignments(farmId?: string) {
  return useQuery({
    queryKey: ['farm-assignments', farmId],
    queryFn: async () => {
      let query = (supabase as SupabaseAny)
        .from('farm_assignments')
        .select(`
          *,
          profiles:user_id (id, user_id, full_name, role)
        `)
        .order('created_at', { ascending: false });
      
      if (farmId) {
        query = query.eq('farm_id', farmId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FarmAssignment[];
    },
  });
}

export function useRevokeAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await (supabase as SupabaseAny)
        .from('farm_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-assignments'] });
      toast.success('Access revoked successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke access');
    },
  });
}

// Audit Logs hooks
export function useAuditLogs(farmId?: string) {
  return useQuery({
    queryKey: ['audit-logs', farmId],
    queryFn: async () => {
      let query = (supabase as SupabaseAny)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (farmId) {
        query = query.eq('farm_id', farmId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

export function useLogAudit() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (log: {
      farm_id?: string;
      action: string;
      entity_type: string;
      entity_id?: string;
      details?: Record<string, unknown>;
    }) => {
      const { error } = await (supabase as SupabaseAny)
        .from('audit_logs')
        .insert({
          ...log,
          user_id: user?.id,
        });
      
      if (error) throw error;
    },
  });
}

// Get user's profile with full name
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!userId,
  });
}
