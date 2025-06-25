import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
} from '../../types';

export class StudentsService {
  private endpoint = API_CONFIG.ENDPOINTS.STUDENTS;

  async createStudent(studentData: CreateStudentDto): Promise<Student> {
    const response = await apiClient.post<Student>(this.endpoint, studentData);
    return response.data;
  }

  async getAllStudents(): Promise<Student[]> {
    const response = await apiClient.get<Student[]>(this.endpoint);
    return response.data;
  }

  async getStudentById(id: number): Promise<Student> {
    const response = await apiClient.get<Student>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async updateStudent(id: number, studentData: UpdateStudentDto): Promise<Student> {
    const response = await apiClient.patch<Student>(`${this.endpoint}/${id}`, studentData);
    return response.data;
  }

  async deleteStudent(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }
}

export const studentsService = new StudentsService();