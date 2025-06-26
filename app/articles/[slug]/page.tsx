'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { articlesService } from '@/lib/api/services/articles'
import { Article } from '@/lib/types'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/ui/loading'

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      loadArticle()
    }
  }, [slug])

  const loadArticle = async () => {
    try {
      setLoading(true)
      const articleData = await articlesService.getArticleBySlug(slug)
      setArticle(articleData)
      setError(null)
    } catch (err) {
      setError('Failed to load article')
      console.error('Error loading article:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!article || !confirm('Are you sure you want to delete this article?')) return

    try {
      await articlesService.deleteArticle(article.id)
      router.push('/articles')
    } catch (err) {
      console.error('Error deleting article:', err)
      alert('Failed to delete article')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderEditorContent = (content: string) => {
    try {
      const parsedContent = JSON.parse(content)
      if (parsedContent.blocks) {
        return parsedContent.blocks.map((block: any, index: number) => {
          switch (block.type) {
            case 'header':
              const level = block.data.level || 2
              if (level === 1) {
                return (
                  <h1 key={index} className="text-3xl font-bold mb-4">
                    {block.data.text}
                  </h1>
                )
              } else if (level === 2) {
                return (
                  <h2 key={index} className="text-2xl font-bold mb-4">
                    {block.data.text}
                  </h2>
                )
              } else if (level === 3) {
                return (
                  <h3 key={index} className="text-xl font-bold mb-4">
                    {block.data.text}
                  </h3>
                )
              } else {
                return (
                  <h4 key={index} className="text-lg font-bold mb-4">
                    {block.data.text}
                  </h4>
                )
              }
            case 'paragraph':
              return (
                <div key={index} className="mb-4 text-gray-700 leading-relaxed" 
                     dangerouslySetInnerHTML={{ __html: block.data.text }} />
              )
            case 'list':
              const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul'
              return (
                <ListTag key={index} className={`mb-4 ${
                  block.data.style === 'ordered' ? 'list-decimal' : 'list-disc'
                } list-inside`}>
                  {block.data.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="mb-2 text-gray-700">
                      {item}
                    </li>
                  ))}
                </ListTag>
              )
            case 'quote':
              return (
                <blockquote key={index} className="border-l-4 border-blue-500 pl-6 mb-4 italic text-gray-600">
                  <p className="mb-2">{block.data.text}</p>
                  {block.data.caption && (
                    <cite className="text-sm text-gray-500">— {block.data.caption}</cite>
                  )}
                </blockquote>
              )
            case 'code':
              return (
                <pre key={index} className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                  <code className="text-sm">{block.data.code}</code>
                </pre>
              )
            case 'image':
              return (
                <div key={index} className="mb-6">
                  <img
                    src={block.data.file?.url || block.data.url}
                    alt={block.data.caption || ''}
                    className="w-full h-auto rounded-lg"
                  />
                  {block.data.caption && (
                    <p className="text-sm text-gray-600 text-center mt-2 italic">
                      {block.data.caption}
                    </p>
                  )}
                </div>
              )
            case 'table':
              return (
                <div key={index} className="mb-6 overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <tbody>
                      {block.data.content?.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row.map((cell: string, cellIndex: number) => (
                            <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            case 'embed':
              return (
                <div key={index} className="mb-6">
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      src={block.data.embed}
                      title={block.data.caption || 'Embedded content'}
                      className="w-full h-64 rounded-lg"
                      allowFullScreen
                    />
                  </div>
                  {block.data.caption && (
                    <p className="text-sm text-gray-600 text-center mt-2 italic">
                      {block.data.caption}
                    </p>
                  )}
                </div>
              )
            case 'raw':
              return (
                <div key={index} className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <div dangerouslySetInnerHTML={{ __html: block.data.html }} />
                </div>
              )
            case 'delimiter':
              return (
                <div key={index} className="text-center my-8">
                  <div className="inline-block text-2xl text-gray-400">* * *</div>
                </div>
              )
            default:
              return (
                <div key={index} className="mb-4 text-gray-700">
                  {block.data.text || JSON.stringify(block.data)}
                </div>
              )
          }
        })
      }
    } catch (e) {
      // Fallback to plain text if JSON parsing fails
      return (
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The article you\'re looking for doesn\'t exist.'}</p>
          <Link href="/articles">
            <Button>Back to Articles</Button>
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = (user?.role === 'teacher' && article.teacherId === user.id) || user?.role === 'admin'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/articles" className="text-blue-600 hover:text-blue-800">
          ← Back to Articles
        </Link>
      </div>

      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {article.title}
        </h1>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <span>By {article.teacher?.user?.firstName} {article.teacher?.user?.lastName}</span>
            <span className="mx-2">•</span>
            <span>
              {article.publishedAt ? formatDate(article.publishedAt) : formatDate(article.createdAt)}
            </span>
            {article.status !== 'published' && (
              <>
                <span className="mx-2">•</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs capitalize">
                  {article.status}
                </span>
              </>
            )}
          </div>
          
          {canEdit && (
            <div className="flex space-x-2">
              <Link href={`/articles/edit/${article.slug}`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          )}
        </div>

        {article.excerpt && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700 font-medium">{article.excerpt}</p>
          </div>
        )}

        {article.featuredImage && (
          <div className="mb-8">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
      </header>

      {/* Article Content */}
      <div className="prose prose-lg max-w-none">
        {renderEditorContent(article.content)}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Last updated: {formatDate(article.updatedAt)}
          </div>
          
          <Link href="/articles">
            <Button variant="outline">
              More Articles
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  )
}