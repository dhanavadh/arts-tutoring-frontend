'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quizzesService } from '@/lib/api/services/quizzes';
import { QuizAttempt, QuizAssignment, QuizQuestion } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function TakeQuizPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = parseInt(params.assignmentId as string);
  
  const [assignment, setAssignment] = useState<QuizAssignment | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      } catch (err) {
        setError('Failed to start quiz');
        console.error('Error starting quiz:', err);
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
    };
  }, [assignmentId]);

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
      
      router.push('/quizzes/assigned?submitted=true');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: QuizQuestion) => {
    const currentAnswer = answers[question.id] || '';

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={currentAnswer === 'true'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-4 h-4"
              />
              <span>True</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={currentAnswer === 'false'}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-4 h-4"
              />
              <span>False</span>
            </label>
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            className="w-full p-3 border rounded-md"
          />
        );

      case 'ESSAY':
        return (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            rows={6}
            className="w-full p-3 border rounded-md"
          />
        );

      default:
        return null;
    }
  };

  if (loading) return <div className="p-6">Starting quiz...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!assignment || !attempt) return <div className="p-6">Quiz not found</div>;

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assignment.quiz.title}</h1>
              {assignment.quiz.description && (
                <p className="text-gray-600">{assignment.quiz.description}</p>
              )}
            </div>
            {timeLeft !== null && (
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Time Remaining</div>
                  <div className={`text-xl font-bold ${
                    timeLeft < 300 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </Card>
            )}
          </div>
          
          <div className="flex gap-4 text-sm text-gray-500 mb-4">
            <span>{assignment.quiz.questions.length} questions</span>
            <span>{assignment.quiz.totalPoints} points</span>
            {assignment.quiz.timeLimit && (
              <span>{assignment.quiz.timeLimit} minutes</span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {assignment.quiz.questions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => (
              <Card key={question.id} className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium">Question {index + 1}</h3>
                    <span className="text-sm text-gray-500">{question.points} point{question.points !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{question.question}</p>
                </div>
                
                <div className="mt-4">
                  {renderQuestion(question)}
                </div>
              </Card>
            ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {Object.keys(answers).length} of {assignment.quiz.questions.length} questions answered
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}