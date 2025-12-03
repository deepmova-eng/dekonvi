import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Review {
    id: string;
    seller_id: string;
    reviewer_id: string;
    rating: number;
    comment: string;
    proof_image_url: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: {
        name: string;
    };
}

/**
 * Hook pour récupérer les avis d'un vendeur
 * @param sellerId - ID du vendeur
 * @returns Liste des avis approuvés avec cache
 */
export function useSellerReviews(sellerId: string | undefined) {
    return useQuery({
        queryKey: ['seller-reviews', sellerId],
        queryFn: async () => {
            if (!sellerId) return [];

            const { data, error } = await supabase
                .from('reviews')
                .select(`
          *,
          reviewer:profiles!reviewer_id (
            name
          )
        `)
                .eq('seller_id', sellerId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching reviews:', error);
                return [];
            }
            return (data || []) as Review[];
        },
        enabled: !!sellerId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook pour soumettre un nouvel avis
 */
export function useSubmitReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewData: {
            seller_id: string;
            rating: number;
            comment: string;
            proof_image_url: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    ...reviewData,
                    reviewer_id: user.id,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalider le cache des avis du vendeur
            queryClient.invalidateQueries({
                queryKey: ['seller-reviews', variables.seller_id]
            });
        },
    });
}
