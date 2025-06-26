'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { studentsService } from '@/lib/api/services/students';
import { CreateQuizDto, QuestionType, Student, AssignQuizDto } from '@/lib/types';
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
  correctAnswerExplanation?: string;
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
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-1',
      question: '',
      type: 'MULTIPLE_CHOICE' as QuestionType,
      options: ['', '', '', ''],
      correctAnswer: '',
      correctAnswerExplanation: '',
      points: 1,
      order: 1,
    },
  ]);

  // Question UI state
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set(['q-1'])); // Expand first question by default

  // Assignment-related state
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Debug: Log when questions state changes
  console.log('🔵 Component render - questions state:', questions.length, questions);

  // Load students on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  const addQuestion = () => {
    console.log('🔴 Adding question. Current questions:', questions.length);
    console.log('🔴 Current questions array:', questions);
    const newQuestionId = `q-${Date.now()}`;
    const newQuestion = {
      id: newQuestionId,
      question: '',
      type: 'MULTIPLE_CHOICE' as QuestionType,
      options: ['', '', '', ''],
      correctAnswer: '',
      correctAnswerExplanation: '',
      points: 1,
      order: questions.length + 1,
    };
    console.log('🔴 New question to add:', newQuestion);
    const updatedQuestions = [...questions, newQuestion];
    console.log('🔴 Updated questions array:', updatedQuestions);
    console.log('🔴 New questions array length:', updatedQuestions.length);
    setQuestions(updatedQuestions);
    // Auto-expand the new question
    setExpandedQuestions(prev => new Set([...prev, newQuestionId]));
    console.log('🔴 setQuestions called with:', updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const questionToRemove = questions[index];
    setQuestions(questions.filter((_, i) => i !== index));
    // Remove from expanded set
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionToRemove.id || '');
      return newSet;
    });
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

  // Assignment-related functions
  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const studentsData = await studentsService.getAllStudents();
      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
      } else if (studentsData && studentsData.data && Array.isArray(studentsData.data)) {
        setStudents(studentsData.data);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };


  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitType: 'draft' | 'published' = 'draft') => {
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

    // Validate student assignment (now required)
    if (selectedStudents.length === 0) {
      console.log('🟨 Validation failed: No students selected');
      alert('Please select at least one student to assign the quiz to.');
      return;
    }
    console.log('🟨 All validations passed! Proceeding to create quiz...');

    setLoading(true);
    try {
      const quizData: CreateQuizDto = {
        title: quiz.title,
        description: quiz.description || undefined,
        timeLimit: quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit : undefined,
        status: 'draft', // Always create as draft first, then publish after assignment if needed
        questions: questions.map(q => ({
          question: q.question,
          questionType: q.type.toLowerCase(), // Convert to backend enum format
          options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          correctAnswerExplanation: q.correctAnswerExplanation || undefined,
          marks: q.points, // Backend expects 'marks' not 'points'
        })),
      };

      console.log('🟢 Creating quiz with data:', JSON.stringify(quizData, null, 2));
      console.log('🟢 Questions state before submission:', JSON.stringify(questions, null, 2));
      console.log('🟢 Processed questions for submission:', JSON.stringify(quizData.questions, null, 2));
      console.log('🟢 Number of questions being sent:', quizData.questions.length);
      
      const result = await quizzesService.createQuiz(quizData);
      console.log('🟢 Quiz creation result:', result);
      
      // Assign students to the quiz (now mandatory)
      try {
        const assignmentData: AssignQuizDto = {
          studentIds: selectedStudents,
          dueDate: dueDate || undefined,
        };
        await quizzesService.assignQuiz(result.id, assignmentData);
        
        // If originally wanted to publish, try to publish after assignment
        if (submitType === 'published') {
          try {
            await quizzesService.publishQuiz(result.id);
            alert('Quiz created, assigned to students, and published successfully!');
          } catch (publishError) {
            alert('Quiz created and assigned to students. However, it could not be published. You can publish it manually from the quiz list.');
          }
        } else {
          alert(`Quiz created and assigned to ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} successfully!`);
        }
      } catch (assignError) {
        console.error('Assignment failed:', assignError);
        alert('Quiz created successfully, but assignment failed. You can assign students manually from the quiz edit page.');
      }
      
      router.push('/quizzes');
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      if (error instanceof Error && error.message.includes('403')) {
        alert('You do not have permission to create quizzes. Please make sure you are logged in as a teacher.');
      } else if (error?.response?.data?.message?.includes('assign the quiz to at least one student')) {
        alert('Quiz created as draft. To publish, you need to assign it to at least one student first.');
        // Still navigate to quizzes page since the quiz was created
        router.push('/quizzes');
      } else if (error?.response?.status === 400 && submitType === 'published') {
        alert('Quiz created as draft. Cannot publish without student assignments. Please assign students first.');
        router.push('/quizzes');
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

        <form className="space-y-6">
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
              <Button 
                type="button" 
                variant="outline"
                onClick={addQuestion}
              >
                Add Question
              </Button>
            </div>
            
            <div className="space-y-3">
              {questions.map((question, index) => {
                const isExpanded = expandedQuestions.has(question.id || '');
                const questionText = question.question || 'New Question';
                const typeText = question.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={question.id} className="border rounded-lg">
                    {/* Collapsed View */}
                    <div 
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${isExpanded ? 'border-b' : ''}`}
                      onClick={() => toggleQuestionExpansion(question.id || '')}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                            <h3 className="font-medium text-gray-900 truncate max-w-md">
                              {questionText}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {typeText}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                              {question.points} pts
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {questions.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestion(index);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          )}
                          <span className="text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-50">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Question Text *</label>
                            <textarea
                              className="w-full p-3 border rounded-md bg-white"
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
                                className="w-full p-3 border rounded-md bg-white"
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
                                onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 1)}
                                className="bg-white"
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
                                    className="bg-white"
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
                                className="w-full p-3 border rounded-md bg-white"
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
                                className="w-full p-3 border rounded-md bg-white"
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
                                className="w-full p-3 border rounded-md bg-white"
                                rows={2}
                                value={question.correctAnswer}
                                onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                placeholder="Enter the correct answer or key points"
                                required
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Answer Explanation (Optional)</label>
                            <textarea
                              className="w-full p-3 border rounded-md bg-white"
                              rows={3}
                              value={question.correctAnswerExplanation || ''}
                              onChange={(e) => updateQuestion(index, 'correctAnswerExplanation', e.target.value)}
                              placeholder="Explain why this is the correct answer (optional)"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Assignment Section - Now Required */}
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-red-800">Assign Quiz to Students *</h2>
              <p className="text-sm text-red-600 mt-1">You must assign this quiz to at least one student</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="max-w-sm bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Select Students *</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={studentsLoading || students.length === 0}
                  >
                    {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-4">Loading students...</div>
                ) : students.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2">No students found</p>
                    <p className="text-sm text-red-600">Cannot create quiz without students to assign to</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto bg-white rounded-md p-3 border">
                    {students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {student.user.firstName} {student.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.user.email}
                            {student.grade && ` • Grade ${student.grade}`}
                            {student.school && ` • ${student.school}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {selectedStudents.length > 0 ? (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-800">
                      ⚠ Please select at least one student to assign the quiz to
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudents([]);
                    setDueDate('');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
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
            <Button
              type="button"
              variant="secondary"
              disabled={loading || selectedStudents.length === 0}
              onClick={(e) => handleSubmit(e, 'draft')}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              disabled={loading || selectedStudents.length === 0}
              onClick={(e) => handleSubmit(e, 'published')}
            >
              {loading ? 'Publishing...' : 'Create & Publish'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}