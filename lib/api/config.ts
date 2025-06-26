export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: '/auth',
    ARTICLES: '/articles',
    BOOKINGS: '/bookings',
    QUIZZES: '/quizzes',
    USERS: '/users',
    STUDENTS: '/students',
    TEACHERS: '/teachers',
    UPLOADS: '/uploads',
    ADMIN: '/admin',
    OTP: '/otp',
  },
} as const;

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}