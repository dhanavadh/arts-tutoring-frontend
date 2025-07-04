'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuizQuestion, QuizAssignment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Check if current user can edit this quiz
  const canEditQuiz = (quiz: Quiz): boolean => {
    if (!user || !quiz) return false;
    
    if (user.role === 'teacher') {
      // Teachers can edit quizzes they created
      return quiz.createdBy === user.id;
    } else if (user.role === 'admin') {
      // Admins can only edit quizzes they created themselves
      return quiz.createdBy === user.id;
    }
    
    return false;
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log('Fetching quiz:', id);
        const quizData = await quizzesService.getQuiz(parseInt(id, 10));
        console.log('Quiz data:', quizData);
        setQuiz(quizData);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuiz();
    }
  }, [id]);

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
        <p className="text-red-500">{error || 'Quiz not found'}</p>
        <Button
          className="mt-4"
          onClick={() => router.push('/quizzes')}
        >
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
            
            {/* Creator Information */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">
                  Created by: <span className="font-medium">
                    {quiz.creator ? 
                      `${quiz.creator.firstName} ${quiz.creator.lastName}` :
                      quiz.teacher?.user ? 
                        `${quiz.teacher.user.firstName} ${quiz.teacher.user.lastName}` :
                        quiz.teacherId ? 'Teacher' : 'Unknown'
                    }
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 011 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a1 1 0 011-1h2a1 1 0 001-1z" />
                </svg>
                <span className="text-gray-500">
                  {formatDate(quiz.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Total Points: {quiz.totalPoints}</p>
              <p>Time Limit: {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}</p>
              <p>Maximum Attempts: {quiz.maxAttempts || 1}</p>
              <p>Status: {quiz.status}</p>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => router.push(`/quizzes/${quiz.id}/assign`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Assign to Students
              </Button>
              {canEditQuiz(quiz) && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/quizzes/${quiz.id}/edit`)}
                >
                  Edit Quiz
                </Button>
              )}
              {!quiz.isPublished && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      await quizzesService.publishQuiz(quiz.id);
                      router.refresh();
                    } catch (err) {
                      console.error('Error publishing quiz:', err);
                      setError('Failed to publish quiz');
                    }
                  }}
                >
                  Publish Quiz
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
                    <p className="text-sm text-gray-500 mb-2">Type: {question.type}</p>
                    <p className="text-sm text-gray-500">Points: {question.points}</p>
                    
                    {question.type === 'MULTIPLE_CHOICE' && question.options && (
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

      {(user?.role === 'teacher' || user?.role === 'admin') && (
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
    </div>
  );
}
