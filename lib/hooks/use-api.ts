'use client';

import { useState, useCallback } from 'react';
import { handleApiError, getErrorMessage } from '../utils/error-handler';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const appError = handleApiError(error);
      const errorMessage = getErrorMessage(error);
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw appError;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hooks for common patterns
export function useApiMutation<T = any>(options: UseApiOptions = {}) {
  return useApi<T>(options);
}

export function useApiQuery<T = any>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const api = useApi<T>(options);

  const refetch = useCallback(() => {
    return api.execute(apiCall);
  }, [api, apiCall]);

  return {
    ...api,
    refetch,
  };
}