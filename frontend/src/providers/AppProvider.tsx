'use client'

import React, { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { AuthService } from '@/services/apis/auth.service'

interface AppProviderProps {
   children: ReactNode
}

/**
 * Main application provider using Zustand.
 * Restores session via httpOnly cookies + /auth/profile.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
   const { setInitialized, isInitialized } = useAuthStore()

   useEffect(() => {
      const initializeApp = async () => {
         try {
            if (!isInitialized) {
               await AuthService.restoreSession()
            }
         } catch (error) {
            console.error('App initialization failed:', error)
            setInitialized(true)
         }
      }

      initializeApp()
   }, [setInitialized, isInitialized])

   return <>{children}</>
}

export default AppProvider
