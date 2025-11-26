import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useSupabaseAuth } from './useSupabaseAuth'



export function useIsFavorite(listingId: string | undefined) {
    const { user } = useSupabaseAuth()

    console.log('🔍 [useIsFavorite] Hook called:', {
        listingId,
        userId: user?.id,
        hasUser: !!user,
        hasListing: !!listingId
    })

    return useQuery({
        queryKey: ['is-favorite', listingId, user?.id],
        queryFn: async () => {
            console.log('🔍 [useIsFavorite] Query executing:', { listingId, userId: user?.id })

            if (!listingId || !user) {
                console.log('🔍 [useIsFavorite] Missing params, returning false')
                return false
            }

            const { data, error } = await supabase
                .from('favorites')
                .select('id')
                .eq('listing_id', listingId)
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                console.error('🔍 [useIsFavorite] Error:', error)
                return false
            }

            const isFav = !!data
            console.log('🔍 [useIsFavorite] Result:', {
                isFavorite: isFav,
                data,
                listingId,
                userId: user.id
            })
            return isFav
        },
        enabled: !!listingId && !!user,
        staleTime: 0, // Always fetch fresh
        gcTime: 0, // Don't cache
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    })
}

export function useFavoriteListings(userId: string | undefined) {
    console.log('🔍 [useFavoriteListings] Hook called with userId:', userId)

    return useQuery({
        queryKey: ['favorite-listings', userId],
        queryFn: async () => {
            console.log('🔍 [useFavoriteListings] Query executing for userId:', userId)

            if (!userId) {
                console.log('🔍 [useFavoriteListings] No userId, returning []')
                return []
            }

            // 1. Fetch favorite IDs
            console.log('🔍 [useFavoriteListings] Fetching favorite IDs...')
            const { data: favoriteIds, error: favError } = await supabase
                .from('favorites')
                .select('listing_id')
                .eq('user_id', userId)

            console.log('🔍 [useFavoriteListings] Favorite IDs result:', {
                count: favoriteIds?.length,
                error: favError,
                ids: favoriteIds?.map(f => f.listing_id)
            })

            if (favError) {
                console.error('🔍 [useFavoriteListings] Error fetching favorites:', favError)
                throw favError
            }
            if (!favoriteIds || favoriteIds.length === 0) {
                console.log('🔍 [useFavoriteListings] No favorites found, returning []')
                return []
            }

            // 2. Fetch listings
            const listingIds = favoriteIds.map(f => f.listing_id)
            console.log('🔍 [useFavoriteListings] Fetching listings for IDs:', listingIds)

            const { data: listings, error: listError } = await supabase
                .from('listings')
                .select('*')
                .in('id', listingIds)

            console.log('🔍 [useFavoriteListings] Listings result:', {
                count: listings?.length,
                error: listError,
                listings
            })

            if (listError) {
                console.error('🔍 [useFavoriteListings] Error fetching listings:', listError)
                throw listError
            }

            console.log('🔍 [useFavoriteListings] Returning:', listings)
            return listings || []
        },
        enabled: !!userId,
        staleTime: 0, // Always fetch fresh
        gcTime: 0, // Don't cache
        refetchOnMount: true,
        refetchOnWindowFocus: true,
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
