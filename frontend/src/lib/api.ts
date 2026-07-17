/**
 * @deprecated Use `httpService` from `@/services/http` instead.
 * Kept as a thin re-export so accidental imports do not diverge.
 */
export { httpService as apiClient, ApiError } from '@/services/http'
export type { BackendApiResponse as ApiResponse } from '@/services/http'
