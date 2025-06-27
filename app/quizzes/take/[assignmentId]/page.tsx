'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quizzesService } from '@/lib/api/services/quizzes';
import { QuizAttempt, QuizAssignment, QuizQuestion, UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function TakeQuizPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = parseInt(params.assignmentId as string);
  
  const [assignment, setAssignment] = useState<QuizAssignment | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startQuiz = async () => {
      try {
        setLoading(true);
        const attemptData = await quizzesService.startQuizAttempt(assignmentId);
        setAttempt(attemptData);
        setAssignment(attemptData.quizAssignment);
        
        // Set up timer if quiz has time limit
        if (attemptData.quizAssignment.quiz.timeLimit) {
          const timeLimit = attemptData.quizAssignment.quiz.timeLimit * 60; // Convert to seconds
          setTimeLeft(timeLimit);
          
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev && prev <= 1) {
                handleSubmit();
                return 0;
              }
              return prev ? prev - 1 : null;
            });
          }, 1000);
        }
      } catch (err: any) {
        console.error('Error starting quiz:', err);
        console.error('Error message:', err.message);
        console.error('Error errors field:', err.errors);
        console.error('Error stack:', err.stack);
        
        // Check if quiz has already been attempted - look for various error patterns
        const errorMessage = err.message || '';
        const errorsField = err.errors || ''; // Check the nested errors field too
        
        const isAttemptLimitExceeded = 
          errorMessage.includes('reached the maximum number of attempts') ||
          errorsField.includes('reached the maximum number of attempts');

        const isNotPublished = 
          errorMessage.includes('not yet published and cannot be taken') ||
          errorsField.includes('not yet published and cannot be taken');

        const isAlreadyAttempted = 
          isAttemptLimitExceeded ||
          errorMessage.includes('Quiz has already been attempted') ||
          errorMessage.includes('already been attempted') ||
          errorMessage.includes('already attempted') ||
          errorMessage.includes('Quiz has already been completed') ||
          errorMessage.includes('quiz attempt already exists') ||
          errorMessage.toLowerCase().includes('already') ||
          (err.status === 400 && errorMessage.includes('attempt')) ||
          // Also check the errors field where the backend actually puts the message
          errorsField.includes('Quiz has already been attempted') ||
          errorsField.includes('already been attempted') ||
          errorsField.includes('already attempted') ||
          errorsField.includes('Quiz has already been completed');
          
        if (isNotPublished) {
          setError('This quiz has not been published yet and cannot be taken. Please contact your teacher.');
        } else if (isAlreadyAttempted) {
          let errorDisplayMessage;
          if (isAttemptLimitExceeded) {
            errorDisplayMessage = errorMessage.includes('reached the maximum number of attempts') 
              ? errorMessage 
              : 'You have reached the maximum number of attempts for this quiz. Please contact your teacher if you need additional attempts.';
          } else {
            errorDisplayMessage = 'This quiz has already been completed. You cannot retake it, but you can review your previous attempt from the quiz dashboard.';
          }
          setError(errorDisplayMessage);
          
          // Try to load the assignment details to show the completed quiz
          try {
            // For now, set a basic quiz state to show the error message
            setAssignment({
              id: assignmentId,
              quiz: { 
                id: 0, 
                title: 'Quiz Already Completed',
                questions: [],
                timeLimit: null 
              }
            } as any);
          } catch (loadErr) {
            console.error('Error loading completed quiz:', loadErr);
          }
        } else {
          setError(`Failed to start quiz: ${errorMessage || 'Please try again.'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      startQuiz();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [assignmentId]);

  // Auto-save answers
  useEffect(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    autoSaveRef.current = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        autoSaveAnswers();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [answers]);

  const autoSaveAnswers = async () => {
    if (!attempt) return;
    
    try {
      setAutoSaving(true);
      // Implement auto-save API call here if backend supports it
      // await quizzesService.saveAnswers(attempt.id, answers);
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    if (Object.keys(answers).length === 0) {
      if (!confirm('You haven\'t answered any questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const submitData = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          answer,
        })),
      };

      await quizzesService.submitQuiz(attempt.id, submitData);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      router.push('/quizzes?submitted=true');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (assignment && currentQuestionIndex < assignment.quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const getQuestionStatus = (questionId: number) => {
    return answers[questionId] ? 'answered' : 'unanswered';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number) => {
    if (seconds < 300) return 'text-red-600'; // Less than 5 minutes
    if (seconds < 600) return 'text-yellow-600'; // Less than 10 minutes
    return 'text-green-600';
  };

  const renderQuestion = (question: QuizQuestion) => {
    const currentAnswer = answers[question.id] || '';

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label 
                key={index} 
                className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 mt-1 text-blue-600"
                />
                <span className="text-gray-800 leading-relaxed">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            {['true', 'false'].map((value) => (
              <label 
                key={value}
                className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={value}
                  checked={currentAnswer === value}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-800 capitalize font-medium">{value}</span>
              </label>
            ))}
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        );

      case 'ESSAY':
        return (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            rows={8}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting your quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-lg w-full text-center border-red-200 bg-red-50">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Quiz Unavailable</h2>
          </div>
          <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push('/quizzes')} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Quiz Dashboard
            </Button>
            <Button 
              onClick={() => router.back()} 
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!assignment || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or you don't have permission to access it.</p>
          <Button onClick={() => router.push('/quizzes')} variant="outline">
            Back to Quizzes
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = assignment.quiz.questions.sort((a, b) => a.order - b.order)[currentQuestionIndex];
  const totalQuestions = assignment.quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{assignment.quiz.title}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {autoSaving && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    Saving...
                  </div>
                )}
                
                {timeLeft !== null && (
                  <Card className="p-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Time Remaining</div>
                      <div className={`text-lg font-bold ${getTimeColor(timeLeft)}`}>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{answeredCount} of {totalQuestions} answered</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Question Navigation Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-32">
                <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {assignment.quiz.questions
                    .sort((a, b) => a.order - b.order)
                    .map((q, index) => {
                      const status = getQuestionStatus(q.id);
                      const isCurrent = index === currentQuestionIndex;
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => handleQuestionJump(index)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                              : status === 'answered'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                </div>
                
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Question Area */}
            <div className="lg:col-span-3">
              <Card className="p-8">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          Question {currentQuestionIndex + 1}
                        </span>
                        <span className="text-sm text-gray-500">
                          {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <h2 className="text-xl font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.question}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  {renderQuestion(currentQuestion)}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    {currentQuestionIndex === totalQuestions - 1 ? (
                      <Button
                        onClick={() => setShowConfirmSubmit(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-8"
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        className="flex items-center gap-2 px-6"
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <Modal
          isOpen={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
          title="Submit Quiz"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to submit your quiz? You have answered {answeredCount} out of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-amber-600 font-medium">
                  You still have {totalQuestions - answeredCount} unanswered questions.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={() => setShowConfirmSubmit(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}