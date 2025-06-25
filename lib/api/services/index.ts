// Import all services first
import { authService, AuthService } from './auth';
import { articlesService, ArticlesService } from './articles';
import { bookingsService, BookingsService } from './bookings'; 
import { quizzesService, QuizzesService } from './quizzes';
import { usersService, UsersService } from './users';
import { adminService, AdminService } from './admin';
import { studentsService, StudentsService } from './students';
import { teachersService, TeachersService } from './teachers';
import { uploadsService, UploadsService } from './uploads';

// Export all API services
export { authService, AuthService };
export { articlesService, ArticlesService };
export { bookingsService, BookingsService }; 
export { quizzesService, QuizzesService };
export { usersService, UsersService };
export { adminService, AdminService };
export { studentsService, StudentsService };
export { teachersService, TeachersService };
export { uploadsService, UploadsService };

// Create a combined API object for easy access
export const api = {
  auth: authService,
  articles: articlesService,
  bookings: bookingsService,
  quizzes: quizzesService,
  users: usersService,
  admin: adminService,
  students: studentsService,
  teachers: teachersService,
  uploads: uploadsService,
};