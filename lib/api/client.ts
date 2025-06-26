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
    
    const config: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };


    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ApiError;
        let responseText = '';
        
        try {
          responseText = await response.text();
          console.log('Raw error response text:', responseText);
          
          // Try to parse as JSON
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Failed to parse error response as JSON:', parseError);
          errorData = {
            message: responseText || 'An error occurred',
            statusCode: response.status,
          };
        }
        
        console.error('API Error Status:', response.status);
        console.error('API Error URL:', url);
        console.error('API Response Text:', responseText);
        console.error('API Error Data:', errorData);
        console.error('Request method:', config.method);
        console.error('Request headers:', config.headers);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error(errorData.message || 'Authentication required');
        }
        if (response.status === 500 && errorData.message?.includes('email')) {
          throw new Error('Registration successful but email verification failed. Please contact support.');
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
        message: error?.message,
        name: error?.name,
        stack: error?.stack
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
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
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
}

export const apiClient = new ApiClient();