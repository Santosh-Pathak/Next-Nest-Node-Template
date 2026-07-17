import axios, {
   AxiosInstance,
   AxiosRequestConfig,
   AxiosResponse,
   AxiosError,
   InternalAxiosRequestConfig,
} from 'axios'
import toast from 'react-hot-toast'
import { BASE_URL, API_ENDPOINTS } from '@/constants/urls'
import { clearAuthCookies, handleSessionExpired } from '@/services/auth-session'

// Backend API Response Types (updated to handle both formats)
export interface BackendApiResponse<T = any> {
   status: 'success' | 'fail' | 'error' | number
   message: string
   data?: T
   errors?: Record<string, string[]>
   meta?: {
      total?: number
      page?: number
      limit?: number
      totalPages?: number
   }
}

// Auth refresh response (tokens stay in httpOnly cookies)
export interface AuthRefreshResult {
   refreshed?: boolean
}

export class ApiError extends Error {
   constructor(
      public message: string,
      public status: number,
      public data?: any,
      public errors?: Record<string, string[]>
   ) {
      super(message)
      this.name = 'ApiError'
   }
}

export interface RequestConfig extends AxiosRequestConfig {
   skipAuth?: boolean
   skipAuthRefresh?: boolean
   skipErrorHandler?: boolean
   showErrorToast?: boolean
   suppressErrorLogging?: boolean
}

// Extended config for request metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
   metadata?: {
      startTime: Date
   }
}

/**
 * Production-ready HTTP service with proper token management and automatic retry
 * Features:
 * - Automatic access token refresh on expiration
 * - Automatic retry of failed requests after token refresh
 * - Queue management for concurrent requests during token refresh
 * - Proper error handling and user feedback
 * Designed specifically for your backend API format
 */
class HttpService {
   private readonly instance: AxiosInstance
   private refreshTokenPromise: Promise<boolean> | null = null
   private isRefreshing = false
   private failedQueue: Array<{
      resolve: (ok: boolean) => void
      reject: (error: any) => void
   }> = []

   constructor(baseURL: string = BASE_URL) {
      this.instance = axios.create({
         baseURL,
         timeout: 30000,
         withCredentials: true,
         headers: {
            'Content-Type': 'application/json',
         },
      })

      this.setupInterceptors()
   }

   /**
    * Process failed queue after cookie refresh
    */
   private processQueue(error: any, ok: boolean = false): void {
      this.failedQueue.forEach(({ resolve, reject }) => {
         if (error) {
            reject(error)
         } else {
            resolve(ok)
         }
      })

      this.failedQueue = []
   }

   private clearTokens(): void {
      clearAuthCookies()
   }

   private handleAuthenticationFailure(): void {
      handleSessionExpired()
   }

   /**
    * Refresh access token via httpOnly refresh cookie
    */
   private async refreshAccessToken(): Promise<boolean> {
      if (this.refreshTokenPromise) {
         return this.refreshTokenPromise
      }

      this.refreshTokenPromise = this.performTokenRefresh()

      try {
         return await this.refreshTokenPromise
      } finally {
         this.refreshTokenPromise = null
      }
   }

   /**
    * Perform the actual token refresh call using the backend /refresh endpoint
    */
   private async performTokenRefresh(): Promise<boolean> {
      try {
         const refreshUrl = `${BASE_URL || ''}${API_ENDPOINTS.AUTH.REFRESH}`

         const response = await axios.post<
            BackendApiResponse<AuthRefreshResult>
         >(
            refreshUrl,
            {},
            {
               withCredentials: true,
               headers: { 'Content-Type': 'application/json' },
            }
         )

         const isSuccessResponse =
            response.status === 200 &&
            (response.data.status === 'success' ||
               response.data.message?.includes('refreshed') ||
               response.data.data?.refreshed === true)

         if (!isSuccessResponse) {
            throw new Error('Token refresh failed - invalid response')
         }

         return true
      } catch (error: any) {
         const errorData = error.response?.data
         const isRefreshTokenInvalid =
            error.response?.status === 401 ||
            errorData?.status === 'fail' ||
            errorData?.message?.includes('Invalid or expired token') ||
            errorData?.message?.includes('refresh token') ||
            errorData?.message === 'Invalid or expired refresh token' ||
            errorData?.message === 'Invalid refresh token' ||
            errorData?.message === 'Refresh token not found' ||
            errorData?.message === 'Refresh token is required'

         if (isRefreshTokenInvalid) {
            this.clearTokens()
         }

         throw error
      }
   }

   /**
    * Setup request and response interceptors
    */
   private setupInterceptors(): void {
      // Request interceptor
      this.instance.interceptors.request.use(
         (config: InternalAxiosRequestConfig) => {
            // Auth is carried by httpOnly cookies (withCredentials).
            // Bearer headers are intentionally not set from JS.

            ;(config as ExtendedAxiosRequestConfig).metadata = {
               startTime: new Date(),
            }

            return config
         },
         (error: AxiosError) => {
            return Promise.reject(this.normalizeError(error))
         }
      )

      // Response interceptor
      this.instance.interceptors.response.use(
         (response: AxiosResponse) => {
            // Log response time in development
            if (process.env.NODE_ENV === 'development') {
               const config = response.config as ExtendedAxiosRequestConfig
               const endTime = new Date()
               const duration =
                  endTime.getTime() -
                  (config.metadata?.startTime?.getTime() || 0)
               console.log(`API Request to ${config.url} took ${duration}ms`)
            }

            return response
         },
         async (error: AxiosError) => {
            const originalRequest = error.config as any

            // Handle specific account status errors first
            const errorData = error.response?.data as any
            const errorMessage = errorData?.message || ''

            // Handle deactivated account (don't trigger token refresh)
            if (errorMessage.toLowerCase().includes('deactivated')) {
               console.log('Account deactivated error detected')
               toast.error(
                  'Your account has been deactivated. Please contact support to reactivate your account.'
               )
               return Promise.reject(
                  new ApiError(
                     'Account deactivated',
                     error.response?.status || 403,
                     errorData
                  )
               )
            }

            // Handle 401 errors with cookie-based token refresh and automatic retry
            if (error.response?.status === 401 && !originalRequest._retry) {
               const skipAuth = originalRequest.skipAuth
               const skipAuthRefresh = originalRequest.skipAuthRefresh
               const isRefreshCall =
                  originalRequest.url?.includes('/auth/refresh')

               if (skipAuth || skipAuthRefresh || isRefreshCall) {
                  return Promise.reject(this.normalizeError(error))
               }

               if (this.isRefreshing) {
                  return new Promise((resolve, reject) => {
                     this.failedQueue.push({
                        resolve: async () => {
                           try {
                              const response =
                                 await this.instance(originalRequest)
                              resolve(response)
                           } catch (retryError) {
                              reject(retryError)
                           }
                        },
                        reject,
                     })
                  })
               }

               originalRequest._retry = true
               this.isRefreshing = true

               try {
                  const refreshed = await this.refreshAccessToken()

                  if (refreshed) {
                     this.processQueue(null, true)
                     return await this.instance(originalRequest)
                  }

                  this.processQueue(
                     new ApiError('Failed to refresh token', 401),
                     false
                  )
                  this.handleAuthenticationFailure()
                  return Promise.reject(
                     new ApiError('Failed to refresh token', 401)
                  )
               } catch (refreshError: any) {
                  this.processQueue(refreshError, false)
                  this.handleAuthenticationFailure()
                  return Promise.reject(
                     new ApiError('Session expired', 401, refreshError)
                  )
               } finally {
                  this.isRefreshing = false
               }
            }

            // Handle other errors
            return Promise.reject(this.normalizeError(error))
         }
      )
   }

   /**
    * Normalize errors to a consistent format
    */
   private normalizeError(error: AxiosError): ApiError {
      console.log('normalizeError called with:', error)
      console.log('Error response:', error.response)
      console.log('Error response data:', error.response?.data)
      console.log('Error response status:', error.response?.status)

      const status = error.response?.status || 500
      const data = error.response?.data as any

      let message = 'An unexpected error occurred'

      // Handle your backend's error format
      if (data?.message) {
         message = data.message
         console.log('Using message from response data:', message)
      } else if (error.message) {
         message = error.message
         console.log('Using error.message:', message)
      }

      // Check if this is an authentication error
      const isAuthError =
         status === 401 ||
         message.includes('Invalid or expired token') ||
         message.includes('Unauthorized') ||
         message.includes('Authentication failed')

      const apiError = new ApiError(message, status, data?.data, data?.errors)

      // Show error toast if not explicitly disabled and not an auth error
      // (auth errors are handled by the auth system)
      const config = error.config as any
      const shouldShowToast = config?.showErrorToast !== false && !isAuthError

      // Only log to console if not explicitly disabled
      const shouldLogError = config?.suppressErrorLogging !== true
      if (shouldLogError) {
         console.log('Created ApiError:', apiError)
      }

      if (shouldShowToast && typeof window !== 'undefined') {
         // Don't show toast for token refresh failures as they're handled automatically
         if (!error.config?.url?.includes('/get-access-token')) {
            toast.error(message)
         }
      }

      return apiError
   }

   /**
    * HTTP GET request
    */
   async get<T>(url: string, config?: RequestConfig): Promise<T> {
      try {
         const response = await this.instance.get<BackendApiResponse<T>>(
            url,
            config
         )

         // Handle both string and number status formats
         const isFail =
            response.data.status === 'error' ||
            response.data.status === 'fail' ||
            (typeof response.data.status === 'number' &&
               response.data.status >= 400)

         if (isFail) {
            throw new ApiError(
               response.data.message,
               typeof response.data.status === 'number'
                  ? response.data.status
                  : response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data.data!
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * HTTP POST request
    */
   async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
      try {
         const response = await this.instance.post<BackendApiResponse<T>>(
            url,
            data,
            config
         )

         // Handle both string and number status formats
         const isFail =
            response.data.status === 'error' ||
            response.data.status === 'fail' ||
            (typeof response.data.status === 'number' &&
               response.data.status >= 400)

         if (isFail) {
            throw new ApiError(
               response.data.message,
               typeof response.data.status === 'number'
                  ? response.data.status
                  : response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data.data!
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * HTTP PUT request
    */
   async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
      try {
         const response = await this.instance.put<BackendApiResponse<T>>(
            url,
            data,
            config
         )

         // Handle both string and number status formats
         const isFail =
            response.data.status === 'error' ||
            response.data.status === 'fail' ||
            (typeof response.data.status === 'number' &&
               response.data.status >= 400)

         if (isFail) {
            throw new ApiError(
               response.data.message,
               typeof response.data.status === 'number'
                  ? response.data.status
                  : response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data.data!
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * HTTP PATCH request
    */
   async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
      try {
         const response = await this.instance.patch<BackendApiResponse<T>>(
            url,
            data,
            config
         )

         if (
            response.data.status === 'error' ||
            response.data.status === 'fail'
         ) {
            throw new ApiError(
               response.data.message,
               response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data.data!
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * HTTP DELETE request
    */
   async delete<T>(url: string, config?: RequestConfig): Promise<T> {
      try {
         const response = await this.instance.delete<BackendApiResponse<T>>(
            url,
            config
         )

         if (
            response.data.status === 'error' ||
            response.data.status === 'fail'
         ) {
            throw new ApiError(
               response.data.message,
               response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data.data!
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * Upload file with progress tracking
    */
   async upload<T>(
      url: string,
      formData: FormData,
      onProgress?: (progress: number) => void,
      config?: RequestConfig
   ): Promise<T> {
      try {
         const response = await this.instance.post<BackendApiResponse<T>>(
            url,
            formData,
            {
               ...config,
               headers: {
                  'Content-Type': 'multipart/form-data',
                  ...config?.headers,
               },
               onUploadProgress: (progressEvent) => {
                  if (onProgress && progressEvent.total) {
                     const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                     )
                     onProgress(progress)
                  }
               },
            }
         )

         if (
            response.data.status === 'error' ||
            response.data.status === 'fail'
         ) {
            throw new ApiError(
               response.data.message,
               response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data.data!
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * Download file
    */
   async download(url: string, config?: RequestConfig): Promise<Blob> {
      try {
         const response = await this.instance.get(url, {
            ...config,
            responseType: 'blob',
         })
         return response.data
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * GET request that returns full backend response (data + meta)
    * Useful for paginated endpoints
    */
   async getWithMeta<T>(
      url: string,
      config?: RequestConfig
   ): Promise<BackendApiResponse<T>> {
      try {
         const response = await this.instance.get<BackendApiResponse<T>>(
            url,
            config
         )

         const isFail =
            response.data.status === 'error' ||
            response.data.status === 'fail' ||
            (typeof response.data.status === 'number' &&
               response.data.status >= 400)

         if (isFail) {
            throw new ApiError(
               response.data.message,
               typeof response.data.status === 'number'
                  ? response.data.status
                  : response.status,
               response.data.data,
               response.data.errors
            )
         }

         return response.data
      } catch (error) {
         throw error instanceof ApiError
            ? error
            : this.normalizeError(error as AxiosError)
      }
   }

   /**
    * Get axios instance for advanced usage
    */
   getInstance(): AxiosInstance {
      return this.instance
   }
}

// Create and export singleton instance
export const httpService = new HttpService()

// Export the class for custom instances
export { HttpService }

// Legacy compatibility export
export const apiClient = httpService
