import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HealthRecord } from '@/types/database';

export function useVetStats() {
  return useQuery({
    queryKey: ['vet-stats'],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: records, error } = await supabase
        .from('health_records')
        .select('*')
        .gte('created_at', weekAgo.toISOString());

      if (error) throw error;

      const underTreatment = records?.filter(r => r.record_type === 'treatment').length ?? 0;
      const followUpsDue = records?.filter(r => r.record_type === 'follow_up').length ?? 0;
      const recentTreatments = records?.filter(r => 
        ['treatment', 'vaccination'].includes(r.record_type)
      ).length ?? 0;

      return {
        underTreatment,
        followUpsDue,
        recentTreatments,
        pendingReviews: 0,
      };
    },
  });
}

export function useHealthRecordsForVet(limit = 20) {
  return useQuery({
    queryKey: ['vet-health-records', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as HealthRecord[];
    },
  });
}
