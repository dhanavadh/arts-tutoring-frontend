'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { QuizAssignment, UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function AssignedQuizzesPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedQuizzes = async () => {
      try {
        setLoading(true);
        const data = await quizzesService.getAssignedQuizzes();
        // Filter out assignments where quiz is inactive or missing
        const validAssignments = (Array.isArray(data) ? data : []).filter(
          (assignment) => assignment.quiz && assignment.quiz.isActive
        );
        setAssignments(validAssignments);
      } catch (err) {
        setError('Failed to load assigned quizzes');
        console.error('Error fetching assigned quizzes:', err);
        setAssignments([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'student') {
      fetchAssignedQuizzes();
    }
  }, [user]);

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="p-6">Loading assigned quizzes...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Assigned Quizzes</h1>
          <p className="text-gray-600">Complete your assigned quizzes</p>
        </div>

        {assignments.length === 0 ? (
          <Card className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No quizzes assigned</h3>
            <p className="text-gray-600">You don't have any quizzes assigned yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{assignment.quiz.title}</h3>
                    {assignment.quiz.description && (
                      <p className="text-gray-600 mb-2">{assignment.quiz.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      <span>{assignment.quiz?.questions?.length || 0} questions</span>
                      <span>{assignment.quiz?.totalPoints || 0} points</span>
                      {assignment.quiz?.timeLimit && (
                        <span>{assignment.quiz.timeLimit} minutes</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm mb-3">
                      <span className="text-gray-500">
                        Assigned: {formatDate(assignment.assignedAt)}
                      </span>
                      {assignment.dueDate && (
                        <span
                          className={`${
                            isOverdue(assignment.dueDate)
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          Due: {formatDate(assignment.dueDate)}
                          {isOverdue(assignment.dueDate) && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Teacher: {assignment.quiz?.teacher?.user?.firstName}{' '}
                        {assignment.quiz?.teacher?.user?.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href={`/quizzes/take/${assignment.id}`}>
                      <Button
                        className={`w-full ${
                          isOverdue(assignment.dueDate) ? 'bg-red-600 hover:bg-red-700' : ''
                        }`}
                      >
                        {isOverdue(assignment.dueDate) ? 'Take Quiz (Overdue)' : 'Take Quiz'}
                      </Button>
                    </Link>
                    <div
                      className={`px-2 py-1 rounded text-xs text-center ${
                        isOverdue(assignment.dueDate)
                          ? 'bg-red-100 text-red-800'
                          : assignment.dueDate
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isOverdue(assignment.dueDate)
                        ? 'Overdue'
                        : assignment.dueDate
                        ? 'Pending'
                        : 'No Due Date'}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}