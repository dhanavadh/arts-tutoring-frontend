import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  Teacher,
  CreateTeacherDto,
  UpdateTeacherDto,
} from '../../types';

export class TeachersService {
  private endpoint = API_CONFIG.ENDPOINTS.TEACHERS;

  async createTeacher(teacherData: CreateTeacherDto): Promise<Teacher> {
    const response = await apiClient.post<Teacher>(this.endpoint, teacherData);
    return response.data;
  }

  async getAllTeachers(): Promise<{ teachers: Teacher[]; total: number; page: number; totalPages: number }> {
    const response = await apiClient.get<{ teachers: Teacher[]; total: number; page: number; totalPages: number }>(this.endpoint);
    return response.data;
  }

  async getTeacherById(id: number): Promise<Teacher> {
    const response = await apiClient.get<Teacher>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async updateTeacher(id: number, teacherData: UpdateTeacherDto): Promise<Teacher> {
    const response = await apiClient.patch<Teacher>(`${this.endpoint}/${id}`, teacherData);
    return response.data;
  }

  async deleteTeacher(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async getMyProfile(): Promise<Teacher> {
    const response = await apiClient.get<Teacher>(`${this.endpoint}/me`);
    return response.data;
  }

  async updateMyProfile(teacherData: UpdateTeacherDto): Promise<Teacher> {
    const response = await apiClient.patch<Teacher>(`${this.endpoint}/me`, teacherData);
    return response.data;
  }
}

export const teachersService = new TeachersService();