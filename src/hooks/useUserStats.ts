import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserStats {
    activeListings: number;
    totalListings: number;
    averageRating: number;
    totalReviews: number;
    pendingPremiumRequests: number;
}

export function useUserStats(userId: string | undefined) {
    const [stats, setStats] = useState<UserStats>({
        activeListings: 0,
        totalListings: 0,
        averageRating: 0,
        totalReviews: 0,
        pendingPremiumRequests: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                setLoading(true);

                console.log('Fetching stats for user:', userId);

                // Fetch listing stats (using seller_id, not user_id!)
                console.log('Querying listings table...');
                const { data: listingsData, error: listingsError } = await supabase
                    .from('listings')
                    .select('id')
                    .eq('seller_id', userId);

                console.log('Listings result:', { count: listingsData?.length, error: listingsError });

                if (listingsError) {
                    console.error('❌ Listings error details:', listingsError);
                }

                // For now just count total
                const totalListings = listingsData?.length || 0;
                const activeListings = totalListings; // Same for now

                console.log('📊 Listings count:', { totalListings, activeListings });

                // Fetch review stats
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('seller_id', userId);

                if (reviewsError) {
                    console.error('Reviews error:', reviewsError);
                    // Don't throw, just log - reviews might not exist
                }

                const totalReviews = reviewsData?.length || 0;
                const averageRating = totalReviews > 0 && reviewsData
                    ? reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
                    : 0;

                // Fetch premium requests
                const { data: premiumData, error: premiumError } = await supabase
                    .from('premium_requests')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('status', 'pending');

                if (premiumError) {
                    console.error('Premium error:', premiumError);
                    // Don't throw
                }

                const pendingPremiumRequests = premiumData?.length || 0;

                setStats({
                    activeListings,
                    totalListings,
                    averageRating,
                    totalReviews,
                    pendingPremiumRequests
                });
                setError(null);
            } catch (err) {
                console.error('Error fetching user stats:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId]);

    return { stats, loading, error };
}
