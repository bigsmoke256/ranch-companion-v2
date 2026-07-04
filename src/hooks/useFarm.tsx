import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Farm {
  id: string;
  farm_code: string;
  name: string;
  owner_id: string;
  location: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

interface FarmMember {
  id: string;
  farm_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FarmContextType {
  currentFarm: Farm | null;
  farmId: string | null;
  farmCode: string | null;
  isLoading: boolean;
  farms: Farm[];
  members: FarmMember[];
  switchFarm: (farmId: string) => void;
  refetch: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentFarmId, setCurrentFarmId] = useState<string | null>(null);

  // Fetch user's farms (owned or member of)
  const { data: farmsData, isLoading: farmsLoading, refetch } = useQuery({
    queryKey: ['user-farms', user?.id],
    queryFn: async () => {
      if (!user?.id) return { farms: [], memberships: [] };

      // Get farms user owns
      const { data: ownedFarms, error: ownedError } = await supabase
        .from('farms')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get farms user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('farm_members')
        .select('*, farms(*)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (memberError) throw memberError;

      // Combine unique farms
      const memberFarms = memberships
        ?.map(m => (m as { farms: Farm | null }).farms)
        .filter((f): f is Farm => Boolean(f)) || [];
      const allFarms = [...(ownedFarms || []), ...memberFarms];
      
      // Remove duplicates by ID
      const uniqueFarms = allFarms.reduce((acc: Farm[], farm) => {
        if (!acc.find(f => f.id === farm.id)) {
          acc.push(farm);
        }
        return acc;
      }, []);

      return { 
        farms: uniqueFarms as Farm[], 
        memberships: memberships as FarmMember[] 
      };
    },
    enabled: !!user?.id,
  });

  // Fetch members of current farm
  const { data: members = [] } = useQuery({
    queryKey: ['farm-members', currentFarmId],
    queryFn: async () => {
      if (!currentFarmId) return [];
      
      const { data, error } = await supabase
        .from('farm_members')
        .select('*')
        .eq('farm_id', currentFarmId)
        .eq('is_active', true);

      if (error) throw error;
      return data as FarmMember[];
    },
    enabled: !!currentFarmId,
  });

  // Auto-select first farm if none selected
  useEffect(() => {
    if (farmsData?.farms && farmsData.farms.length > 0 && !currentFarmId) {
      setCurrentFarmId(farmsData.farms[0].id);
    }
  }, [farmsData?.farms, currentFarmId]);

  const farms = farmsData?.farms || [];
  const currentFarm = farms.find(f => f.id === currentFarmId) || null;

  const switchFarm = (farmId: string) => {
    setCurrentFarmId(farmId);
  };

  return (
    <FarmContext.Provider value={{
      currentFarm,
      farmId: currentFarmId,
      farmCode: currentFarm?.farm_code || null,
      isLoading: farmsLoading,
      farms,
      members,
      switchFarm,
      refetch,
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}

// Hook to create a new farm
export function useCreateFarm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (farmData: {
      name: string;
      location?: string;
      description?: string;
      phone?: string;
      email?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate farm code
      const { data: farmCode, error: codeError } = await supabase
        .rpc('generate_farm_code');

      if (codeError) throw codeError;

      // Create farm
      const { data, error } = await supabase
        .from('farms')
        .insert({
          ...farmData,
          farm_code: farmCode,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as farm member
      const { error: memberError } = await supabase
        .from('farm_members')
        .insert({
          farm_id: data.id,
          user_id: user.id,
          role: 'farmer',
          is_active: true,
        });

      if (memberError) throw memberError;

      // Update user's profile with farm_id
      await supabase
        .from('profiles')
        .update({ farm_id: data.id })
        .eq('user_id', user.id);

      return data as Farm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-farms'] });
      toast.success('Farm created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create farm');
    },
  });
}

// Hook to add a member to farm
export function useAddFarmMember() {
  const queryClient = useQueryClient();
  const { farmId } = useFarm();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'staff' | 'farmer' | 'vet' | 'farm_manager' | 'client' }) => {
      if (!farmId) throw new Error('No farm selected');

      const { data, error } = await supabase
        .from('farm_members')
        .insert({
          farm_id: farmId,
          user_id: userId,
          role: role,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user's profile with farm_id
      await supabase
        .from('profiles')
        .update({ farm_id: farmId })
        .eq('user_id', userId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-members'] });
      toast.success('Member added to farm');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
}

// Hook to toggle member active status
export function useToggleFarmMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('farm_members')
        .update({ is_active: isActive })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-members'] });
      toast.success('Member status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update member');
    },
  });
}
