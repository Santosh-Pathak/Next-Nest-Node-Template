'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Activity, Palette } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/theme-utils'

export default function DashboardPage() {
   const { user } = useAuthStore()
   useTheme()

   const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin'

   const stats = [
      {
         title: 'Your Role',
         value: user?.role || '—',
         icon: Users,
         change: 'Active session',
         changeType: 'positive' as const,
      },
      {
         title: 'Account Status',
         value: user?.isActive === false ? 'Inactive' : 'Active',
         icon: Activity,
         change: user?.isEmailVerified ? 'Email verified' : 'Verify email',
         changeType: 'positive' as const,
      },
      {
         title: 'Themes',
         value: 'Ready',
         icon: Palette,
         change: 'Customize appearance',
         changeType: 'positive' as const,
      },
      {
         title: 'Template',
         value: 'v1',
         icon: TrendingUp,
         change: 'Next + Nest starter',
         changeType: 'positive' as const,
      },
   ]

   const welcomeMessage = (() => {
      switch (user?.role) {
         case 'superAdmin':
            return 'Welcome to your Super Admin dashboard'
         case 'admin':
            return 'Welcome to your Admin dashboard'
         case 'developer':
            return 'Welcome to your Developer dashboard'
         default:
            return 'Welcome to your Dashboard'
      }
   })()

   const quickActions = isAdmin
      ? [
           {
              title: 'Items (CRUD)',
              color: 'bg-[var(--interactive-primary)]',
              href: '/items',
           },
           {
              title: 'Manage Users',
              color: 'bg-[var(--success-500)]',
              href: '/user-management',
           },
           {
              title: 'Themes',
              color: 'bg-[var(--warning-500)]',
              href: '/themes',
           },
           {
              title: 'Profile',
              color: 'bg-[var(--info-500)]',
              href: '/profile',
           },
        ]
      : [
           {
              title: 'Items (CRUD)',
              color: 'bg-[var(--interactive-primary)]',
              href: '/items',
           },
           {
              title: 'Profile',
              color: 'bg-[var(--success-500)]',
              href: '/profile',
           },
           {
              title: 'Dashboard',
              color: 'bg-[var(--warning-500)]',
              href: '/dashboard',
           },
        ]

   return (
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="space-y-6"
      >
         <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
               'relative overflow-hidden rounded-2xl p-8',
               'bg-gradient-to-r from-[var(--interactive-primary)]/5 via-[var(--interactive-primary)]/10 to-[var(--interactive-primary)]/5',
               'theme-border border'
            )}
         >
            <div className="relative z-10">
               <h1 className="theme-text-primary mb-2 text-3xl font-bold">
                  {welcomeMessage}
               </h1>
               <p className="theme-text-secondary text-lg">
                  Welcome back, {user?.name || 'User'}. This is the starter
                  dashboard — replace these placeholders with your product
                  metrics.
               </p>
            </div>
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
         </motion.div>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
         >
            {stats.map((stat, index) => {
               const Icon = stat.icon
               return (
                  <motion.div
                     key={stat.title}
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                  >
                     <Card className="theme-bg-primary theme-border transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="theme-text-secondary text-sm font-medium">
                              {stat.title}
                           </CardTitle>
                           <Icon className="theme-text-muted h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                           <div className="theme-text-primary mb-1 text-2xl font-bold capitalize">
                              {stat.value}
                           </div>
                           <p className="text-[var(--success-500)] flex items-center text-xs">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              {stat.change}
                           </p>
                        </CardContent>
                     </Card>
                  </motion.div>
               )
            })}
         </motion.div>

         <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
         >
            <Card className="theme-bg-primary theme-border">
               <CardHeader>
                  <CardTitle className="theme-text-primary">
                     Getting started
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <ul className="theme-text-secondary space-y-3 text-sm">
                     <li>1. Configure env vars for frontend and backend</li>
                     <li>2. Create an admin user and explore User Management</li>
                     <li>3. Customize themes under Theme Management</li>
                     <li>4. Replace this dashboard with your product UI</li>
                  </ul>
               </CardContent>
            </Card>

            <Card className="theme-bg-primary theme-border">
               <CardHeader>
                  <CardTitle className="theme-text-primary">
                     Quick Actions
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                     {quickActions.map((action) => (
                        <Link
                           key={action.title}
                           href={action.href}
                           className={cn(
                              'rounded-lg p-4 text-center text-sm font-medium text-white',
                              'transition-transform hover:scale-105',
                              action.color
                           )}
                        >
                           {action.title}
                        </Link>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </motion.div>
      </motion.div>
   )
}
