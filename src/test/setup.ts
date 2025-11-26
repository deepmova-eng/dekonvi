import '@testing-library/jest-dom'

import { vi } from 'vitest'


// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user-id' } },
                error: null
            }),
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
                error: null
            }),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
    },
}))

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useParams: () => ({}),
        useLocation: () => ({ pathname: '/' }),
    }
})

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    takeRecords: vi.fn(),
    unobserve: vi.fn(),
}))

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
