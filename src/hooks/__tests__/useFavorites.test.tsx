import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useIsFavorite, useToggleFavorite } from '../useFavorites'
import { supabase } from '../../lib/supabase'

// Wrapper pour React Query
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

// Mock useSupabaseAuth
vi.mock('../useSupabaseAuth', () => ({
    useSupabaseAuth: () => ({
        user: { id: 'user-123' },
        loading: false
    })
}))

describe('useFavorites', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('useIsFavorite', () => {
        it('should return false when listing is not favorited', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null
                }),
                then: (resolve: any) => resolve({ data: null, error: null })
            }
            vi.mocked(supabase.from).mockReturnValue(mockBuilder as any)

            const { result } = renderHook(
                () => useIsFavorite('listing-123'),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(result.current.data).toBe(false)
            })
        })

        it('should return true when listing is favorited', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: 'fav-123' },
                    error: null
                }),
                then: (resolve: any) => resolve({ data: { id: 'fav-123' }, error: null })
            }
            vi.mocked(supabase.from).mockReturnValue(mockBuilder as any)

            const { result } = renderHook(
                () => useIsFavorite('listing-123'),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(result.current.data).toBe(true)
            })
        })
    })

    describe('useToggleFavorite', () => {
        it('should add to favorites when not favorited', async () => {
            const insertMock = vi.fn().mockResolvedValue({
                data: { id: 'new-fav' },
                error: null
            })

            const mockBuilder = {
                insert: insertMock,
                select: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ data: { id: 'new-fav' }, error: null })
            }

            vi.mocked(supabase.from).mockReturnValue(mockBuilder as any)

            const { result } = renderHook(
                () => useToggleFavorite(),
                { wrapper: createWrapper() }
            )

            await result.current.mutateAsync({
                userId: 'user-123',
                listingId: 'listing-123',
                isFavorite: false,
            })

            expect(insertMock).toHaveBeenCalledWith({
                listing_id: 'listing-123',
                user_id: 'user-123',
            })
        })

        it('should remove from favorites when favorited', async () => {
            const deleteMock = vi.fn().mockReturnThis()

            const mockBuilder = {
                delete: deleteMock,
                eq: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                then: (resolve: any) => resolve({ error: null })
            }

            // Fix: Ensure delete returns the builder so .eq() can be called on it
            deleteMock.mockReturnValue(mockBuilder as any)

            vi.mocked(supabase.from).mockReturnValue(mockBuilder as any)

            const { result } = renderHook(
                () => useToggleFavorite(),
                { wrapper: createWrapper() }
            )

            await result.current.mutateAsync({
                userId: 'user-123',
                listingId: 'listing-123',
                isFavorite: true,
            })

            expect(deleteMock).toHaveBeenCalled()
        })
    })
})
