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

  async getQuizzes(role?: string): Promise<Quiz[]> {
    try {
      let response;
      console.log('Fetching quizzes for role:', role);
      
      if (role === 'admin') {
        // Admin gets all quizzes (paginated)
        response = await apiClient.get<PaginatedResponse<Quiz>>(this.endpoint);
        console.log('Admin quizzes response:', response);
        
        // Handle different response structures
        if (response.data && Array.isArray(response.data.data)) {
          return response.data.data; // Extract the quizzes array from paginated response
        } else if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else {
          console.error('Unexpected admin quizzes response format:', response);
          return [];
        }
      } else if (role === 'teacher') {
        // Teachers get their own quizzes
        response = await apiClient.get<Quiz[]>(`${this.endpoint}/my-quizzes`);
        console.log('Teacher quizzes response:', response);
        
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Handle possible nested data structure
          const possibleData = (response.data as any).data || (response.data as any).quizzes || response.data;
          if (Array.isArray(possibleData)) {
            return possibleData;
          }
        }
        console.error('Unexpected teacher quizzes response format:', response);
        return [];
      } else {
        // Students get their assigned quizzes
        response = await apiClient.get<QuizAssignment[]>(`${this.endpoint}/assigned`);
        console.log('Student assigned quizzes response:', response);
        
        if (Array.isArray(response.data)) {
          // Map assignments to quizzes
          return response.data.map(assignment => assignment.quiz).filter(quiz => quiz != null);
        } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).data)) {
          return (response.data as any).data.map((assignment: any) => assignment.quiz).filter((quiz: any) => quiz != null);
        }
        console.error('Unexpected student quizzes response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }

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

  async getQuizAssignments(id: number): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/${id}/assignments`);
    return response.data;
  }

  async assignQuiz(id: number, assignmentData: AssignQuizDto): Promise<QuizAssignment[]> {
    console.log('Assigning quiz:', { quizId: id, ...assignmentData });
    try {
      // The backend expects POST /quizzes/:id/assign with quizId in the body
      const response = await apiClient.post<QuizAssignment[]>(
        `${this.endpoint}/${id}/assign`,
        {
          quizId: id,
          ...assignmentData
        }
      );
      console.log('Quiz assignment response data:', {
        data: response.data,
        type: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 0
      });
      return response.data;
    } catch (error: any) {
      console.error('Error assigning quiz:', error.response?.data || error);
      throw error;
    }
  }

  async removeQuizAssignment(id: number, studentId: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `${this.endpoint}/${id}/assignments/${studentId}`
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

  async updateQuizStatus(id: number, status: 'published' | 'draft'): Promise<Quiz> {
    const response = await apiClient.patch<Quiz>(`${this.endpoint}/${id}/status`, { status });
    return response.data;
  }

  async getQuiz(id: number): Promise<Quiz> {
    try {
      const response = await apiClient.get<Quiz>(`${this.endpoint}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }
}

export const quizzesService = new QuizzesService();