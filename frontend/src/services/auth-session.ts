import toast from 'react-hot-toast'
import { STORAGE_KEYS, ROUTES } from '@/constants/urls'

/**
 * Auth session cookie helpers (SRP).
 * Used by HttpService — keeps token I/O out of the HTTP transport class core.
 */

export function getAccessTokenFromCookie(): string | null {
   if (typeof window === 'undefined') return null
   const cookies = document.cookie.split(';')
   const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${STORAGE_KEYS.ACCESS_TOKEN}=`)
   )
   return tokenCookie ? tokenCookie.split('=')[1] : null
}

export function getRefreshTokenFromCookie(): string | null {
   if (typeof window === 'undefined') return null
   const cookies = document.cookie.split(';')
   const tokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${STORAGE_KEYS.REFRESH_TOKEN}=`)
   )
   return tokenCookie ? tokenCookie.split('=')[1] : null
}

export function updateAccessTokenCookie(newToken: string): void {
   if (typeof window === 'undefined') return
   const isProduction = process.env.NODE_ENV === 'production'
   const secure = isProduction ? '; secure' : ''
   document.cookie = `${STORAGE_KEYS.ACCESS_TOKEN}=${newToken}; path=/; samesite=strict${secure}`
}

export function clearAuthCookies(): void {
   if (typeof window === 'undefined') return
   document.cookie = `${STORAGE_KEYS.ACCESS_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
   document.cookie = `${STORAGE_KEYS.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
   document.cookie = `${STORAGE_KEYS.USER}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

let isLoggingOut = false

/**
 * Notify store + redirect on session expiry (breaks circular import via dynamic import).
 */
export function handleSessionExpired(): void {
   if (typeof window === 'undefined') return
   if (isLoggingOut) return

   isLoggingOut = true
   clearAuthCookies()

   import('@/store/auth.store')
      .then(({ useAuthStore }) => {
         useAuthStore.getState().logout()
      })
      .catch(console.error)

   toast.error('Your session has expired. Please log in again.')

   setTimeout(() => {
      window.location.href = ROUTES.LOGIN
      isLoggingOut = false
   }, 1000)
}

export function syncAccessTokenToStore(accessToken: string): void {
   if (typeof window === 'undefined') return
   import('@/store/auth.store')
      .then(({ useAuthStore }) => {
         useAuthStore.getState().refreshAccessToken(accessToken)
      })
      .catch(console.error)
}
