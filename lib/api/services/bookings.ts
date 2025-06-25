import { apiClient } from '../client';
import { API_CONFIG } from '../config';
import {
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
  PaginatedResponse,
  PaginationDto,
  BookingStatus,
} from '../../types';

export class BookingsService {
  private endpoint = API_CONFIG.ENDPOINTS.BOOKINGS;

  async createBooking(bookingData: CreateBookingDto): Promise<Booking> {
    const response = await apiClient.post<Booking>(this.endpoint, bookingData);
    return response.data;
  }

  async getAllBookings(params?: PaginationDto): Promise<PaginatedResponse<Booking>> {
    const response = await apiClient.get<PaginatedResponse<Booking>>(
      this.endpoint,
      params as Record<string, string>
    );
    return response.data;
  }

  async getMyBookings(params?: PaginationDto): Promise<PaginatedResponse<Booking>> {
    const response = await apiClient.get<PaginatedResponse<Booking>>(
      `${this.endpoint}/my-bookings`,
      params as Record<string, string>
    );
    return response.data;
  }

  async getMySchedule(params?: PaginationDto): Promise<PaginatedResponse<Booking>> {
    const response = await apiClient.get<PaginatedResponse<Booking>>(
      `${this.endpoint}/my-schedule`,
      params as Record<string, string>
    );
    return response.data;
  }

  async getUpcomingBookings(): Promise<Booking[]> {
    const response = await apiClient.get<Booking[]>(`${this.endpoint}/upcoming`);
    return response.data;
  }

  async getTeacherSchedule(
    teacherId: number,
    date?: string
  ): Promise<Booking[]> {
    const params = date ? { date } : undefined;
    const response = await apiClient.get<Booking[]>(
      `${this.endpoint}/teacher/${teacherId}/schedule`,
      params
    );
    return response.data;
  }

  async updateBookingStatus(
    id: number,
    status: BookingStatus
  ): Promise<Booking> {
    const response = await apiClient.patch<Booking>(
      `${this.endpoint}/${id}/status`,
      { status }
    );
    return response.data;
  }

  async updateBooking(
    id: number,
    bookingData: UpdateBookingDto
  ): Promise<Booking> {
    const response = await apiClient.patch<Booking>(
      `${this.endpoint}/${id}`,
      bookingData
    );
    return response.data;
  }

  async deleteBooking(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }
}

export const bookingsService = new BookingsService();