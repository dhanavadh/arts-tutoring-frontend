'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { studentsService } from '@/lib/api/services/students';
import { CreateQuizDto, CreateQuizQuestionDto, QuestionType, Student, AssignQuizDto, UserRole } from '@/lib/types';
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

// API response type
interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: number;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState<number | null>(null);
  
  const [assignmentStatus, setAssignmentStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
    assignedStudents: number[];
    failedAssignments: number[];
  }>({
    loading: false,
    error: null,
    success: false,
    assignedStudents: [],
    failedAssignments: []
  });

  const { user } = useAuth();
  console.log('Current user in CreateQuizPage:', user);

  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: undefined as number | undefined,
    maxAttempts: 1 as number | undefined,
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([{
    id: 'q-1',
    question: '',
    type: 'MULTIPLE_CHOICE',
    options: ['', '', '', ''],
    correctAnswer: '',
    correctAnswerExplanation: '',
    points: 1,
    order: 1,
  }]);

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set(['q-1']));
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
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

  // Type-safe question update handler
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
        } else {
          question.options = [];
          question.correctAnswer = '';
        }
        break;
      case 'question':
        question.question = value as string;
        break;
      case 'correctAnswer':
        question.correctAnswer = value as string;
        break;
      case 'correctAnswerExplanation':
        question.correctAnswerExplanation = value as string;
        break;
      case 'points':
        question.points = value as number;
        break;
      case 'order':
        question.order = value as number;
        break;
    }
    
    updated[index] = question;
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  // Assignment-related functions
  // Load students with proper type handling
  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const response = await studentsService.getAllStudents() as Student[] | ApiResponse<Student[]>;
      let studentsData: Student[] = [];
      
      if (Array.isArray(response)) {
        studentsData = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        studentsData = response.data;
      }
      
      setStudents(studentsData);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setStudents([]);
      // Show error in UI
      setAssignmentStatus(prev => ({
        ...prev,
        error: 'Failed to load students. Please refresh the page or try again later.',
        loading: false,
        success: false,
        assignedStudents: [],
        failedAssignments: []
      }));
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

  const assignQuizToStudents = async (quizId: number, studentIds: number[]) => {
    console.log('Starting quiz assignment process:', { quizId, studentIds, dueDate });
    setAssignmentStatus(prev => ({ 
      ...prev, 
      loading: true,
      error: null,
      success: false,
      assignedStudents: [],
      failedAssignments: []
    }));

    try {
      const assignmentData: AssignQuizDto = {
        studentIds: studentIds,
        dueDate: dueDate || undefined,
      };
      
      console.log('Sending assignment request:', assignmentData);
      const assignments = await quizzesService.assignQuiz(quizId, assignmentData);
      console.log('Assignment response details:', {
        assignments,
        count: Array.isArray(assignments) ? assignments.length : 0,
        studentIds,
        assignedStudentIds: Array.isArray(assignments) ? assignments.map(a => a.studentId) : []
      });

      if (Array.isArray(assignments) && assignments.length > 0) {
        // Get list of successfully assigned student IDs
        const assignedStudentIds = assignments.map(a => a.studentId);
        // Find any students that weren't assigned
        const failedStudentIds = studentIds.filter(id => !assignedStudentIds.includes(id));

        setAssignmentStatus(prev => ({
          ...prev,
          loading: false,
          assignedStudents: assignedStudentIds,
          failedAssignments: failedStudentIds,
          error: failedStudentIds.length > 0 ? `Failed to assign ${failedStudentIds.length} student(s)` : null,
          success: assignedStudentIds.length > 0
        }));

        // Show appropriate message based on results
        if (failedStudentIds.length === 0) {
          alert(`Quiz successfully assigned to ${assignedStudentIds.length} student(s)!`);
        } else {
          alert(`Quiz assigned to ${assignedStudentIds.length} student(s), but failed for ${failedStudentIds.length} student(s).`);
        }
      } else {
        throw new Error('No assignments were created');
      }

    } catch (error: any) {
      console.error('Assignment error details:', {
        error,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.message 
        ? `Failed to assign quiz: ${error.response.data.message}`
        : error.message
        ? `Error: ${error.message}`
        : 'Failed to assign quiz to students. Please try again.';

      setAssignmentStatus(prev => ({
        ...prev,
        loading: false,
        assignedStudents: [],
        failedAssignments: studentIds,
        error: errorMessage,
        success: false
      }));

      alert(`Failed to assign quiz: ${errorMessage}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitType: 'draft' | 'published') => {
    e.preventDefault();
    
    // Validate basic quiz data
    if (!quiz.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    // Validate questions
    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      alert(`Please fill in all questions. Found ${emptyQuestions.length} empty questions.`);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the quiz
      // Map frontend question types to backend format
      const mapQuestionType = (frontendType: QuestionType): string => {
        const typeMap = {
          'MULTIPLE_CHOICE': 'multiple_choice',
          'TRUE_FALSE': 'true_false', 
          'SHORT_ANSWER': 'short_answer',
          'ESSAY': 'essay'
        };
        return typeMap[frontendType] || frontendType.toLowerCase().replace('_', '_');
      };

      // Map questions to match the backend DTO format
      const mappedQuestions: CreateQuizQuestionDto[] = questions.map((q, index) => ({
        question: q.question.trim(),
        questionType: mapQuestionType(q.type as QuestionType),
        options: q.type === 'MULTIPLE_CHOICE' ? q.options.filter(opt => opt.trim()) : undefined,
        correctAnswer: q.correctAnswer.trim(),
        correctAnswerExplanation: q.correctAnswerExplanation?.trim() || undefined,
        marks: q.points,
      }));

      console.log('Mapped questions:', mappedQuestions);
      
      const quizData: CreateQuizDto = {
        title: quiz.title,
        description: quiz.description || undefined,
        timeLimit: quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit : undefined,
        maxAttempts: quiz.maxAttempts && quiz.maxAttempts > 0 ? quiz.maxAttempts : 1,
        status: submitType,
        questions: mappedQuestions,
      };

      console.log('Creating quiz...', quizData);
      const createdQuiz = await quizzesService.createQuiz(quizData);
      console.log('Quiz created successfully:', createdQuiz);

      // Set the created quiz ID
      setCreatedQuizId(createdQuiz.id);
      
      alert(submitType === 'published' ? 'Quiz created and published successfully!' : 'Quiz saved as draft successfully.');

      // If students are selected, show assignment modal
      if (selectedStudents.length > 0) {
        setShowAssignmentModal(true);
      } else {
        router.push('/quizzes');
      }

    } catch (error: any) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignQuiz = async () => {
    if (!createdQuizId || selectedStudents.length === 0) return;

    setAssignmentStatus(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
      assignedStudents: [],
      failedAssignments: []
    }));

    try {
      const assignmentData: AssignQuizDto = {
        studentIds: selectedStudents,
        dueDate: dueDate || undefined,
      };

      await quizzesService.assignQuiz(createdQuizId, assignmentData);
      
      setAssignmentStatus(prev => ({
        ...prev,
        success: true,
        assignedStudents: selectedStudents,
      }));

      alert(`Successfully assigned quiz to ${selectedStudents.length} student(s)`);
    } catch (error) {
      console.error('Error assigning quiz:', error);
      alert('Failed to assign quiz to students. You can try assigning them later from the quiz page.');
    } finally {
      setShowAssignmentModal(false);
      router.push('/quizzes');
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
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
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Attempts *</label>
                <Input
                  type="number"
                  min="1"
                  value={quiz.maxAttempts || 1}
                  onChange={(e) => setQuiz({ ...quiz, maxAttempts: e.target.value ? parseInt(e.target.value) : 1 })}
                  placeholder="Number of attempts allowed"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  How many times can a student take this quiz? Default is 1.
                </p>
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
                            {student.schoolGrade && ` • Grade ${student.schoolGrade}`}
                            {student.level && ` • Level: ${student.level}`}
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

          {/* Assignment Status */}
          {assignmentStatus.loading && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏳ Assigning quiz to selected students...
              </p>
            </div>
          )}

          {assignmentStatus.error && (
            <div className="mt-3 p-3 bg-red-100 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠ {assignmentStatus.error}
              </p>
            </div>
          )}

          {assignmentStatus.success && (
            <div className="mt-3 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Quiz assigned successfully to {assignmentStatus.assignedStudents.length} student(s)
                {assignmentStatus.failedAssignments.length > 0 && (
                  <span className="block mt-1 text-yellow-700">
                    ⚠ Failed to assign to {assignmentStatus.failedAssignments.length} student(s)
                  </span>
                )}
              </p>
            </div>
          )}

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
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Publishing...' : 'Create & Publish'}
            </Button>
          </div>
        </form>

        {showAssignmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Assign Quiz to Students</h2>
              <p className="mb-4">Would you like to assign this quiz to the selected students now?</p>
              <p className="text-sm text-gray-600 mb-4">
                Selected students: {selectedStudents.length}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAssignmentModal(false);
                    router.push('/quizzes');
                  }}
                >
                  Skip
                </Button>
                <Button
                  type="button"
                  onClick={handleAssignQuiz}
                  disabled={assignmentStatus.loading}
                >
                  {assignmentStatus.loading ? 'Assigning...' : 'Assign Now'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}