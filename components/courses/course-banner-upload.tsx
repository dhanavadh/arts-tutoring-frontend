'use client'

import React, { useState, useEffect } from 'react'
import { FileUpload } from '../ui/file-upload'
import { Button } from '../ui/button'
import { apiClient } from '../../lib/api/client'
import { Course } from '../../lib/types'

interface CourseBannerUploadProps {
  courseId?: number
  currentBanner?: string
  onBannerUploaded: (bannerUrl: string) => void
  onFileSelected?: (file: File) => void
  className?: string
}

export const CourseBannerUpload: React.FC<CourseBannerUploadProps> = ({
  courseId,
  currentBanner,
  onBannerUploaded,
  onFileSelected,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBanner || null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setSelectedFile(file)

    // Create preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    if (courseId) {
      // If courseId exists, upload immediately
      await uploadToServer(file)
    } else {
      // If no courseId, just store for later upload and notify parent
      if (onFileSelected) {
        onFileSelected(file)
      }
    }
  }

  const uploadToServer = async (file: File) => {
    if (!courseId) return

    setIsUploading(true)
    setError(null)

    try {
      // Upload to backend
      const formData = new FormData()
      formData.append('banner', file)

      const response = await apiClient.upload<Course>(
        `/courses/${courseId}/upload-banner`,
        formData
      )

      console.log('Course banner upload response:', response);
      
      // Extract the filename from the upload response
      let imageUrl = '';
      
      // Check if we have a direct course with featuredImage
      if (typeof response === 'object' && response !== null) {
        if ('featuredImage' in response) {
          imageUrl = response.featuredImage as string;
          console.log('Found featuredImage directly in response:', imageUrl);
        } else if ('data' in response && typeof response.data === 'object' && response.data !== null) {
          if ('featuredImage' in response.data) {
            imageUrl = response.data.featuredImage as string;
            console.log('Found featuredImage in response.data:', imageUrl);
          }
        }
      }
      
      if (imageUrl && imageUrl.trim() !== '') {
        console.log('Setting course banner URL to:', imageUrl);
        onBannerUploaded(imageUrl);
      } else {
        console.error('Could not find featuredImage in response or it was empty');
        console.error('Full response data:', response.data);
        // For now, just continue without setting the banner
        // The course was created successfully, just without the banner
      }
    } catch (err: any) {
      console.error('Course banner upload error:', err)
      setError(err.message || 'Failed to upload course banner')
      setPreviewUrl(currentBanner || null)
    } finally {
      setIsUploading(false)
    }
  }

  // Effect to upload when courseId becomes available
  useEffect(() => {
    if (courseId && selectedFile && !isUploading) {
      uploadToServer(selectedFile)
    }
  }, [courseId, selectedFile, isUploading])

  const removeBanner = () => {
    setPreviewUrl(null)
    onBannerUploaded('')
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Course Banner
      </label>
      
      {previewUrl ? (
        <div className="relative">
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={previewUrl}
              alt="Course banner"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
          <div className="absolute top-2 right-2 space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewUrl(null)}
              disabled={isUploading}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeBanner}
              disabled={isUploading}
            >
              Remove
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <FileUpload
          onFileSelect={handleFileSelect}
          accept="image/*"
          maxSize={10} // 10MB for banners
          disabled={isUploading}
          className="h-48"
        >
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M24 14l8 8H32v16H16V22h-4l8-8z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload course banner</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Recommended: 1200x630px, JPG or PNG up to 10MB
            </p>
            {!courseId && (
              <p className="text-xs text-blue-600 mt-1">
                📸 Preview available now, will upload when course is saved
              </p>
            )}
          </div>
        </FileUpload>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}