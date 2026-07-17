'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { User, UserFilters } from '@/types/user'
import { UserAPI } from '@/services/apis/user.api'
import { useDebounceCallback } from '@/utils/debounce'

export interface UserStats {
   totalUsers: { count: number; change: string }
   activeUsers: { count: number; change: string }
   verifiedUsers: { count: number; change: string }
   adminUsers: { count: number; change: string }
}

const ITEMS_PER_PAGE = 10
const DEBOUNCE_DELAY = 300
const STATS_REFRESH_INTERVAL = 30000

const emptyStats = (): UserStats => ({
   totalUsers: { count: 0, change: '+0%' },
   activeUsers: { count: 0, change: '+0%' },
   verifiedUsers: { count: 0, change: '+0%' },
   adminUsers: { count: 0, change: '+0%' },
})

/**
 * User list domain logic (SRP) — keeps UserManagement.tsx mostly presentational.
 */
export function useUserManagement() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const [, startTransition] = useTransition()
   const isLoadingRef = useRef(false)

   const [users, setUsers] = useState<User[]>([])
   const [loading, setLoading] = useState(true)
   const [totalCount, setTotalCount] = useState(0)
   const [currentPage, setCurrentPage] = useState(1)
   const [error, setError] = useState<string | null>(null)
   const [showFilters, setShowFilters] = useState(false)
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
   const [selectedUser, setSelectedUser] = useState<User | null>(null)
   const [filters, setFilters] = useState<
      Omit<UserFilters, 'page' | 'limit' | 'search'>
   >({})
   const [sortConfig, setSortConfig] = useState<{
      key: keyof User
      direction: 'asc' | 'desc'
   } | null>({
      key: 'createdAt',
      direction: 'desc',
   })
   const [userStats, setUserStats] = useState<UserStats | null>(null)

   const searchParamsTerm = searchParams.get('search') || ''
   const [localSearchTerm, setLocalSearchTerm] = useState(searchParamsTerm)

   const fetchUserStatsFromData = useCallback(
      async (usersResponse?: unknown) => {
         try {
            const response = await UserAPI.getUserStats(usersResponse as any)
            setUserStats(response.data)
         } catch {
            setUserStats(emptyStats())
         }
      },
      []
   )

   const fetchUserStats = useCallback(async () => {
      try {
         const response = await UserAPI.getUserStats()
         setUserStats(response.data)
      } catch {
         setUserStats(emptyStats())
      }
   }, [])

   const fetchUsers = useCallback(
      async (page = 1, search = '', useCache = true) => {
         if (isLoadingRef.current) return

         try {
            isLoadingRef.current = true
            setLoading(true)
            setError(null)

            const params: UserFilters = {
               page,
               limit: ITEMS_PER_PAGE,
               search,
               searchFields: search ? ['name', 'email', 'phone'] : undefined,
               sort: sortConfig
                  ? [
                       `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.key}`,
                    ]
                  : ['-createdAt', '-name'],
               ...filters,
            }

            if (process.env.NODE_ENV === 'development' && !useCache) {
               UserAPI.clearCache()
            }

            const response = await UserAPI.getUsers(params)
            setUsers(response.data.data || [])
            setTotalCount(response.data.meta?.totalCount || 0)
            setCurrentPage(page)

            if (page === 1) {
               fetchUserStatsFromData(response)
            }
         } catch (err) {
            let errorMessage = 'Failed to fetch users'
            if (err instanceof Error) {
               const msg = err.message.toLowerCase()
               if (msg.includes('deactivated')) {
                  errorMessage =
                     'Your account has been deactivated. Please contact support.'
               } else if (msg.includes('disabled')) {
                  errorMessage =
                     'Your account has been disabled. Please contact support.'
               } else {
                  errorMessage = err.message
               }
            }
            setError(errorMessage)
            toast.error(errorMessage)
         } finally {
            setLoading(false)
            isLoadingRef.current = false
         }
      },
      [filters, sortConfig, fetchUserStatsFromData]
   )

   const debouncedSearch = useDebounceCallback((searchTerm: string) => {
      startTransition(() => {
         const params = new URLSearchParams(searchParams.toString())
         if (searchTerm) {
            params.set('search', searchTerm)
         } else {
            params.delete('search')
         }
         params.set('page', '1')
         router.push(`?${params.toString()}`)
      })
   }, DEBOUNCE_DELAY)

   const handleSearchInputChange = useCallback(
      (value: string) => {
         setLocalSearchTerm(value)
         debouncedSearch(value)
      },
      [debouncedSearch]
   )

   const handleSearch = useCallback(
      (search: string) => {
         const params = new URLSearchParams(searchParams.toString())
         if (search) {
            params.set('search', search)
         } else {
            params.delete('search')
         }
         params.set('page', '1')
         router.push(`?${params.toString()}`)
      },
      [router, searchParams]
   )

   const handlePageChange = useCallback(
      (page: number) => {
         const params = new URLSearchParams(searchParams.toString())
         params.set('page', (page + 1).toString())
         router.push(`?${params.toString()}`)
      },
      [router, searchParams]
   )

   const handleSort = useCallback(
      (key: keyof User) => {
         let direction: 'asc' | 'desc' = 'asc'
         if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'asc'
         ) {
            direction = 'desc'
         }
         setSortConfig({ key, direction })
         setFilters((prev) => ({
            ...prev,
            sortBy: key as string,
            sortOrder: direction,
         }))
      },
      [sortConfig]
   )

   const handleCreateUser = useCallback(() => {
      router.push('/user-management/new')
   }, [router])

   const handleEditUser = useCallback(
      (user: User) => {
         router.push(`/user-management/${user._id}/edit`)
      },
      [router]
   )

   const handleViewUser = useCallback(
      (user: User) => {
         router.push(`/user-management/${user._id}`)
      },
      [router]
   )

   const handleDeleteUser = useCallback((user: User) => {
      setSelectedUser(user)
      setDeleteDialogOpen(true)
   }, [])

   const handleToggleActive = useCallback(
      async (user: User) => {
         try {
            const updatedStatus = !user.active
            await UserAPI.updateUser(user._id, { active: updatedStatus })
            toast.success(
               `User ${updatedStatus ? 'activated' : 'deactivated'} successfully`
            )
            fetchUsers(currentPage, searchParamsTerm)
            fetchUserStatsFromData()
         } catch {
            toast.error(
               `Failed to ${user.active ? 'deactivate' : 'activate'} user`
            )
         }
      },
      [currentPage, searchParamsTerm, fetchUsers, fetchUserStatsFromData]
   )

   const confirmDeleteUser = useCallback(async () => {
      if (!selectedUser) return
      try {
         await UserAPI.deleteUser(selectedUser._id)
         toast.success('User deleted successfully')
         fetchUsers(currentPage, searchParamsTerm)
         fetchUserStatsFromData()
      } catch {
         toast.error('Failed to delete user')
      } finally {
         setDeleteDialogOpen(false)
         setSelectedUser(null)
      }
   }, [
      selectedUser,
      currentPage,
      searchParamsTerm,
      fetchUsers,
      fetchUserStatsFromData,
   ])

   const cancelDeleteUser = useCallback(() => {
      setDeleteDialogOpen(false)
      setSelectedUser(null)
   }, [])

   const handleExportUsers = useCallback(async () => {
      try {
         const params: UserFilters = {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            search: searchParamsTerm,
            ...filters,
         }
         const blob = await UserAPI.exportUsers(params)
         const url = window.URL.createObjectURL(blob)
         const a = document.createElement('a')
         a.style.display = 'none'
         a.href = url
         a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
         document.body.appendChild(a)
         a.click()
         window.URL.revokeObjectURL(url)
         document.body.removeChild(a)
         toast.success('Users exported successfully')
      } catch {
         toast.error('Failed to export users')
      }
   }, [currentPage, searchParamsTerm, filters])

   useEffect(() => {
      const page = Number.parseInt(searchParams.get('page') || '1', 10)
      const search = searchParams.get('search') || ''
      setCurrentPage(page)
      setLocalSearchTerm(search)
      fetchUsers(page, search)
   }, [searchParams, filters, fetchUsers])

   useEffect(() => {
      fetchUserStats()
      const statsInterval = setInterval(fetchUserStats, STATS_REFRESH_INTERVAL)
      return () => clearInterval(statsInterval)
   }, [fetchUserStats])

   useEffect(() => {
      if (filters.sortBy && filters.sortOrder) {
         setSortConfig({
            key: filters.sortBy as keyof User,
            direction: filters.sortOrder,
         })
      } else if (!sortConfig) {
         setSortConfig({ key: 'createdAt', direction: 'desc' })
         setFilters((prev) => ({
            ...prev,
            sortBy: 'createdAt',
            sortOrder: 'desc',
         }))
      }
   }, [filters.sortBy, filters.sortOrder, sortConfig])

   return {
      ITEMS_PER_PAGE,
      users,
      loading,
      totalCount,
      currentPage,
      error,
      setError,
      showFilters,
      setShowFilters,
      deleteDialogOpen,
      setDeleteDialogOpen,
      selectedUser,
      filters,
      setFilters,
      sortConfig,
      userStats,
      localSearchTerm,
      searchParamsTerm,
      fetchUsers,
      fetchUserStats,
      handleSearchInputChange,
      handleSearch,
      handlePageChange,
      handleSort,
      handleCreateUser,
      handleEditUser,
      handleViewUser,
      handleDeleteUser,
      handleToggleActive,
      confirmDeleteUser,
      cancelDeleteUser,
      handleExportUsers,
   }
}
