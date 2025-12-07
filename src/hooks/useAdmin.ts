import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════
// PENDING LISTINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour fetch pending listings (admin)
 */
export function usePendingListings() {
    return useQuery({
        queryKey: ['admin', 'pending-listings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('listings')
                .select(`
          *,
          profiles:seller_id (
            name,
            email
          )
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 30, // 30 secondes (admin besoin données fraîches)
        refetchOnWindowFocus: true, // Refetch au focus
    });
}

/**
 * Hook pour approuver une annonce
 */
export function useApproveListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (listingId: string) => {
            const { error } = await supabase
                .from('listings')
                .update({ status: 'active' as const })
                .eq('id', listingId);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalider le cache des pending listings
            queryClient.invalidateQueries({
                queryKey: ['admin', 'pending-listings']
            });
        },
    });
}

/**
 * Hook pour rejeter une annonce
 */
export function useRejectListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            listingId,
            reason
        }: {
            listingId: string;
            reason?: string
        }) => {
            const { error } = await supabase
                .from('listings')
                .update({
                    status: 'rejected' as const,
                    rejection_reason: reason
                })
                .eq('id', listingId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'pending-listings']
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour fetch tous les users (admin)
 * Uses get_users_admin() RPC to fetch auth.users data
 * and joins with profiles for complete user information
 */
export function useAllUsers() {
    return useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            // Step 1: Get auth.users data via RPC
            const { data: authUsers, error: authError } = await supabase
                .rpc('get_users_admin' as any);

            if (authError) throw authError;
            if (!authUsers || authUsers.length === 0) return [];

            // Step 2: Get profiles data
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;

            // Step 3: Merge auth.users + profiles data
            const mergedUsers = authUsers.map((authUser: any) => {
                const profile = profiles?.find(p => p.id === authUser.id);
                return {
                    ...profile,
                    email_confirmed_at: authUser.email_confirmed_at,
                    last_sign_in_at: authUser.last_sign_in_at,
                    email: authUser.email
                };
            });

            return mergedUsers;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook pour ban un user
 */
export function useBanUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_banned: true as const })
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'users']
            });
        },
    });
}

/**
 * Hook pour unban un user
 */
export function useUnbanUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_banned: false as const })
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'users']
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════════════
// REVIEW MODERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour fetch pending reviews (admin)
 */
export function usePendingReviews() {
    return useQuery({
        queryKey: ['admin', 'pending-reviews'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          *,
          reviewer:profiles!reviewer_id (
            name
          )
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 30, // 30 secondes
    });
}

/**
 * Hook pour approuver un avis
 */
export function useApproveReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewId: string) => {
            const { error } = await supabase
                .from('reviews')
                .update({ status: 'approved' as const })
                .eq('id', reviewId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'pending-reviews']
            });
        },
    });
}

/**
 * Hook pour rejeter un avis
 */
export function useRejectReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reviewId: string) => {
            const { error } = await supabase
                .from('reviews')
                .update({ status: 'rejected' as const })
                .eq('id', reviewId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'pending-reviews']
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════════════
// PREMIUM REQUESTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour fetch premium requests
 */
export function usePremiumRequests() {
    const queryClient = useQueryClient();

    // Subscribe to Realtime changes
    useEffect(() => {
        const channel = supabase
            .channel('admin_premium_requests')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'premium_requests'
                },
                () => {
                    // Invalidate cache when premium_requests changes
                    queryClient.invalidateQueries({
                        queryKey: ['admin', 'premium-requests']
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: ['admin', 'premium-requests'],
        queryFn: async () => {
            // Fetch premium requests first
            const { data: requests, error } = await supabase
                .from('premium_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!requests || requests.length === 0) return [];

            // Fetch related data manually (PostgREST join syntax doesn't work in this config)
            const enrichedRequests = await Promise.all(
                requests.map(async (request) => {
                    // Fetch user profile
                    const { data: user } = await supabase
                        .from('profiles')
                        .select('name, email')
                        .eq('id', request.user_id)
                        .single();

                    // Fetch listing
                    const { data: listing } = await supabase
                        .from('listings')
                        .select('title')
                        .eq('id', request.listing_id)
                        .single();

                    return {
                        ...request,
                        user,
                        listing
                    };
                })
            );

            return enrichedRequests;
        },
        staleTime: 1000 * 10, // 10 seconds - refresh more frequently
        refetchOnWindowFocus: true, // Refetch when window gets focus
        refetchInterval: 1000 * 15, // Auto-refetch every 15 seconds
    });
}

/**
 * Hook pour approuver une demande premium
 */
export function useApprovePremiumRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const { error } = await supabase
                .from('premium_requests')
                .update({ status: 'approved' as const })
                .eq('id', requestId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'premium-requests']
            });
        },
    });
}

/**
 * Hook pour rejeter une demande premium
 */
export function useRejectPremiumRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const { error } = await supabase
                .from('premium_requests')
                .update({ status: 'rejected' as const })
                .eq('id', requestId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'premium-requests']
            });
        },
    });
}

//═══════════════════════════════════════════════════════════════════
// REPORTED LISTINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour fetch reported listings
 */
export function useReportedListings() {
    return useQuery({
        queryKey: ['admin', 'reported-listings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select(`
          *,
          listings (
            title,
            images
          ),
          profiles:reporter_id (
            name
          )
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Hook pour résoudre un report
 */
export function useResolveReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (reportId: string) => {
            const { error } = await supabase
                .from('reports')
                .update({ status: 'resolved' as const })
                .eq('id', reportId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'reported-listings']
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════════════
// ADVERTISEMENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour fetch advertisements
 */
export function useAdvertisements() {
    return useQuery({
        queryKey: ['admin', 'advertisements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('advertisements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook pour créer une publicité
 */
export function useCreateAdvertisement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (adData: any) => {
            const { data, error } = await supabase
                .from('advertisements')
                .insert(adData)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'advertisements']
            });
        },
    });
}

/**
 * Hook pour supprimer une publicité
 */
export function useDeleteAdvertisement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (adId: string) => {
            const { error } = await supabase
                .from('advertisements')
                .delete()
                .eq('id', adId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'advertisements']
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN STATS
// ═══════════════════════════════════════════════════════════════════

/**
 * Hook pour les stats admin (dashboard)
 */
export function useAdminStats() {
    return useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            // Fetch multiple stats en parallèle
            const [
                totalListings,
                pendingListings,
                totalUsers,
                pendingReviews,
                premiumRequests,
                reportedListings,
            ] = await Promise.all([
                supabase.from('listings').select('id', { count: 'exact', head: true }),
                supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('premium_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            ]);

            return {
                totalListings: totalListings.count || 0,
                pendingListings: pendingListings.count || 0,
                totalUsers: totalUsers.count || 0,
                pendingReviews: pendingReviews.count || 0,
                premiumRequests: premiumRequests.count || 0,
                reportedListings: reportedListings.count || 0,
            };
        },
        staleTime: 1000 * 60, // 1 minute
        refetchInterval: 1000 * 60, // Auto-refetch chaque minute
    });
}
