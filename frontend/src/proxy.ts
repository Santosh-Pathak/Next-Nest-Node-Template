import { NextRequest, NextResponse } from 'next/server'
import { ROUTES, STORAGE_KEYS } from '@/constants/urls'
import { UserRole } from '@/types/auth'

const protectedRoutes = {
   '/dashboard': {
      requiredRoles: ['superAdmin', 'admin', 'developer'] as UserRole[],
   },
   '/profile': {
      requiredRoles: ['superAdmin', 'admin', 'developer'] as UserRole[],
   },
   '/user-management': {
      requiredRoles: ['superAdmin', 'admin'] as UserRole[],
   },
   '/themes': {
      requiredRoles: ['superAdmin', 'admin'] as UserRole[],
   },
   '/items': {
      requiredRoles: ['superAdmin', 'admin', 'developer'] as UserRole[],
   },
} as const

const publicRoutes = [
   '/',
   '/login',
   '/register',
   '/signup',
   '/forgot-password',
   '/reset-password',
   '/verify-email',
   '/verify-otp',
   '/unauthorized',
   '/not-found',
   '/_next',
   '/api',
   '/favicon.ico',
] as const

const authPages = [
   '/login',
   '/register',
   '/signup',
   '/forgot-password',
   '/reset-password',
   '/verify-email',
   '/verify-otp',
] as const

function hasRequiredRole(
   userRole: UserRole,
   requiredRoles: UserRole[]
): boolean {
   return requiredRoles.includes(userRole)
}

function getUserFromCookies(request: NextRequest): {
   isAuthenticated: boolean
   user: {
      _id?: string
      id?: string
      role: UserRole
      isEmailVerified: boolean
      isActive: boolean
   } | null
   accessToken: string | null
} {
   const accessToken = request.cookies.get(STORAGE_KEYS.ACCESS_TOKEN)?.value
   const userCookie = request.cookies.get(STORAGE_KEYS.USER)?.value

   if (!accessToken || !userCookie) {
      return { isAuthenticated: false, user: null, accessToken: null }
   }

   try {
      const user = JSON.parse(decodeURIComponent(userCookie))

      if (!user.role) {
         return { isAuthenticated: false, user: null, accessToken: null }
      }

      const isEmailVerified = Object.hasOwn(user, 'isEmailVerified')
         ? user.isEmailVerified
         : true
      const isActive = Object.hasOwn(user, 'isActive') ? user.isActive : true

      return {
         isAuthenticated: true,
         user: {
            _id: user._id,
            id: user.id || user._id,
            role: user.role,
            isEmailVerified: isEmailVerified,
            isActive: isActive,
         },
         accessToken,
      }
   } catch (error) {
      console.error('Failed to parse user cookie:', error)
      return { isAuthenticated: false, user: null, accessToken: null }
   }
}

function isPublicRoute(pathname: string): boolean {
   return publicRoutes.some((route) => {
      if (route === '/') {
         return pathname === '/'
      }
      return pathname.startsWith(route)
   })
}

function isAuthPage(pathname: string): boolean {
   return authPages.some((route) => pathname.startsWith(route))
}

function getRoutePermissions(
   pathname: string
): { requiredRoles: UserRole[] } | null {
   if (pathname in protectedRoutes) {
      return protectedRoutes[pathname as keyof typeof protectedRoutes]
   }

   for (const [route, permissions] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route + '/')) {
         return permissions
      }
   }

   return null
}

function createRedirectWithToast(
   url: string,
   request: NextRequest,
   toastMessage?: string,
   toastType: 'error' | 'warning' | 'info' = 'error'
): NextResponse {
   const redirectUrl = new URL(url, request.url)

   if (toastMessage) {
      redirectUrl.searchParams.set('toast', encodeURIComponent(toastMessage))
      redirectUrl.searchParams.set('toastType', toastType)
   }

   const response = NextResponse.redirect(redirectUrl)

   response.headers.set('X-Frame-Options', 'DENY')
   response.headers.set('X-Content-Type-Options', 'nosniff')
   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
   response.headers.set('X-XSS-Protection', '1; mode=block')

   return response
}

function createAuthenticatedResponse(
   request: NextRequest,
   user: {
      _id?: string
      id?: string
      role: UserRole
      isEmailVerified: boolean
      isActive: boolean
   }
): NextResponse {
   const response = NextResponse.next()

   response.headers.set('X-Frame-Options', 'DENY')
   response.headers.set('X-Content-Type-Options', 'nosniff')
   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
   response.headers.set('X-XSS-Protection', '1; mode=block')

   if (user.id || user._id) {
      response.headers.set('X-User-ID', user.id || user._id || '')
   }
   response.headers.set('X-User-Role', user.role)
   response.headers.set(
      'X-User-Email-Verified',
      user.isEmailVerified.toString()
   )
   response.headers.set('X-User-Active', user.isActive.toString())

   return response
}

export default function proxy(request: NextRequest) {
   const { pathname } = request.nextUrl

   if (isPublicRoute(pathname) && !isAuthPage(pathname)) {
      return NextResponse.next()
   }

   const { isAuthenticated, user, accessToken } = getUserFromCookies(request)

   if (isAuthPage(pathname)) {
      if (isAuthenticated && user) {
         return createRedirectWithToast(
            ROUTES.DASHBOARD,
            request,
            'You are already logged in',
            'info'
         )
      }
      return NextResponse.next()
   }

   const routePermissions = getRoutePermissions(pathname)

   if (!routePermissions) {
      return NextResponse.next()
   }

   if (!isAuthenticated || !user || !accessToken) {
      return createRedirectWithToast(
         `${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`,
         request,
         'Please log in to access this page'
      )
   }

   if (
      Object.prototype.hasOwnProperty.call(user, 'isActive') &&
      !user.isActive
   ) {
      return createRedirectWithToast(
         ROUTES.UNAUTHORIZED,
         request,
         'Your account is inactive. Please contact support.'
      )
   }

   if (
      Object.prototype.hasOwnProperty.call(user, 'isEmailVerified') &&
      !user.isEmailVerified
   ) {
      return createRedirectWithToast(
         ROUTES.LOGIN,
         request,
         'Please verify your email address before accessing this page'
      )
   }

   const { requiredRoles } = routePermissions

   if (!hasRequiredRole(user.role, requiredRoles)) {
      return createRedirectWithToast(
         ROUTES.UNAUTHORIZED,
         request,
         'You do not have permission to access this page'
      )
   }

   return createAuthenticatedResponse(request, user)
}

export const config = {
   matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
   ],
}
