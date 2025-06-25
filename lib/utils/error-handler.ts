import { ApiError } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error.response) {
    const apiError: ApiError = error.response.data;
    return new AppError(
      apiError.message || 'An API error occurred',
      apiError.statusCode || error.response.status
    );
  }

  if (error.message) {
    return new AppError(error.message);
  }

  return new AppError('An unknown error occurred');
};

export const getErrorMessage = (error: any): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unknown error occurred';
};

export const isAuthError = (error: any): boolean => {
  const appError = handleApiError(error);
  return appError.statusCode === 401 || appError.statusCode === 403;
};

export const isNetworkError = (error: any): boolean => {
  return error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error');
};

export const isValidationError = (error: any): boolean => {
  const appError = handleApiError(error);
  return appError.statusCode === 400;
};