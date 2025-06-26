'use client'

import React, { useState } from 'react'
import { FileUpload } from '../ui/file-upload'
import { Button } from '../ui/button'
import { apiClient } from '../../lib/api/client'
import { Article } from '../../lib/types'

interface BannerUploadProps {
  articleId?: number
  currentBanner?: string
  onBannerUploaded: (bannerUrl: string) => void
  className?: string
}

export const BannerUpload: React.FC<BannerUploadProps> = ({
  articleId,
  currentBanner,
  onBannerUploaded,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBanner || null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    if (!articleId) {
      setError('Article must be saved before uploading banner')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)

      // Upload to backend
      const formData = new FormData()
      formData.append('banner', file)

      const response = await apiClient.upload<Article>(
        `/articles/${articleId}/upload-banner`,
        formData
      )

      console.log('Banner upload response:', response);
      
      // The backend upload endpoint returns the updated article
      console.log('Detailed upload response:', JSON.stringify(response, null, 2));
      
      // Extract the filename from the upload response
      let imageUrl = '';
      
      // Check if we have a direct article with featuredImage
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
      
      if (imageUrl) {
        console.log('Setting banner URL to:', imageUrl);
        onBannerUploaded(imageUrl);
      } else {
        console.error('Could not find featuredImage in response');
      }
    } catch (err: any) {
      console.error('Banner upload error:', err)
      setError(err.message || 'Failed to upload banner')
      setPreviewUrl(currentBanner || null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeBanner = () => {
    setPreviewUrl(null)
    onBannerUploaded('')
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Article Banner
      </label>
      
      {previewUrl ? (
        <div className="relative">
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={previewUrl}
              alt="Article banner"
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
          disabled={isUploading || !articleId}
          className="h-48"
        >
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M24 14l8 8H32v16H16V22h-4l8-8z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload banner</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Recommended: 1200x630px, JPG or PNG up to 10MB
            </p>
            {!articleId && (
              <p className="text-xs text-orange-600 mt-1">
                Save article first to upload banner
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