"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { quizzesService } from "@/lib/api/services/quizzes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, BookOpen, Award, CheckCircle, XCircle, AlertCircle } from "@/components/ui/icons";
import Link from "next/link";

interface QuestionResult {
  id: number;
  question: string;
  questionType: string;
  options?: string[];
  marks: number;
  studentAnswer: any;
  correctAnswer: any;
  correctAnswerExplanation?: string;
  isCorrect: boolean;
  pointsEarned: number;
}

interface AttemptDetails {
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
    timeLimit: number;
    teacher: {
      name: string;
      email: string;
    };
  };
  questions: QuestionResult[];
  assignment: {
    id: number;
    assignedAt: string;
    dueDate: string;
  };
}

export default function StudentQuizResultPage() {
  const params = useParams();
  const { user } = useAuth();
  const assignmentId = params.assignmentId as string;
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && assignmentId) {
      fetchAttemptDetails();
    }
  }, [user, assignmentId]);

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching assignment result for assignment ID:', assignmentId);
      
      // Use the new direct assignment result endpoint
      const details = await quizzesService.getAssignmentResult(parseInt(assignmentId));
      console.log('Assignment result details:', details);
      console.log('Questions in details:', details.questions);
      console.log('First question details:', details.questions?.[0]);
      
      setAttemptDetails(details);
    } catch (err) {
      console.error('Error fetching attempt details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz result');
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

  const getScoreBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 90) return 'default';
    if (percentage >= 70) return 'secondary';
    if (percentage >= 50) return 'outline';
    return 'destructive';
  };

  const renderAnswer = (question: QuestionResult) => {
    const { studentAnswer, correctAnswer, questionType, options, correctAnswerExplanation } = question;

    console.log('Frontend rendering question:', {
      questionId: question.id,
      questionType,
      studentAnswer,
      correctAnswer,
      correctAnswerExplanation
    });

    switch (questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              {options?.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index);
                const isStudentChoice = studentAnswer === optionLabel;
                const isCorrectChoice = correctAnswer === optionLabel;
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isCorrectChoice
                        ? 'bg-green-50 border-green-200'
                        : isStudentChoice
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{optionLabel}.</span>
                      <span className="flex-1">{option}</span>
                      {isCorrectChoice && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Correct</span>
                        </div>
                      )}
                      {isStudentChoice && !isCorrectChoice && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Your choice</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {correctAnswerExplanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 font-medium text-sm">Explanation:</div>
                </div>
                <div className="text-blue-700 text-sm mt-1">{correctAnswerExplanation}</div>
              </div>
            )}
          </div>
        );
      
      case 'true_false':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className={`p-3 rounded-lg border ${correctAnswer === 'true' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">True</span>
                  <div className="flex items-center gap-1">
                    {correctAnswer === 'true' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Correct</span>
                      </div>
                    )}
                    {studentAnswer === 'true' && correctAnswer !== 'true' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Your choice</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${correctAnswer === 'false' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">False</span>
                  <div className="flex items-center gap-1">
                    {correctAnswer === 'false' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Correct</span>
                      </div>
                    )}
                    {studentAnswer === 'false' && correctAnswer !== 'false' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Your choice</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {correctAnswerExplanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-600 font-medium text-sm">Explanation:</div>
                <div className="text-blue-700 text-sm mt-1">{correctAnswerExplanation}</div>
              </div>
            )}
          </div>
        );
      
      case 'short_answer':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-700 font-medium mb-1">Your Answer:</div>
                <div className="font-mono text-sm text-blue-800">{studentAnswer || 'Not answered'}</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-700 font-medium mb-1">Correct Answer:</div>
                <div className="font-mono text-sm text-green-800">{correctAnswer}</div>
              </div>
            </div>
            {correctAnswerExplanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-600 font-medium text-sm">Explanation:</div>
                <div className="text-blue-700 text-sm mt-1">{correctAnswerExplanation}</div>
              </div>
            )}
          </div>
        );
      
      case 'essay':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700 font-medium mb-2">Your Answer:</div>
              <div className="text-sm whitespace-pre-wrap text-blue-800">{studentAnswer || 'Not answered'}</div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <div className="text-sm text-yellow-700 font-medium">Essay questions require manual grading by your teacher</div>
              </div>
            </div>
            {correctAnswerExplanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-600 font-medium text-sm">Sample Answer / Guidelines:</div>
                <div className="text-blue-700 text-sm mt-1">{correctAnswerExplanation}</div>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm">Answer: {studentAnswer || 'Not answered'}</div>
            </div>
            {correctAnswerExplanation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-600 font-medium text-sm">Explanation:</div>
                <div className="text-blue-700 text-sm mt-1">{correctAnswerExplanation}</div>
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz result...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Result</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/quizzes">
                <Button>Back to Quizzes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!attemptDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Result Not Found</h3>
            <p className="text-gray-600 mb-4">The quiz result you're looking for doesn't exist or you don't have access to it.</p>
            <Link href="/quizzes">
              <Button>Back to Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/quizzes">
          <Button variant="outline" className="mb-4">← Back to Quizzes</Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Result</h1>
        <p className="text-gray-600">Detailed results for your quiz attempt</p>
      </div>

      {/* Quiz Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-6 w-6" />
            {attemptDetails.quiz.title}
          </CardTitle>
          <CardDescription>
            {attemptDetails.quiz.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Quiz Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Teacher:</span>
                  <span>{attemptDetails.quiz.teacher.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span>{attemptDetails.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Limit:</span>
                  <span>{attemptDetails.quiz.timeLimit ? `${attemptDetails.quiz.timeLimit} minutes` : 'No limit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Score:</span>
                  <span>{attemptDetails.maxScore} points</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Your Performance</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Score</span>
                    <Badge variant={getScoreBadgeVariant(attemptDetails.percentage)}>
                      {attemptDetails.percentage}%
                    </Badge>
                  </div>
                  <Progress value={attemptDetails.percentage} className="h-2" />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>{attemptDetails.score} points</span>
                    <span>{attemptDetails.maxScore} points</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Time taken: {formatTime(attemptDetails.timeTaken)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted: {new Date(attemptDetails.submittedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Breakdown of your performance on this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {attemptDetails.questions.filter(q => q.isCorrect).length}
              </div>
              <div className="text-sm text-green-700">Correct Answers</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {attemptDetails.questions.filter(q => !q.isCorrect).length}
              </div>
              <div className="text-sm text-red-700">Incorrect Answers</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {attemptDetails.questions.length}
              </div>
              <div className="text-sm text-blue-700">Total Questions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Answer Review</CardTitle>
          <CardDescription>
            Your answers compared to the correct answers with explanations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {attemptDetails.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {question.marks} {question.marks === 1 ? 'point' : 'points'}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{question.question}</h3>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {question.isCorrect ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">+{question.pointsEarned}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">+{question.pointsEarned}</span>
                      </div>
                    )}
                  </div>
                </div>
                {renderAnswer(question)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Navigation */}
      <div className="mt-6 flex justify-between">
        <Link href="/quizzes">
          <Button variant="outline">Back to Quizzes</Button>
        </Link>
        <Link href="/quizzes/my-results">
          <Button>View All Results</Button>
        </Link>
      </div>
    </div>
  );
}
