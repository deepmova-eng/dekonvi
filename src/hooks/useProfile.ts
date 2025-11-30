import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface SellerProfile {
    id: string;
    name: string;
    avatar_url: string | null;
    location: string;
    phone: string | null;
    created_at: string;
    rating: number;
    total_ratings: number;
}

/**
 * Hook pour récupérer le profil d'un vendeur
 * @param sellerId - ID du vendeur
 * @returns Profil du vendeur avec cache et refetch automatique
 */
export function useSellerProfile(sellerId: string | undefined) {
    return useQuery({
        queryKey: ['seller-profile', sellerId],
        queryFn: async () => {
            if (!sellerId) throw new Error('Seller ID required');

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sellerId)
                .single();

            if (error) throw error;
            return data as SellerProfile;
        },
        enabled: !!sellerId, // Ne fetch que si sellerId existe
        staleTime: 1000 * 60 * 10, // 10 minutes - Profile change rarement
    });
}

/**
 * Hook pour récupérer le profil de l'utilisateur courant
 * @param userId - ID de l'utilisateur
 */
export function useUserProfile(userId: string | undefined) {
    return useQuery({
        queryKey: ['user-profile', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID required');

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as SellerProfile;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
