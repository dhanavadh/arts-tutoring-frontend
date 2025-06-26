import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  Quiz,
  QuizAssignment,
  QuizAttempt,
  CreateQuizDto,
  AssignQuizDto,
  SubmitQuizDto,
  PaginatedResponse,
  PaginationDto,
} from '../../types';

export class QuizzesService {
  private endpoint = API_CONFIG.ENDPOINTS.QUIZZES;

  async createQuiz(quizData: CreateQuizDto): Promise<Quiz> {
    const response = await apiClient.post<Quiz>(this.endpoint, quizData);
    return response.data;
  }

  async updateQuiz(id: number, quizData: CreateQuizDto): Promise<Quiz> {
    const response = await apiClient.put<Quiz>(`${this.endpoint}/${id}`, quizData);
    return response.data;
  }

  async getAllQuizzes(params?: PaginationDto): Promise<PaginatedResponse<Quiz>> {
    const response = await apiClient.get<any>(
      this.endpoint,
      params as Record<string, string>
    );
    
    console.log('Raw getAllQuizzes response:', response);
    
    // Handle different response structures from backend
    let backendData;
    if (response.data) {
      backendData = response.data;
    } else {
      backendData = response;
    }
    
    console.log('Processed backendData:', backendData);
    
    return {
      data: backendData.quizzes || backendData.data || [],
      total: backendData.total || 0,
      page: backendData.page || 1,
      limit: params?.limit || 10,
      totalPages: backendData.totalPages || 1,
    };
  }

  async getMyQuizzes(): Promise<Quiz[]> {
    const response = await apiClient.get<Quiz[]>(`${this.endpoint}/my-quizzes`);
    return response.data;
  }

  async getAssignedQuizzes(): Promise<QuizAssignment[]> {
    const response = await apiClient.get<QuizAssignment[]>(`${this.endpoint}/assigned`);
    return response.data;
  }

  async getQuizById(id: number): Promise<Quiz> {
    const response = await apiClient.get<Quiz>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async assignQuiz(id: number, assignmentData: AssignQuizDto): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${this.endpoint}/${id}/assign`,
      assignmentData
    );
    return response.data;
  }

  async startQuizAttempt(assignmentId: number): Promise<QuizAttempt> {
    const response = await apiClient.post<QuizAttempt>(
      `${this.endpoint}/assignments/${assignmentId}/attempt`
    );
    return response.data;
  }

  async submitQuiz(attemptId: number, answers: SubmitQuizDto): Promise<QuizAttempt> {
    const response = await apiClient.post<QuizAttempt>(
      `${this.endpoint}/attempts/${attemptId}/submit`,
      answers
    );
    return response.data;
  }

  async gradeQuiz(
    attemptId: number,
    grades: { questionId: number; score: number; feedback?: string }[]
  ): Promise<QuizAttempt> {
    const response = await apiClient.patch<QuizAttempt>(
      `${this.endpoint}/attempts/${attemptId}/grade`,
      { grades }
    );
    return response.data;
  }

  async getQuizResults(id: number): Promise<QuizAttempt[]> {
    const response = await apiClient.get<QuizAttempt[]>(`${this.endpoint}/${id}/results`);
    return response.data;
  }

  async deleteQuiz(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async publishQuiz(id: number): Promise<Quiz> {
    const response = await apiClient.patch<Quiz>(`${this.endpoint}/${id}/publish`);
    return response.data;
  }

  async unpublishQuiz(id: number): Promise<Quiz> {
    const response = await apiClient.patch<Quiz>(`${this.endpoint}/${id}/unpublish`);
    return response.data;
  }
}

export const quizzesService = new QuizzesService();