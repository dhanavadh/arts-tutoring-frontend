'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/contexts/auth-context';
import { LoadingSpinner } from '../ui/loading';
import { Card, CardBody } from '../ui/card';

export const LogoutPage: React.FC = () => {
  const [status, setStatus] = useState<'logging-out' | 'success' | 'error'>('logging-out');
  const [countdown, setCountdown] = useState(3);
  const { logout, isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // If user is not authenticated, just show success and redirect
        if (!isAuthenticated) {
          setStatus('success');
          return;
        }
        
        await logout();
        setStatus('success');
      } catch (error) {
        console.error('Logout error:', error);
        setStatus('error');
      }
    };

    performLogout();
  }, [logout, isAuthenticated]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => router.push('/'), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, router]);

  const handleRedirectNow = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardBody className="text-center py-8">
            {status === 'logging-out' && (
              <>
                <div className="text-4xl mb-4">👋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {user?.firstName ? `Goodbye, ${user.firstName}!` : 'Logging you out...'}
                </h2>
                <LoadingSpinner className="mx-auto mb-4" />
                <p className="text-gray-600">
                  Please wait while we securely log you out.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Successfully Logged Out
                </h2>
                <p className="text-gray-600 mb-6">
                  {isAuthenticated ? (
                    "You have been securely logged out."
                  ) : (
                    "Thank you for using Arts Tutor Platform!"
                  )}
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Redirecting to home page in <span className="font-bold">{countdown}</span> seconds...
                  </p>
                </div>
                <button
                  onClick={handleRedirectNow}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  Go to home page now
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Logout Error
                </h2>
                <p className="text-gray-600 mb-6">
                  There was an issue logging you out, but you can still navigate away safely.
                </p>
                <button
                  onClick={handleRedirectNow}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                >
                  Go to Home Page
                </button>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};