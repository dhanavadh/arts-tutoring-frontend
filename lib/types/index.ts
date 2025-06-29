// Base types
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}
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
  schoolGrade?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  parentPhone?: string;
  learningGoals?: string;
  preferredSubjects?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: number;
  userId: number;
  user: User;
  subject: string;
  hourlyRate: number;
  bio?: string;
  yearsExperience: number;
  isVerified: boolean;
  availabilitySchedule?: any;
  // Legacy fields for backwards compatibility
  subjects?: string[];
  qualifications?: string;
  experience?: string;
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
  requiresVerification?: boolean;
}

// Article types
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: ArticleStatus;
  category?: string;
  tags?: string[];
  viewCount: number;
  publishedAt?: string;
  teacherId: number;
  teacher: Teacher;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status?: ArticleStatus;
  category?: string;
  tags?: string[];
}

export interface UpdateArticleDto {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  status?: ArticleStatus;
  category?: string;
  tags?: string[];
}

export interface PublishArticleDto {
  status: ArticleStatus;
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
  questionType: QuestionType; // Backend uses questionType
  options?: string[];
  correctAnswer?: string;
  correctAnswerExplanation?: string;
  marks: number; // Backend uses marks
  orderIndex: number; // Backend uses orderIndex
  // Legacy fields for backwards compatibility
  type?: QuestionType;
  points?: number;
  order?: number;
}

export interface Quiz {
  id: number;
  title: string;
  description?: string;
  timeLimit?: number;
  maxAttempts?: number;
  totalMarks: number; // Backend uses totalMarks
  isPublished: boolean;
  status: 'draft' | 'published' | 'archived';
  isActive: boolean;
  teacherId: number;
  teacher: Teacher;
  questions: QuizQuestion[];
  assignments?: QuizAssignment[];
  createdAt: string;
  updatedAt: string;
  // Legacy field for backwards compatibility
  totalPoints?: number;
}

export interface QuizAssignment {
  id: number;
  quizId: number;
  studentId: number;
  assignedAt: string;
  assignedBy?: number; // Teacher ID who assigned the quiz
  assignedByTeacher?: Teacher; // Teacher who assigned the quiz
  dueDate?: string;
  completed: boolean;
  quiz: Quiz;
  student: Student;
  attempts?: number; // Number of attempts made
  completedAt?: string;
  status?: 'assigned' | 'in_progress' | 'completed' | 'overdue';
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
  // Flat fields from API response
  studentName?: string;
  studentEmail?: string;
  studentId?: number;
  assignedAt?: string;
  dueDate?: string;
  status?: string;
  // Answers keyed by question id
  answers?: {
    [questionId: string]: {
      studentAnswer: string;
      correctAnswer: string;
      marks: number;
    }
  };
}

export interface CreateQuizQuestionDto {
  question: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
  correctAnswerExplanation?: string;
  marks: number;
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  timeLimit?: number;
  maxAttempts?: number;
  status?: 'draft' | 'published' | 'archived';
  questions: CreateQuizQuestionDto[];
}

export interface AssignQuizDto {
  quizId?: number;  // Optional because we'll add it in the service
  studentIds: number[];
  dueDate?: string;
}

export interface SubmitQuizDto {
  answers: { [questionId: number]: string };
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

// Course types
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped' | 'in_progress';

// Course enums for easier usage in forms
export enum CourseLevelEnum {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum CourseStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EnrollmentStatusEnum {
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  IN_PROGRESS = 'in_progress',
}

export interface Course {
  id: number;
  title: string;
  description: string;
  content?: string;
  featuredImage?: string;
  status: CourseStatus;
  level: CourseLevel;
  category: string;
  tags?: string[];
  estimatedDuration?: number;
  price: number;
  maxEnrollments?: number;
  enrollmentCount: number;
  viewCount: number;
  isFeatured: boolean;
  publishedAt?: string;
  teacherId: number;
  teacher: Teacher;
  enrollments?: CourseEnrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollment {
  id: number;
  courseId: number;
  studentId: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  progressPercentage: number;
  notes?: string;
  course: Course;
  student: Student;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  content?: string;
  featuredImage?: string;
  status?: CourseStatus;
  level: CourseLevel;
  category: string;
  tags?: string[];
  estimatedDuration?: number;
  price?: number;
  maxEnrollments?: number;
  isFeatured?: boolean;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  content?: string;
  featuredImage?: string;
  status?: CourseStatus;
  level?: CourseLevel;
  category?: string;
  tags?: string[];
  estimatedDuration?: number;
  price?: number;
  maxEnrollments?: number;
  isFeatured?: boolean;
}

export interface PublishCourseDto {
  status: CourseStatus;
}

export interface EnrollCourseDto {
  courseId: number;
  notes?: string;
}