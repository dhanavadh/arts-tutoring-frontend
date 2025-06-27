'use client';

import React from 'react';
import { useAuth } from '../contexts/auth-context';
import { UserRole } from '../types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  hideOnNoAccess?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  hideOnNoAccess = false,
}) => {
  const { isAuthenticated, hasAnyRole } = useAuth();

  if (!isAuthenticated || !hasAnyRole(allowedRoles)) {
    if (hideOnNoAccess) {
      return null;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return null;
  }

  return <>{children}</>;
};

// Specific role components for convenience
export const AdminOnly: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={[UserRole.ADMIN]} />
);

export const TeacherOnly: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={[UserRole.TEACHER]} />
);

export const StudentOnly: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={[UserRole.STUDENT]} />
);

export const TeacherOrAdmin: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]} />
);

export const StudentOrTeacher: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => (
  <RoleGuard {...props} allowedRoles={[UserRole.STUDENT, UserRole.TEACHER]} />
);