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
    const response = await apiClient.get<any>(
      this.endpoint,
      params as Record<string, string>
    );
    // Backend returns nested structure: { data: { articles: [], total: 0, page: 1, totalPages: 0 } }
    const backendData = response.data?.data || { articles: [], total: 0, page: 1, totalPages: 0 };
    return {
      data: backendData.articles || [],
      total: backendData.total || 0,
      page: backendData.page || 1,
      limit: params?.limit || 10,
      totalPages: backendData.totalPages || 0
    };
  }

  async createArticle(articleData: CreateArticleDto): Promise<Article> {
    const response = await apiClient.post<any>(this.endpoint, articleData);
    return response.data?.data || response.data;
  }

  async getMyArticles(): Promise<Article[]> {
    const response = await apiClient.get<any>(`${this.endpoint}/my-articles`);
    return response.data?.data || response.data || [];
  }

  async getArticleById(id: number): Promise<Article> {
    const response = await apiClient.get<any>(`${this.endpoint}/${id}`);
    return response.data?.data || response.data;
  }

  async getArticleBySlug(slug: string): Promise<Article> {
    const response = await apiClient.get<any>(`${this.endpoint}/${slug}`);
    return response.data?.data || response.data;
  }

  async updateArticle(id: number, articleData: UpdateArticleDto): Promise<Article> {
    const response = await apiClient.patch<any>(`${this.endpoint}/${id}`, articleData);
    return response.data?.data || response.data;
  }

  async deleteArticle(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<any>(`${this.endpoint}/${id}`);
    return response.data?.data || response.data;
  }

  async uploadArticleImage(id: number, file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.upload<any>(
      `${this.endpoint}/${id}/upload-image`,
      formData
    );
    return response.data?.data || response.data;
  }

  async getArticlesByStatus(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Article>> {
    console.log('API getArticlesByStatus called with params:', params);
    
    // Force the status value to be lowercase to match backend enum
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.page !== undefined) queryParams['page'] = String(params.page);
      if (params.limit !== undefined) queryParams['limit'] = String(params.limit);
      if (params.search !== undefined) queryParams['search'] = params.search;
      if (params.status !== undefined) queryParams['status'] = params.status.toLowerCase();
    }
    
    console.log('API getArticlesByStatus queryParams after conversion:', queryParams);
    
    try {
      // Make a direct fetch request for debugging
      console.log(`DEBUG: Making direct fetch request to ${this.endpoint}`);
      const directResponse = await fetch(`http://localhost:8080/api/v1${this.endpoint}?${new URLSearchParams(queryParams).toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const directData = await directResponse.json();
      console.log('DEBUG: Direct fetch response:', JSON.stringify(directData, null, 2));
      
      // If direct fetch worked but our normal method doesn't, use the direct data
      let useDirectData = false;
      let articlesFromDirectFetch: Article[] = [];
      
      if (directData?.data?.articles && Array.isArray(directData.data.articles) && directData.data.articles.length > 0) {
        console.log('DEBUG: Direct fetch found articles:', directData.data.articles.length);
        articlesFromDirectFetch = directData.data.articles;
        useDirectData = true;
      }
      
      // Continue with normal API client
      console.log(`DEBUG: Requesting ${this.endpoint} with params:`, queryParams);
      const response = await apiClient.get<any>(
        this.endpoint,
        queryParams
      );
      
      console.log('API getArticlesByStatus raw response:', JSON.stringify(response, null, 2));
      
      // Get the data from the response
      const backendData = response.data?.data || { articles: [], total: 0, page: 1, totalPages: 0 };
      console.log('API getArticlesByStatus backendData:', JSON.stringify(backendData, null, 2));
      
      // Check if we have articles
      if (Array.isArray(backendData.articles) && backendData.articles.length > 0) {
        console.log('DEBUG: Found articles in normal response:', backendData.articles.length);
        
        return {
          data: backendData.articles,
          total: backendData.total || 0,
          page: backendData.page || 1,
          limit: params?.limit || 10,
          totalPages: backendData.totalPages || 0
        };
      } else if (useDirectData) {
        // Use the direct fetch data if normal API failed
        console.log('DEBUG: Using direct fetch data as fallback');
        return {
          data: articlesFromDirectFetch,
          total: directData.data.total || articlesFromDirectFetch.length,
          page: directData.data.page || 1,
          limit: params?.limit || 10,
          totalPages: directData.data.totalPages || 1
        };
      } else {
        console.log('DEBUG: No articles found in either response');
        return {
          data: [],
          total: 0,
          page: 1,
          limit: params?.limit || 10,
          totalPages: 0
        };
      }
    } catch (error) {
      console.error('Error in getArticlesByStatus:', error);
      throw error;
    }
  }
}

export const articlesService = new ArticlesService();