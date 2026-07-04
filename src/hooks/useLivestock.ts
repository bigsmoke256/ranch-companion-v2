import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Livestock, HealthRecord, BreedingRecord, MovementRecord, ActivityLog } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Helper to get user's farm_id
async function getUserFarmId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('farm_members')
    .select('farm_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  
  return data?.farm_id || null;
}

// Livestock queries
export function useLivestockList() {
  return useQuery({
    queryKey: ['livestock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Livestock[];
    },
  });
}

export function useLivestockById(id: string) {
  return useQuery({
    queryKey: ['livestock', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Livestock | null;
    },
    enabled: !!id,
  });
}

export function useCreateLivestock() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (livestock: {
      animal_id: string;
      breed: string;
      age: number;
      sex: string;
      status?: string;
      notes?: string | null;
      sale_ready?: boolean;
      farm_id?: string | null;
    }) => {
      // Get user's farm_id if not provided
      let farmId = livestock.farm_id;
      if (!farmId && user?.id) {
        farmId = await getUserFarmId(user.id);
      }

      const { data, error } = await supabase
        .from('livestock')
        .insert({ 
          ...livestock, 
          created_by: user?.id,
          farm_id: farmId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Livestock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Animal added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add animal');
    },
  });
}

export function useUpdateLivestock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Livestock> & { id: string }) => {
      const { data, error } = await supabase
        .from('livestock')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Livestock;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['livestock', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Animal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update animal');
    },
  });
}

export function useDeleteLivestock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('livestock')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Animal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete animal');
    },
  });
}

// Health records
export function useHealthRecords(livestockId: string) {
  return useQuery({
    queryKey: ['health-records', livestockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('record_date', { ascending: false });
      
      if (error) throw error;
      return data as HealthRecord[];
    },
    enabled: !!livestockId,
  });
}

export function useCreateHealthRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: {
      livestock_id: string;
      record_type: string;
      description: string;
      performed_by?: string | null;
      record_date?: string;
      farm_id?: string | null;
    }) => {
      // Get user's farm_id if not provided
      let farmId = record.farm_id;
      if (!farmId && user?.id) {
        farmId = await getUserFarmId(user.id);
      }

      const { data, error } = await supabase
        .from('health_records')
        .insert({ 
          ...record, 
          created_by: user?.id,
          farm_id: farmId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as HealthRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['health-records', data.livestock_id] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success('Health record added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add health record');
    },
  });
}

export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HealthRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('health_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as HealthRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['health-records', data.livestock_id] });
      toast.success('Health record updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update health record');
    },
  });
}

export function useDeleteHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, livestockId }: { id: string; livestockId: string }) => {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { livestockId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['health-records', data.livestockId] });
      toast.success('Health record deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete health record');
    },
  });
}

// Breeding records
export function useBreedingRecords(livestockId: string) {
  return useQuery({
    queryKey: ['breeding-records', livestockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeding_records')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('breeding_date', { ascending: false });
      
      if (error) throw error;
      return data as BreedingRecord[];
    },
    enabled: !!livestockId,
  });
}

export function useCreateBreedingRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: {
      livestock_id: string;
      breeding_date: string;
      partner_animal_id?: string | null;
      expected_due_date?: string | null;
      actual_birth_date?: string | null;
      offspring_count?: number | null;
      outcome?: string | null;
      notes?: string | null;
      farm_id?: string | null;
    }) => {
      // Get user's farm_id if not provided
      let farmId = record.farm_id;
      if (!farmId && user?.id) {
        farmId = await getUserFarmId(user.id);
      }

      const { data, error } = await supabase
        .from('breeding_records')
        .insert({ 
          ...record, 
          created_by: user?.id,
          farm_id: farmId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as BreedingRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records', data.livestock_id] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success('Breeding record added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add breeding record');
    },
  });
}

export function useUpdateBreedingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BreedingRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('breeding_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BreedingRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records', data.livestock_id] });
      toast.success('Breeding record updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update breeding record');
    },
  });
}

export function useDeleteBreedingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, livestockId }: { id: string; livestockId: string }) => {
      const { error } = await supabase
        .from('breeding_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { livestockId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['breeding-records', data.livestockId] });
      toast.success('Breeding record deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete breeding record');
    },
  });
}

// Movement records
export function useMovementRecords(livestockId: string) {
  return useQuery({
    queryKey: ['movement-records', livestockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movement_records')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('movement_date', { ascending: false });
      
      if (error) throw error;
      return data as MovementRecord[];
    },
    enabled: !!livestockId,
  });
}

export function useCreateMovementRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (record: Omit<MovementRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'> & { farm_id?: string | null }) => {
      // Get user's farm_id if not provided
      let farmId = record.farm_id;
      if (!farmId && user?.id) {
        farmId = await getUserFarmId(user.id);
      }

      const { data, error } = await supabase
        .from('movement_records')
        .insert({ 
          ...record, 
          created_by: user?.id,
          farm_id: farmId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as MovementRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movement-records', data.livestock_id] });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      toast.success('Movement record added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add movement record');
    },
  });
}

export function useUpdateMovementRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MovementRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('movement_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as MovementRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movement-records', data.livestock_id] });
      toast.success('Movement record updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update movement record');
    },
  });
}

export function useDeleteMovementRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, livestockId }: { id: string; livestockId: string }) => {
      const { error } = await supabase
        .from('movement_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { livestockId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movement-records', data.livestockId] });
      toast.success('Movement record deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete movement record');
    },
  });
}

// Activity log
export function useActivityLog(limit = 20) {
  return useQuery({
    queryKey: ['activity-log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

export function useLivestockActivityLog(livestockId: string) {
  return useQuery({
    queryKey: ['activity-log', 'livestock', livestockId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!livestockId,
  });
}

// Dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: livestock, error: livestockError } = await supabase
        .from('livestock')
        .select('breed, sex, status');
      
      if (livestockError) throw livestockError;

      const { data: activity, error: activityError } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (activityError) throw activityError;

      const activeLivestock = livestock?.filter(l => l.status === 'active') || [];
      
      // Calculate breed breakdown
      const breedCounts: Record<string, number> = {};
      activeLivestock.forEach(l => {
        breedCounts[l.breed] = (breedCounts[l.breed] || 0) + 1;
      });
      const breedBreakdown = Object.entries(breedCounts).map(([breed, count]) => ({ breed, count }));

      // Calculate sex breakdown
      const sexCounts: Record<string, number> = {};
      activeLivestock.forEach(l => {
        sexCounts[l.sex] = (sexCounts[l.sex] || 0) + 1;
      });
      const sexBreakdown = Object.entries(sexCounts).map(([sex, count]) => ({ sex, count }));

      return {
        totalLivestock: activeLivestock.length,
        breedBreakdown,
        sexBreakdown,
        recentActivity: activity as ActivityLog[],
      };
    },
  });
}
