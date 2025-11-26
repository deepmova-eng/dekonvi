import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useListings } from '../useListings'
import { supabase } from '../../lib/supabase'

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient} >
            {children}
        </QueryClientProvider>
    )
}

describe('useListings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should fetch listings successfully', async () => {
        const mockListings = [
            { id: '1', title: 'Listing 1', price: 100 },
            { id: '2', title: 'Listing 2', price: 200 },
        ]

        const mockBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: mockListings, error: null })
        }

        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any)

        const { result } = renderHook(
            () => useListings(),
            { wrapper: createWrapper() }
        )

        await waitFor(() => {
            expect(result.current.data).toHaveLength(2)
            expect(result.current.data?.[0].title).toBe('Listing 1')
        })
    })

    it('should handle errors', async () => {
        const mockBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: null, error: { message: 'Database error' } })
        }

        vi.mocked(supabase.from).mockReturnValue(mockBuilder as any)

        const { result } = renderHook(
            () => useListings(),
            { wrapper: createWrapper() }
        )

        await waitFor(() => {
            expect(result.current.error).toBeTruthy()
        })
    })
})
