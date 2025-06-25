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
    const response = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>(
      `${this.endpoint}/login`,
      credentials
    );
    console.log('Auth service: Raw response:', response);
    console.log('Auth service: Extracted data:', response.data.data);
    return response.data.data;
  }

  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; message: string; data: AuthResponse }>(
      `${this.endpoint}/register`,
      userData
    );
    return response.data.data;
  }

  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${this.endpoint}/logout`
    );
    return { message: response.data.message };
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.post<{ success: boolean; data: { user: User } }>(`${this.endpoint}/profile`);
    return response.data.data.user;
  }

  async changePassword(passwordData: ChangePasswordDto): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.endpoint}/change-password`,
      passwordData
    );
    return response.data;
  }
}

export const authService = new AuthService();