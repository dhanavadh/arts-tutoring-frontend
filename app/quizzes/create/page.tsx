'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { CreateQuizDto, QuestionType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/lib/components/protected-route';

interface QuizQuestion {
  id?: string;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
  order: number;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Debug: Check user authentication
  const { user } = useAuth();
  console.log('Current user in CreateQuizPage:', user);
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: undefined as number | undefined,
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-1',
      question: '',
      type: 'MULTIPLE_CHOICE' as QuestionType,
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      order: 1,
    },
  ]);

  // Debug: Log when questions state changes
  console.log('🔵 Component render - questions state:', questions.length, questions);

  const addQuestion = () => {
    console.log('🔴 Adding question. Current questions:', questions.length);
    console.log('🔴 Current questions array:', questions);
    const newQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type: 'MULTIPLE_CHOICE' as QuestionType,
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      order: questions.length + 1,
    };
    console.log('🔴 New question to add:', newQuestion);
    const updatedQuestions = [...questions, newQuestion];
    console.log('🔴 Updated questions array:', updatedQuestions);
    console.log('🔴 New questions array length:', updatedQuestions.length);
    setQuestions(updatedQuestions);
    console.log('🔴 setQuestions called with:', updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Reset options and correct answer when question type changes
    if (field === 'type') {
      console.log('🔶 Question type changed to:', value);
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
      console.log('🔶 Question after type change:', updated[index]);
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
    console.log('🟨 Form submitted!');
    console.log('🟨 Quiz title:', quiz.title);
    console.log('🟨 Questions state:', questions);
    
    if (!quiz.title.trim()) {
      console.log('🟨 Validation failed: No quiz title');
      alert('Please enter a quiz title');
      return;
    }

    console.log('🟨 Title validation passed');
    console.log('🟨 Validation - questions state:', questions);
    console.log('🟨 Number of questions:', questions.length);
    
    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      console.log('🟨 Validation failed: Empty questions found:', emptyQuestions);
      alert(`Please fill in all questions. Found ${emptyQuestions.length} empty questions.`);
      return;
    }
    console.log('🟨 Question text validation passed');

    const mcQuestionsWithEmptyOptions = questions.filter(q => 
      q.type === 'MULTIPLE_CHOICE' && q.options.some(opt => !opt.trim())
    );
    if (mcQuestionsWithEmptyOptions.length > 0) {
      console.log('🟨 Validation failed: Empty options found:', mcQuestionsWithEmptyOptions);
      alert(`Please fill in all multiple choice options. Found ${mcQuestionsWithEmptyOptions.length} questions with empty options.`);
      return;
    }
    console.log('🟨 Options validation passed');

    const questionsWithoutAnswers = questions.filter(q => !q.correctAnswer.trim());
    if (questionsWithoutAnswers.length > 0) {
      console.log('🟨 Validation failed: Missing answers found:', questionsWithoutAnswers);
      alert(`Please provide correct answers for all questions. Found ${questionsWithoutAnswers.length} questions without answers.`);
      return;
    }
    console.log('🟨 All validations passed! Proceeding to create quiz...');

    setLoading(true);
    try {
      const quizData: CreateQuizDto = {
        title: quiz.title,
        description: quiz.description || undefined,
        timeLimit: quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit : undefined,
        questions: questions.map(q => ({
          question: q.question,
          questionType: q.type.toLowerCase(), // Convert to backend enum format
          options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          marks: q.points, // Backend expects 'marks' not 'points'
        })),
      };

      console.log('🟢 Creating quiz with data:', JSON.stringify(quizData, null, 2));
      console.log('🟢 Questions state before submission:', JSON.stringify(questions, null, 2));
      console.log('🟢 Processed questions for submission:', JSON.stringify(quizData.questions, null, 2));
      console.log('🟢 Number of questions being sent:', quizData.questions.length);
      
      const result = await quizzesService.createQuiz(quizData);
      console.log('🟢 Quiz creation result:', result);
      router.push('/quizzes');
    } catch (error) {
      console.error('Error creating quiz:', error);
      if (error instanceof Error && error.message.includes('403')) {
        alert('You do not have permission to create quizzes. Please make sure you are logged in as a teacher.');
      } else {
        alert('Failed to create quiz. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Create New Quiz</h1>
          <p className="text-gray-600">Create a quiz for your students</p>
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
              <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={() => {
                    console.log('🚨 Button clicked!');
                    addQuestion();
                  }} 
                  variant="outline"
                >
                  Add Question
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    console.log('🚨 Test button clicked! Current questions:', questions.length);
                    console.log('🚨 Questions array:', questions);
                  }} 
                  variant="outline"
                  className="bg-red-500 text-white"
                >
                  Test
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id || index} className="border rounded-lg p-4">
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
              {loading ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}