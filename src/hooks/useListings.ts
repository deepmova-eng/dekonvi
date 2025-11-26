import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import type { Database } from '../types/supabase'
import { ListingService, CreateListingData } from '../services/listingService'

type Listing = Database['public']['Tables']['listings']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] | Database['public']['Tables']['profiles']['Row'][] | null
}

// ... (ListingFilters interface remains the same)

// Fonction de fetch exportée pour le prefetching
export const fetchListing = async (id: string) => {
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Listing
}

// Hook pour récupérer toutes les annonces (avec filtres)
export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status)
      } else {
        query = query.eq('status', 'active')
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice)
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice)
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      return data as Listing[]
    },
    staleTime: 1000 * 60 * 3, // 3 minutes pour les listings
  })
}

// Hook pour une annonce spécifique
export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes pour un listing individuel
  })
}

// Interface for listing filters
export interface ListingFilters {
  status?: 'active' | 'pending' | 'rejected' | 'sold';
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
}

// Hook pour récupérer les annonces avec infinite scroll
const LISTINGS_PER_PAGE = 20;

export function useInfiniteListings(filters?: ListingFilters) {
  return useInfiniteQuery({
    queryKey: ['listings', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('listings')
        .select('*, profiles(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + LISTINGS_PER_PAGE - 1);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'active');
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as Listing[],
        count: count || 0,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.data.length, 0);
      if (loadedCount >= lastPage.count) {
        return undefined; // No more pages
      }
      return loadedCount; // Next offset
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 3, // 3 minutes
  })
}

// Hook pour les annonces d'un vendeur
export function useSellerListings(sellerId: string | undefined) {
  return useQuery({
    queryKey: ['listings', 'seller', sellerId],
    queryFn: async () => {
      if (!sellerId) throw new Error('Seller ID requis')

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Listing[]
    },
    enabled: !!sellerId,
  })
}

// Hook pour créer une annonce
export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateListingData) => {
      return await ListingService.create(data)
    },
    onSuccess: () => {
      // Invalide tous les caches de listings
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      // toast.success('Annonce créée avec succès !') // Déjà géré dans CreateListing.tsx ou ListingService
    },
    onError: (error: Error) => {
      console.error('Error creating listing:', error)
      // toast.error(error.message || 'Erreur lors de la création') // Déjà géré
    },
  })
}

// Hook pour mettre à jour une annonce
export function useUpdateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<CreateListingData>
    }) => {
      return await ListingService.update(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['listing', id] })

      // Snapshot previous value
      const previousListing = queryClient.getQueryData(['listing', id])

      // Optimistically update
      queryClient.setQueryData(['listing', id], (old: any) => ({
        ...old,
        ...updates,
      }))

      return { previousListing }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousListing) {
        queryClient.setQueryData(
          ['listing', variables.id],
          context.previousListing
        )
      }
      toast.error('Erreur lors de la mise à jour')
    },
    onSuccess: (data: any) => {
      if (data) {
        queryClient.setQueryData(['listing', data.id], data)
      }
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      toast.success('Annonce mise à jour !')
    },
  })
}

// Hook pour supprimer une annonce
export function useDeleteListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await ListingService.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      toast.success('Annonce supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })
}