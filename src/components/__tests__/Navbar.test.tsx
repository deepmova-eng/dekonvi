import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from '../layout/Navbar'
import { SupabaseContext } from '../../contexts/SupabaseContext'

const mockSupabaseContext = {
    user: { id: 'test-user-id' },
    profile: null,
    loading: false,
    error: null,
    isAdmin: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
}

const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })

    return render(
        <QueryClientProvider client={queryClient}>
            <SupabaseContext.Provider value={mockSupabaseContext as any}>
                <BrowserRouter>
                    {component}
                </BrowserRouter>
            </SupabaseContext.Provider>
        </QueryClientProvider>
    )
}

describe('Navbar', () => {
    it('should render logo', () => {
        renderWithProviders(<Navbar onCreateListing={vi.fn()} />)
        expect(screen.getByText('Dekonvi')).toBeInTheDocument()
    })

    it('should render navigation links', () => {
        renderWithProviders(<Navbar onCreateListing={vi.fn()} />)
        expect(screen.getAllByText('Accueil')[0]).toBeInTheDocument()
        expect(screen.getAllByText('Favoris')[0]).toBeInTheDocument()
        expect(screen.getAllByText('Messages')[0]).toBeInTheDocument()
    })

    it('should render post button', () => {
        renderWithProviders(<Navbar onCreateListing={vi.fn()} />)
        const buttons = screen.getAllByText('Déposer une annonce')
        expect(buttons.length).toBeGreaterThan(0)
        expect(buttons[0]).toBeInTheDocument()
    })
})
