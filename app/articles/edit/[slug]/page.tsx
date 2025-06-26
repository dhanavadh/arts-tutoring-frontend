'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { articlesService } from '@/lib/api/services/articles'
import { useAuth } from '@/lib/contexts/auth-context'
import { Article, UpdateArticleDto } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingPage } from '@/components/ui/loading'
import { TeacherOnly } from '@/components/auth/TeacherOnly'
import { BannerUpload } from '@/components/articles/banner-upload'
import type { ArticleEditorRef } from '@/components/editor/ArticleEditor'

const ArticleEditor = dynamic(
  () => import('@/components/editor/ArticleEditor'),
  { ssr: false }
)

export default function EditArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const editorRef = useRef<ArticleEditorRef>(null)
  
  const [article, setArticle] = useState<Article | null>(null)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState<any>(null)
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string>('')

  const articleSlug = params.slug as string

  useEffect(() => {
    if (articleSlug) {
      loadArticle()
    }
  }, [articleSlug])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const articleData = await articlesService.getArticleBySlug(articleSlug)
      
      // Check if user can edit this article
      if ((user?.role !== 'teacher' || articleData.teacherId !== user.id) && user?.role !== 'admin') {
        router.push('/articles')
        return
      }

      setArticle(articleData)
      setTitle(articleData.title)
      setExcerpt(articleData.excerpt || '')
      setStatus(articleData.status)
      setBannerUrl(articleData.featuredImage || '')
      
      // Parse content for editor
      try {
        const parsedContent = JSON.parse(articleData.content)
        setContent(parsedContent)
      } catch {
        // If content is not JSON, treat as plain text
        setContent({
          time: Date.now(),
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: articleData.content
              }
            }
          ]
        })
      }
      
      setError(null)
    } catch (err) {
      console.error('Error loading article:', err)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = (data: any) => {
    setContent(data)
  }

  const handleSave = async (newStatus?: 'draft' | 'published' | 'archived') => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!article) {
      setError('Article not found')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Get the latest content from editor
      const editorContent = editorRef.current ? await editorRef.current.save() : content

      console.log('Current bannerUrl in state before saving:', bannerUrl);
      
      const updateData: UpdateArticleDto = {
        title: title.trim(),
        content: JSON.stringify(editorContent),
        excerpt: excerpt.trim() || undefined,
        status: newStatus !== undefined ? newStatus : status,
        // Always include the featured image URL from state
        featuredImage: bannerUrl
      }

      console.log('Saving article with data:', updateData);

      const updatedArticle = await articlesService.updateArticle(article.id, updateData)
      
      // Update local state
      setArticle(updatedArticle)
      setStatus(updatedArticle.status)
      
      // Redirect to the article
      router.push(`/articles/${updatedArticle.slug || updatedArticle.id}`)
    } catch (err) {
      console.error('Error updating article:', err)
      setError('Failed to update article. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDraft = () => handleSave('draft')
  const handlePublish = () => handleSave('published')
  const handleUpdate = () => handleSave()

  if (loading) {
    return <LoadingPage />
  }

  if (error && !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Article</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TeacherOnly>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Article</h1>
          <p className="text-gray-600">
            Update your article content and settings
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
          <Card className="p-6">          <BannerUpload
            articleId={article?.id}
            currentBanner={bannerUrl}
            onBannerUploaded={(url) => {
              console.log('Banner URL updated in editor:', url);
              setBannerUrl(url);
            }}
          />
          </Card>

          {/* Content Editor */}
          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Article Content *
            </label>
            {content && (
              <ArticleEditor
                ref={editorRef}
                data={content}
                onChange={handleContentChange}
                placeholder="Start writing your article..."
              />
            )}
          </Card>

          {/* Publishing Options */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Publication Status</h3>
                <p className="text-sm text-gray-500">
                  Current status: <span className="capitalize">{status}</span>
                </p>
              </div>
              
              <div className="flex items-center">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

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
                {status === 'published' ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleDraft}
                      disabled={saving || !title.trim()}
                    >
                      {saving ? 'Saving...' : 'Move to Draft'}
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      disabled={saving || !title.trim()}
                    >
                      {saving ? 'Updating...' : 'Update Article'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleUpdate}
                      disabled={saving || !title.trim()}
                    >
                      {saving ? 'Saving...' : `Save ${status === 'draft' ? 'Draft' : 'Changes'}`}
                    </Button>
                    <Button
                      onClick={handlePublish}
                      disabled={saving || !title.trim()}
                    >
                      {saving ? 'Publishing...' : 'Publish Article'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Auto-save indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Updating article...
          </div>
        )}
      </div>
    </TeacherOnly>
  )
}