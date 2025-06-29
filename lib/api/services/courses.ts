import { apiClient } from '../client';
import type {
  Course,
  CourseEnrollment,
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
  EnrollCourseDto,
} from '../../types';

export const coursesApi = {
  // Course CRUD operations
  async createCourse(data: CreateCourseDto): Promise<Course> {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  async getAllCourses(): Promise<Course[]> {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  async getPublishedCourses(): Promise<Course[]> {
    const response = await apiClient.get('/courses/published');
    return response.data;
  },

  async getMyCourses(): Promise<Course[]> {
    const response = await apiClient.get('/courses/my-courses');
    return response.data;
  },

  async getCourse(id: number): Promise<Course> {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  async updateCourse(id: number, data: UpdateCourseDto): Promise<Course> {
    const response = await apiClient.patch(`/courses/${id}`, data);
    return response.data;
  },

  async publishCourse(id: number, data: PublishCourseDto): Promise<Course> {
    const response = await apiClient.patch(`/courses/${id}/publish`, data);
    return response.data;
  },

  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },

  // Enrollment operations
  async enrollInCourse(data: EnrollCourseDto): Promise<CourseEnrollment> {
    const response = await apiClient.post('/courses/enroll', data);
    return response.data;
  },

  async getCourseEnrollments(courseId: number): Promise<CourseEnrollment[]> {
    const response = await apiClient.get(`/courses/${courseId}/enrollments`);
    return response.data;
  },

  async getMyEnrollments(): Promise<CourseEnrollment[]> {
    const response = await apiClient.get('/courses/my-enrollments');
    return response.data;
  },
};