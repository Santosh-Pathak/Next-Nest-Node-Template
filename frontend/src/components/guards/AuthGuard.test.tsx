import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleGuard, RequireAuth } from '@/components/guards/AuthGuard'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types/auth'

vi.mock('@/services/auth-session', () => ({
   setUserCookie: vi.fn(),
   clearAuthCookies: vi.fn(),
}))

const adminUser: User = {
   id: '1',
   name: 'Admin',
   email: 'admin@example.com',
   role: 'admin',
   isActive: true,
}

describe('RequireAuth', () => {
   beforeEach(() => {
      useAuthStore.getState().reset()
      useAuthStore.setState({
         isAuthenticated: false,
         user: null,
         isInitialized: true,
         isLoading: false,
      })
   })

   it('shows fallback when unauthenticated', () => {
      render(
         <RequireAuth fallback={<p>Please login</p>}>
            <p>Secret</p>
         </RequireAuth>
      )

      expect(screen.getByText('Please login')).toBeInTheDocument()
      expect(screen.queryByText('Secret')).not.toBeInTheDocument()
   })

   it('renders children when authenticated', () => {
      useAuthStore.setState({
         isAuthenticated: true,
         user: adminUser,
      })

      render(
         <RequireAuth fallback={<p>Please login</p>}>
            <p>Secret</p>
         </RequireAuth>
      )

      expect(screen.getByText('Secret')).toBeInTheDocument()
   })
})

describe('RoleGuard', () => {
   beforeEach(() => {
      useAuthStore.getState().reset()
      useAuthStore.setState({
         isAuthenticated: true,
         user: adminUser,
         isInitialized: true,
         isLoading: false,
      })
   })

   it('allows matching roles', () => {
      render(
         <RoleGuard
            allowedRoles={['admin', 'superAdmin']}
            fallback={<p>Denied</p>}
         >
            <p>Admin panel</p>
         </RoleGuard>
      )

      expect(screen.getByText('Admin panel')).toBeInTheDocument()
   })

   it('blocks non-matching roles', () => {
      useAuthStore.setState({
         user: { ...adminUser, role: 'developer' },
      })

      render(
         <RoleGuard allowedRoles={['admin']} fallback={<p>Denied</p>}>
            <p>Admin panel</p>
         </RoleGuard>
      )

      expect(screen.getByText('Denied')).toBeInTheDocument()
      expect(screen.queryByText('Admin panel')).not.toBeInTheDocument()
   })
})
