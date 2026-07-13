import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types/auth'

vi.mock('js-cookie', () => ({
   default: {
      set: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
   },
}))

const sampleUser: User = {
   id: 'user-1',
   name: 'Test User',
   email: 'test@example.com',
   role: 'developer',
   isActive: true,
   isEmailVerified: true,
}

const sampleTokens = {
   accessToken: 'access-token',
   refreshToken: 'refresh-token',
}

describe('auth.store', () => {
   beforeEach(() => {
      useAuthStore.getState().reset()
      useAuthStore.setState({
         isAuthenticated: false,
         isLoading: false,
         isInitialized: true,
         user: null,
         tokens: null,
         error: null,
      })
   })

   it('logs in and sets authenticated state', () => {
      useAuthStore.getState().login(sampleUser, sampleTokens)

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.email).toBe('test@example.com')
      expect(state.tokens?.accessToken).toBe('access-token')
      expect(state.error).toBeNull()
   })

   it('logs out and clears user/tokens', () => {
      useAuthStore.getState().login(sampleUser, sampleTokens)
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.tokens).toBeNull()
   })

   it('checks roles correctly', () => {
      useAuthStore.getState().login(sampleUser, sampleTokens)

      expect(useAuthStore.getState().hasRole('developer')).toBe(true)
      expect(useAuthStore.getState().hasRole('admin')).toBe(false)
      expect(useAuthStore.getState().hasAnyRole(['admin', 'developer'])).toBe(
         true
      )
      expect(useAuthStore.getState().canAccess(['admin'])).toBe(false)
      expect(useAuthStore.getState().canAccess(['developer', 'admin'])).toBe(
         true
      )
   })

   it('setError clears loading and clearError removes message', () => {
      useAuthStore.getState().setLoading(true)
      useAuthStore.getState().setError('Boom')

      expect(useAuthStore.getState().error).toBe('Boom')
      expect(useAuthStore.getState().isLoading).toBe(false)

      useAuthStore.getState().clearError()
      expect(useAuthStore.getState().error).toBeNull()
   })
})
