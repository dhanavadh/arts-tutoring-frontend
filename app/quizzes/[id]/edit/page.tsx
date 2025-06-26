'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { quizzesService } from '@/lib/api/services/quizzes';
import { studentsService } from '@/lib/api/services/students';
import { CreateQuizDto, QuestionType, Quiz, Student, AssignQuizDto } from '@/lib/types';
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

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = parseInt(params.id as string);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: undefined as number | undefined,
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  // Assignment-related state
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState<string[]>([]);
  
  // Question UI state
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Fetch quiz data on component mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setFetchLoading(true);
        const quizData = await quizzesService.getQuizById(quizId);
        
        // Set quiz details
        setQuiz({
          title: quizData.title,
          description: quizData.description || '',
          timeLimit: quizData.timeLimit || undefined,
          status: quizData.status || 'draft',
        });

        // Format questions for the form
        const formattedQuestions = quizData.questions?.map((q, index) => {
          const questionType = q.questionType?.toUpperCase() as QuestionType || 'MULTIPLE_CHOICE';
          
          return {
            id: q.id?.toString() || `q-${index}`,
            question: q.question,
            type: questionType,
            options: questionType === 'MULTIPLE_CHOICE' ? (q.options || ['', '', '', '']) : [],
            correctAnswer: q.correctAnswer || '',
            correctAnswerExplanation: q.correctAnswerExplanation || '',
            points: q.marks || 1,
            order: q.orderIndex || index + 1,
          };
        }) || [];

        if (formattedQuestions.length === 0) {
          // Add default question if none exist
          formattedQuestions.push({
            id: 'q-1',
            question: '',
            type: 'MULTIPLE_CHOICE' as QuestionType,
            options: ['', '', '', ''],
            correctAnswer: '',
            correctAnswerExplanation: '',
            points: 1,
            order: 1,
          });
        }

        setQuestions(formattedQuestions);

        // Load students for assignment
        loadStudents();
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz');
      } finally {
        setFetchLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const addQuestion = () => {
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
    setQuestions([...questions, newQuestion]);
    // Auto-expand the new question
    setExpandedQuestions(prev => new Set([...prev, newQuestionId]));
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
    }
    
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent, submitType: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    
    if (!quiz.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      alert(`Please fill in all questions. Found ${emptyQuestions.length} empty questions.`);
      return;
    }

    const mcQuestionsWithEmptyOptions = questions.filter(q => 
      q.type === 'MULTIPLE_CHOICE' && q.options.some(opt => !opt.trim())
    );
    if (mcQuestionsWithEmptyOptions.length > 0) {
      alert(`Please fill in all multiple choice options. Found ${mcQuestionsWithEmptyOptions.length} questions with empty options.`);
      return;
    }

    const questionsWithoutAnswers = questions.filter(q => !q.correctAnswer.trim());
    if (questionsWithoutAnswers.length > 0) {
      alert(`Please provide correct answers for all questions. Found ${questionsWithoutAnswers.length} questions without answers.`);
      return;
    }

    setLoading(true);
    try {
      const quizData: CreateQuizDto = {
        title: quiz.title,
        description: quiz.description || undefined,
        timeLimit: quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit : undefined,
        status: submitType,
        questions: questions.map(q => ({
          question: q.question,
          questionType: q.type.toLowerCase(),
          options: q.type === 'MULTIPLE_CHOICE' ? q.options : undefined,
          correctAnswer: q.correctAnswer,
          correctAnswerExplanation: q.correctAnswerExplanation || undefined,
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

  const handlePublish = async () => {
    try {
      await quizzesService.publishQuiz(quizId);
      setQuiz(prev => ({ ...prev, status: 'published' }));
      // Students should already be loaded
      if (students.length === 0) {
        loadStudents();
      }
      alert('Quiz published successfully!');
    } catch (error: any) {
      console.error('Error publishing quiz:', error);
      if (error?.response?.data?.message?.includes('assign the quiz to at least one student')) {
        alert('Cannot publish quiz. Please assign the quiz to at least one student before publishing.');
      } else if (error?.response?.status === 400) {
        alert(error.response.data.message || 'Cannot publish quiz. Please check if students are assigned.');
      } else {
        alert('Failed to publish quiz. Please try again.');
      }
    }
  };

  const handleUnpublish = async () => {
    try {
      await quizzesService.unpublishQuiz(quizId);
      setQuiz(prev => ({ ...prev, status: 'draft' }));
      // Clear assignment data when unpublished
      setSelectedStudents([]);
      setDueDate('');
      alert('Quiz unpublished successfully!');
    } catch (error) {
      console.error('Error unpublishing quiz:', error);
      alert('Failed to unpublish quiz');
    }
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

  const handleAssignQuiz = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setAssigning(true);
    try {
      const assignmentData: AssignQuizDto = {
        studentIds: selectedStudents,
        dueDate: dueDate || undefined,
      };

      await quizzesService.assignQuiz(quizId, assignmentData);
      
      // Show success message with student names
      const assignedStudentNames = students
        .filter(s => selectedStudents.includes(s.id))
        .map(s => `${s.user.firstName} ${s.user.lastName}`)
        .join(', ');
      
      alert(`Quiz successfully assigned to ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''}:\n${assignedStudentNames}`);
      
      // Add to recent assignments for visual feedback
      const assignmentSummary = `${new Date().toLocaleString()}: Assigned to ${assignedStudentNames}`;
      setRecentAssignments(prev => [assignmentSummary, ...prev].slice(0, 5)); // Keep only last 5
      
      // Clear the form
      setSelectedStudents([]);
      setDueDate('');
    } catch (err) {
      console.error('Error assigning quiz:', err);
      alert('Failed to assign quiz. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const generatePreviewData = () => {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const questionTypes = questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      quiz: {
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        status: quiz.status,
        totalQuestions: questions.length,
        totalPoints,
        questionTypes,
      },
      questions: questions.map((q, index) => ({
        number: index + 1,
        question: q.question,
        type: q.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.correctAnswerExplanation,
        points: q.points,
      })),
      assignment: {
        selectedStudents: selectedStudents.length,
        studentNames: students
          .filter(s => selectedStudents.includes(s.id))
          .map(s => `${s.user.firstName} ${s.user.lastName}`),
        dueDate: dueDate,
      }
    };
  };

  if (fetchLoading) return <div className="p-6">Loading quiz...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Edit Quiz</h1>
              <p className="text-gray-600">Edit your quiz details and questions</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded text-sm ${
                quiz.status === 'published'
                  ? 'bg-green-100 text-green-800' 
                  : quiz.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {quiz.status === 'published' ? 'Published' : quiz.status === 'draft' ? 'Draft' : 'Archived'}
              </span>
            </div>
          </div>
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

          {/* Assignment Section */}
          <Card className="p-6 border-purple-200 bg-purple-50">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-purple-800">Assign Quiz to Students</h2>
              <p className="text-sm text-purple-600 mt-1">
                {quiz.status === 'published' 
                  ? 'Assign this published quiz to students' 
                  : 'Assign students to this quiz (can be done while in draft)'}
              </p>
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
                    <label className="block text-sm font-medium">Select Students</label>
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
                    <p className="text-gray-600 text-center py-4">No students found</p>
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

                  {selectedStudents.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
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
                  <Button
                    type="button"
                    onClick={handleAssignQuiz}
                    disabled={assigning || selectedStudents.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>

                {/* Recent Assignments */}
                {recentAssignments.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Recent Assignments:</h4>
                    <div className="space-y-1">
                      {recentAssignments.map((assignment, index) => (
                        <p key={index} className="text-xs text-green-700">
                          {assignment}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          </Card>

          <div className="flex justify-between">
            <div className="flex gap-2">
              {quiz.status === 'draft' ? (
                <Button
                  type="button"
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Publish Quiz
                </Button>
              ) : quiz.status === 'published' ? (
                <Button
                  type="button"
                  onClick={handleUnpublish}
                  variant="outline"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  Unpublish Quiz
                </Button>
              ) : null}
            </div>
            
            <div className="flex gap-4">
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
                onClick={handlePreview}
              >
                Preview Quiz
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const previewData = generatePreviewData();
                  const jsonString = JSON.stringify(previewData, null, 2);
                  const blob = new Blob([jsonString], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${quiz.title || 'quiz'}_preview.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Generate Preview Data
              </Button>
            </div>
          </div>
        </form>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Quiz Preview</h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close Preview
                  </Button>
                </div>

                {(() => {
                  const previewData = generatePreviewData();
                  return (
                    <div className="space-y-6">
                      {/* Quiz Overview */}
                      <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Quiz Overview</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Title</p>
                            <p className="font-medium">{previewData.quiz.title || 'Untitled Quiz'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              previewData.quiz.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : previewData.quiz.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {previewData.quiz.status.charAt(0).toUpperCase() + previewData.quiz.status.slice(1)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Questions</p>
                            <p className="font-medium">{previewData.quiz.totalQuestions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Points</p>
                            <p className="font-medium">{previewData.quiz.totalPoints}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Time Limit</p>
                            <p className="font-medium">{previewData.quiz.timeLimit ? `${previewData.quiz.timeLimit} minutes` : 'No limit'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Question Types</p>
                            <p className="font-medium">
                              {Object.entries(previewData.quiz.questionTypes).map(([type, count]) => 
                                `${type.replace('_', ' ')}: ${count}`
                              ).join(', ') || 'None'}
                            </p>
                          </div>
                        </div>
                        {previewData.quiz.description && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600">Description</p>
                            <p className="text-gray-800">{previewData.quiz.description}</p>
                          </div>
                        )}
                      </Card>

                      {/* Questions */}
                      <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Questions</h3>
                        <div className="space-y-4">
                          {previewData.questions.map((question) => (
                            <div key={question.number} className="border-l-4 border-blue-500 pl-4 py-2">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">Question {question.number}</h4>
                                <div className="flex gap-2">
                                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">{question.type}</span>
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{question.points} pts</span>
                                </div>
                              </div>
                              <p className="text-gray-800 mb-2">{question.question}</p>
                              
                              {question.options && question.options.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-sm text-gray-600 mb-1">Options:</p>
                                  <ul className="list-disc list-inside text-sm text-gray-700">
                                    {question.options.map((option, index) => (
                                      <li key={index} className={option === question.correctAnswer ? 'font-medium text-green-600' : ''}>
                                        {option} {option === question.correctAnswer && '✓'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="text-sm">
                                <p className="text-gray-600">Correct Answer: <span className="font-medium text-green-600">{question.correctAnswer}</span></p>
                                {question.explanation && (
                                  <p className="text-gray-600 mt-1">Explanation: <span className="text-gray-800">{question.explanation}</span></p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Assignment Info */}
                      <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Assignment Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Students Assigned</p>
                            <p className="font-medium">{previewData.assignment.selectedStudents}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Due Date</p>
                            <p className="font-medium">{previewData.assignment.dueDate ? new Date(previewData.assignment.dueDate).toLocaleString() : 'No due date set'}</p>
                          </div>
                        </div>
                        {previewData.assignment.studentNames.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Assigned Students:</p>
                            <div className="flex flex-wrap gap-2">
                              {previewData.assignment.studentNames.map((name, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}