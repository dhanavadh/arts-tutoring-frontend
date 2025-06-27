'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuestionType, CreateQuizDto } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/lib/components/protected-route';

interface FormattedQuestion {
  id?: number;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  correctAnswerExplanation?: string;
  points: number;
  order: number;
}

interface EditQuizForm {
  title: string;
  description: string;
  timeLimit?: number;
  maxAttempts?: number;
  limitAttempts: boolean;
  status: 'draft' | 'published' | 'archived';
}

function EditQuizContent({ id }: { id: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<EditQuizForm>({
    title: '',
    description: '',
    timeLimit: undefined,
    maxAttempts: undefined,
    limitAttempts: false,
    status: 'draft',
  });
  
  const [questions, setQuestions] = useState<FormattedQuestion[]>([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setFetchLoading(true);
        const quizData = await quizzesService.getQuiz(id);
        console.log('Fetched quiz data:', quizData);
        
        setQuiz({
          title: quizData.title,
          description: quizData.description || '',
          timeLimit: quizData.timeLimit || undefined,
          maxAttempts: (typeof quizData.maxAttempts === 'number' && quizData.maxAttempts > 0) ? quizData.maxAttempts : undefined,
          limitAttempts: (typeof quizData.maxAttempts === 'number' && quizData.maxAttempts > 0),
          status: quizData.status || 'draft',
        });

        const backendToFrontendType = {
          'multiple_choice': 'MULTIPLE_CHOICE',
          'true_false': 'TRUE_FALSE',
          'short_answer': 'SHORT_ANSWER',
          'essay': 'ESSAY',
        } as const;
        const frontendToBackendType = {
          'MULTIPLE_CHOICE': 'multiple_choice',
          'TRUE_FALSE': 'true_false',
          'SHORT_ANSWER': 'short_answer',
          'ESSAY': 'essay',
        } as const;

        const formattedQuestions = quizData.questions?.map((q, index) => {
          const backendType = q.questionType || q.type;
          const convertedType = backendToFrontendType[backendType as keyof typeof backendToFrontendType] || 'MULTIPLE_CHOICE';
          return {
            id: q.id,
            question: q.question || '',
            type: convertedType,
            options: (convertedType === 'MULTIPLE_CHOICE') ? (q.options || ['', '', '', '']) : (convertedType === 'TRUE_FALSE' ? ['true', 'false'] : []),
            correctAnswer: q.correctAnswer || '',
            correctAnswerExplanation: q.correctAnswerExplanation || '',
            points: q.points || q.marks || 1,
            order: index + 1,
          };
        }) || [];

        console.log('Formatted questions:', formattedQuestions);

        if (formattedQuestions.length === 0) {
          formattedQuestions.push({
            id: -1, // Temporary ID for new questions
            question: '',
            type: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correctAnswer: '',
            correctAnswerExplanation: '',
            points: 1,
            order: 1,
          });
        }

        setQuestions(formattedQuestions);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const handleUpdateQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!quiz.title.trim()) {
        setError('Quiz title is required');
        return;
      }

      if (questions.length === 0) {
        setError('At least one question is required');
        return;
      }

      // Validate required fields for each question
      const invalidQuestions = questions.filter(
        q => !q.question.trim() || !q.correctAnswer.trim() || q.points <= 0
      );

      if (invalidQuestions.length > 0) {
        setError('All questions must have question text, correct answer, and positive points value');
        return;
      }

      // Prevent submitting with limitAttempts checked but no valid maxAttempts
      if (quiz.limitAttempts && (!quiz.maxAttempts || quiz.maxAttempts <= 0)) {
        setError('Please enter a valid number of maximum attempts (must be greater than 0)');
        return;
      }

      // Map frontend question types to backend format
      const mapQuestionType = (frontendType: QuestionType | string): string => {
        if (!frontendType) return 'multiple_choice';
        const frontendToBackendType = {
          'MULTIPLE_CHOICE': 'multiple_choice',
          'TRUE_FALSE': 'true_false',
          'SHORT_ANSWER': 'short_answer',
          'ESSAY': 'essay',
        } as const;
        return frontendToBackendType[frontendType as keyof typeof frontendToBackendType] || 'multiple_choice';
      };

      // Build updateData, only include maxAttempts if limitAttempts is true and >0
      const updateData: CreateQuizDto = {
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        status: quiz.status,
        questions: questions.map((q, index) => ({
          question: q.question.trim(),
          questionType: mapQuestionType(q.type),
          options: q.type === 'MULTIPLE_CHOICE' ? q.options.filter(opt => opt.trim()) : undefined,
          correctAnswer: q.correctAnswer.trim(),
          correctAnswerExplanation: q.correctAnswerExplanation?.trim(),
          marks: q.points,
        })),
      };
      if (quiz.limitAttempts && quiz.maxAttempts && quiz.maxAttempts > 0) {
        updateData.maxAttempts = quiz.maxAttempts;
      }
      await quizzesService.updateQuiz(id, updateData);
      console.log('Quiz updated successfully');
      router.push(`/quizzes/${id}?updated=true`);
    } catch (err) {
      console.error('Error updating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quiz');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: FormattedQuestion = {
      id: undefined,
      question: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: '',
      correctAnswerExplanation: '',
      points: 1,
      order: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Quiz</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/quizzes/${id}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateQuiz}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <Card className="mb-8 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <Input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={quiz.description}
              onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time Limit (minutes)</label>
            <Input
              type="number"
              value={quiz.timeLimit || ''}
              onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || undefined }))}
              className="mt-1"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Attempt Limits</label>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={quiz.limitAttempts}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setQuiz(prev => ({
                      ...prev,
                      limitAttempts: checked,
                      maxAttempts: checked ? (prev.maxAttempts ?? 1) : undefined
                    }));
                  }}
                  className="text-blue-600"
                />
                <span className="text-sm">Limit the number of attempts</span>
              </label>
              
              {quiz.limitAttempts && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Attempts *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={quiz.maxAttempts ?? ''}
                    onChange={(e) => setQuiz(prev => ({ ...prev, maxAttempts: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-32"
                    placeholder="Number of attempts allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many times can a student attempt this quiz? (1-10)</p>
                </div>
              )}
              
              {!quiz.limitAttempts && (
                <p className="text-sm text-gray-600 ml-6">Students will have unlimited attempts</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Questions</h2>
          <Button onClick={addQuestion}>Add Question</Button>
        </div>

        {questions.map((question, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Question {index + 1}</h3>
                {questions.length > 1 && (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const newQuestions = [...questions];
                      newQuestions.splice(index, 1);
                      setQuestions(newQuestions);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Question Text</label>
                <Input
                  type="text"
                  value={question.question}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index] = { ...question, question: e.target.value };
                    setQuestions(newQuestions);
                  }}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Question Type</label>
                <select
                  value={question.type}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index] = {
                      ...question,
                      type: e.target.value as QuestionType,
                      options: e.target.value === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : []
                    };
                    setQuestions(newQuestions);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="ESSAY">Essay</option>
                </select>
              </div>

              {question.type === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            const newOptions = [...newQuestions[index].options];
                            newOptions[optIndex] = e.target.value;
                            newQuestions[index] = { ...question, options: newOptions };
                            setQuestions(newQuestions);
                          }}
                          required
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        {optIndex > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newQuestions = [...questions];
                              const newOptions = [...newQuestions[index].options];
                              newOptions.splice(optIndex, 1);
                              newQuestions[index] = { ...question, options: newOptions };
                              setQuestions(newQuestions);
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newQuestions = [...questions];
                        newQuestions[index] = {
                          ...question,
                          options: [...question.options, '']
                        };
                        setQuestions(newQuestions);
                      }}
                    >
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

              {question.type === 'TRUE_FALSE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index] = { ...question, correctAnswer: e.target.value };
                      setQuestions(newQuestions);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                <Input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index] = { ...question, correctAnswer: e.target.value };
                    setQuestions(newQuestions);
                  }}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Explanation (Optional)
                </label>
                <textarea
                  value={question.correctAnswerExplanation || ''}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index] = {
                      ...question,
                      correctAnswerExplanation: e.target.value
                    };
                    setQuestions(newQuestions);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Points</label>
                <Input
                  type="number"
                  value={question.points}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[index] = {
                      ...question,
                      points: parseInt(e.target.value) || 0
                    };
                    setQuestions(newQuestions);
                  }}
                  required
                  min="0"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/quizzes/${id}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdateQuiz}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const quizId = parseInt(unwrappedParams.id, 10);

  return (
    <ProtectedRoute>
      <EditQuizContent id={quizId} />
    </ProtectedRoute>
  );
}