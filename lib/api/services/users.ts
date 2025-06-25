import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginatedResponse,
  PaginationDto,
} from '../../types';

export class UsersService {
  private endpoint = API_CONFIG.ENDPOINTS.USERS;

  async createUser(userData: CreateUserDto): Promise<User> {
    const response = await apiClient.post<User>(this.endpoint, userData);
    return response.data;
  }

  async getAllUsers(params?: PaginationDto): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>(
      this.endpoint,
      params as Record<string, string>
    );
    return response.data;
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    activeUsers: number;
  }> {
    const response = await apiClient.get<{
      totalUsers: number;
      totalStudents: number;
      totalTeachers: number;
      totalAdmins: number;
      activeUsers: number;
    }>(`${this.endpoint}/stats`);
    return response.data;
  }

  async getCurrentUserProfile(): Promise<User> {
    const response = await apiClient.get<User>(`${this.endpoint}/profile`);
    return response.data;
  }

  async updateProfile(userData: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<User>(`${this.endpoint}/profile`, userData);
    return response.data;
  }

  async uploadProfileImage(file: File): Promise<{ profileImage: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.upload<{ profileImage: string }>(
      `${this.endpoint}/profile/upload-image`,
      formData
    );
    return response.data;
  }

  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<User>(`${this.endpoint}/${id}`, userData);
    return response.data;
  }

  async toggleUserStatus(id: number): Promise<User> {
    const response = await apiClient.patch<User>(`${this.endpoint}/${id}/toggle-status`);
    return response.data;
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async testEndpoint(): Promise<{ message: string }> {
    const response = await apiClient.get<{ message: string }>(`${this.endpoint}/test`);
    return response.data;
  }

  async debugEndpoint(): Promise<any> {
    const response = await apiClient.get<any>(`${this.endpoint}/debug`);
    return response.data;
  }
}

export const usersService = new UsersService();