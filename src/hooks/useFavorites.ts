import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useSupabaseAuth } from './useSupabaseAuth'



export function useIsFavorite(listingId: string | undefined) {
    const { user } = useSupabaseAuth()

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
        staleTime: 1000 * 60 * 5, // ✅ Cache 5 minutes - prevents infinite re-renders
        gcTime: 1000 * 60 * 10, // ✅ Keep in cache 10 minutes
        refetchOnMount: false, // ✅ Don't refetch on every mount
        refetchOnWindowFocus: false, // ✅ Don't refetch on window focus
    })
}

export function useFavoriteListings(userId: string | undefined) {
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
        staleTime: 1000 * 60 * 5, // ✅ Cache 5 minutes
        gcTime: 1000 * 60 * 10, // ✅ Keep in cache 10 minutes
        refetchOnMount: false,
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
            queryClient.invalidateQueries({ queryKey: ['favorites', variables.userId] })
            queryClient.invalidateQueries({ queryKey: ['favorite-listings', variables.userId] })
            queryClient.invalidateQueries({ queryKey: ['is-favorite', variables.listingId, variables.userId] })
            toast.success(variables.isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris')
        },
    })
}
