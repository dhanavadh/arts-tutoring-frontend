import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  Article,
  CreateArticleDto,
  UpdateArticleDto,
  PaginatedResponse,
} from '../../types';

export class ArticlesService {
  private endpoint = API_CONFIG.ENDPOINTS.ARTICLES;

  async getPublishedArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Article>> {
    const response = await apiClient.get<PaginatedResponse<Article>>(
      this.endpoint,
      params as Record<string, string>
    );
    return response.data;
  }

  async createArticle(articleData: CreateArticleDto): Promise<Article> {
    const response = await apiClient.post<Article>(this.endpoint, articleData);
    return response.data;
  }

  async getMyArticles(): Promise<Article[]> {
    const response = await apiClient.get<Article[]>(`${this.endpoint}/my-articles`);
    return response.data;
  }

  async getArticleById(id: number): Promise<Article> {
    const response = await apiClient.get<Article>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async updateArticle(id: number, articleData: UpdateArticleDto): Promise<Article> {
    const response = await apiClient.patch<Article>(`${this.endpoint}/${id}`, articleData);
    return response.data;
  }

  async deleteArticle(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async uploadArticleImage(id: number, file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.upload<{ imageUrl: string }>(
      `${this.endpoint}/${id}/upload-image`,
      formData
    );
    return response.data;
  }
}

export const articlesService = new ArticlesService();