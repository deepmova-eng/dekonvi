import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProductCard from '../home/ProductCard'
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

const mockListing = {
    id: 'listing-123',
    title: 'Test Product',
    price: 5000,
    images: ['https://example.com/image.jpg'],
    condition: 'new' as const,
    location: 'Paris',
    seller_id: 'seller-123',
    category: 'Electronics',
    description: 'Test description',
    status: 'active' as const,
    created_at: new Date().toISOString(),
    delivery_available: true,
    is_premium: false,
    premium_until: null,
    contact_phone: null,
    hide_phone: false,
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

describe('ProductCard', () => {
    it('should render product information', () => {
        renderWithProviders(
            <ProductCard
                listing={mockListing}
            />
        )

        expect(screen.getByText('Test Product')).toBeInTheDocument()
        expect(screen.getByTestId('product-price')).toHaveTextContent(/5.*000.*FCFA/)
        expect(screen.getByText(/Paris/)).toBeInTheDocument()
    })

    it('should display product image', () => {
        renderWithProviders(
            <ProductCard
                listing={mockListing}
            />
        )

        const image = screen.getByRole('img')
        expect(image).toHaveAttribute('src', mockListing.images[0])
    })

    it('should render favorite button', () => {
        renderWithProviders(
            <ProductCard
                listing={mockListing}
            />
        )

        const favoriteButton = screen.getByRole('button', { name: /Ajouter aux favoris/i })
        expect(favoriteButton).toBeInTheDocument()
    })
})
