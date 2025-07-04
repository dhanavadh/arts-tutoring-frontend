import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-neutral-600 ${sizeClasses[size]} ${className}`}></div>
  );
};

export const LoadingPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export const LoadingCard: React.FC = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
      <div className="bg-gray-300 h-4 rounded w-1/2 mb-2"></div>
      <div className="bg-gray-300 h-4 rounded w-5/6"></div>
    </div>
  );
};