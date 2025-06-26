'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function QuizzesPage() {
  const router = useRouter();
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

    if (user) {
      if (user.role === 'teacher' || user.role === 'admin') {
        fetchQuizzes();
      } else if (user.role === 'student') {
        // Redirect students to their assigned quizzes
        router.push('/quizzes/assigned');
      }
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

  const handlePublishQuiz = async (quizId: number) => {
    try {
      const updatedQuiz = await quizzesService.publishQuiz(quizId);
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === quizId ? { ...quiz, status: 'published' } : quiz
      ));
      alert('Quiz published successfully!');
    } catch (err: any) {
      console.error('Error publishing quiz:', err);
      if (err?.response?.data?.message?.includes('assign the quiz to at least one student')) {
        alert('Cannot publish quiz. Please assign the quiz to at least one student before publishing. Click Edit to assign students.');
      } else if (err?.response?.status === 400) {
        alert(err.response.data.message || 'Cannot publish quiz. Please check if students are assigned.');
      } else {
        alert('Failed to publish quiz. Please try again.');
      }
    }
  };

  const handleUnpublishQuiz = async (quizId: number) => {
    if (!confirm('Are you sure you want to unpublish this quiz? Students will no longer be able to see it.')) return;
    
    try {
      const updatedQuiz = await quizzesService.unpublishQuiz(quizId);
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === quizId ? { ...quiz, status: 'draft' } : quiz
      ));
      alert('Quiz unpublished successfully!');
    } catch (err) {
      console.error('Error unpublishing quiz:', err);
      alert('Failed to unpublish quiz. The backend may need to be restarted to support the new status field.');
    }
  };

  if (loading) return <div className="p-6">Loading quizzes...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Debug log
  console.log('Rendering with quizzes:', quizzes, 'isArray:', Array.isArray(quizzes));

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {user?.role === 'admin' ? 'Quiz Management Center' : 'My Quiz Dashboard'}
            </h1>
            <p className="text-gray-600 mb-4">
              Manage your quizzes with one-click actions. Edit questions, assign to students, and publish quizzes directly from this page.
            </p>
          </div>
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
          <div className="grid gap-6">
            {Array.isArray(quizzes) && quizzes.map((quiz) => (
              <Card key={quiz.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/quizzes/${quiz.id}/edit`} className="cursor-pointer">
                        <h3 className="text-2xl font-bold text-blue-600 hover:text-blue-800">{quiz.title}</h3>
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        quiz.status === 'published'
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : quiz.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {quiz.status === 'published' ? '✓ Published' : quiz.status === 'draft' ? '📝 Draft' : '📁 Archived'}
                      </span>
                    </div>
                    {quiz.description && (
                      <p className="text-gray-700 mb-3 text-lg">{quiz.description}</p>
                    )}
                    <div className="flex gap-6 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">📊</span>
                        {quiz.questions?.length || 0} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">🎯</span>
                        {quiz.totalPoints || 0} points
                      </span>
                      {quiz.timeLimit && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">⏱️</span>
                          {quiz.timeLimit} minutes
                        </span>
                      )}
                    </div>
                    {user?.role === 'admin' && quiz.teacher && (
                      <p className="text-sm text-gray-500">
                        👨‍🏫 Created by: {quiz.teacher.user?.firstName} {quiz.teacher.user?.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Primary Actions Row */}
                <div className="flex gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                  <Link href={`/quizzes/${quiz.id}/edit`} className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      ✏️ Edit Quiz
                    </Button>
                  </Link>
                  
                  {quiz.status === 'published' && (
                    <Link href={`/quizzes/${quiz.id}/assign`} className="flex-1">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        👥 Assign to Students
                      </Button>
                    </Link>
                  )}
                  
                  {quiz.status === 'draft' ? (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handlePublishQuiz(quiz.id)}
                    >
                      🚀 Publish Quiz
                    </Button>
                  ) : quiz.status === 'published' ? (
                    <Button 
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => handleUnpublishQuiz(quiz.id)}
                    >
                      📥 Unpublish
                    </Button>
                  ) : null}
                </div>

                {/* Secondary Actions Row */}
                <div className="flex gap-2 justify-end">
                  <Link href={`/quizzes/${quiz.id}/results`}>
                    <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                      📈 View Results
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    🗑️ Delete
                  </Button>
                </div>

                {/* Status-specific help text */}
                {quiz.status === 'draft' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Draft Status:</strong> This quiz is not visible to students. Edit it to add questions and assign to students, then publish to make it available.
                    </p>
                  </div>
                )}
                {quiz.status === 'published' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Published:</strong> This quiz is live and visible to assigned students. You can still edit questions or assign to additional students.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}