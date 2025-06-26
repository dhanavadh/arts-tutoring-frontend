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

  async uploadFile(file: File, uploadType: 'profile_image' | 'article_image' | 'document' = 'profile_image'): Promise<FileUpload> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('originalName', file.name);
    formData.append('mimetype', file.type);
    formData.append('size', file.size.toString());
    formData.append('uploadType', uploadType);
    
    // Note: uploadedById and path will likely be set by the backend

    console.log('Uploading file with required fields:', {
      name: file.name,
      type: file.type,
      size: file.size,
      uploadType,
      endpoint: this.endpoint
    });

    try {
      const response = await apiClient.upload<FileUpload>(this.endpoint, formData);
      return response.data;
    } catch (error) {
      console.error('Upload service error:', error);
      throw error;
    }
  }
}

export const uploadsService = new UploadsService();