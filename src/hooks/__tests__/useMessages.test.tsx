import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConversations, useMessages } from '../useMessages'
import { supabase } from '../../lib/supabase'

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

describe('useMessages', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('useConversations', () => {
        it('should fetch conversations for a user', async () => {
            const mockConversations = [
                { id: 'conv-1', user1_id: 'user-123', user2_id: 'user-456', listing_id: 'listing-1' },
            ]
            const mockProfiles = [{ id: 'user-456', name: 'User 2' }]
            const mockListings = [{ id: 'listing-1', title: 'Listing 1' }]

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'conversations') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        or: vi.fn().mockReturnThis(),
                        order: vi.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockConversations, error: null })
                    } as any
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockProfiles, error: null })
                    } as any
                }
                if (table === 'listings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockListings, error: null })
                    } as any
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    then: (resolve: any) => resolve({ data: [], error: null })
                } as any
            })

            const { result } = renderHook(
                () => useConversations('user-123'),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(result.current.data).toHaveLength(1)
                expect(result.current.data?.[0].user2?.name).toBe('User 2')
            })
        })
    })

    describe('useMessages', () => {
        it('should fetch messages for a conversation', async () => {
            const mockMessages = [
                { id: 'msg-1', content: 'Hello', sender_id: 'user-123', conversation_id: 'conv-123' },
            ]
            const mockProfiles = [{ id: 'user-123', name: 'User 1' }]

            vi.mocked(supabase.from).mockImplementation((table: string) => {
                if (table === 'messages') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockMessages, error: null })
                    } as any
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockReturnThis(),
                        then: (resolve: any) => resolve({ data: mockProfiles, error: null })
                    } as any
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    then: (resolve: any) => resolve({ data: [], error: null })
                } as any
            })

            const { result } = renderHook(
                () => useMessages('conv-123'),
                { wrapper: createWrapper() }
            )

            await waitFor(() => {
                expect(result.current.data).toHaveLength(1)
            })
        })
    })
})
