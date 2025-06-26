'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { articlesService } from '@/lib/api/services/articles'
import { useAuth } from '@/lib/contexts/auth-context'
import { Article, PaginatedResponse, Teacher } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/ui/loading'
import { useDebounce } from '@/lib/hooks/use-debounce'

export default function ArticlesPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentStatus, setCurrentStatus] = useState<'published' | 'draft'>(
    'published',
  )

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    loadArticles()

    // Debug: Direct fetch to API
    debugDirectApiCall()
  }, [currentPage, debouncedSearchTerm, currentStatus])

  // Direct API call function to check if we can get articles
  const checkDirectApiCall = async () => {
    try {
      console.log('Making direct API call to backend...')
      const response = await fetch('http://localhost:8080/api/v1/articles', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      console.log('Direct API response:', data)
      
      // If we can get articles directly but not through the service, use them
      if (data?.data?.articles?.length > 0 && articles.length === 0) {
        console.log('Setting articles from direct API call:', data.data.articles)
        setArticles(data.data.articles)
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (err) {
      console.error('Direct API call error:', err)
    }
  }
  
  const debugDirectApiCall = async () => {
    try {
      console.log('Debug: Making direct fetch to API...')
      const response = await fetch('http://localhost:8080/api/v1/articles?status=published')
      const data = await response.json()
      console.log('Debug direct API response:', data)
      
      // Check if we have articles in the direct response
      if (data?.data?.articles?.length > 0) {
        console.log('Debug: Found articles in direct call:', data.data.articles)
      }
    } catch (error) {
      console.error('Debug direct API error:', error)
    }
  }

  const loadArticles = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching articles with status:', currentStatus)
      
      // Make a direct API call for debugging
      try {
        const directUrl = `http://localhost:8080/api/v1/articles?status=${currentStatus.toLowerCase()}&page=${currentPage}&limit=10${searchTerm ? `&search=${searchTerm}` : ''}`;
        console.log('DEBUG: Making direct fetch to:', directUrl);
        
        const directResponse = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        const directData = await directResponse.json();
        console.log('DEBUG: Direct API response:', JSON.stringify(directData, null, 2));
        
        // If direct call works, use this data
        if (directData?.data?.articles && directData.data.articles.length > 0) {
          console.log('DEBUG: Direct API found articles:', directData.data.articles.length);
          console.log('DEBUG: Setting articles from direct API');
          setArticles(directData.data.articles);
          setTotalPages(directData.data.totalPages || 1);
          setError(null);
          setLoading(false);
          return; // Exit early if direct API worked
        }
      } catch (directErr) {
        console.error('Direct API call failed:', directErr);
      }
      
      // Use the service method as fallback
      console.log('DEBUG: Using service method as fallback')
      const response: PaginatedResponse<Article> = await articlesService.getArticlesByStatus({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm || undefined,
        status: currentStatus,
      })

      console.log('Articles response:', JSON.stringify(response, null, 2))
      console.log('Articles data:', JSON.stringify(response.data, null, 2))
      
      if (Array.isArray(response.data)) {
        console.log('Setting articles with length:', response.data.length)
        setArticles(response.data)
      } else {
        console.error('Response.data is not an array:', response.data)
        setArticles([])
      }
      
      setTotalPages(response.totalPages || 1)
      setError(null)
    } catch (err) {
      setError('Failed to load articles')
      console.error('Error loading articles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadArticles()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && articles.length === 0) {
    return <LoadingPage />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-600 mt-2">
            Discover insights and knowledge from our teachers
          </p>
        </div>
        
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <div className="flex items-center gap-4">
            <Link href="/articles/new">
              <Button onClick={() => console.log('Write Article clicked, user role:', user?.role)}>
                Write Article
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search articles by title or content..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Status toggle - only for teachers and admins */}
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <div className="mb-6">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-700 mb-2">Filter by status:</div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setCurrentStatus('published')}
                className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
                  currentStatus === 'published'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setCurrentStatus('draft')}
                className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${
                  currentStatus === 'draft'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                Drafts
              </button>
            </div>
          </div>
          
          {/* Current view indicator */}
          <div className="mt-2 text-sm text-gray-500">
            {currentStatus === 'published' 
              ? 'Viewing published articles visible to all users' 
              : 'Viewing draft articles (only visible to you and admins)'}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {(!articles || articles.length === 0) && !loading ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms.' 
              : currentStatus === 'published'
                ? 'No published articles available.'
                : 'No draft articles available. Start writing a new article!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(articles || []).map((article) => (
            <Card key={article.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link href={`/articles/${article.slug}`}>
                    <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">
                      {article.title}
                    </h2>
                  </Link>
                  
                  {article.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <span>By {article.teacher?.user?.firstName} {article.teacher?.user?.lastName}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {article.status === 'published' 
                        ? `Published on ${formatDate(article.publishedAt || article.createdAt)}`
                        : `Updated on ${formatDate(article.updatedAt || article.createdAt)}`
                      }
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
                </div>
                
                {article.featuredImage && (
                  <div className="ml-6">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <Link href={`/articles/${article.slug}`}>
                  <Button variant="outline" size="sm">
                    Read More
                  </Button>
                </Link>
                
                {/* Edit button for draft articles */}
                {(user?.role === 'teacher' || user?.role === 'admin') && article.status === 'draft' && (
                  <Link href={`/articles/edit/${article.slug}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}