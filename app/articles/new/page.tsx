'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { articlesService } from '@/lib/api/services/articles'
import { useAuth } from '@/lib/contexts/auth-context'
import { CreateArticleDto } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TeacherOnly } from '@/components/auth/TeacherOnly'
import { BannerUpload } from '@/components/articles/banner-upload'
import type { ArticleEditorRef } from '@/components/editor/ArticleEditor'

const ArticleEditor = dynamic(
  () => import('@/components/editor/ArticleEditor'),
  { ssr: false }
)

export default function NewArticlePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const editorRef = useRef<ArticleEditorRef>(null)
  
  console.log('NewArticlePage: isAuthenticated:', isAuthenticated, 'user:', user?.email, 'role:', user?.role, 'isLoading:', isLoading)
  
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState<any>(null)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articleId, setArticleId] = useState<number | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string>('')

  const handleContentChange = (data: any) => {
    setContent(data)
  }

  const handleSave = async (articleStatus: 'draft' | 'published' = 'draft') => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Get the latest content from editor
      const editorContent = editorRef.current ? await editorRef.current.save() : content

      const articleData: CreateArticleDto = {
        title: title.trim(),
        content: JSON.stringify(editorContent),
        excerpt: excerpt.trim() || undefined,
        status: articleStatus
      }

      const newArticle = await articlesService.createArticle(articleData)
      
      // Store article ID for banner upload
      setArticleId(newArticle.id)
      
      // Redirect to the new article
      router.push(`/articles/${newArticle.slug || newArticle.id}`)
    } catch (err) {
      console.error('Error saving article:', err)
      setError('Failed to save article. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDraft = () => handleSave('draft')
  const handlePublish = () => handleSave('published')

  // Add debugging for localStorage
  console.log('NewArticlePage: localStorage token exists:', !!localStorage.getItem('access_token'))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article editor...</p>
        </div>
      </div>
    )
  }

  return (
    <TeacherOnly>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Write New Article</h1>
          <p className="text-gray-600">
            Share your knowledge and insights with students
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title Input */}
          <Card className="p-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Article Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your article title..."
              className="w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <div className="text-sm text-gray-500 mt-1">
              {title.length}/200 characters
            </div>
          </Card>

          {/* Excerpt Input */}
          <Card className="p-6">
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Article Excerpt
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief excerpt of your article (optional)..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-500 mt-1">
              {excerpt.length}/500 characters
            </div>
          </Card>

          {/* Banner Upload */}
          <Card className="p-6">
            <BannerUpload
              articleId={articleId}
              currentBanner={bannerUrl}
              onBannerUploaded={setBannerUrl}
            />
          </Card>

          {/* Content Editor */}
          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Article Content *
            </label>
            <ArticleEditor
              ref={editorRef}
              onChange={handleContentChange}
              placeholder="Start writing your article..."
            />
          </Card>

          {/* Publishing Options */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <input
                id="publish"
                type="checkbox"
                checked={status === 'published'}
                onChange={(e) => setStatus(e.target.checked ? 'published' : 'draft')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="publish" className="ml-2 block text-sm text-gray-700">
                Publish immediately
              </label>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              {status === 'published'
                ? 'This article will be visible to all users immediately after saving.'
                : 'This article will be saved as a draft and won\'t be visible to others until published.'
              }
            </p>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleDraft}
                  disabled={saving || !title.trim()}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                
                <Button
                  onClick={handlePublish}
                  disabled={saving || !title.trim()}
                >
                  {saving ? 'Publishing...' : 'Publish Article'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Auto-save indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Saving article...
          </div>
        )}
      </div>
    </TeacherOnly>
  )
}