'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuizAttempt, UserRole } from '@/lib/types';
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
        // Log the full attempts data for inspection
        console.log('Fetched attempts data:', attemptsData);
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
    <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
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
                  {attempts.map((attempt, idx) => {
                    console.log('Rendering attempt:', attempt);
                    const percentage = attempt.score !== undefined 
                      ? getScorePercentage(attempt.score, attempt.maxScore)
                      : 0;
                    // Use flat fields from API response
                    const studentName = attempt.studentName || 'Unknown student';
                    const studentEmail = attempt.studentEmail || 'N/A';
                    const startedAt = attempt.assignedAt || attempt.startedAt;
                    const submittedAt = attempt.submittedAt;
                    return [
                      <tr key={attempt.id ?? attempt.studentId ?? `attempt-${idx}`} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium">
                              {studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {studentEmail}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {startedAt ? formatDate(startedAt) : '-'}
                        </td>
                        <td className="py-3 px-2 text-sm">
                          {submittedAt ? formatDate(submittedAt) : '-'}
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
                            attempt.status === 'in_progress' || attempt.status === 'assigned'
                              ? 'bg-yellow-100 text-yellow-800'
                              : attempt.graded
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {attempt.status === 'in_progress' || attempt.status === 'assigned'
                              ? 'In Progress'
                              : attempt.graded
                              ? 'Graded'
                              : 'Submitted'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            {attempt.answers && Object.keys(attempt.answers).length > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`/quizzes/teacher-view-result/${attempt.id}`, '_blank')}
                              >
                                View Details
                              </Button>
                            )}
                            {submittedAt && !attempt.graded && (
                              <Button size="sm" variant="outline">
                                Grade
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>,
                      // Details row for answers
                      <tr key={`details-${attempt.id ?? attempt.studentId ?? idx}`}> 
                        <td colSpan={7} className="bg-gray-50 px-4 py-2">
                          <div className="text-sm">
                            <div className="flex justify-between items-center mb-3">
                              <strong className="text-base">Quick Answer Preview:</strong>
                              {attempt.answers && Object.keys(attempt.answers).length > 0 && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => window.open(`/quizzes/teacher-view-result/${attempt.id}`, '_blank')}
                                >
                                  View Full Details
                                </Button>
                              )}
                            </div>
                            {attempt.answers && Object.keys(attempt.answers).length > 0 ? (
                              <div className="grid gap-3">
                                {quiz?.questions?.slice(0, 3).map((q) => {
                                  const answerObj = attempt.answers?.[q.id];
                                  const studentAnswer = answerObj?.studentAnswer || answerObj;
                                  const correctAnswer = answerObj?.correctAnswer || q.correctAnswer;
                                  const isCorrect = studentAnswer === correctAnswer;
                                  
                                  return (
                                    <div key={q.id} className="bg-white p-3 rounded border">
                                      <div className="font-medium mb-2 text-gray-800">
                                        Q: {q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question}
                                      </div>
                                      <div className="flex gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-600">Student:</span> 
                                          <span className={`ml-1 font-mono ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                            {studentAnswer || 'Not answered'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Correct:</span> 
                                          <span className="ml-1 font-mono text-green-600">{correctAnswer}</span>
                                        </div>
                                        <div>
                                          <span className={`px-2 py-1 rounded text-xs ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                {quiz?.questions && quiz.questions.length > 3 && (
                                  <div className="text-center text-gray-500 text-sm">
                                    ... and {quiz.questions.length - 3} more questions
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500 italic">No answers submitted yet</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ];
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