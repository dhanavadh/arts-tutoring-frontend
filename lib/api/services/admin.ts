import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  DashboardStats,
  MonthlyStats,
  SystemHealth,
} from '../../types';

export class AdminService {
  private endpoint = API_CONFIG.ENDPOINTS.ADMIN;

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>(`${this.endpoint}/dashboard`);
    return response.data;
  }

  async getMonthlyStats(): Promise<MonthlyStats[]> {
    const response = await apiClient.get<MonthlyStats[]>(`${this.endpoint}/stats/monthly`);
    return response.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>(`${this.endpoint}/health`);
    return response.data;
  }

  async getReports(params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
  }): Promise<any> {
    const response = await apiClient.get<any>(
      `${this.endpoint}/reports`,
      params as Record<string, string>
    );
    return response.data;
  }
}

export const adminService = new AdminService();