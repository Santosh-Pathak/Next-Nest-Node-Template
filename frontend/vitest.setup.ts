import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
   cleanup()
   vi.clearAllMocks()
})

vi.mock('next/navigation', () => ({
   useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
   }),
   usePathname: () => '/dashboard',
   useSearchParams: () => new URLSearchParams(),
}))

vi.mock('react-hot-toast', () => ({
   toast: {
      success: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
   },
   default: {
      success: vi.fn(),
      error: vi.fn(),
   },
}))
