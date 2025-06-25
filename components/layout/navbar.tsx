'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/contexts/auth-context';
import { Button } from '../ui/button';
import { LogoutButton } from '../ui/logout-button';
import { AdminOnly, TeacherOnly, StudentOnly } from '../../lib/components/role-guard';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

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
                    Quizzes
                  </Link>
                </StudentOnly>

                <TeacherOnly>
                  <Link href="/articles" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Articles
                  </Link>
                  <Link href="/schedule" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Schedule
                  </Link>
                  <Link href="/quiz-management" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Quiz Management
                  </Link>
                </TeacherOnly>

                <AdminOnly>
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </Link>
                </AdminOnly>

                <Link href="/articles/public" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Articles
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
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