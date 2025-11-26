import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { useNetwork } from './useNetwork';

type Listing = Database['public']['Tables']['listings']['Row'];

export function useSupabaseListings(category?: string, subcategory?: string, searchTerm?: string) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useNetwork();

  useEffect(() => {
    const fetchListings = async (retryCount = 0) => {
      if (!isOnline) {
        setError('Pas de connexion internet');
        setLoading(false);
        return;
      }

      try {
        setError(null);

        let query = supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);

        if (category && category !== 'all') {
          query = query.eq('category', category);
        }

        if (subcategory) {
          query = query.eq('subcategory', subcategory);
        }

        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
        }

        // Add timeout to handle hanging queries
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        );

        const { data, error } = await Promise.race([
          query,
          timeoutPromise
        ]) as any;

        if (error) throw error;
        setListings(data || []);
        setError(null);
      } catch (err) {

        // Fallback to direct REST API if client fails
        if (err instanceof Error && err.message === 'Query timeout') {
          console.log('Switching to REST API fallback...');
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let url = `${supabaseUrl}/rest/v1/listings?select=*&status=eq.active&order=created_at.desc&limit=50`;

            if (category && category !== 'all') {
              url += `&category=eq.${category}`;
            }

            if (subcategory) {
              url += `&subcategory=eq.${subcategory}`;
            }

            if (searchTerm) {
              const term = encodeURIComponent(`*${searchTerm}*`);
              url += `&or=(title.ilike.${term},location.ilike.${term})`;
            }

            const response = await fetch(url, {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setListings(data);
              setError(null);
              // setLoading(false) and return are handled by finally block or subsequent logic
            } else {
              console.error('REST API fallback failed:', response.status, response.statusText);
            }
          } catch (fetchErr) {
            console.error('REST API fallback error:', fetchErr);
          }
        }

        // Retry logic for network errors
        if (retryCount < 3 && (
          err instanceof TypeError ||
          (err instanceof Error && err.message.includes('Failed to fetch')) ||
          (err instanceof Error && err.message.includes('NetworkError'))
        )) {
          console.log(`Retrying fetch... Attempt ${retryCount + 1}`);
          setTimeout(() => fetchListings(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }

        if (!isOnline) {
          setError('Pas de connexion internet. Vérifiez votre connexion.');
        } else if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
        } else {
          setError('Erreur lors du chargement des annonces. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    };

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    // Only set up real-time subscription if online
    if (isOnline) {
      subscription = supabase
        .channel('listings_changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'listings',
            filter: category ? `category=eq.${category}` : undefined
          },
          () => {
            if (isOnline) {
              fetchListings();
            }
          }
        )
        .subscribe();
    }

    fetchListings();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [category, subcategory, searchTerm, isOnline]);

  return { listings, loading, error };
}