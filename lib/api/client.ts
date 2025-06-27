import { API_CONFIG, ApiResponse, ApiError } from './config';

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage for Authorization header
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Debug logging for all requests
    console.log('API Client Request:', { 
      url, 
      method: options.method || 'GET',
      endpoint, 
      options
    });
    
    // Debug logging for authentication requests
    if (endpoint.includes('/profile') || endpoint.includes('/auth')) {
      console.log('API Client: Making authenticated request to:', url);
      console.log('API Client: Request config:', config);
      if (typeof document !== 'undefined') {
        console.log('API Client: Document cookies:', document.cookie);
      }
    }


    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Debug logging for Set-Cookie headers
      if (endpoint.includes('/auth/login')) {
        console.log('API Client: Response headers for login:', Object.fromEntries(response.headers.entries()));
        console.log('API Client: Set-Cookie header:', response.headers.get('Set-Cookie'));
      }

      if (!response.ok) {
        let errorData: ApiError;
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.log('Raw error response text:', responseText);
          
          // Try to parse as JSON
          try {
            errorData = JSON.parse(responseText);
          } catch (jsonError) {
            console.log('Failed to parse error response as JSON:', jsonError);
            errorData = {
              message: responseText || 'An error occurred',
              statusCode: response.status,
            };
          }
        } catch (textError) {
          console.log('Failed to read response text:', textError);
          errorData = {
            message: 'Failed to read error response from server',
            statusCode: response.status,
          };
        }
        
        const errorDetails = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          url: url,
          method: config.method,
          responseText: responseText.substring(0, 500), // Limit response size in logs
          errorData: errorData,
          headers: Object.fromEntries(Object.entries(config.headers || {}).filter(([key]) => key !== 'Authorization')), // Avoid logging auth tokens
          timestamp: new Date().toISOString(),
        };
        
        console.error('API ERROR DETAILS:', JSON.stringify(errorDetails, null, 2));
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(errorData.message || 'Authentication required');
        }
        if (response.status === 403) {
          throw new Error(errorData.message || 'You do not have permission to access this resource');
        }
        if (response.status === 404) {
          throw new Error(errorData.message || 'The requested resource was not found');
        }
        if (response.status === 500) {
          if (errorData.message?.includes('email')) {
            throw new Error('Registration successful but email verification failed. Please contact support.');
          }
          throw new Error(errorData.message || 'Internal server error. Please try again later.');
        }
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error('Server temporarily unavailable. Please try again in a few minutes.');
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error details:', {
        error,
        url,
        baseURL: this.baseURL,
        message: (error as any)?.message,
        name: (error as any)?.name,
        stack: (error as any)?.stack
      });
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms to ${url}`);
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
          throw new Error(`Cannot connect to API server at ${url}. Make sure your backend server is running.`);
        }
        throw error;
      }
      throw new Error(`Network error occurred while fetching ${url}`);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    console.log('API get called with params:', params);
    
    // Debug all params in detail
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        console.log(`Param ${key}:`, value, 'type:', typeof value);
      });
    }
    
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    console.log('API get constructed URL:', url);
    console.log('API absolute URL:', `${this.baseURL}${url}`);
    
    try {
      const response = await this.request<T>(url, { method: 'GET' });
      return response;
    } catch (error) {
      console.error(`GET request failed for ${this.baseURL}${url}:`, error);
      // Add endpoint context to error
      if (error instanceof Error) {
        error.message = `[GET ${endpoint}] ${error.message}`;
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('Upload request:', { url, formData });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        let errorData: ApiError;
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.log('Upload error response:', responseText);
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          errorData = {
            message: responseText || 'Upload failed',
            statusCode: response.status,
          };
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload success result:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Upload failed');
    }
  }

  // Direct API call for debugging
  async directApiGet(url: string) {
    console.log('Making direct API call to:', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Direct API response:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('Direct API call failed:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();