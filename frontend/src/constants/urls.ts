/**
 * API endpoint constants - Based on backend documentation
 */
export const API_ENDPOINTS = {
   AUTH: {
      SIGNUP: '/api/v1/auth/signup',
      LOGIN: '/api/v1/auth/login',
      LOGOUT: '/api/v1/auth/logout',
      SEND_VERIFICATION_EMAIL: '/api/v1/auth/send-verification-email',
      VERIFY_EMAIL: '/api/v1/auth/verify-email',
      FORGET_PASSWORD: '/api/v1/auth/forget-password',
      VERIFY_OTP: '/api/v1/auth/verify-otp',
      RESET_PASSWORD: '/api/v1/auth/reset-password',
      REFRESH: '/api/v1/auth/refresh',
      PROFILE: '/api/v1/auth/profile',
      UPDATE_PROFILE: '/api/v1/auth/profile',
      UPDATE_PASSWORD: '/api/v1/auth/update-password',
      DELETE_ACCOUNT: '/api/v1/auth/delete-account',
      REGISTER_USER: '/api/v1/auth/register-user',
      GET_USERS: '/api/v1/users',
      UPLOAD_FILE: '/api/v1/file/azure-upload',
   },
   THEME: {
      GET_ALL: '/api/v1/theme',
      CREATE: '/api/v1/theme',
      GET_BY_ID: '/api/v1/theme/:id',
      UPDATE: '/api/v1/theme/:id',
      DELETE: '/api/v1/theme/:id',
      DUPLICATE: '/api/v1/theme/:id/duplicate',
      VALIDATE: '/api/v1/theme/validate',
      VALIDATE_THEME: '/api/v1/theme/:id/validate',
      EXPORT: '/api/v1/theme/:id/export',
      IMPORT: '/api/v1/theme/import',
      SET_DEFAULT: '/api/v1/theme/:id/set-default',
      GET_ACTIVE: '/api/v1/theme/active',
      ACTIVATE: '/api/v1/theme/:id/activate',
   },
   USER: {
      GET_ALL: '/api/v1/users',
      CREATE: '/api/v1/users',
      GET_BY_ID: '/api/v1/users/:id',
      UPDATE: '/api/v1/users/:id',
      DELETE: '/api/v1/users/:id',
      PROFILE: '/api/v1/auth/profile',
      UPDATE_PROFILE: '/api/v1/auth/profile',
      CHANGE_PASSWORD: '/api/v1/auth/update-password',
   },
   ITEMS: {
      GET_ALL: '/api/v1/items',
      CREATE: '/api/v1/items',
      GET_BY_ID: '/api/v1/items/:id',
      UPDATE: '/api/v1/items/:id',
      DELETE: '/api/v1/items/:id',
   },
} as const

export const ROUTES = {
   HOME: '/',
   LOGIN: '/login',
   REGISTER: '/register',
   SIGNUP: '/register',
   VERIFY_EMAIL: '/verify-email',
   VERIFY_OTP: '/verify-otp',
   DASHBOARD: '/dashboard',
   PROFILE: '/profile',
   FORGOT_PASSWORD: '/forgot-password',
   RESET_PASSWORD: '/reset-password',
   ACCESS_DENIED: '/access-denied',
   UNAUTHORIZED: '/unauthorized',
   USER_MANAGEMENT: '/user-management',
   THEME_MANAGEMENT: '/themes',
   ITEMS: '/items',
} as const

import { env } from '@/config/env'

export const BASE_URL = env.NEXT_PUBLIC_API_BASE_URL

export const CACHE_TIME = {
   SHORT: 1000 * 60 * 5,
   MEDIUM: 1000 * 60 * 15,
   LONG: 1000 * 60 * 60,
} as const

export const STORAGE_KEYS = {
   ACCESS_TOKEN: 'accessToken',
   REFRESH_TOKEN: 'refreshToken',
   USER: 'user',
   THEME: 'theme',
   AUTH_STORAGE: 'auth-storage',
   SESSION_ID: 'sessionId',
} as const

export const ROLES = {
   SUPER_ADMIN: 'superAdmin',
   ADMIN: 'admin',
   DEVELOPER: 'developer',
} as const

export const PERMISSIONS = {
   VIEW_PROFILE: 'view:profile',
   EDIT_PROFILE: 'edit:profile',
   DELETE_ACCOUNT: 'delete:account',
   MANAGE_USERS: 'manage:users',
   VIEW_THEMES: 'view:themes',
   CREATE_THEMES: 'create:themes',
   EDIT_THEMES: 'edit:themes',
   DELETE_THEMES: 'delete:themes',
   MANAGE_THEMES: 'manage:themes',
   EXPORT_THEMES: 'export:themes',
   IMPORT_THEMES: 'import:themes',
} as const
