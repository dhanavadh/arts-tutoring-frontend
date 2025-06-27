import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  AuthResponse,
  User,
} from '../../types';

export class AuthService {
  private endpoint = API_CONFIG.ENDPOINTS.AUTH;

  async login(credentials: LoginDto): Promise<AuthResponse> {
    console.log('Auth service: Making login request...');
    console.log('Auth service: Login URL:', `${this.endpoint}/login`);
    console.log('Auth service: Credentials:', { email: credentials.email, password: '***' });
    
    const response = await apiClient.post<{ success: boolean; message: string; data: AuthResponse & { accessToken?: string } }>(
      `${this.endpoint}/login`,
      credentials
    );
    console.log('Auth service: Raw response:', response);
    console.log('Auth service: Response data:', response.data);
    console.log('Auth service: Extracted user data:', response.data.data);
    
    // Check if we have the expected response structure
    if (!response.data.data || !response.data.data.user) {
      console.error('Auth service: Invalid response structure:', response.data);
      throw new Error('Invalid login response structure');
    }
    
    // Store token in localStorage temporarily for testing (only in browser)
    if (response.data.data.accessToken && typeof window !== 'undefined') {
      console.log('Auth service: Storing token in localStorage');
      localStorage.setItem('access_token', response.data.data.accessToken);
    }
    
    return response.data.data;
  }

  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<{ 
      success: boolean; 
      message: string; 
      data?: AuthResponse;
      requiresVerification?: boolean;
      user?: any;
    }>(
      `${this.endpoint}/register`,
      userData
    );
    
    // Handle OTP verification response structure
    if (response.data.requiresVerification) {
      return {
        user: response.data.data?.user || response.data.user,
        message: response.data.message,
        requiresVerification: true
      };
    }
    
    // Handle normal registration response
    return response.data.data || {
      user: response.data.user,
      message: response.data.message
    };
  }

  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${this.endpoint}/logout`
    );
    
    // Clear localStorage token (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    
    return { message: response.data.message };
  }

  async getProfile(): Promise<User> {
    try {
      console.log('Trying to get profile from /users/profile');
      const response = await apiClient.get<{ user: User }>(`${API_CONFIG.ENDPOINTS.USERS}/profile`);
      console.log('Profile response:', response);
      
      // The backend returns { user: {...} } format
      if (response.data && response.data.user) {
        return response.data.user;
      }
      
      // Fallback if the response format is different
      if (response.data) {
        return response.data as any;
      }
      
      throw new Error('Invalid profile response format');
    } catch (error) {
      console.log('Profile fetch failed:', error);
      throw new Error('Failed to fetch user profile. Please log in again.');
    }
  }

  async changePassword(passwordData: ChangePasswordDto): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.endpoint}/change-password`,
      {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      }
    );
    return response.data;
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ 
      success: boolean; 
      message: string; 
      data: AuthResponse 
    }>(
      `${this.endpoint}/verify-registration`,
      { email, otp }
    );
    return response.data.data;
  }
}

export const authService = new AuthService();