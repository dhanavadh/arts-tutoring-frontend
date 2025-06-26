'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, hasAnyRole, user, checkAuth } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);

  console.log('ProtectedRoute state:', { isAuthenticated, isLoading, user: user?.email || 'none', hasCheckedAuth });

  // Check for authentication when protected route is accessed
  useEffect(() => {
    if (!isAuthenticated && !isLoading && !hasCheckedAuth) {
      console.log('ProtectedRoute: Checking for existing authentication...');
      setHasCheckedAuth(true);
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth, hasCheckedAuth]);

  if (isLoading || (!isAuthenticated && !hasCheckedAuth)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing access denied');
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // In a real app, you'd use Next.js router to redirect
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You must be logged in to access this page.</p>
          <a 
            href={redirectTo}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    console.log('User lacks required roles:', allowedRoles);
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h2>
          <p className="text-gray-600 mb-4">
            You don't have the required permissions to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required roles: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  console.log('User authenticated, rendering protected content');
  return <>{children}</>;
};