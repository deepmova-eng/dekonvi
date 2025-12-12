/**
 * Centralized Query Keys Factory
 * 
 * Benefits:
 * - Single source of truth for all query keys
 * - Prevents typos and inconsistencies
 * - IDE autocomplete support
 * - Easy refactoring across codebase
 * 
 * Usage:
 * ```ts
 * import { queryKeys } from '@/lib/queryKeys';
 * 
 * useQuery({
 *   queryKey: queryKeys.listings.detail(id),
 *   queryFn: () => fetchListing(id)
 * });
 * ```
 */

export const queryKeys = {
    // ═══════════════════════════════════════════════════════════
    // LISTINGS
    // ═══════════════════════════════════════════════════════════
    listings: {
        all: ['listings'] as const,
        lists: () => [...queryKeys.listings.all, 'list'] as const,
        list: (filters?: any) => [...queryKeys.listings.lists(), filters] as const,
        infinite: (filters?: any) => [...queryKeys.listings.all, 'infinite', filters] as const,
        detail: (id: string) => [...queryKeys.listings.all, id] as const,
        seller: (sellerId: string) => [...queryKeys.listings.all, 'seller', sellerId] as const,
    },

    // ═══════════════════════════════════════════════════════════
    // FAVORITES
    // ═══════════════════════════════════════════════════════════
    favorites: {
        all: ['favorites'] as const,
        isFavorite: (listingId: string, userId: string) =>
            ['is-favorite', listingId, userId] as const,
        userFavorites: (userId: string) =>
            ['favorite-listings', userId] as const,
    },

    // ═══════════════════════════════════════════════════════════
    // MESSAGES
    // ═══════════════════════════════════════════════════════════
    messages: {
        all: ['messages'] as const,
        conversations: (userId: string) => ['conversations', userId] as const,
        conversation: (conversationId: string) => ['messages', conversationId] as const,
        unreadCount: (userId: string) => ['unread-messages-count', userId] as const,
    },

    // ═══════════════════════════════════════════════════════════
    // PROFILES
    // ═══════════════════════════════════════════════════════════
    profiles: {
        all: ['profiles'] as const,
        detail: (userId: string) => [...queryKeys.profiles.all, userId] as const,
        seller: (sellerId: string) => ['seller-profile', sellerId] as const,
        responseRate: (sellerId: string) => ['seller-response-rate', sellerId] as const,
    },

    // ═══════════════════════════════════════════════════════════
    // REVIEWS
    // ═══════════════════════════════════════════════════════════
    reviews: {
        all: ['reviews'] as const,
        seller: (sellerId: string) => ['seller-reviews', sellerId] as const,
    },

    // ═══════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════
    admin: {
        all: ['admin'] as const,
        stats: () => [...queryKeys.admin.all, 'stats'] as const,
        users: () => [...queryKeys.admin.all, 'users'] as const,
        pendingListings: () => [...queryKeys.admin.all, 'pending-listings'] as const,
        pendingReviews: () => [...queryKeys.admin.all, 'pending-reviews'] as const,
        premiumRequests: () => [...queryKeys.admin.all, 'premium-requests'] as const,
        reportedListings: () => [...queryKeys.admin.all, 'reported-listings'] as const,
        advertisements: () => [...queryKeys.admin.all, 'advertisements'] as const,
        tickets: () => [...queryKeys.admin.all, 'tickets'] as const,
        ticketMessages: (ticketId: string) => ['ticket-messages', ticketId] as const,
    },

    // ═══════════════════════════════════════════════════════════
    // SUPPORT
    // ═══════════════════════════════════════════════════════════
    support: {
        all: ['support'] as const,
        userTickets: () => ['user', 'tickets'] as const,
    },
};

/**
 * Type-safe query key helper
 * Ensures query keys are always arrays
 */
export type QueryKey = ReturnType<typeof queryKeys[keyof typeof queryKeys][keyof any]>;
