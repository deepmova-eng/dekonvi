import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type ActivityType = 'listing_created' | 'review_received' | 'premium_requested' | 'listing_updated';

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: string;
    metadata?: any;
}

export function useUserActivity(userId: string | undefined) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchActivities = async () => {
            try {
                setLoading(true);
                const allActivities: Activity[] = [];

                // Fetch recent listings (using seller_id!)
                const { data: listingsData, error: listingsError } = await supabase
                    .from('listings')
                    .select('id, title, created_at')
                    .eq('seller_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!listingsError && listingsData) {
                    listingsData.forEach((listing: any) => {
                        allActivities.push({
                            id: `listing-${listing.id}`,
                            type: 'listing_created',
                            title: 'Annonce publiée',
                            description: listing.title,
                            timestamp: listing.created_at,
                            metadata: { listingId: listing.id }
                        });
                    });
                }

                // Fetch recent reviews
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('id, rating, comment, created_at, reviewer_id')
                    .eq('seller_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!reviewsError && reviewsData) {
                    reviewsData.forEach((review: any) => {
                        allActivities.push({
                            id: `review-${review.id}`,
                            type: 'review_received',
                            title: 'Nouvel avis reçu',
                            description: `${review.rating} ⭐${review.comment ? ` - "${review.comment.substring(0, 50)}..."` : ''}`,
                            timestamp: review.created_at,
                            metadata: { review }
                        });
                    });
                }

                // Fetch recent premium requests
                const { data: premiumData, error: premiumError } = await supabase
                    .from('premium_requests')
                    .select('id, listing_id, status, created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (!premiumError && premiumData) {
                    premiumData.forEach((request: any) => {
                        const statusText = request.status === 'pending' ? 'En attente'
                            : request.status === 'approved' ? 'Approuvée'
                                : 'Rejetée';

                        allActivities.push({
                            id: `premium-${request.id}`,
                            type: 'premium_requested',
                            title: 'Demande Premium',
                            description: `Statut: ${statusText}`,
                            timestamp: request.created_at,
                            metadata: { request }
                        });
                    });
                }

                // Sort all activities by timestamp
                allActivities.sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                setActivities(allActivities.slice(0, 20)); // Keep top 20
                setError(null);
            } catch (err) {
                console.error('Error fetching user activity:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [userId]);

    return { activities, loading, error };
}
