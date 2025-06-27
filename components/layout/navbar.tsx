'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../lib/contexts/auth-context';
import { API_CONFIG } from '../../lib/api/config';
import { getProtectedImageUrl } from '../../lib/api/image-utils';
import { useProtectedImage } from '../../lib/hooks/useProtectedImage';
import { Button } from '../ui/button';
import { LogoutButton } from '../ui/logout-button';
import { AdminOnly, TeacherOnly, StudentOnly } from '../../lib/components/role-guard';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Use the protected image hook for profile image
  const { imageUrl: profileImageUrl, loading: imageLoading } = useProtectedImage(user?.profileImage);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Arts Tutor Platform
            </Link>

            {isAuthenticated && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>

                <StudentOnly>
                  <Link href="/bookings" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    My Bookings
                  </Link>
                  <Link href="/quizzes" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    My Quizzes
                  </Link>
                </StudentOnly>

                <Link href="/articles" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Articles
                </Link>

                <TeacherOnly>
                  <Link href="/schedule" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Schedule
                  </Link>
                  <Link href="/quizzes" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    My Quizzes
                  </Link>
                </TeacherOnly>

                <AdminOnly>
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                  <Link href="/quizzes" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    All Quizzes
                  </Link>
                </AdminOnly>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
              {imageLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              ) : (
                <Image
                  src={profileImageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K'}
                  alt="Profile Picture"
                  width={40}
                  height={40}
                  className="rounded-full"
                  unoptimized={true}
                  onError={(e) => {
                    // Fallback to default image on error
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                  key={profileImageUrl || 'default'} // Force re-render when URL changes
                />
              )}
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  Welcome, {user?.firstName} {user?.lastName}
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};