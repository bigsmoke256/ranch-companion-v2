import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: AppRole, licenseNumber?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isFarmer: boolean;
  isVet: boolean;
  isFarmManager: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pure function, kept outside the component so it can be unit tested
// without mounting React or mocking Supabase.
export function deriveRoleFlags(role: AppRole | null) {
  return {
    role,
    isAdmin: role === 'admin',
    isFarmer: role === 'farmer' || role === 'admin',
    isVet: role === 'vet',
    isFarmManager: role === 'farm_manager',
    isClient: role === 'client',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    _role: AppRole = 'client', // Ignored - server always assigns 'client' for security
    licenseNumber?: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // SECURITY: Role is NOT sent to server - handle_new_user() always assigns 'client'
    // Privileged roles must be requested and approved by farm owners
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          // role intentionally NOT included - server ignores it anyway
          license_number: licenseNumber,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const { role, isAdmin, isFarmer, isVet, isFarmManager, isClient } =
    deriveRoleFlags(profile?.role ?? null);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isFarmer,
      isVet,
      isFarmManager,
      isClient,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
