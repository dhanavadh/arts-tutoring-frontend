'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        let fetchedQuizzes = [];
        
        if (user?.role === 'admin') {
          const response = await quizzesService.getAllQuizzes();
          console.log('Admin quizzes response:', response);
          fetchedQuizzes = response.data || [];
        } else if (user?.role === 'teacher') {
          const data = await quizzesService.getMyQuizzes();
          console.log('Teacher quizzes response:', data);
          fetchedQuizzes = Array.isArray(data) ? data : [];
        }
        
        console.log('Setting quizzes to:', fetchedQuizzes);
        setQuizzes(fetchedQuizzes);
      } catch (err) {
        setError('Failed to load quizzes');
        console.error('Error fetching quizzes:', err);
        setQuizzes([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === 'teacher' || user.role === 'admin')) {
      fetchQuizzes();
    }
  }, [user]);

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await quizzesService.deleteQuiz(quizId);
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert('Failed to delete quiz');
    }
  };

  if (loading) return <div className="p-6">Loading quizzes...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Debug log
  console.log('Rendering with quizzes:', quizzes, 'isArray:', Array.isArray(quizzes));

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {user?.role === 'admin' ? 'All Quizzes' : 'My Quizzes'}
          </h1>
          <Link href="/quizzes/create">
            <Button>Create New Quiz</Button>
          </Link>
        </div>

        {!quizzes || quizzes.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No quizzes found.</p>
            <Link href="/quizzes/create">
              <Button className="mt-4">Create Your First Quiz</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {Array.isArray(quizzes) && quizzes.map((quiz) => (
              <Card key={quiz.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-gray-600 mb-2">{quiz.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 mb-3">
                      <span>{quiz.questions?.length || 0} questions</span>
                      <span>{quiz.totalPoints || 0} points</span>
                      {quiz.timeLimit && <span>{quiz.timeLimit} minutes</span>}
                      <span className={`px-2 py-1 rounded text-xs ${
                        quiz.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {user?.role === 'admin' && quiz.teacher && (
                      <p className="text-sm text-gray-500">
                        Created by: {quiz.teacher.user?.firstName} {quiz.teacher.user?.lastName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/quizzes/${quiz.id}/results`}>
                      <Button variant="outline" size="sm">Results</Button>
                    </Link>
                    <Link href={`/quizzes/${quiz.id}/assign`}>
                      <Button variant="outline" size="sm">Assign</Button>
                    </Link>
                    <Link href={`/quizzes/${quiz.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
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