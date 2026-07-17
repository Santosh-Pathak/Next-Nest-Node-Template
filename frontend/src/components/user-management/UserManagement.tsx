'use client'

import React, { useMemo, memo } from 'react'
import {
   Plus,
   Search,
   Filter,
   Download,
   Eye,
   Edit,
   Trash2,
   RefreshCw,
   UserCheck,
   Users,
   Shield,
   TrendingUp,
   X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog'

import {
   User,
   UserFilters,
   USER_ROLES,
   USER_STATUS_OPTIONS,
   getUserRoleConfig,
   getUserStatusColor,
} from '@/types/user'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/theme-utils'
import DynamicTable from '@/components/common/DynamicTable'
import UserFiltersComponent from './UserFilters'
import { useUserManagement, type UserStats } from '@/hooks/useUserManagement'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'

// Memoized components for better performance
const MemoizedUserStats = memo(({ stats }: { stats: UserStats | null }) => {
   console.log('MemoizedUserStats rendering with stats:', stats) // Debug log

   // Show loading state if stats are not available
   if (!stats) {
      console.log('Stats is null, showing loading state') // Debug log
      return (
         <div className="px-3 pb-6 sm:px-4 lg:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
               {Array.from({ length: 4 }).map((_, index) => (
                  <Card
                     key={index}
                     className="theme-border overflow-hidden border-0 bg-gradient-to-br from-white/80 to-white/40 shadow-lg backdrop-blur-sm dark:from-gray-900/80 dark:to-gray-900/40"
                  >
                     <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                           <div className="flex flex-1 items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                 <div className="h-4 w-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <div className="mb-2 h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                 <div className="flex items-baseline gap-2">
                                    <div className="h-6 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-4 w-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>
      )
   }

   const statItems = useMemo(
      () => [
         {
            title: 'Total Users',
            value: String(stats?.totalUsers?.count ?? 0),
            icon: Users,
            gradient: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/50',
            iconColor: 'text-blue-600 dark:text-blue-400',
            change: stats?.totalUsers?.change ?? '+0%',
            isPositive: (stats?.totalUsers?.change ?? '+0%').startsWith('+'),
         },
         {
            title: 'Active Users',
            value: String(stats?.activeUsers?.count ?? 0),
            icon: UserCheck,
            gradient: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            change: stats?.activeUsers?.change ?? '+0%',
            isPositive: (stats?.activeUsers?.change ?? '+0%').startsWith('+'),
         },
         {
            title: 'Verified Users',
            value: String(stats?.verifiedUsers?.count ?? 0),
            icon: Shield,
            gradient: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-950/50',
            iconColor: 'text-orange-600 dark:text-orange-400',
            change: stats?.verifiedUsers?.change ?? '+0%',
            isPositive: (stats?.verifiedUsers?.change ?? '+0%').startsWith('+'),
         },
         {
            title: 'Admin Users',
            value: String(stats?.adminUsers?.count ?? 0),
            icon: Shield,
            gradient: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/50',
            iconColor: 'text-purple-600 dark:text-purple-400',
            change: stats?.adminUsers?.change ?? '+0%',
            isPositive: (stats?.adminUsers?.change ?? '+0%').startsWith('+'),
         },
      ],
      [stats]
   )

   return (
      <div className="px-3 pb-6 sm:px-4 lg:px-6">
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statItems.map((stat, index) => (
               <Card
                  key={index}
                  className="theme-border overflow-hidden border-0 bg-gradient-to-br from-white/80 to-white/40 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:from-gray-900/80 dark:to-gray-900/40"
               >
                  <CardContent className="p-3">
                     <div className="flex items-center justify-between">
                        <div className="flex flex-1 items-center gap-3">
                           <div
                              className={cn(
                                 'flex h-8 w-8 items-center justify-center rounded-lg',
                                 stat.bgColor
                              )}
                           >
                              <stat.icon
                                 className={cn('h-4 w-4', stat.iconColor)}
                              />
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="theme-text-secondary mb-0.5 truncate text-xs font-medium">
                                 {stat.title}
                              </p>
                              <div className="flex items-baseline gap-2">
                                 <p className="theme-text-primary text-xl font-bold">
                                    {stat.value}
                                 </p>
                                 <div
                                    className={cn(
                                       'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium',
                                       stat.isPositive
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                          : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                    )}
                                 >
                                    <TrendingUp
                                       className={cn(
                                          'h-2.5 w-2.5',
                                          stat.isPositive
                                             ? 'rotate-0'
                                             : 'rotate-180'
                                       )}
                                    />
                                    <span className="text-xs">
                                       {stat.change}
                                    </span>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div
                           className={cn(
                              'absolute top-0 right-0 h-8 w-8 rounded-bl-lg bg-gradient-to-br opacity-10',
                              stat.gradient
                           )}
                        />
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
   )
})

MemoizedUserStats.displayName = 'MemoizedUserStats'

// Optimized search input component
const SearchInput = memo(
   ({
      value,
      onChange,
      placeholder = 'Search users...',
   }: {
      value: string
      onChange: (value: string) => void
      placeholder?: string
   }) => {
      return (
         <div className="relative w-full sm:w-80 md:w-96 lg:w-[420px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
               <Search className="theme-text-muted h-5 w-5" />
            </div>
            <Input
               type="text"
               placeholder={placeholder}
               value={value}
               onChange={(e) => onChange(e.target.value)}
               className="theme-border theme-bg-secondary theme-text-primary placeholder:theme-text-muted h-12 w-full rounded-xl border-0 bg-transparent pr-4 pl-12 text-sm font-medium transition-all focus:ring-2 focus:ring-[var(--interactive-primary)]/20"
            />
         </div>
      )
   }
)

SearchInput.displayName = 'SearchInput'

// Main optimized component
const UserManagementOptimized: React.FC = () => {
   const { mode } = useTheme()
   const isDark = mode === 'dark'
   const {
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
   } = useUserManagement()

   // Memoized table columns
   const columns = useMemo(
      () => [
         {
            Header: 'User',
            accessor: 'name' as keyof User,
            sortable: true,
            Cell: (row: User) => (
               <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
                     {row.photo ? (
                        <img
                           src={row.photo}
                           alt={row.name}
                           className="h-10 w-10 rounded-lg object-cover"
                        />
                     ) : (
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                     )}
                  </div>
                  <div>
                     <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {row.name || 'Unknown'}
                     </p>
                     <p className="text-sm text-slate-600 dark:text-slate-400">
                        {row.email}
                     </p>
                  </div>
               </div>
            ),
         },
         {
            Header: 'Contact',
            accessor: 'phone' as keyof User,
            sortable: false,
            Cell: (row: User) => (
               <div>
                  {row.phone && (
                     <p className="text-sm text-slate-600 dark:text-slate-400">
                        {row.phone}
                     </p>
                  )}
                  {row.address && (
                     <p className="max-w-[200px] truncate text-sm text-slate-500 dark:text-slate-500">
                        {row.address}
                     </p>
                  )}
               </div>
            ),
         },
         {
            Header: 'Role',
            accessor: 'role' as keyof User,
            sortable: true,
            Cell: (row: User) => {
               const roleConfig = getUserRoleConfig(row.role)
               return (
                  <Badge className={roleConfig.color}>
                     <Shield className="mr-1 h-3 w-3" />
                     {roleConfig.label}
                  </Badge>
               )
            },
         },
         {
            Header: 'Status',
            accessor: 'active' as keyof User,
            sortable: true,
            Cell: (row: User) => (
               <Badge className={getUserStatusColor(row.active)}>
                  {row.active ? 'Active' : 'Inactive'}
               </Badge>
            ),
         },
         {
            Header: 'Created',
            accessor: 'createdAt' as keyof User,
            sortable: true,
            Cell: (row: User) => (
               <p className="text-sm text-slate-600 dark:text-slate-400">
                  {row.createdAt
                     ? new Date(row.createdAt).toLocaleDateString()
                     : '-'}
               </p>
            ),
         },
         {
            Header: 'Actions',
            accessor: 'actions' as keyof User,
            sortable: false,
            Cell: (row: User) => (
               <div className="flex gap-1 sm:gap-2">
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleViewUser(row)}
                     className="p-2"
                     title="View User"
                  >
                     <Eye className="size-4" />
                  </Button>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleEditUser(row)}
                     className="p-2"
                     title="Edit User"
                  >
                     <Edit className="size-4" />
                  </Button>
                  {/* Active/Inactive Toggle */}
                  <div
                     className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border border-solid transition-all duration-300 sm:h-6 sm:w-11 md:h-7 md:w-12 ${
                        row.active
                           ? 'border-green-500 bg-gradient-to-r from-green-500 to-green-600 shadow-green-200 hover:from-green-600 hover:to-green-700 dark:shadow-green-900/30'
                           : 'border-gray-300 bg-gradient-to-r from-gray-200 to-gray-300 shadow-gray-200 hover:from-gray-300 hover:to-gray-400 dark:border-gray-600 dark:from-gray-600 dark:to-gray-700 dark:shadow-gray-700/30 dark:hover:from-gray-500 dark:hover:to-gray-600'
                     } shadow-lg hover:shadow-xl`}
                     onClick={() => handleToggleActive(row)}
                     title={
                        row.active
                           ? 'Click to deactivate user'
                           : 'Click to activate user'
                     }
                  >
                     <span
                        className={`inline-block h-3 w-3 transform rounded-full border border-gray-200 bg-white shadow-md transition-all duration-300 ease-in-out sm:h-4 sm:w-4 md:h-5 md:w-5 dark:border-gray-300 ${
                           row.active
                              ? 'translate-x-5 shadow-lg sm:translate-x-6 md:translate-x-6'
                              : 'translate-x-1 shadow-sm'
                        }`}
                     >
                        {/* Status indicator inside the toggle */}
                        <div className="flex h-full w-full items-center justify-center">
                           <div
                              className={`h-1 w-1 rounded-full transition-all duration-300 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 ${
                                 row.active
                                    ? 'bg-green-500 shadow-sm'
                                    : 'bg-gray-400 dark:bg-gray-500'
                              }`}
                           />
                        </div>
                     </span>
                  </div>
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleDeleteUser(row)}
                     className="p-2 text-red-600 hover:text-red-800"
                     title="Delete User"
                  >
                     <Trash2 className="size-4" />
                  </Button>
               </div>
            ),
         },
      ],
      [handleViewUser, handleEditUser, handleToggleActive, handleDeleteUser]
   )

   return (
      <div className="theme-bg-primary min-h-screen">
         {/* Modern Header Section */}
         <div className="px-3 py-6 sm:px-4 lg:px-6">
            <div className="w-full">
               {/* Header Top */}
               <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--interactive-primary)] to-[var(--interactive-primary)] opacity-90 shadow-lg lg:h-14 lg:w-14">
                           <Users className="h-6 w-6 text-white lg:h-7 lg:w-7" />
                        </div>
                        <div>
                           <p className="theme-text-primary text-3xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                              User Management
                           </p>
                           <p className="theme-text-secondary mt-2 text-base leading-6 lg:text-lg">
                              Manage system users, roles, and permissions with
                              comprehensive controls
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:gap-5">
                     {/* Action Buttons */}
                     <div className="flex items-center gap-3">
                        <Button
                           onClick={() => setShowFilters(!showFilters)}
                           variant="outline"
                           size="sm"
                           className={cn(
                              'theme-border flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                              showFilters
                                 ? 'border-[var(--interactive-primary)] bg-[var(--interactive-primary)] text-white'
                                 : 'theme-bg-secondary theme-text-primary border-transparent hover:bg-[var(--bg-tertiary)]'
                           )}
                        >
                           <Filter className="h-4 w-4" />
                           <span className="hidden sm:inline">Filters</span>
                        </Button>
                        <Button
                           onClick={handleExportUsers}
                           variant="outline"
                           size="sm"
                           className="theme-border theme-bg-secondary theme-text-primary flex items-center gap-2 rounded-xl border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
                        >
                           <Download className="h-4 w-4" />
                           <span className="hidden sm:inline">Export</span>
                        </Button>
                        <Button
                           onClick={handleCreateUser}
                           className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--interactive-primary)] to-[var(--interactive-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl"
                           size="sm"
                        >
                           <Plus className="h-4 w-4" />
                           <span className="hidden sm:inline">New User</span>
                           <span className="sm:hidden">New</span>
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Modern Statistics Cards Section */}
         <MemoizedUserStats stats={userStats} />

         {/* Modern Filters Section */}
         {showFilters && (
            <div className="px-3 pb-6 sm:px-4 lg:px-6">
               <Card className="theme-border overflow-hidden border-0 bg-gradient-to-br from-white/80 to-white/40 shadow-lg backdrop-blur-sm dark:from-gray-900/80 dark:to-gray-900/40">
                  <CardContent className="p-6">
                     <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--interactive-primary)] to-[var(--interactive-primary)] opacity-90">
                              <Filter className="h-5 w-5 text-white" />
                           </div>
                           <div>
                              <h3 className="theme-text-primary text-lg font-semibold">
                                 Advanced Filters
                              </h3>
                              <p className="theme-text-secondary text-sm">
                                 Refine your user search with multiple criteria
                              </p>
                           </div>
                        </div>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setShowFilters(false)}
                           className="theme-text-muted hover:theme-bg-secondary h-8 w-8 rounded-lg p-0"
                        >
                           <X className="h-4 w-4" />
                        </Button>
                     </div>
                     <UserFiltersComponent
                        filters={filters as UserFilters}
                        onFilterChange={(newFilters) =>
                           setFilters((prev) => ({ ...prev, ...newFilters }))
                        }
                     />
                  </CardContent>
               </Card>
            </div>
         )}

         {/* Modern Search and Quick Filters */}
         <div className="px-3 pb-6 sm:px-4 lg:px-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
               <SearchInput
                  value={localSearchTerm}
                  onChange={handleSearchInputChange}
                  placeholder="Search users by name, email, or phone..."
               />

               <div className="flex flex-wrap items-center gap-3">
                  <Select
                     value={filters.role || 'all'}
                     onValueChange={(value) =>
                        setFilters((prev) => ({
                           ...prev,
                           role: value === 'all' ? undefined : (value as any),
                        }))
                     }
                  >
                     <SelectTrigger className="theme-border theme-bg-secondary theme-text-primary h-11 w-auto min-w-[130px] rounded-xl border-0 bg-transparent text-sm font-medium shadow-sm">
                        <SelectValue placeholder="All Roles" />
                     </SelectTrigger>
                     <SelectContent className="theme-bg-primary theme-border border shadow-xl">
                        <SelectItem value="all">All Roles</SelectItem>
                        {USER_ROLES.map((role) => (
                           <SelectItem key={role.value} value={role.value}>
                              {role.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>

                  <Select
                     value={
                        filters.active === undefined
                           ? 'all'
                           : filters.active
                             ? 'active'
                             : 'inactive'
                     }
                     onValueChange={(value) => {
                        const activeValue =
                           value === 'all' ? undefined : value === 'active'
                        setFilters((prev) => ({ ...prev, active: activeValue }))
                     }}
                  >
                     <SelectTrigger className="theme-border theme-bg-secondary theme-text-primary h-11 w-auto min-w-[130px] rounded-xl border-0 bg-transparent text-sm font-medium shadow-sm">
                        <SelectValue placeholder="All Status" />
                     </SelectTrigger>
                     <SelectContent className="theme-bg-primary theme-border border shadow-xl">
                        {USER_STATUS_OPTIONS.map((option) => (
                           <SelectItem key={option.value} value={option.value}>
                              {option.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>

                  {/* Refresh Button */}
                  <Button
                     onClick={() =>
                        fetchUsers(currentPage, searchParamsTerm, false)
                     }
                     variant="outline"
                     size="sm"
                     className="theme-border theme-bg-secondary theme-text-primary h-11 w-11 rounded-xl border-0 bg-transparent p-0 transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
                     title="Refresh"
                  >
                     <RefreshCw className="h-4 w-4" />
                  </Button>
               </div>
            </div>
         </div>

         {/* Error Display */}
         {error && (
            <div className="px-3 pb-6 sm:px-4 lg:px-6">
               <Card className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                  <CardContent className="p-4">
                     <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
                           <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                           <p className="font-medium text-red-800 dark:text-red-200">
                              {error}
                           </p>
                        </div>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setError(null)}
                           className="h-8 w-8 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                        >
                           <X className="h-4 w-4" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         )}

         {/* Modern Main Content Area */}
         <div className="px-3 pb-6 sm:px-4 lg:px-6">
            <Card className="theme-border overflow-hidden border-0 bg-gradient-to-br from-white/80 to-white/40 shadow-lg backdrop-blur-sm dark:from-gray-900/80 dark:to-gray-900/40">
               <DynamicTable
                  data={users || []}
                  columns={columns}
                  pageSize={ITEMS_PER_PAGE}
                  onSearch={handleSearch}
                  onPageChange={handlePageChange}
                  isLoading={loading}
                  totalCount={totalCount}
                  currentPage={currentPage}
                  isServerSide={true}
                  searchPlaceholder="Search users by name, email, or phone..."
                  moveEntriesToFooter={true}
                  showSearchInHeader={false}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  isSort={true}
               />
            </Card>
         </div>

         {/* Mobile Floating Action Button */}
         <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-4 sm:hidden">
            <Button
               onClick={() => setShowFilters(!showFilters)}
               className={cn(
                  'h-12 w-12 rounded-full p-0 shadow-lg backdrop-blur-sm transition-all duration-200',
                  showFilters
                     ? 'bg-[var(--interactive-primary)] text-white'
                     : 'theme-text-primary border border-gray-200/50 bg-white/80 dark:border-gray-700/50 dark:bg-gray-900/80'
               )}
               title="Filters"
            >
               <Filter className="h-5 w-5" />
            </Button>
            <Button
               onClick={handleCreateUser}
               className="h-16 w-16 rounded-full bg-gradient-to-r from-[var(--interactive-primary)] to-[var(--interactive-primary)] p-0 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:opacity-90 hover:shadow-2xl"
            >
               <Plus className="h-6 w-6" />
            </Button>
         </div>

         {/* Delete Confirmation Dialog */}
         <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="theme-bg-primary theme-border mx-4 max-w-md overflow-hidden rounded-2xl border shadow-2xl sm:mx-auto">
               <DialogDescription />
               <DialogHeader className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50">
                     <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <DialogTitle className="theme-text-primary text-2xl font-bold">
                     Delete User
                  </DialogTitle>
                  <p className="theme-text-secondary text-base leading-relaxed">
                     Are you sure you want to delete{' '}
                     <span className="theme-text-primary font-semibold">
                        "{selectedUser?.name}"
                     </span>
                     ? This action cannot be undone and will permanently remove
                     all associated data.
                  </p>
               </DialogHeader>
               <DialogFooter className="flex gap-3 pt-6 sm:flex-row">
                  <Button
                     variant="outline"
                     onClick={cancelDeleteUser}
                     className="theme-border theme-bg-secondary theme-text-primary flex-1 rounded-xl border-0 bg-transparent hover:bg-[var(--bg-tertiary)]"
                  >
                     Keep User
                  </Button>
                  <Button
                     onClick={confirmDeleteUser}
                     className="flex-1 rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700"
                  >
                     Delete User
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   )
}

export default UserManagementOptimized
