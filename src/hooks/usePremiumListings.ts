import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Listing } from '../types/listing';

/**
 * Hook to fetch premium listings with polling (migrated from Realtime)
 * Automatically updates every 20s when tab is active
 */
export function usePremiumListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        // Fetch premium listings
        const fetchPremiumListings = async () => {
            // Skip if tab inactive (smart polling)
            if (document.hidden) {
                console.log('💤 [PREMIUM] Tab inactive, skipping poll');
                return;
            }

            console.log('🔄 [PREMIUM] Polling for premium listings...');

            try {
                const { data, error: fetchError } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('is_premium', true)
                    .eq('status', 'active')
                    .order('premium_until', { ascending: false })
                    .limit(10);

                if (fetchError) throw fetchError;

                if (mounted) {
                    setListings(data || []);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching premium listings:', err);
                if (mounted) {
                    setError(err as Error);
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchPremiumListings();

        // Poll every 20 seconds
        console.log('⏱️ [PREMIUM] Setting up polling (20s)...');
        const pollingInterval = setInterval(fetchPremiumListings, 20000); // 20s

        // Poll when tab becomes active
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('👀 [PREMIUM] Tab active, polling immediately...');
                fetchPremiumListings();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            mounted = false;
            console.log('🛑 [PREMIUM] Cleaning up polling');
            clearInterval(pollingInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return { listings, loading, error };
}
