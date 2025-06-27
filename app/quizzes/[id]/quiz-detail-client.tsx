'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuizQuestion, QuizAssignment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { ProtectedRoute } from '@/lib/components/protected-route';

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function QuizDetailClient({ id }: { id: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [selectedStudentModal, setSelectedStudentModal] = useState<QuizAssignment | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [unpublishLoading, setUnpublishLoading] = useState(false);
  const [error, setError] = useState<string | { message: string; actionButton?: { text: string; action: () => void } } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        console.log('Fetching quiz:', id);
        const quizData = await quizzesService.getQuizById(parseInt(id, 10));
        console.log('Quiz data:', quizData);
        setQuiz(quizData);
        
        // Fetch assignments if user is teacher or admin
        if (user?.role === 'admin' || user?.role === 'teacher') {
          try {
            setAssignmentsLoading(true);
            console.log('Fetching assignments for quiz:', id);
            const assignmentsData = await quizzesService.getQuizAssignments(parseInt(id, 10));
            console.log('Assignments data received:', assignmentsData);
            console.log('Assignments data type:', typeof assignmentsData);
            console.log('Assignments array length:', Array.isArray(assignmentsData) ? assignmentsData.length : 'Not an array');
            setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
          } catch (assignmentErr) {
            console.error('Error fetching assignments:', assignmentErr);
            // Don't show error for missing assignments, just set empty array
            setAssignments([]);
          } finally {
            setAssignmentsLoading(false);
          }
        } else {
          setAssignmentsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuizData();
    }
  }, [id, user?.role]);

  // Additional effect to check for fresh redirects from quiz creation
  useEffect(() => {
    // Check if we were redirected from quiz creation (indicated by a hash or query param)
    const urlParams = new URLSearchParams(window.location.search);
    const fromCreation = urlParams.get('created') || window.location.hash.includes('created');
    
    if (fromCreation && user?.role) {
      console.log('Detected redirect from quiz creation, refreshing data in 1 second...');
      // Add a small delay to ensure backend has processed the assignment
      setTimeout(() => {
        refreshQuizData();
      }, 1000);
    }
  }, [user?.role]);

  // Function to refresh quiz data and assignments
  const refreshQuizData = async () => {
    try {
      console.log('Refreshing quiz data...');
      setAssignmentsLoading(true); // Set loading state while refreshing
      addToast({
        type: 'info',
        title: 'Refreshing',
        message: 'Getting the latest quiz data and assignments...',
        duration: 2000
      });
      
      const updatedQuiz = await quizzesService.getQuizById(parseInt(id, 10));
      console.log('Updated quiz data:', updatedQuiz);
      setQuiz(updatedQuiz);

      // Also refresh assignments if user is teacher or admin
      if (user?.role === 'admin' || user?.role === 'teacher') {
        try {
          console.log('Specifically requesting assignments with ID:', id);
          const assignmentsData = await quizzesService.getQuizAssignments(parseInt(id, 10));
          console.log('Updated assignments data received:', assignmentsData);
          console.log('Assignments data type:', typeof assignmentsData);
          console.log('Assignments array length:', Array.isArray(assignmentsData) ? assignmentsData.length : 'Not an array');
          
          if (Array.isArray(assignmentsData) && assignmentsData.length > 0) {
            console.log('First assignment details:', JSON.stringify(assignmentsData[0], null, 2));
            addToast({
              type: 'success',
              title: 'Assignments Loaded',
              message: `Found ${assignmentsData.length} assigned student(s)`,
              duration: 3000
            });
          } else {
            console.log('No assignments found or invalid data format');
          }
          
          setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        } catch (assignmentErr: any) {
          console.error('Error refreshing assignments:', assignmentErr);
          addToast({
            type: 'error',
            title: 'Error Loading Assignments',
            message: assignmentErr.message || 'Failed to load assignments',
            duration: 4000
          });
          setAssignments([]);
        }
      }
    } catch (err: any) {
      console.error('Error refreshing quiz data:', err);
      addToast({
        type: 'error',
        title: 'Refresh Failed',
        message: err.message || 'Could not refresh quiz data',
        duration: 4000
      });
    } finally {
      setAssignmentsLoading(false); // Always reset loading state
    }
  };

  // Function to handle publish attempt with validation
  const handlePublishAttempt = () => {
    // Don't allow publishing while assignments are still loading
    if (assignmentsLoading) {
      addToast({
        type: 'warning',
        title: 'Please Wait',
        message: 'Loading quiz assignments, please try again in a moment.',
        duration: 3000
      });
      return;
    }
    
    // Check if there are any assignments
    if (assignments.length === 0) {
      setShowPublishModal(true);
    } else {
      // Proceed with publishing directly
      handlePublishQuiz();
    }
  };

  // Function to actually publish the quiz
  const handlePublishQuiz = async () => {
    setPublishLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowPublishModal(false);
    
    try {
      console.log('Publishing quiz with current status:', quiz?.status);
      await quizzesService.publishQuiz(parseInt(id, 10));
      
      // Refresh the quiz data and assignments
      await refreshQuizData();
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Quiz Published!',
        message: `"${quiz?.title}" is now live and available to students.`,
        duration: 6000
      });
      
      setSuccessMessage('Quiz published successfully! Students can now take this quiz.');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (err: any) {
      console.error('Error publishing quiz:', err);
      
      // Handle specific error messages from backend
      if (err.message?.includes('assign') || err.message?.includes('student')) {
        setError({
          message: 'Cannot publish quiz. You must assign this quiz to at least one student before publishing.',
          actionButton: {
            text: 'Assign to Students Now',
            action: () => router.push(`/quizzes/${quiz?.id}/assign`)
          }
        });
        
        // Also show toast for immediate feedback
        addToast({
          type: 'warning',
          title: 'Assignment Required',
          message: 'Please assign the quiz to students before publishing.',
          duration: 5000
        });
        
      } else if (err.message?.includes('already published')) {
        // Refresh the quiz data if it's already published
        try {
          const updatedQuiz = await quizzesService.getQuizById(parseInt(id, 10));
          setQuiz(updatedQuiz);
          addToast({
            type: 'info',
            message: 'Quiz is already published!'
          });
          setSuccessMessage('Quiz is already published!');
        } catch (refreshErr) {
          console.error('Error refreshing quiz data:', refreshErr);
          setError('Quiz may already be published. Please refresh the page.');
        }
      } else {
        addToast({
          type: 'error',
          title: 'Publish Failed',
          message: err.message || 'Failed to publish quiz'
        });
        setError(err.message || 'Failed to publish quiz');
      }
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">
          {typeof error === 'string' ? error : (error as any)?.message || 'Quiz not found'}
        </div>
        {typeof error === 'object' && (error as any)?.actionButton && (
          <Button
            className="mt-4 mr-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(error as any).actionButton.action}
          >
            {(error as any).actionButton.text}
          </Button>
        )}
        <Button
          className="mt-4"
          onClick={() => router.push('/quizzes')}
          variant="outline"
        >
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            {typeof error === 'string' ? error : (error as any).message}
          </p>
          {typeof error === 'object' && (error as any).actionButton && (
            <Button
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(error as any).actionButton.action}
            >
              {(error as any).actionButton.text}
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/quizzes')}
        >
          Back to Quizzes
        </Button>
      </div>

      <Card className="mb-8 p-6">
        <div className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Quiz Details</h2>
            <p className="text-gray-600 mb-4">{quiz.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div className="space-y-2">
                <p><span className="font-medium">Created:</span> {formatDate(quiz.createdAt)}</p>
                <p><span className="font-medium">Last Updated:</span> {formatDate(quiz.updatedAt)}</p>
                <p><span className="font-medium">Total Points:</span> {quiz.totalMarks || quiz.totalPoints || 0}</p>
                <p><span className="font-medium">Questions:</span> {quiz.questions?.length || 0}</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium">Time Limit:</span> {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}</p>
                <p><span className="font-medium">Max Attempts:</span> {quiz.maxAttempts ? quiz.maxAttempts : 'Unlimited'}</p>
                <p><span className="font-medium">Teacher:</span> {quiz.teacher?.user ? `${quiz.teacher.user.firstName} ${quiz.teacher.user.lastName}` : 'Unknown'}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`
                    ml-2 px-3 py-1 text-sm font-semibold rounded-full
                    ${quiz.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : quiz.status === 'archived'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  `}>
                    {quiz.status === 'published' ? '🟢 Published' : 
                     quiz.status === 'archived' ? '⚫ Archived' : '🟡 Draft'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Students Section */}
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Assigned Students</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshQuizData}
                  disabled={assignmentsLoading}
                  className="text-xs"
                >
                  {assignmentsLoading ? 'Refreshing...' : '🔄 Refresh'}
                </Button>
              </div>
              {assignmentsLoading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span>Loading assignments...</span>
                </div>
              ) : assignments.length > 0 ? (
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      onClick={() => setSelectedStudentModal(assignment)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {assignment.student?.user?.firstName?.[0] || '?'}
                            {assignment.student?.user?.lastName?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {assignment.student?.user?.firstName || 'Unknown'} {assignment.student?.user?.lastName || 'Student'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {assignment.student?.user?.email || 'No email available'}
                          </p>
                          {assignment.student?.schoolGrade && (
                            <p className="text-xs text-gray-500">
                              Grade: {assignment.student.schoolGrade}
                            </p>
                          )}
                          {assignment.student?.level && (
                            <p className="text-xs text-gray-500">
                              Level: {assignment.student.level}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Assigned: {formatDate(assignment.assignedAt)}
                        </p>
                        {assignment.assignedByTeacher?.user && (
                          <p className="text-xs text-gray-500">
                            By: {assignment.assignedByTeacher.user.firstName} {assignment.assignedByTeacher.user.lastName}
                          </p>
                        )}
                        {assignment.dueDate && (
                          <p className="text-sm text-gray-500">
                            Due: {formatDate(assignment.dueDate)}
                          </p>
                        )}
                        <span className={`
                          inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1
                          ${assignment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : assignment.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : assignment.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        `}>
                          {assignment.status === 'completed' ? '✅ Completed' : 
                           assignment.status === 'in_progress' ? '🔄 In Progress' :
                           assignment.status === 'overdue' ? '⚠️ Overdue' :
                           '⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>{assignments.length}</strong> student{assignments.length !== 1 ? 's' : ''} assigned
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="font-medium">No students assigned</p>
                  <p className="text-sm">Assign students to this quiz to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Workflow Information */}
          {quiz.status === 'draft' && (user?.role === 'admin' || user?.role === 'teacher') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div>
                  <h3 className="text-blue-800 font-medium">Publishing Workflow</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    To publish this quiz: <strong>1)</strong> Assign it to students first, then <strong>2)</strong> Click "Publish Quiz". 
                    Students can only take published quizzes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => router.push(`/quizzes/${quiz.id}/edit`)}
              >
                Edit Quiz
              </Button>
              {(quiz.status === 'draft' || quiz.status === 'published') && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => router.push(`/quizzes/${quiz.id}/assign`)}
                >
                  Assign to Students
                </Button>
              )}
              {quiz.status === 'draft' && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  disabled={publishLoading || assignmentsLoading}
                  onClick={handlePublishAttempt}
                >
                  {publishLoading ? 'Publishing...' : assignmentsLoading ? 'Loading...' : 'Publish Quiz'}
                </Button>
              )}
              {quiz.status === 'published' && (
                <Button
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                  disabled={unpublishLoading}
                  onClick={async () => {
                    setUnpublishLoading(true);
                    setError(null);
                    setSuccessMessage(null);
                    
                    try {
                      console.log('Unpublishing quiz with current status:', quiz.status);
                      await quizzesService.unpublishQuiz(quiz.id);
                      
                      // Refresh the quiz data and assignments
                      await refreshQuizData();
                      
                      // Show success toast
                      addToast({
                        type: 'info',
                        title: 'Quiz Unpublished',
                        message: `"${quiz.title}" is now in draft mode and no longer available to students.`,
                        duration: 5000
                      });
                      
                      setSuccessMessage('Quiz unpublished successfully! Students can no longer take this quiz.');
                      
                      // Clear success message after 5 seconds
                      setTimeout(() => setSuccessMessage(null), 5000);
                      
                    } catch (err: any) {
                      console.error('Error unpublishing quiz:', err);
                      if (err.message?.includes('already') || err.message?.includes('draft')) {
                        // Refresh the quiz data if state changed
                        try {
                          await refreshQuizData();
                          addToast({
                            type: 'info',
                            message: 'Quiz is already unpublished!'
                          });
                          setSuccessMessage('Quiz is already unpublished!');
                        } catch (refreshErr) {
                          console.error('Error refreshing quiz data:', refreshErr);
                          setError('Quiz may already be unpublished. Please refresh the page.');
                        }
                      } else {
                        addToast({
                          type: 'error',
                          title: 'Unpublish Failed',
                          message: err.message || 'Failed to unpublish quiz'
                        });
                        setError(err.message || 'Failed to unpublish quiz');
                      }
                    } finally {
                      setUnpublishLoading(false);
                    }
                  }}
                >
                  {unpublishLoading ? 'Unpublishing...' : 'Unpublish Quiz'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Questions</h2>
        {quiz.questions && quiz.questions.length > 0 ? (
          <div className="space-y-4">
            {quiz.questions.map((question: QuizQuestion, index: number) => (
              <Card key={question.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Question {index + 1}: {question.question}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">Type: {question.questionType || question.type}</p>
                    <p className="text-sm text-gray-500">Points: {question.marks || question.points}</p>
                    
                    {(question.questionType || question.type) === 'MULTIPLE_CHOICE' && question.options && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Options:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex} className="text-gray-600">{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {user?.role === 'admin' && (
                      <div className="mt-4">
                        <p className="font-medium">Correct Answer: </p>
                        <p className="text-green-600">{question.correctAnswer}</p>
                        {question.correctAnswerExplanation && (
                          <div className="mt-2">
                            <p className="font-medium">Explanation:</p>
                            <p className="text-gray-600">{question.correctAnswerExplanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No questions available.</p>
        )}
      </div>

      {user?.role === 'teacher' && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Assignments</h2>
          {quiz.assignments && quiz.assignments.length > 0 ? (
            <div className="space-y-4">
              {quiz.assignments.map((assignment: QuizAssignment) => (
                <Card key={assignment.id} className="p-4">
                  <p>Student: {assignment.student.user.firstName} {assignment.student.user.lastName}</p>
                  <p>Assigned: {formatDate(assignment.assignedAt)}</p>
                  <p>Status: {assignment.completed ? 'Completed' : 'Pending'}</p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No assignments yet.</p>
          )}
        </div>
      )}

      {/* Student Details Modal */}
      <Modal
        isOpen={!!selectedStudentModal}
        onClose={() => setSelectedStudentModal(null)}
        title="Student Assignment Details"
        size="md"
      >
        {selectedStudentModal && (
          <div className="p-6">
            <div className="space-y-4">
              {/* Student Info */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {selectedStudentModal.student.user.firstName[0]}{selectedStudentModal.student.user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedStudentModal.student.user.firstName} {selectedStudentModal.student.user.lastName}
                    </h3>
                    <p className="text-gray-600">{selectedStudentModal.student.user.email}</p>
                  </div>
                </div>
                {selectedStudentModal.student.schoolGrade && (
                  <p className="text-sm text-gray-600">Grade: {selectedStudentModal.student.schoolGrade}</p>
                )}
                {selectedStudentModal.student.level && (
                  <p className="text-sm text-gray-600">Level: {selectedStudentModal.student.level}</p>
                )}
                {selectedStudentModal.assignedByTeacher?.user && (
                  <p className="text-sm text-gray-600">
                    Assigned by: {selectedStudentModal.assignedByTeacher.user.firstName} {selectedStudentModal.assignedByTeacher.user.lastName}
                  </p>
                )}
              </div>

              {/* Assignment Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Assignment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Assigned:</span>
                    <p className="font-medium">{formatDate(selectedStudentModal.assignedAt)}</p>
                  </div>
                  {selectedStudentModal.dueDate && (
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <p className="font-medium">{formatDate(selectedStudentModal.dueDate)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className={`font-medium ${
                      selectedStudentModal.completed ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {selectedStudentModal.completed ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                  {selectedStudentModal.attempts !== undefined && (
                    <div>
                      <span className="text-gray-600">Attempts:</span>
                      <p className="font-medium">{selectedStudentModal.attempts || 0}</p>
                    </div>
                  )}
                </div>
                {selectedStudentModal.completedAt && (
                  <div className="mt-2">
                    <span className="text-gray-600 text-sm">Completed on:</span>
                    <p className="font-medium text-sm">{formatDate(selectedStudentModal.completedAt)}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedStudentModal(null)}
                >
                  Close
                </Button>
                {!selectedStudentModal.completed && (
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={async () => {
                      try {
                        await quizzesService.removeQuizAssignment(quiz!.id, selectedStudentModal.student.id);
                        // Refresh assignments
                        const updatedAssignments = await quizzesService.getQuizAssignments(quiz!.id);
                        setAssignments(updatedAssignments || []);
                        setSelectedStudentModal(null);
                        addToast({
                          type: 'success',
                          message: `Unassigned ${selectedStudentModal.student.user.firstName} ${selectedStudentModal.student.user.lastName} from quiz`
                        });
                      } catch (err) {
                        addToast({
                          type: 'error',
                          message: 'Failed to unassign student'
                        });
                      }
                    }}
                  >
                    Unassign Student
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Publish Validation Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Cannot Publish Quiz"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Quiz needs students assigned
              </h3>
              <p className="text-gray-700 mb-4">
                Before you can publish "{quiz?.title}", you need to assign it to at least one student. 
                Published quizzes without student assignments cannot be accessed by anyone.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>What happens next:</strong> You'll be taken to the assignment page where you can select students 
                  and set a due date. After assigning students, you can return here to publish the quiz.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPublishModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowPublishModal(false);
                router.push(`/quizzes/${quiz?.id}/assign`);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Assign to Students
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
