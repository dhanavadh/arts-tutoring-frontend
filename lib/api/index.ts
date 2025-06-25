// Main API exports
export * from './config';
export * from './client';
export * from './services';

// Re-export types for convenience
export * from '../types';

// Re-export hooks
export * from '../hooks/use-api';

// Re-export error handling
export * from '../utils/error-handler';

// Re-export auth context
export * from '../contexts/auth-context';

// Re-export components
export * from '../components/protected-route';
export * from '../components/role-guard';