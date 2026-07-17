import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
   setUserCookie,
   clearAuthCookies,
   clearLegacyTokenCookies,
} from '@/services/auth-session'
import type { User, UserRole } from '@/types/auth'

export interface AuthState {
   isAuthenticated: boolean
   isLoading: boolean
   isInitialized: boolean
   user: User | null
   error: string | null
   lastActivity: Date | null
   isUploading: boolean
   uploadProgress: number
   preferences: {
      rememberMe: boolean
      theme: 'light' | 'dark' | 'system'
      language: string
   }
}

export interface AuthActions {
   login: (user: User) => void
   logout: () => void
   setUser: (user: User | null) => void
   setAuthenticated: (isAuthenticated: boolean) => void
   setLoading: (isLoading: boolean) => void
   setError: (error: string | null) => void
   clearError: () => void
   setUploading: (isUploading: boolean) => void
   setUploadProgress: (progress: number) => void
   updateActivity: () => void
   updatePreferences: (preferences: Partial<AuthState['preferences']>) => void
   setInitialized: (isInitialized: boolean) => void
   reset: () => void
   hasRole: (role: UserRole) => boolean
   hasAnyRole: (roles: UserRole[]) => boolean
   canAccess: (requiredRoles: UserRole[]) => boolean
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
   isAuthenticated: false,
   isLoading: false,
   isInitialized: false,
   user: null,
   error: null,
   lastActivity: null,
   isUploading: false,
   uploadProgress: 0,
   preferences: {
      rememberMe: false,
      theme: 'system',
      language: 'en',
   },
}

export const useAuthStore = create<AuthStore>()(
   persist(
      immer((set, get) => ({
         ...initialState,

         login: (user: User) => {
            set((state) => {
               state.isAuthenticated = true
               state.isLoading = false
               state.user = user
               state.error = null
               state.lastActivity = new Date()
            })

            clearLegacyTokenCookies()
            setUserCookie(user)
         },

         logout: () => {
            set((state) => {
               state.isAuthenticated = false
               state.isLoading = false
               state.user = null
               state.error = null
               state.lastActivity = null
            })

            clearAuthCookies()
         },

         setUser: (user: User | null) => {
            set((state) => {
               state.user = user
               if (user) {
                  state.isAuthenticated = true
                  state.lastActivity = new Date()
                  setUserCookie(user)
               } else {
                  clearAuthCookies()
               }
            })
         },

         setAuthenticated: (isAuthenticated: boolean) => {
            set((state) => {
               state.isAuthenticated = isAuthenticated
               if (!isAuthenticated) {
                  state.user = null
                  state.lastActivity = null
                  clearAuthCookies()
               }
            })
         },

         setLoading: (isLoading: boolean) => {
            set((state) => {
               state.isLoading = isLoading
            })
         },

         setError: (error: string | null) => {
            set((state) => {
               state.error = error
               if (error) {
                  state.isLoading = false
               }
            })
         },

         clearError: () => {
            set((state) => {
               state.error = null
            })
         },

         setUploading: (isUploading: boolean) => {
            set((state) => {
               state.isUploading = isUploading
               if (!isUploading) {
                  state.uploadProgress = 0
               }
            })
         },

         setUploadProgress: (progress: number) => {
            set((state) => {
               state.uploadProgress = progress
            })
         },

         updateActivity: () => {
            set((state) => {
               state.lastActivity = new Date()
            })
         },

         updatePreferences: (
            preferences: Partial<AuthState['preferences']>
         ) => {
            set((state) => {
               state.preferences = { ...state.preferences, ...preferences }
            })
         },

         setInitialized: (isInitialized: boolean) => {
            set((state) => {
               state.isInitialized = isInitialized
            })
         },

         reset: () => {
            set(() => ({ ...initialState }))
            clearAuthCookies()
         },

         hasRole: (role: UserRole) => {
            const state = get()
            return state.user?.role === role
         },

         hasAnyRole: (roles: UserRole[]) => {
            const state = get()
            return state.user?.role ? roles.includes(state.user.role) : false
         },

         canAccess: (requiredRoles: UserRole[]) => {
            const state = get()
            return state.isAuthenticated && state.user?.role
               ? requiredRoles.includes(state.user.role)
               : false
         },
      })),
      {
         name: 'auth-storage',
         partialize: (state) => ({
            user: state.user,
            preferences: state.preferences,
            isAuthenticated: state.isAuthenticated,
         }),
         onRehydrateStorage: () => (state) => {
            if (state) {
               // Tokens are httpOnly — restore UI session from persisted user only.
               // AppProvider validates via /auth/profile with credentials.
               if (state.user && state.isAuthenticated) {
                  setUserCookie(state.user)
               } else {
                  state.isAuthenticated = false
                  state.user = null
                  clearAuthCookies()
               }

               state.isInitialized = true
               state.isLoading = false
            }
         },
      }
   )
)

export const authSelectors = {
   isAuthenticated: () => useAuthStore((state) => state.isAuthenticated),
   isLoading: () => useAuthStore((state) => state.isLoading),
   isInitialized: () => useAuthStore((state) => state.isInitialized),
   user: () => useAuthStore((state) => state.user),
   error: () => useAuthStore((state) => state.error),
   preferences: () => useAuthStore((state) => state.preferences),
   userRole: () => useAuthStore((state) => state.user?.role),
   isUploading: () => useAuthStore((state) => state.isUploading),
   uploadProgress: () => useAuthStore((state) => state.uploadProgress),
   hasRole: (role: UserRole) => useAuthStore((state) => state.hasRole(role)),
   hasAnyRole: (roles: UserRole[]) =>
      useAuthStore((state) => state.hasAnyRole(roles)),
   canAccess: (roles: UserRole[]) =>
      useAuthStore((state) => state.canAccess(roles)),
}

export const authActions = {
   login: () => useAuthStore((state) => state.login),
   logout: () => useAuthStore((state) => state.logout),
   setUser: () => useAuthStore((state) => state.setUser),
   setAuthenticated: () => useAuthStore((state) => state.setAuthenticated),
   setLoading: () => useAuthStore((state) => state.setLoading),
   setError: () => useAuthStore((state) => state.setError),
   clearError: () => useAuthStore((state) => state.clearError),
   setUploading: () => useAuthStore((state) => state.setUploading),
   setUploadProgress: () => useAuthStore((state) => state.setUploadProgress),
   updateActivity: () => useAuthStore((state) => state.updateActivity),
   updatePreferences: () => useAuthStore((state) => state.updatePreferences),
   setInitialized: () => useAuthStore((state) => state.setInitialized),
   reset: () => useAuthStore((state) => state.reset),
}
