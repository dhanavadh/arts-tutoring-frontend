'use client';

import React from 'react';
import { useAuth } from '../../lib/contexts/auth-context';
import { LoadingPage } from '../ui/loading';
import { StudentDashboard } from './student-dashboard';
import { TeacherDashboard } from './teacher-dashboard';
import { AdminDashboard } from './admin-dashboard';

export const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    // Check if we have auth cookies but failed to load profile
    const hasAuthCookie = typeof document !== 'undefined' && document.cookie.includes('access_token');
    
    if (hasAuthCookie) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900">Loading Profile...</h2>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
          <p className="text-sm text-gray-500 mt-2">
            You appear to be logged in, but we're having trouble loading your profile.
          </p>
        </div>
      );
    }
    
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">Please log in to access your dashboard.</p>
      </div>
    );
  }

  console.log('Dashboard user data:', user);
  console.log('User role:', user.role, 'Type:', typeof user.role);
  
  // Use the user directly
  const userRole = user.role?.toLowerCase?.()?.trim?.() || '';
  
  console.log('User role processed:', userRole);
  
  switch (userRole) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900">Unknown Role: {user.role}</h2>
          <p className="text-gray-600">Unable to determine dashboard type.</p>
          <p className="text-gray-500 text-xs mt-2">
            Raw role value: "{user.role}" (type: {typeof user.role})
          </p>
          <p className="text-gray-500 text-xs">
            Processed role: "{userRole}"
          </p>
        </div>
      );
  }
};