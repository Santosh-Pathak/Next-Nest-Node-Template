import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuthStore } from '@/store/auth.store'

vi.mock('js-cookie', () => ({
   default: {
      set: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
   },
}))

vi.mock('@/services/apis/auth.service', () => ({
   AuthService: {
      login: vi.fn(),
   },
}))

describe('LoginForm', () => {
   beforeEach(() => {
      useAuthStore.getState().reset()
      useAuthStore.setState({
         isLoading: false,
         isAuthenticated: false,
         error: null,
      })
   })

   it('renders email and password fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
   })

   it('shows email validation error on invalid email (onChange)', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
      await user.tab()

      await waitFor(() => {
         expect(
            screen.getByText(/please enter a valid email address/i)
         ).toBeInTheDocument()
      })
   })

   it('shows password length error', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email address/i), 'a@b.com')
      await user.type(screen.getByLabelText(/^password/i), '123')
      await user.tab()

      await waitFor(() => {
         expect(
            screen.getByText(/password must be at least 6 characters/i)
         ).toBeInTheDocument()
      })
   })

   it('enables submit when form is valid', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText(/email address/i), 'a@b.com')
      await user.type(screen.getByLabelText(/^password/i), 'secret1')

      await waitFor(() => {
         expect(
            screen.getByRole('button', { name: /sign in/i })
         ).toBeEnabled()
      })
   })
})
