import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Livestock } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useClientStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get sale-ready animals
      const { data: saleReady, error: saleError } = await supabase
        .from('livestock')
        .select('id')
        .eq('sale_ready', true)
        .eq('status', 'active');

      if (saleError) throw saleError;

      // Get recently added
      const { data: recent, error: recentError } = await supabase
        .from('livestock')
        .select('id')
        .eq('sale_ready', true)
        .eq('status', 'active')
        .gte('created_at', weekAgo.toISOString());

      if (recentError) throw recentError;

      // Get user's interests
      const { data: interests, error: interestsError } = await supabase
        .from('animal_interests')
        .select('id')
        .eq('client_id', user?.id);

      if (interestsError) throw interestsError;

      return {
        availableAnimals: saleReady?.length ?? 0,
        myInterests: interests?.length ?? 0,
        recentlyAdded: recent?.length ?? 0,
      };
    },
    enabled: !!user,
  });
}

export function useSaleReadyAnimals(limit = 20) {
  return useQuery({
    queryKey: ['sale-ready-animals', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('sale_ready', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Livestock[];
    },
  });
}

export function useMyInterests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-interests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animal_interests')
        .select('*, livestock(*)')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useExpressInterest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ animalId, message }: { animalId: string; message?: string }) => {
      const { data, error } = await supabase
        .from('animal_interests')
        .insert({
          animal_id: animalId,
          client_id: user?.id,
          message: message || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interests'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
      toast.success('Interest expressed! The farmer will be notified.');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('You have already expressed interest in this animal');
      } else {
        toast.error(error.message || 'Failed to express interest');
      }
    },
  });
}
