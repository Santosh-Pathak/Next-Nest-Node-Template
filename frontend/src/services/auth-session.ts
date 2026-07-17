import toast from 'react-hot-toast'
import { STORAGE_KEYS, ROUTES } from '@/constants/urls'

/**
 * Auth session helpers — tokens live in httpOnly cookies set by the API.
 * JS only manages the non-sensitive USER cookie for Next.js route guards.
 */

const userCookieOptions = (): string => {
   const isProduction = process.env.NODE_ENV === 'production'
   const secure = isProduction ? '; secure' : ''
   return `path=/; samesite=lax${secure}`
}

export function setUserCookie(user: unknown): void {
   if (typeof window === 'undefined') return
   document.cookie = `${STORAGE_KEYS.USER}=${encodeURIComponent(JSON.stringify(user))}; ${userCookieOptions()}`
}

export function clearUserCookie(): void {
   if (typeof window === 'undefined') return
   document.cookie = `${STORAGE_KEYS.USER}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

/** Clears any legacy non-httpOnly token cookies from older clients. */
export function clearLegacyTokenCookies(): void {
   if (typeof window === 'undefined') return
   document.cookie = `${STORAGE_KEYS.ACCESS_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
   document.cookie = `${STORAGE_KEYS.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function clearAuthCookies(): void {
   clearUserCookie()
   clearLegacyTokenCookies()
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
