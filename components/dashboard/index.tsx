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
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">Please log in to access your dashboard.</p>
      </div>
    );
  }

  switch (user.role) {
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
        </div>
      );
  }
};