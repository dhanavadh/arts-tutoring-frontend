// Base types
export type UserRole = 'student' | 'teacher' | 'admin';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';

// User related types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  teacher?: any;
  student?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  userId: number;
  user: User;
  grade?: string;
  school?: string;
  parentContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: number;
  userId: number;
  user: User;
  subjects: string[];
  qualifications?: string;
  experience?: string;
  hourlyRate?: number;
  availability?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string; // 'student', 'teacher', 'admin' (lowercase)
  // Teacher specific
  subject?: string;
  experienceYears?: number;
  hourlyRate?: number;
  bio?: string;
  qualifications?: string;
  // Student specific
  gradeLevel?: string;
  school?: string;
  parentEmail?: string;
  parentPhone?: string;
  learningGoals?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

// Article types
export interface Article {
  id: number;
  title: string;
  content: string;
  summary?: string;
  image?: string;
  isPublished: boolean;
  publishedAt?: string;
  authorId: number;
  author: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  title: string;
  content: string;
  summary?: string;
  isPublished?: boolean;
}

export interface UpdateArticleDto {
  title?: string;
  content?: string;
  summary?: string;
  isPublished?: boolean;
}

export interface PublishArticleDto {
  isPublished: boolean;
}

// Booking types
export interface Booking {
  id: number;
  studentId: number;
  teacherId: number;
  startTime: string;
  endTime: string;
  subject?: string;
  notes?: string;
  status: BookingStatus;
  student: Student;
  teacher: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  teacherId: number;
  startTime: string;
  endTime: string;
  subject?: string;
  notes?: string;
}

export interface UpdateBookingDto {
  startTime?: string;
  endTime?: string;
  subject?: string;
  notes?: string;
  status?: BookingStatus;
}

// Quiz types
export interface QuizQuestion {
  id: number;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  points: number;
  order: number;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  timeLimit?: number;
  totalPoints: number;
  isPublished: boolean;
  teacherId: number;
  teacher: Teacher;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAssignment {
  id: number;
  quizId: number;
  studentId: number;
  assignedAt: string;
  dueDate?: string;
  quiz: Quiz;
  student: Student;
}

export interface QuizAttempt {
  id: number;
  quizAssignmentId: number;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore: number;
  graded: boolean;
  quizAssignment: QuizAssignment;
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  timeLimit?: number;
  questions: {
    question: string;
    type: QuestionType;
    options?: string[];
    correctAnswer?: string;
    points: number;
    order: number;
  }[];
}

export interface AssignQuizDto {
  studentIds: number[];
  dueDate?: string;
}

export interface SubmitQuizDto {
  answers: {
    questionId: number;
    answer: string;
  }[];
}

// Upload types
export interface FileUpload {
  id: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: number;
  createdAt: string;
}

export interface CreateUploadDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface UpdateUploadDto {
  filename?: string;
  originalName?: string;
}

export interface FileUploadDto {
  file: File;
  description?: string;
}

// User management DTOs
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  profileImage?: string;
}

export interface CreateStudentDto {
  email: string;
  password: string;
  name: string;
  grade?: string;
  school?: string;
  parentContact?: string;
}

export interface UpdateStudentDto {
  grade?: string;
  school?: string;
  parentContact?: string;
}

export interface CreateTeacherDto {
  email: string;
  password: string;
  name: string;
  subjects: string[];
  qualifications?: string;
  experience?: string;
  hourlyRate?: number;
  availability?: string;
}

export interface UpdateTeacherDto {
  subjects?: string[];
  qualifications?: string;
  experience?: string;
  hourlyRate?: number;
  availability?: string;
}

// Admin dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalBookings: number;
  totalArticles: number;
  totalQuizzes: number;
  activeBookings: number;
  publishedArticles: number;
}

export interface MonthlyStats {
  month: string;
  newUsers: number;
  newBookings: number;
  completedBookings: number;
  newArticles: number;
  quizAttempts: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  database: 'connected' | 'disconnected';
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Pagination
export interface PaginationDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}