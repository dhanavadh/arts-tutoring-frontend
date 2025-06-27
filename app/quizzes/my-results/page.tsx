'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, BookOpen, Award, TrendingUp, Eye } from '@/components/ui/icons';
import Link from 'next/link';

interface QuizAttempt {
  id: number;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  timeTaken: number;
  status: string;
  quiz: {
    id: number;
    title: string;
    description: string;
    totalMarks: number;
    questionCount: number;
    teacher: {
      name: string;
      email: string;
    };
  };
  assignment: {
    id: number;
    assignedAt: string;
    dueDate: string;
  };
}

export default function MyResultsPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    try {
      console.log('Fetching student attempts...');
      const data = await quizzesService.getStudentAttempts();
      console.log('Student attempts response:', data);
      setAttempts(data);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      setError('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    if (percentage >= 50) return 'outline';
    return 'destructive';
  };

  const calculateStats = () => {
    if (attempts.length === 0) {
      return {
        averageScore: 0,
        totalQuizzes: 0,
        bestScore: 0,
        totalTimeSpent: 0,
      };
    }

    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.percentage, 0);
    const averageScore = Math.round(totalScore / attempts.length);
    const bestScore = Math.max(...attempts.map(attempt => attempt.percentage));
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeTaken, 0);

    return {
      averageScore,
      totalQuizzes: attempts.length,
      bestScore,
      totalTimeSpent,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your quiz results...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Quiz Results</h1>
        <p className="text-gray-600">Track your quiz performance and progress</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Quiz Results Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't completed any quizzes yet. Start taking quizzes to see your results here.
            </p>
            <Link href="/quizzes">
              <Button>View Available Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageScore}%</div>
                  <Progress value={stats.averageScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.bestScore}%</div>
                  <Progress value={stats.bestScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(stats.totalTimeSpent)}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Results</CardTitle>
                <CardDescription>Your latest quiz attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attempts.slice(0, 5).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{attempt.quiz.title}</h3>
                        <p className="text-sm text-gray-600">{attempt.quiz.teacher.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(attempt.submittedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(attempt.timeTaken)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                            {attempt.percentage}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {attempt.score}/{attempt.maxScore} points
                          </div>
                          <div className="text-xs text-gray-400">
                            {attempt.quiz.questionCount} questions
                          </div>
                        </div>
                        <Link href={`/quizzes/result/${attempt.assignment.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review Answers
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Quiz Results</CardTitle>
                <CardDescription>Complete history of your quiz attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{attempt.quiz.title}</h3>
                          <Badge variant={getScoreBadgeVariant(attempt.percentage)}>
                            {attempt.percentage}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{attempt.quiz.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Teacher: {attempt.quiz.teacher.name}</span>
                          <span>{attempt.quiz.questionCount} questions</span>
                          <span>Max Score: {attempt.maxScore} points</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Submitted: {new Date(attempt.submittedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Time: {formatTime(attempt.timeTaken)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-xl font-bold ${getScoreColor(attempt.percentage)}`}>
                            {attempt.score}/{attempt.maxScore}
                          </div>
                          <Progress value={attempt.percentage} className="w-20 mt-1" />
                        </div>
                        <Link href={`/quizzes/result/${attempt.assignment.id}`}>
                          <Button variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Review Answers & Explanations
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}