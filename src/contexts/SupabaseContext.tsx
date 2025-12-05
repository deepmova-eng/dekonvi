import { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import toast from 'react-hot-toast';

interface SupabaseContextType {
  user: User | null;
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      // 1. Optimistic Load from LocalStorage
      let optimisticUser = null;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        // Handle potential URL format issues safely
        const urlParts = supabaseUrl?.split('//')[1]?.split('.');
        const projectRef = urlParts ? urlParts[0] : null;

        if (projectRef) {
          const storageKey = `sb-${projectRef}-auth-token`;
          const storedSession = localStorage.getItem(storageKey);

          if (storedSession) {
            const session = JSON.parse(storedSession);
            if (session?.user) {
              console.log('Optimistic session found:', session.user.email);
              optimisticUser = session.user;
              setUser(session.user);
            }
          }
        }
      } catch (e) {
        console.error('Error reading optimistic session:', e);
      } finally {
        // Unblock UI immediately
        setLoading(false);
      }

      // 2. Background Verification - no timeout
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Update user state with verified session
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchProfile(session.user.id);
        } else if (optimisticUser) {
          // Token was invalid/expired, clear optimistic user
          setProfile(null);
        }
      } catch (error) {
        console.error('Background session verification failed:', error);
      }
    };

    initSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${userId}`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setProfile(data[0]);
        } else {
          console.log('No profile found');
          setError('Profil non trouvé');
        }
      } else {
        console.error('REST API profile fetch failed:', response.status);
        setError('Erreur lors du chargement du profil');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Try Supabase client first with short timeout (10s)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Client timeout')), 10000)
      );

      const loginPromise = supabase.auth.signInWithPassword({ email, password });

      let authResult;
      try {
        authResult = await Promise.race([
          loginPromise,
          timeoutPromise
        ]) as any;
      } catch (clientError) {
        // Fallback to REST API if client times out
        console.log('Supabase client timed out, using REST API fallback...');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error_description || errorData.msg || 'Identifiants invalides');
        }

        const data = await response.json();

        // Manually set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });

        if (sessionError) throw sessionError;

        authResult = { error: null };
      }

      if (authResult.error) throw authResult.error;
      toast.success('Connexion réussie !');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            name,
            email,
            role: 'user',
            rating: 0,
            total_ratings: 0,
            is_recommended: false
          }]);

        if (profileError) throw profileError;
      }

      toast.success('Compte créé avec succès !');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Déconnexion réussie');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(message);
      toast.error(message);
    }
  };

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin';
  }, [profile]);

  return (
    <SupabaseContext.Provider value={{
      user,
      profile,
      loading,
      error,
      isAdmin,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}