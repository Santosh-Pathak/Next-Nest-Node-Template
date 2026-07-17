'use client'

import React, { useState } from 'react'
import { Camera, User, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthUpload } from '@/hooks/useAuthUpload'
import FileUpload from './FileUpload'
import type { User as UserType } from '@/types/auth'

interface ProfilePhotoUploadProps {
   user?: UserType | null
   onPhotoUpdate?: (photoUrl: string, user: UserType) => void
   className?: string
   size?: 'sm' | 'md' | 'lg' | 'xl'
   variant?: 'circle' | 'square' | 'rounded'
   showUploadButton?: boolean
   allowRemove?: boolean
}

const sizeClasses = {
   sm: 'w-16 h-16',
   md: 'w-24 h-24',
   lg: 'w-32 h-32',
   xl: 'w-40 h-40',
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
   user,
   onPhotoUpdate,
   className,
   size = 'lg',
   variant = 'circle',
   showUploadButton = true,
   allowRemove = true,
}) => {
   const [showUploadModal, setShowUploadModal] = useState(false)
   const [isRemoving, setIsRemoving] = useState(false)

   const { uploadProfilePhoto, isUploading, uploadProgress, updateProfile } =
      useAuthUpload()

   const currentPhotoUrl = user?.photo
   const userName = user?.name || 'User'
   const userInitials = userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

   const handlePhotoUpload = async (file: File, result: any) => {
      try {
         // The upload already updates the user profile
         setShowUploadModal(false)
         onPhotoUpdate?.(result.url, result.user)
      } catch (error) {
         console.error('Failed to upload profile photo:', error)
      }
   }

   const handleRemovePhoto = async () => {
      if (!currentPhotoUrl || isRemoving) return

      try {
         setIsRemoving(true)

         // Update profile to remove photo
         const updatedUser = await updateProfile({ photo: '' })
         onPhotoUpdate?.('', updatedUser)
      } catch (error) {
         console.error('Failed to remove profile photo:', error)
      } finally {
         setIsRemoving(false)
      }
   }

   const avatarClasses = cn(sizeClasses[size], {
      'rounded-full': variant === 'circle',
      'rounded-none': variant === 'square',
      'rounded-lg': variant === 'rounded',
   })

   return (
      <div className={cn('group relative', className)}>
         <div className="relative">
            <Avatar className={avatarClasses}>
               <AvatarImage
                  src={currentPhotoUrl}
                  alt={userName}
                  className="object-cover"
               />
               <AvatarFallback className="theme-bg theme-text text-lg font-semibold">
                  {currentPhotoUrl ? (
                     <User className="h-1/2 w-1/2" />
                  ) : (
                     userInitials
                  )}
               </AvatarFallback>
            </Avatar>

            {/* Upload Overlay */}
            {showUploadButton && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                     <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowUploadModal(true)}
                        disabled={isUploading}
                        className="h-auto p-2 text-white hover:bg-white/20 hover:text-white"
                     >
                        {isUploading ? (
                           <div className="flex flex-col items-center space-y-1">
                              <Upload className="h-5 w-5 animate-pulse" />
                              <span className="text-xs">{uploadProgress}%</span>
                           </div>
                        ) : (
                           <Camera className="h-5 w-5" />
                        )}
                     </Button>
                  </div>
               </div>
            )}

            {/* Remove Button */}
            {allowRemove && currentPhotoUrl && (
               <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemovePhoto}
                  disabled={isRemoving}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
               >
                  <X className="h-3 w-3" />
               </Button>
            )}
         </div>

         {/* Upload Button (Alternative) */}
         {showUploadButton && (
            <div className="mt-3 text-center">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  disabled={isUploading}
                  className="theme-border hover:theme-bg hover:theme-text"
               >
                  <Camera className="mr-2 h-4 w-4" />
                  {currentPhotoUrl ? 'Change Photo' : 'Add Photo'}
               </Button>
            </div>
         )}

         {/* Upload Modal */}
         {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
               <Card className="theme-border w-full max-w-lg">
                  <CardContent className="p-6">
                     <div className="mb-4 flex items-center justify-between">
                        <h3 className="theme-text text-lg font-semibold">
                           {currentPhotoUrl
                              ? 'Change Profile Photo'
                              : 'Upload Profile Photo'}
                        </h3>
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => setShowUploadModal(false)}
                           className="h-8 w-8 p-0"
                        >
                           <X className="h-4 w-4" />
                        </Button>
                     </div>

                     <FileUpload
                        onFileUpload={handlePhotoUpload}
                        acceptedTypes={['image/*']}
                        maxSize={10}
                        multiple={false}
                        placeholder="Drop your profile photo here or click to browse"
                        uploadOptions={{
                           container: 'profile-photos',
                           updateProfile: true,
                        }}
                        showPreview={true}
                        variant="compact"
                     />

                     <div className="theme-text/70 mt-4 text-center text-xs">
                        Supported formats: JPG, PNG, GIF • Max size: 10MB
                        <br />
                        For best results, use a square image at least 400x400
                        pixels
                     </div>
                  </CardContent>
               </Card>
            </div>
         )}
      </div>
   )
}

export default ProfilePhotoUpload
