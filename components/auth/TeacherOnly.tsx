'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface TeacherOnlyProps {
  children: React.ReactNode
}

export function TeacherOnly({ children }: TeacherOnlyProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  console.log('TeacherOnly: isAuthenticated:', isAuthenticated, 'user role:', user?.role, 'isLoading:', isLoading)

  useEffect(() => {
    if (isLoading) return // Don't redirect while loading
    
    if (!isAuthenticated) {
      console.log('TeacherOnly: User not authenticated, redirecting to login')
      router.push('/login')
      return
    }

    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      console.log('TeacherOnly: User role not allowed:', user?.role, 'redirecting to dashboard')
      router.push('/dashboard')
      return
    }
  }, [isAuthenticated, user, router, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || (user?.role !== 'teacher' && user?.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be logged in as a teacher or admin to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}