import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  FileUpload,
  CreateUploadDto,
  UpdateUploadDto,
} from '../../types';

export class UploadsService {
  private endpoint = API_CONFIG.ENDPOINTS.UPLOADS;

  async createUpload(uploadData: CreateUploadDto): Promise<FileUpload> {
    const response = await apiClient.post<FileUpload>(this.endpoint, uploadData);
    return response.data;
  }

  async getAllUploads(): Promise<FileUpload[]> {
    const response = await apiClient.get<FileUpload[]>(this.endpoint);
    return response.data;
  }

  async getUploadById(id: number): Promise<FileUpload> {
    const response = await apiClient.get<FileUpload>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async updateUpload(id: number, uploadData: UpdateUploadDto): Promise<FileUpload> {
    const response = await apiClient.patch<FileUpload>(`${this.endpoint}/${id}`, uploadData);
    return response.data;
  }

  async deleteUpload(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  async uploadFile(file: File, description?: string): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.upload<FileUpload>(this.endpoint, formData);
    return response.data;
  }
}

export const uploadsService = new UploadsService();