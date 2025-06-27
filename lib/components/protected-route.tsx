'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/login',
}: ProtectedRouteProps): React.ReactElement | null {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasAnyRole, user, checkAuth } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);

  console.log('ProtectedRoute state:', {
    isAuthenticated,
    isLoading,
    userRole: user?.role || 'none',
    userEmail: user?.email || 'none',
    hasCheckedAuth,
    allowedRoles
  });

  // Check for authentication when protected route is accessed
  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isAuthenticated && !isLoading && !hasCheckedAuth) {
        console.log('ProtectedRoute: Checking for existing authentication...');
        setHasCheckedAuth(true);
        await checkAuth();
      }
    };

    checkAuthentication();
  }, [isAuthenticated, isLoading, checkAuth, hasCheckedAuth]);

  if (isLoading) {
    console.log('ProtectedRoute: Loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting...');
    router.push(redirectTo);
    return fallback ? <>{fallback}</> : null;
  }

  // If roles are specified, check if user has any of the allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    console.log('ProtectedRoute: Checking roles...', { userRole: user?.role, allowedRoles });
    if (!user || !hasAnyRole(allowedRoles)) {
      console.log('ProtectedRoute: Access denied - insufficient permissions');
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <Link href="/" className="text-blue-600 hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      );
    }
  }

  console.log('ProtectedRoute: Access granted');
  return <>{children}</>;
}