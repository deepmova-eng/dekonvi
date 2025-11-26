import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from '../../../pages/Login'
import { supabase } from '../../../lib/supabase'

const renderLoginPage = () => {
    const queryClient = new QueryClient()

    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Login onBack={vi.fn()} onRegisterClick={vi.fn()} />
            </BrowserRouter>
        </QueryClientProvider>
    )
}

describe('Authentication Flow', () => {
    it('should display login form', () => {
        renderLoginPage()

        expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    })



    it('should call login with correct credentials', async () => {
        const user = userEvent.setup()
        const signInMock = vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
        })

        vi.mocked(supabase.auth).signInWithPassword = signInMock

        renderLoginPage()

        await user.type(screen.getByLabelText(/e-mail/i), 'test@example.com')
        await user.type(screen.getByLabelText(/mot de passe/i), 'password123')
        await user.click(screen.getByRole('button', { name: /se connecter/i }))

        await waitFor(() => {
            expect(signInMock).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            })
        })
    })
})
