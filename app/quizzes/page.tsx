'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuizAssignment, UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/protected-route';

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface QuizzesResponse {
  data?: Quiz[];
  quizzes?: Quiz[];
}

// Student Dashboard Component
function StudentQuizDashboard() {
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchAssignedQuizzes = async () => {
      try {
        setLoading(true);
        const data = await quizzesService.getAssignedQuizzes();
        const validAssignments = (Array.isArray(data) ? data : []).filter(
          (assignment) => assignment.quiz && assignment.quiz.isActive
        );
        console.log('Fetched assignments:', data);
        console.log('Filtered valid assignments:', validAssignments);
        setAssignments(validAssignments);
      } catch (err) {
        setError('Failed to load assigned quizzes');
        console.error('Error fetching assigned quizzes:', err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedQuizzes();
  }, []);

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getTimeRemaining = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Overdue';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    return 'Due soon';
  };

  const getPriorityLevel = (assignment: QuizAssignment) => {
    // Check assignment status first
    if (assignment.status === 'completed') return 'completed';
    if (assignment.status === 'overdue') return 'overdue';
    if (assignment.status === 'in_progress') return 'high';
    
    // Check due date if no explicit status
    if (!assignment.dueDate) return 'low';
    const timeRemaining = getTimeRemaining(assignment.dueDate);
    if (timeRemaining === 'Overdue' ) return 'overdue';
    if (timeRemaining === 'Due soon' || timeRemaining?.includes('hour')) return 'high';
    if (timeRemaining?.includes('1 day')) return 'medium';
    return 'low';
  };

  const sortedAssignments = assignments.sort((a, b) => {
    // Sort by priority: overdue > high > medium > low > completed
    const priorityOrder = { overdue: 0, high: 1, medium: 2, low: 3, completed: 4 };
    const aPriority = getPriorityLevel(a);
    const bPriority = getPriorityLevel(b);
    
    if (aPriority !== bPriority) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }
    
    // If same priority, sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Quizzes</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Quizzes</h1>
            <p className="text-gray-600">Welcome back, {user?.firstName}! Here are your assigned quizzes.</p>
          </div>
          <Link href="/quizzes/my-results">
            <Button variant="outline" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View My Results
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
              <div className="text-sm text-blue-600">Total Assigned</div>
            </div>
          </Card>
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {assignments.filter(a => isOverdue(a.dueDate)).length}
              </div>
              <div className="text-sm text-red-600">Overdue</div>
            </div>
          </Card>
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {assignments.filter(a => getPriorityLevel(a) === 'high').length}
              </div>
              <div className="text-sm text-yellow-600">Due Soon</div>
            </div>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter(a => a.status === 'completed' || a.completedAt).length}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
          </Card>
        </div>
      )}

      {/* Quizzes List */}
      <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
        Debug: Rendering {assignments.length} assignments. If you see this, assignments are being processed.
      </div>
      {assignments.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quizzes Assigned</h3>
            <p className="text-gray-600 mb-4">You don't have any quizzes assigned yet. Check back later or contact your teacher.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => {
            const priority = getPriorityLevel(assignment);
            const timeRemaining = getTimeRemaining(assignment.dueDate);
            // Check for submitted=true in URL
            const isSubmittedView = typeof window !== 'undefined' && window.location.search.includes('submitted=true');
            // Calculate attempts left
            const maxAttempts = assignment.quiz?.maxAttempts;
            const attemptsMade = assignment.attempts || 0;
            const unlimitedAttempts = !maxAttempts || maxAttempts === 0 || maxAttempts === null;
            const attemptsLeft = unlimitedAttempts ? null : Math.max(0, maxAttempts - attemptsMade);
            return (
              <Card key={assignment.id} className={`p-6 transition-all hover:shadow-lg ${
                priority === 'overdue' ? 'border-red-200 bg-red-50' :
                priority === 'high' ? 'border-yellow-200 bg-yellow-50' :
                priority === 'medium' ? 'border-blue-200 bg-blue-50' :
                priority === 'completed' ? 'border-green-200 bg-green-50' :
                'border-gray-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {assignment.quiz.title}
                      </h3>
                      {priority === 'overdue' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Overdue
                        </span>
                      )}
                      {priority === 'high' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Due Soon
                        </span>
                      )}
                      {(assignment.status === 'completed' || assignment.completedAt) && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      )}
                      {assignment.status === 'in_progress' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                    {assignment.quiz.description && (
                      <p className="text-gray-600 mb-3">{assignment.quiz.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Questions:</span> {assignment.quiz?.questions?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Points:</span> {assignment.quiz?.totalPoints || 0}
                      </div>
                      {assignment.quiz?.timeLimit && (
                        <div>
                          <span className="font-medium">Time Limit:</span> {assignment.quiz.timeLimit} min
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-gray-500">
                        Assigned: {formatDate(assignment.assignedAt)}
                      </span>
                      {assignment.dueDate && (
                        <span className={`font-medium ${
                          isOverdue(assignment.dueDate) ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          Due: {formatDate(assignment.dueDate)}
                          {timeRemaining && ` (${timeRemaining})`}
                        </span>
                      )}
                      {assignment.quiz?.teacher?.user && (
                        <span className="text-gray-500">
                          Teacher: {assignment.quiz.teacher.user.firstName} {assignment.quiz.teacher.user.lastName}
                        </span>
                      )}
                      {assignment.assignedByTeacher?.user && (
                        <span className="text-gray-500">
                          Assigned by: {assignment.assignedByTeacher.user.firstName} {assignment.assignedByTeacher.user.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col gap-2">
                    {/* Button logic for submitted view */}
                    {isSubmittedView && assignment.completedAt && (
                      <>
                        <div className="flex flex-col items-center mb-2">
                          <span className="inline-block px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full mb-2">
                            Completed
                          </span>
                          {unlimitedAttempts ? (
                            <Link href={`/quizzes/take/${assignment.id}`}>
                              <Button size="sm" variant="outline" className="w-full">
                                Do Quiz Again
                              </Button>
                            </Link>
                          ) : attemptsLeft && attemptsLeft > 0 ? (
                            <Link href={`/quizzes/take/${assignment.id}`}>
                              <Button size="sm" variant="outline" className="w-full">
                                Do Quiz Again ({attemptsLeft} left)
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full" disabled>
                              No Attempts Left
                            </Button>
                          )}
                        </div>
                        <div className="text-center text-xs text-gray-500">
                          Completed on {formatDate(assignment.completedAt)}
                        </div>
                      </>
                    )}
                    {/* Main action button logic for quiz assignment */}
                    {assignment.completedAt || assignment.status === 'completed' ? (
                      unlimitedAttempts ? (
                        <Link href={`/quizzes/take/${assignment.id}`}>
                          <Button size="lg" className="w-full min-w-[120px] bg-green-600 hover:bg-green-700">
                            Do Quiz Again
                          </Button>
                        </Link>
                      ) : attemptsLeft && attemptsLeft > 0 ? (
                        <Link href={`/quizzes/take/${assignment.id}`}>
                          <Button size="lg" className="w-full min-w-[120px] bg-green-600 hover:bg-green-700">
                            Do Quiz Again ({attemptsLeft} left)
                          </Button>
                        </Link>
                      ) : (
                        <Button size="lg" className="w-full min-w-[120px] bg-gray-400 cursor-not-allowed" disabled>
                          No Attempts Left
                        </Button>
                      )
                    ) : (
                      <Link href={`/quizzes/take/${assignment.id}`}>
                        <Button
                          size="lg"
                          className={`w-full min-w-[120px] ${
                            priority === 'overdue' ? 'bg-red-600 hover:bg-red-700' :
                            priority === 'high' ? 'bg-yellow-600 hover:bg-yellow-700' :
                            'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          Take Quiz
                        </Button>
                      </Link>
                    )}
                    {/* View Result button for completed quizzes */}
                    {(assignment.completedAt || assignment.status === 'completed') && (
                      <Link href={`/quizzes/result/${assignment.id}`}>
                        <Button size="sm" variant="outline" className="w-full mt-2">
                          View Result
                        </Button>
                      </Link>
                    )}
                    {/* Completed badge and date */}
                    {assignment.completedAt && (
                      <div className="text-center text-xs text-green-700 font-bold mt-2">
                        Completed on {assignment.completedAt ? formatDate(assignment.completedAt) : ''}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
// Teacher/Admin Dashboard Component
function TeacherQuizDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleDeleteQuiz = async (e: React.MouseEvent, quiz: Quiz) => {
    e.stopPropagation();
    console.log('Opening delete modal for quiz:', quiz.title); // Debug log
    setQuizToDelete(quiz);
    setDeleteModalOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    try {
      await quizzesService.deleteQuiz(quizToDelete.id);
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizToDelete.id));
      addToast({
        type: 'success',
        message: `Quiz "${quizToDelete.title}" has been deleted successfully.`
      });
    } catch (err) {
      console.error('Error deleting quiz:', err);
      addToast({
        type: 'error',
        message: 'Failed to delete quiz. Please try again.'
      });
    } finally {
      setDeleteModalOpen(false);
      setQuizToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setQuizToDelete(null);
  };

  const handleQuizClick = (quiz: Quiz) => {
    router.push(`/quizzes/${quiz.id}`);
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (authLoading || !isAuthenticated || !user) {
        return;
      }

      try {
        console.log('Fetching quizzes for user role:', user.role);
        setLoading(true);
        
        const response = await quizzesService.getQuizzes(user.role);
        console.log('Quiz list response received:', { responseType: typeof response, isArray: Array.isArray(response) });
        
        // The updated service should now always return an array
        if (Array.isArray(response)) {
          console.log(`Received ${response.length} quizzes`);
          setQuizzes(response);
        } else {
          console.error('Unexpected response format from getQuizzes:', response);
          setError('Received invalid data format from server. Please try refreshing the page.');
          setQuizzes([]);
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        
        // More detailed error handling
        if (err instanceof Error) {
          if (err.message.includes('Network Error')) {
            setError('Network error. Please check your connection and try again.');
          } else if (err.message.includes('401') || err.message.includes('403')) {
            setError('Authentication error. Please try logging in again.');
          } else {
            setError(`Failed to load quizzes: ${err.message}`);
          }
        } else {
          setError('An unexpected error occurred. Please refresh the page and try again.');
        }
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [user, authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading user authentication...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-8">
        <p className="text-amber-600 font-medium">Authentication required. Please log in to view quizzes.</p>
        <Button 
          className="mt-4 bg-blue-600 hover:bg-blue-700" 
          onClick={() => router.push('/login')}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Quizzes</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setLoading(true);
              setError(null);
              window.location.reload();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        {(user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN) && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push('/quizzes/create')}
          >
            Create Quiz
          </Button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No quizzes available.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id}
              className="cursor-pointer"
              onClick={() => handleQuizClick(quiz)}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-bold mb-2">{quiz.title}</h2>
                <p className="text-gray-600 mb-4">{quiz.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Created: {formatDate(quiz.createdAt)}</p>
                  <p>Questions: {quiz.questions?.length || 0}</p>
                  <p>Total Points: {quiz.totalPoints || 0}</p>
                </div>
                <div className="flex justify-end gap-2">
                  {(user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN) && (
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:bg-red-50"
                      onClick={(e) => handleDeleteQuiz(e, quiz)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        title="Confirm Delete"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the quiz <strong>"{quizToDelete?.title}"</strong>? 
            This action cannot be undone and will permanently remove all associated data.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={cancelDelete}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteQuiz}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function QuizzesContent() {
  const { user } = useAuth();

  // Show student dashboard for students, teacher dashboard for teachers/admins
  if (user?.role === UserRole.STUDENT) {
    return <StudentQuizDashboard />;
  } else {
    return <TeacherQuizDashboard />;
  }
}

export default function QuizzesPage() {
  return (
    <ProtectedRoute>
      <QuizzesContent />
    </ProtectedRoute>
  );
}