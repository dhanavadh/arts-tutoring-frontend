'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuizAttempt } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function QuizResultsPage() {
  const params = useParams();
  const quizId = parseInt(params.id as string);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizData, attemptsData] = await Promise.all([
          quizzesService.getQuizById(quizId),
          quizzesService.getQuizResults(quizId)
        ]);
        setQuiz(quizData);
        setAttempts(Array.isArray(attemptsData) ? attemptsData : []);
      } catch (err) {
        setError('Failed to load quiz results');
        console.error('Error fetching quiz results:', err);
        setAttempts([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchData();
    }
  }, [quizId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScorePercentage = (score: number, maxScore: number) => {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    if (attempts.length === 0) return null;
    
    const completedAttempts = attempts.filter(a => a.score !== undefined);
    if (completedAttempts.length === 0) return null;

    const scores = completedAttempts.map(a => a.score!);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averageScore: Math.round(average),
      maxScore,
      minScore,
      averagePercentage: Math.round((average / (quiz?.totalPoints || 1)) * 100),
    };
  };

  const stats = calculateStats();

  if (loading) return <div className="p-6">Loading quiz results...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!quiz) return <div className="p-6">Quiz not found</div>;

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{quiz.title} - Results</h1>
          <p className="text-gray-600">View quiz performance and student attempts</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
              <div className="text-sm text-gray-600">Total Attempts</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedAttempts}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averagePercentage}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.maxScore}</div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.minScore}</div>
              <div className="text-sm text-gray-600">Lowest Score</div>
            </Card>
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Student Attempts</h2>
          
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No attempts yet</p>
              <p className="text-sm text-gray-500 mt-1">Students haven't taken this quiz yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Student</th>
                    <th className="text-left py-3 px-2">Started</th>
                    <th className="text-left py-3 px-2">Submitted</th>
                    <th className="text-left py-3 px-2">Score</th>
                    <th className="text-left py-3 px-2">Percentage</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => {
                    const percentage = attempt.score !== undefined 
                      ? getScorePercentage(attempt.score, attempt.maxScore)
                      : 0;
                    
                    return (
                      <tr key={attempt.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium">
                              {attempt.quizAssignment.student.user.firstName} {attempt.quizAssignment.student.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.quizAssignment.student.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {formatDate(attempt.startedAt)}
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {attempt.submittedAt ? formatDate(attempt.submittedAt) : '-'}
                        </td>
                        <td className="py-3 px-2">
                          {attempt.score !== undefined ? (
                            <span className="font-medium">
                              {attempt.score}/{attempt.maxScore}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-2">
                          {attempt.score !== undefined ? (
                            <span className={`font-medium ${getGradeColor(percentage)}`}>
                              {percentage}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            !attempt.submittedAt
                              ? 'bg-yellow-100 text-yellow-800'
                              : attempt.graded
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {!attempt.submittedAt 
                              ? 'In Progress' 
                              : attempt.graded 
                              ? 'Graded' 
                              : 'Submitted'
                            }
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {attempt.submittedAt && !attempt.graded && (
                            <Button size="sm" variant="outline">
                              Grade
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}