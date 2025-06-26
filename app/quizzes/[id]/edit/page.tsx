'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { Quiz, QuestionType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/lib/components/protected-route';

interface QuizQuestion {
  id?: number;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const quizId = parseInt(params.id as string);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: undefined as number | undefined,
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setFetchLoading(true);
        const quizData = await quizzesService.getQuizById(quizId);
        
        setQuiz({
          title: quizData.title,
          description: quizData.description || '',
          timeLimit: quizData.timeLimit || undefined,
        });

        // Convert backend question format to frontend format
        const formattedQuestions = quizData.questions?.map((q, index) => {
          const questionType = q.questionType?.toUpperCase() as QuestionType || 'MULTIPLE_CHOICE';
          
          return {
            id: q.id,
            question: q.question,
            type: questionType,
            options: questionType === 'MULTIPLE_CHOICE' ? (q.options || ['', '', '', '']) : [],
            correctAnswer: q.correctAnswer || '',
            points: q.marks || 1,
            order: q.orderIndex || index + 1,
          };
        }) || [];

        setQuestions(formattedQuestions.length > 0 ? formattedQuestions : [
          {
            question: '',
            type: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 1,
            order: 1,
          },
        ]);
      } catch (err) {
        setError('Failed to load quiz');
        console.error('Error fetching quiz:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1,
        order: questions.length + 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Reset options and correct answer when question type changes
    if (field === 'type') {
      console.log('🔶 Edit: Question type changed to:', value);
      if (value === 'MULTIPLE_CHOICE') {
        updated[index].options = ['', '', '', ''];
        updated[index].correctAnswer = '';
      } else if (value === 'TRUE_FALSE') {
        updated[index].options = [];
        updated[index].correctAnswer = '';
      } else if (value === 'SHORT_ANSWER' || value === 'ESSAY') {
        updated[index].options = [];
        updated[index].correctAnswer = '';
      }
      console.log('🔶 Edit: Question after type change:', updated[index]);
    }
    
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quiz.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (questions.some(q => !q.question.trim())) {
      alert('Please fill in all questions');
      return;
    }

    if (questions.some(q => q.type === 'MULTIPLE_CHOICE' && q.options.some(opt => !opt.trim()))) {
      alert('Please fill in all multiple choice options');
      return;
    }

    if (questions.some(q => !q.correctAnswer.trim())) {
      alert('Please provide correct answers for all questions');
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        title: quiz.title,
        description: quiz.description || undefined,
        timeLimit: quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit : undefined,
        questions: questions.map(q => ({
          question: q.question,
          questionType: q.type.toLowerCase(),
          options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          marks: q.points,
        })),
      };

      await quizzesService.updateQuiz(quizId, quizData);
      router.push('/quizzes');
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Failed to update quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="p-6">Loading quiz...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Edit Quiz</h1>
          <p className="text-gray-600">Update your quiz details and questions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  placeholder="Enter quiz title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full p-3 border rounded-md"
                  rows={3}
                  value={quiz.description}
                  onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                  placeholder="Enter quiz description (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                <Input
                  type="number"
                  value={quiz.timeLimit || ''}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Leave empty for no time limit"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Questions</h2>
              <Button type="button" onClick={addQuestion} variant="outline">
                Add Question
              </Button>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Question *</label>
                      <textarea
                        className="w-full p-3 border rounded-md"
                        rows={2}
                        value={question.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        placeholder="Enter your question"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Question Type *</label>
                        <select
                          className="w-full p-3 border rounded-md"
                          value={question.type}
                          onChange={(e) => updateQuestion(index, 'type', e.target.value as QuestionType)}
                        >
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="TRUE_FALSE">True/False</option>
                          <option value="SHORT_ANSWER">Short Answer</option>
                          <option value="ESSAY">Essay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Points *</label>
                        <Input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    {question.type === 'MULTIPLE_CHOICE' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Options *</label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <Input
                              key={optionIndex}
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              required
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Correct Answer *</label>
                      {question.type === 'MULTIPLE_CHOICE' ? (
                        <select
                          className="w-full p-3 border rounded-md"
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          required
                        >
                          <option value="">Select correct answer</option>
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              {option || `Option ${optionIndex + 1}`}
                            </option>
                          ))}
                        </select>
                      ) : question.type === 'TRUE_FALSE' ? (
                        <select
                          className="w-full p-3 border rounded-md"
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          required
                        >
                          <option value="">Select correct answer</option>
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      ) : (
                        <textarea
                          className="w-full p-3 border rounded-md"
                          rows={2}
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          placeholder="Enter the correct answer or key points"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Quiz'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}