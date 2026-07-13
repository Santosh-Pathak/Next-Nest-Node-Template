/**
 * Dynamic Navigation Configuration
 *
 * Role-based navigation for the template app (auth, users, themes).
 */

import {
   IconDashboard,
   IconUsers,
   IconPalette,
   IconUser,
   IconBox,
} from '@tabler/icons-react'
import type { UserRole } from '@/types/auth'

export interface NavigationItem {
   id: string
   name: string
   href?: string
   icon: React.ComponentType<{ className?: string }>
   badge?: string | number
   roles: UserRole[]
   permissions?: string[]
   children?: NavigationItem[]
   isExpandable?: boolean
   defaultExpanded?: boolean
   external?: boolean
   disabled?: boolean
   divider?: boolean
   description?: string
   trackingId?: string
   category?: string
}

export interface NavigationSection {
   id: string
   name: string
   items: NavigationItem[]
   roles?: UserRole[]
   collapsible?: boolean
   defaultCollapsed?: boolean
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
   {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: IconDashboard,
      roles: ['developer', 'admin', 'superAdmin'],
      permissions: ['view_dashboard'],
      trackingId: 'nav_dashboard',
      category: 'overview',
   },
   {
      id: 'items',
      name: 'Items',
      href: '/items',
      icon: IconBox,
      roles: ['developer', 'admin', 'superAdmin'],
      permissions: ['manage_items'],
      trackingId: 'nav_items',
      category: 'examples',
      description: 'Example CRUD module to copy for new features',
   },
   {
      id: 'user-management',
      name: 'User',
      href: '/user-management',
      icon: IconUsers,
      roles: ['admin', 'superAdmin'],
      permissions: ['manage_users'],
      trackingId: 'nav_user_management',
      category: 'admin',
   },
   {
      id: 'theme-management',
      name: 'Theme',
      href: '/themes',
      icon: IconPalette,
      roles: ['admin', 'superAdmin'],
      permissions: ['manage_themes'],
      trackingId: 'nav_theme_management',
      category: 'customization',
      description: 'Customize application themes and appearance',
   },
   {
      id: 'profile',
      name: 'Profile',
      href: '/profile',
      icon: IconUser,
      roles: ['developer', 'admin', 'superAdmin'],
      permissions: ['view_profile'],
      trackingId: 'nav_profile',
      category: 'account',
      description: 'Manage your profile and account settings',
   },
]

export const NAVIGATION_SECTIONS: NavigationSection[] = [
   {
      id: 'main',
      name: 'Main',
      items: NAVIGATION_ITEMS,
   },
]

export const PERMISSION_MAPPINGS = {
   view_dashboard: ['developer', 'admin', 'superAdmin'],
   manage_items: ['developer', 'admin', 'superAdmin'],
   manage_users: ['admin', 'superAdmin'],
   view_users: ['admin', 'superAdmin'],
   create_users: ['admin', 'superAdmin'],
   edit_users: ['admin', 'superAdmin'],
   delete_users: ['superAdmin'],
   change_user_roles: ['superAdmin'],
   manage_themes: ['admin', 'superAdmin'],
   view_themes: ['admin', 'superAdmin'],
   create_themes: ['admin', 'superAdmin'],
   edit_themes: ['admin', 'superAdmin'],
   delete_themes: ['superAdmin'],
   view_profile: ['developer', 'admin', 'superAdmin'],
   edit_profile: ['developer', 'admin', 'superAdmin'],
   change_password: ['developer', 'admin', 'superAdmin'],
   access_admin_panel: ['admin', 'superAdmin'],
   system_admin: ['superAdmin'],
} as const

export class NavigationUtils {
   static filterByRole(
      items: NavigationItem[],
      userRole?: UserRole
   ): NavigationItem[] {
      if (!userRole) return []

      return items
         .filter((item) => item.roles.includes(userRole))
         .map((item) => ({
            ...item,
            children: item.children
               ? this.filterByRole(item.children, userRole)
               : undefined,
         }))
         .filter((item) => !item.children || item.children.length > 0)
   }

   static filterSectionsByRole(
      sections: NavigationSection[],
      userRole?: UserRole
   ): NavigationSection[] {
      if (!userRole) return []

      return sections
         .filter(
            (section) => !section.roles || section.roles.includes(userRole)
         )
         .map((section) => ({
            ...section,
            items: this.filterByRole(section.items, userRole),
         }))
         .filter((section) => section.items.length > 0)
   }

   static hasPermission(
      item: NavigationItem,
      userRole?: UserRole,
      permissions?: string[]
   ): boolean {
      if (!userRole) return false
      if (!item.roles.includes(userRole)) return false

      if (item.permissions && permissions) {
         return item.permissions.some((permission) =>
            permissions.includes(permission)
         )
      }

      return true
   }

   static getFlattenedItems(items: NavigationItem[]): NavigationItem[] {
      const flattened: NavigationItem[] = []

      items.forEach((item) => {
         flattened.push(item)
         if (item.children) {
            flattened.push(...this.getFlattenedItems(item.children))
         }
      })

      return flattened
   }

   static findItemById(
      items: NavigationItem[],
      id: string
   ): NavigationItem | null {
      for (const item of items) {
         if (item.id === id) return item
         if (item.children) {
            const found = this.findItemById(item.children, id)
            if (found) return found
         }
      }
      return null
   }

   static findItemByHref(
      items: NavigationItem[],
      href: string
   ): NavigationItem | null {
      for (const item of items) {
         if (item.href === href) return item
         if (item.children) {
            const found = this.findItemByHref(item.children, href)
            if (found) return found
         }
      }
      return null
   }

   static getBreadcrumbPath(
      items: NavigationItem[],
      href: string
   ): NavigationItem[] {
      for (const item of items) {
         if (item.href === href) {
            return [item]
         }
         if (item.children) {
            const childPath = this.getBreadcrumbPath(item.children, href)
            if (childPath.length > 0) {
               return [item, ...childPath]
            }
         }
      }
      return []
   }

   static isItemActive(item: NavigationItem, currentPath: string): boolean {
      if (!item.href) return false
      if (item.href === currentPath) return true

      if (currentPath.startsWith(item.href)) {
         const remaining = currentPath.slice(item.href.length)
         if (remaining === '' || remaining.startsWith('/')) {
            return true
         }
      }

      if (item.children) {
         return item.children.some((child) =>
            this.isItemActive(child, currentPath)
         )
      }

      return false
   }

   static getNavigationStats(items: NavigationItem[], userRole?: UserRole) {
      const filteredItems = this.filterByRole(items, userRole)
      const flatItems = this.getFlattenedItems(filteredItems)

      return {
         totalItems: flatItems.length,
         expandableItems: flatItems.filter((item) => item.isExpandable).length,
         categoryCounts: flatItems.reduce(
            (acc, item) => {
               if (item.category) {
                  acc[item.category] = (acc[item.category] || 0) + 1
               }
               return acc
            },
            {} as Record<string, number>
         ),
         roleSpecificItems: {
            developer: this.filterByRole(items, 'developer').length,
            admin: this.filterByRole(items, 'admin').length,
            superAdmin: this.filterByRole(items, 'superAdmin').length,
         },
      }
   }
}

export const navigationConfig = {
   items: NAVIGATION_ITEMS,
   sections: NAVIGATION_SECTIONS,
   permissions: PERMISSION_MAPPINGS,
   utils: NavigationUtils,
}

export default navigationConfig
