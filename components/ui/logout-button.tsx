'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
  children = 'Logout',
}) => {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/logout');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={className}
    >
      {children}
    </Button>
  );
};