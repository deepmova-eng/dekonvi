import { useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        // ✅ No timeout - let Supabase complete naturally
        const { data: { session } } = await supabase.auth.getSession();

        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        // Fallback: read from localStorage
        console.log('[useSupabaseAuth] getSession timed out, reading from localStorage...');
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
          const storedSession = localStorage.getItem(storageKey);

          if (storedSession) {
            const session = JSON.parse(storedSession);
            console.log('[useSupabaseAuth] Found session for:', session.user?.email);
            setUser(session.user ?? null);
          } else {
            console.log('[useSupabaseAuth] No session in localStorage');
          }
        } catch (err) {
          console.error('[useSupabaseAuth] Error reading localStorage:', err);
        }
        setLoading(false);
      }
    };

    initSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Connexion réussie !');
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      toast.error(authError.message);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (signUpError) throw signUpError;

      // Créer le profil utilisateur
      if (newUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: newUser.id,
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
      const authError = error as AuthError;
      setError(authError.message);
      toast.error(authError.message);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Déconnexion réussie');
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      toast.error(authError.message);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut
  };
}