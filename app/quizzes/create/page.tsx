'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { CreateQuizDto, CreateQuizQuestionDto, QuestionType, UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/lib/components/protected-route';

// Stepper Component
interface StepperProps {
  currentStep: number;
  steps: string[];
}

const Stepper = ({ currentStep, steps }: StepperProps) => (
  <div className="mb-8">
    <div className="flex items-center justify-center space-x-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
              ${index <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
              }
            `}
          >
            {index + 1}
          </div>
          <span
            className={`
              ml-2 text-sm font-medium
              ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}
            `}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`
                w-8 h-0.5 mx-4
                ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);

// Validation utilities
const validateQuizBasics = (title: string, description: string, limitAttempts: boolean, maxAttempts: number) => {
  const errors: string[] = [];
  
  if (!title.trim()) errors.push('Quiz title is required');
  if (title.length > 100) errors.push('Quiz title must be less than 100 characters');
  if (!description.trim()) errors.push('Quiz description is required');
  if (description.length > 500) errors.push('Quiz description must be less than 500 characters');
  if (limitAttempts && (maxAttempts < 1 || maxAttempts > 10)) errors.push('Max attempts must be between 1 and 10');
  
  return errors;
};

const validateQuestion = (question: QuizQuestion, index: number) => {
  const errors: string[] = [];
  const prefix = `Question ${index + 1}:`;
  
  if (!question.question.trim()) {
    errors.push(`${prefix} Question text is required`);
  }
  
  if (question.points < 1 || question.points > 100) {
    errors.push(`${prefix} Points must be between 1 and 100`);
  }
  
  if (question.type === 'MULTIPLE_CHOICE') {
    const validOptions = question.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      errors.push(`${prefix} Multiple choice questions need at least 2 options`);
    }
    if (!question.correctAnswer.trim()) {
      errors.push(`${prefix} Please select a correct answer`);
    }
    if (!question.options.includes(question.correctAnswer)) {
      errors.push(`${prefix} Correct answer must be one of the options`);
    }
  } else if (question.type === 'TRUE_FALSE') {
    if (!['true', 'false'].includes(question.correctAnswer.toLowerCase())) {
      errors.push(`${prefix} Please select true or false as the correct answer`);
    }
  } else if (question.type === 'SHORT_ANSWER') {
    if (!question.correctAnswer.trim()) {
      errors.push(`${prefix} Please provide the correct answer`);
    }
  }
  
  return errors;
};

interface QuizQuestion {
  id?: string;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  correctAnswerExplanation?: string;
  points: number;
  order: number;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Step 1: Quiz Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [limitAttempts, setLimitAttempts] = useState(false); // Default to unchecked
  const [maxAttempts, setMaxAttempts] = useState<number | undefined>(undefined); // Default to undefined

  // Step 2: Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());



  const steps = ['Quiz Details', 'Add Questions', 'Review & Create'];





  // Step navigation
  const nextStep = () => {
    const stepErrors = validateCurrentStep();
    if (stepErrors.length === 0) {
      setErrors([]);
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      setErrors(stepErrors);
    }
  };

  const prevStep = () => {
    setErrors([]);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return validateQuizBasics(title, description, limitAttempts, maxAttempts ?? 0);
      case 1:
        const questionErrors: string[] = [];
        if (questions.length === 0) {
          questionErrors.push('Please add at least one question');
        }
        questions.forEach((q, index) => {
          questionErrors.push(...validateQuestion(q, index));
        });
        return questionErrors;
      case 2:
        return [];
      default:
        return [];
    }
  };

  // Question management
  const addQuestion = () => {
    const newQuestionId = `question-${Date.now()}-${Math.random()}`;
    const newQuestion: QuizQuestion = {
      id: newQuestionId,
      question: '',
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: '',
      correctAnswerExplanation: '',
      points: 1,
      order: questions.length + 1,
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestions(prev => new Set([...prev, newQuestionId]));
  };

  const removeQuestion = (index: number) => {
    const questionToRemove = questions[index];
    setQuestions(questions.filter((_, i) => i !== index));
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionToRemove.id || '');
      return newSet;
    });
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    const question = { ...updated[index] };
    
    switch (field) {
      case 'type':
        const newType = value as QuestionType;
        question.type = newType;
        if (newType === 'MULTIPLE_CHOICE') {
          question.options = ['', '', '', ''];
          question.correctAnswer = '';
        } else if (newType === 'TRUE_FALSE') {
          question.options = ['true', 'false'];
          question.correctAnswer = '';
        } else {
          question.options = [];
          question.correctAnswer = '';
        }
        break;
      case 'options':
        question.options = value as string[];
        break;
      case 'points':
        question.points = Math.max(1, Math.min(100, parseInt(value) || 1));
        break;
      default:
        (question as any)[field] = value;
        break;
    }
    
    updated[index] = question;
    setQuestions(updated);
  };

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Final submission
  const handleSubmit = async () => {
    const finalErrors = validateCurrentStep();
    if (finalErrors.length > 0) {
      setErrors(finalErrors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
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

      const mappedQuestions: CreateQuizQuestionDto[] = questions.map((q, index) => {
        const mappedType = mapQuestionType(q.type);
        return {
          question: q.question,
          questionType: mappedType,
          options: q.type === 'MULTIPLE_CHOICE' ? q.options.filter(opt => opt.trim()) : undefined,
          correctAnswer: q.correctAnswer,
          correctAnswerExplanation: q.correctAnswerExplanation || '',
          marks: q.points,
        };
      });

      const quizData: CreateQuizDto = {
        title,
        description,
        questions: mappedQuestions,
      };
      if (limitAttempts && maxAttempts && maxAttempts > 0) {
        quizData.maxAttempts = maxAttempts;
      }

      const createdQuiz = await quizzesService.createQuiz(quizData);

      router.push(`/quizzes/${createdQuiz.id}?created=true`);
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      setErrors([error?.message || 'Failed to create quiz. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p className="text-gray-600 mt-2">Follow the steps to create your quiz</p>
        </div>

        <Stepper currentStep={currentStep} steps={steps} />

        {errors.length > 0 && (
          <Card className="mb-6 p-4 border-red-200 bg-red-50">
            <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Step 1: Quiz Details */}
        {currentStep === 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title..."
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this quiz covers..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Attempt Limits
                </label>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={limitAttempts}
                      onChange={e => {
                        const checked = e.target.checked;
                        setLimitAttempts(checked);
                        setMaxAttempts(checked ? 1 : undefined); // Always set to undefined when unchecked
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Limit the number of attempts</span>
                  </label>
                  
                  {limitAttempts && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Attempts *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={maxAttempts ?? ''}
                        onChange={e => setMaxAttempts(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-32"
                        placeholder="Number of attempts allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">How many times can a student attempt this quiz? (1-10)</p>
                    </div>
                  )}
                  
                  {!limitAttempts && (
                    <p className="text-sm text-gray-600 ml-6">Students will have unlimited attempts</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Questions */}
        {currentStep === 1 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Quiz Questions</h2>
              <Button onClick={addQuestion}>
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No questions added yet. Click "Add Question" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id} className="p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <button
                        onClick={() => toggleQuestionExpansion(question.id || '')}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Question {index + 1}</span>
                          <span className={`w-4 h-4 transition-transform ${
                            expandedQuestions.has(question.id || '') ? 'rotate-90' : ''
                          }`}>
                            ▶
                          </span>
                        </div>
                        {question.question && (
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {question.question}
                          </p>
                        )}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>

                    {expandedQuestions.has(question.id || '') && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text *
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            placeholder="Enter your question..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Type *
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(index, 'type', e.target.value as QuestionType)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                              <option value="TRUE_FALSE">True/False</option>
                              <option value="SHORT_ANSWER">Short Answer</option>
                              <option value="ESSAY">Essay</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points *
                            </label>
                            <Input
                              type="number"
                              value={question.points}
                              onChange={(e) => updateQuestion(index, 'points', e.target.value)}
                              min={1}
                              max={100}
                            />
                          </div>
                        </div>

                        {question.type === 'MULTIPLE_CHOICE' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options *
                            </label>
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={question.correctAnswer === option}
                                    onChange={() => updateQuestion(index, 'correctAnswer', option)}
                                    className="text-blue-600"
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[optionIndex] = e.target.value;
                                      updateQuestion(index, 'options', newOptions);
                                    }}
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === 'TRUE_FALSE' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Correct Answer *
                            </label>
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`tf-${question.id}`}
                                  value="true"
                                  checked={question.correctAnswer === 'true'}
                                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                  className="mr-2"
                                />
                                True
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name={`tf-${question.id}`}
                                  value="false"
                                  checked={question.correctAnswer === 'false'}
                                  onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                  className="mr-2"
                                />
                                False
                              </label>
                            </div>
                          </div>
                        )}

                        {question.type === 'SHORT_ANSWER' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Correct Answer *
                            </label>
                            <Input
                              value={question.correctAnswer}
                              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                              placeholder="Enter the correct answer..."
                            />
                          </div>
                        )}

                        {question.type === 'ESSAY' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Model Answer { /* or 'Sample Answer' */ }
                            </label>
                            <Input
                              value={question.correctAnswer}
                              onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                              placeholder="Enter a model answer for this essay question..."
                            />
                          </div>
                        )}

                        {/* Only render explanation once for all types */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Explanation (optional)
                          </label>
                          <textarea
                            value={question.correctAnswerExplanation || ''}
                            onChange={(e) => updateQuestion(index, 'correctAnswerExplanation', e.target.value)}
                            placeholder="Explain why this is the correct answer, or provide additional notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Step 3: Review & Create */}
        {currentStep === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Review & Create Quiz</h2>
            
            {/* Quiz Summary */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Quiz Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="font-medium">Title:</span> {title}</p>
                <p><span className="font-medium">Description:</span> {description}</p>
                <p><span className="font-medium">Questions:</span> {questions.length}</p>
                <p><span className="font-medium">Total Points:</span> {questions.reduce((sum, q) => sum + q.points, 0)}</p>
                <p><span className="font-medium">Max Attempts:</span> {limitAttempts ? maxAttempts : 'Unlimited'}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                📝 <strong>Note:</strong> Your quiz will be created as a draft. 
                You can assign it to students and publish it later from the quiz details page.
              </p>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Creating...' : 'Create Quiz'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
