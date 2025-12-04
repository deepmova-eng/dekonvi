import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Listing } from '../types/listing';

/**
 * Hook to fetch premium listings with Realtime subscription
 * Automatically updates when listings are boosted/unboosted
 */
export function usePremiumListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        // Initial fetch
        const fetchPremiumListings = async () => {
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

        fetchPremiumListings();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('premium-listings-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'listings',
                    filter: 'is_premium=eq.true', // Only premium listings
                },
                (payload) => {
                    console.log('Premium listing changed:', payload);

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newListing = payload.new as any; // Use any to handle DB snake_case

                        // Only add/update if it's premium AND active
                        if (newListing.is_premium && newListing.status === 'active') {
                            setListings((current) => {
                                // Check if listing already exists
                                const exists = current.find((l) => l.id === newListing.id);

                                if (exists) {
                                    // Update existing
                                    return current.map((l) =>
                                        l.id === newListing.id ? (newListing as Listing) : l
                                    );
                                } else {
                                    // Add new (prepend to top)
                                    return [newListing as Listing, ...current];
                                }
                            });
                        } else if (!newListing.is_premium) {
                            // If premium was removed, delete from list
                            setListings((current) =>
                                current.filter((l) => l.id !== newListing.id)
                            );
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const oldListing = payload.old as { id: string };
                        setListings((current) =>
                            current.filter((l) => l.id !== oldListing.id)
                        );
                    }
                }
            )
            .subscribe();

        // Cleanup
        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { listings, loading, error };
}
