import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useSupabaseAuth } from './useSupabaseAuth'



export function useIsFavorite(listingId: string | undefined) {
    const { user } = useSupabaseAuth()
    // Note: Realtime sync is handled by useFavoriteListings hook globally
    // to avoid creating too many concurrent subscriptions

    return useQuery({
        queryKey: ['is-favorite', listingId, user?.id],
        queryFn: async () => {
            if (!listingId || !user) {
                return false
            }

            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('listing_id', listingId)
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                console.error('[useIsFavorite] Error:', error)
                return false
            }

            return !!data
        },
        enabled: !!listingId && !!user,
        staleTime: 1000 * 30, // ✅ Cache 30 seconds (was 0)
        gcTime: 1000 * 60 * 5, // ✅ Keep in cache 5 minutes (was 10 min)
        refetchOnMount: 'always', // ✅ FORCE refetch EVERY time
        refetchOnWindowFocus: false, // ✅ Don't refetch on window focus
    })
}

export function useFavoriteListings(userId: string | undefined) {
    const queryClient = useQueryClient()

    // 🔥 Realtime subscription to invalidate cache on favorites changes
    useEffect(() => {
        if (!userId) return

        console.log('[useFavoriteListings] Setting up Realtime subscription for user:', userId)

        const channel = supabase
            .channel('favorites_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'favorites',
                    filter: `user_id=eq.${userId}` // Only for this user
                },
                (payload) => {
                    console.log('[useFavoriteListings] Realtime event:', payload)

                    // Force immediate refetch of ALL is-favorite queries
                    // This ensures heart icons update instantly across all pages
                    queryClient.refetchQueries({
                        queryKey: ['is-favorite'],
                        exact: false // Match all is-favorite queries
                    })

                    // Invalidate favorite-listings query
                    queryClient.invalidateQueries({ queryKey: ['favorite-listings', userId] })
                }
            )
            .subscribe((status, err) => {
                console.log('[useFavoriteListings] Subscription status:', status)
                if (err) {
                    console.error('[useFavoriteListings] Subscription error:', err)
                }
            })

        return () => {
            console.log('[useFavoriteListings] Cleaning up Realtime subscription')
            supabase.removeChannel(channel)
        }
    }, [userId, queryClient])

    return useQuery({
        queryKey: ['favorite-listings', userId],
        queryFn: async () => {
            if (!userId) {
                return []
            }

            // 1. Fetch favorite IDs
            const { data: favoriteIds, error: favError } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', userId)

            if (favError) {
                console.error('[useFavoriteListings] Error fetching favorites:', favError)
                throw favError
            }
            if (!favoriteIds || favoriteIds.length === 0) {
                return []
            }

            // 2. Fetch listings
            const listingIds = favoriteIds.map(f => f.listing_id)

            const { data: listings, error: listError } = await supabase
                .from('listings')
                .select('*')
                .in('id', listingIds)

            if (listError) {
                console.error('[useFavoriteListings] Error fetching listings:', listError)
                throw listError
            }

            return listings || []
        },
        enabled: !!userId,
        staleTime: 1000 * 30, // ✅ Cache 30 seconds (was 0)
        gcTime: 1000 * 60 * 5, // ✅ Keep in cache 5 minutes
        refetchOnMount: 'always', // ✅ ALWAYS refetch when navigating to Favorites page
        refetchOnWindowFocus: false,
    })
}

export function useToggleFavorite() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            userId,
            listingId,
            isFavorite
        }: {
            userId: string
            listingId: string
            isFavorite: boolean
        }) => {
            if (!userId || !listingId) {
                throw new Error('userId et listingId sont requis')
            }

            if (isFavorite) {
                // Retirer des favoris
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', userId)
                    .eq('listing_id', listingId)

                if (error) throw error
            } else {
                // Ajouter aux favoris
                const { error } = await supabase
                    .from('favorites')
                    .insert({ user_id: userId, listing_id: listingId })

                if (error) {
                    // Si erreur 409 (Conflict), c'est que c'est déjà en favori
                    if (error.code === '23505') {
                        console.log('⚠️ Déjà en favori (409), ignoré.')
                        return
                    }
                    throw error
                }
            }
        },
        onMutate: async ({ userId, listingId, isFavorite }) => {
            await queryClient.cancelQueries({ queryKey: ['favorites', userId] })
            await queryClient.cancelQueries({ queryKey: ['favorite-listings', userId] })
            await queryClient.cancelQueries({ queryKey: ['is-favorite', listingId, userId] })

            const previousFavorites = queryClient.getQueryData(['favorites', userId])
            const previousFavoriteListings = queryClient.getQueryData(['favorite-listings', userId])
            const previousIsFavorite = queryClient.getQueryData(['is-favorite', listingId, userId])

            // Optimistic update for is-favorite
            queryClient.setQueryData(['is-favorite', listingId, userId], !isFavorite)

            // Optimistic update for favorite-listings (remove if unfavoriting)
            if (isFavorite) {
                queryClient.setQueryData(['favorite-listings', userId], (old: any[] | undefined) => {
                    if (!old) return []
                    return old.filter(listing => listing.id !== listingId)
                })
            }

            return { previousFavorites, previousFavoriteListings, previousIsFavorite }
        },
        onError: (error, variables, context) => {
            if (context?.previousFavorites) {
                queryClient.setQueryData(['favorites', variables.userId], context.previousFavorites)
            }
            if (context?.previousFavoriteListings) {
                queryClient.setQueryData(['favorite-listings', variables.userId], context.previousFavoriteListings)
            }
            if (context?.previousIsFavorite !== undefined) {
                queryClient.setQueryData(['is-favorite', variables.listingId, variables.userId], context.previousIsFavorite)
            }
            toast.error('Erreur lors de la modification des favoris')
        },
        onSuccess: (_, variables) => {
            const { userId, listingId, isFavorite } = variables;

            // ✅ DIRECT cache update with correct listing_id
            // This fixes the issue where Realtime DELETE only provides favori ID, not listing_id
            queryClient.setQueryData(['is-favorite', listingId, userId], !isFavorite);
            console.log(`✅ [useToggleFavorite] Cache updated: is-favorite = ${!isFavorite} for listing:`, listingId)

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
            queryClient.invalidateQueries({ queryKey: ['favorite-listings', userId] })
        },
    })
}
