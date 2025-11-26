import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'];

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchListings = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchListings, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return { searchTerm, setSearchTerm, searchResults, loading };
}