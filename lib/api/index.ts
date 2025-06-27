// Main API exports
export * from './config';
export * from './client';
export * from './services';

// Re-export types for convenience (excluding conflicting ones)
export type { 
  User, 
  Student, 
  Teacher, 
  Quiz, 
  QuizQuestion, 
  QuizAssignment, 
  QuizAttempt,
  Article,
  CreateQuizDto,
  CreateQuizQuestionDto,
  AssignQuizDto,
  QuestionType,
  BookingStatus
} from '../types';

// Re-export enums separately
export { UserRole } from '../types';

// Re-export hooks
export * from '../hooks/use-api';

// Re-export error handling
export * from '../utils/error-handler';

// Re-export auth context
export * from '../contexts/auth-context';

// Re-export components
export * from '../components/protected-route';
export * from '../components/role-guard';