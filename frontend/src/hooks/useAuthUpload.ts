'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { AuthService } from '@/services/apis/auth.service'
import type { User } from '@/types/auth'

/**
 * Upload / profile mutations (SRP) — keeps I/O out of the auth session store.
 */
export function useAuthUpload() {
   const setUploading = useAuthStore((s) => s.setUploading)
   const setUploadProgress = useAuthStore((s) => s.setUploadProgress)
   const setError = useAuthStore((s) => s.setError)
   const setUser = useAuthStore((s) => s.setUser)
   const setLoading = useAuthStore((s) => s.setLoading)
   const isUploading = useAuthStore((s) => s.isUploading)
   const uploadProgress = useAuthStore((s) => s.uploadProgress)

   const uploadFile = useCallback(
      async (
         file: File,
         options: {
            container?: string
            folder?: string
            updateProfile?: boolean
         } = {}
      ) => {
         try {
            setUploading(true)
            setError(null)
            setUploadProgress(0)

            let progress = 0
            const progressInterval = setInterval(() => {
               progress = Math.min(progress + 10, 90)
               setUploadProgress(progress)
            }, 100)

            const result = await AuthService.uploadFile(file, options)

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (result.user) {
               setUser(result.user as User)
            }

            return result
         } catch (error: any) {
            setError(error.message || 'Upload failed')
            throw error
         } finally {
            setUploading(false)
            setTimeout(() => setUploadProgress(0), 1000)
         }
      },
      [setUploading, setUploadProgress, setError, setUser]
   )

   const uploadProfilePhoto = useCallback(
      async (file: File): Promise<User> => {
         const result = await uploadFile(file, {
            container: 'profile-photos',
            updateProfile: true,
         })
         if (!result.user) {
            throw new Error('Profile update failed')
         }
         return result.user
      },
      [uploadFile]
   )

   const updateProfile = useCallback(
      async (profileData: Partial<User>): Promise<User> => {
         try {
            setLoading(true)
            setError(null)
            const updatedUser = await AuthService.updateProfile(profileData)
            setUser(updatedUser)
            return updatedUser
         } catch (error: any) {
            setError(error.message || 'Failed to update profile')
            throw error
         } finally {
            setLoading(false)
         }
      },
      [setLoading, setError, setUser]
   )

   return {
      isUploading,
      uploadProgress,
      uploadFile,
      uploadProfilePhoto,
      updateProfile,
   }
}
