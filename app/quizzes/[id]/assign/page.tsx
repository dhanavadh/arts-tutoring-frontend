'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quizzesService } from '@/lib/api/services/quizzes';
import { studentsService } from '@/lib/api/services/students';
import { Quiz, Student, AssignQuizDto, UserRole } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function AssignQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const quizId = parseInt(params.id as string);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizData, studentsData, assignmentsData] = await Promise.all([
          quizzesService.getQuizById(quizId),
          studentsService.getAllStudents(),
          quizzesService.getQuizAssignments(quizId).catch(() => []) // Don't fail if assignments can't be loaded
        ]);
        
        setQuiz(quizData);
        
        // Handle different possible response structures for students
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
        } else if (studentsData && typeof studentsData === 'object' && 'data' in studentsData && Array.isArray((studentsData as any).data)) {
          setStudents((studentsData as any).data);
        } else {
          setStudents([]);
        }
        
        // Handle assignments data to get already assigned student IDs
        if (Array.isArray(assignmentsData)) {
          const alreadyAssignedIds = assignmentsData.map((assignment: any) => assignment.studentId);
          setAssignedStudents(alreadyAssignedIds);
          console.log('Already assigned student IDs:', alreadyAssignedIds);
        }
        
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
        setStudents([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchData();
    }
  }, [quizId]);

  const handleStudentToggle = (studentId: number) => {
    // Don't allow toggling already assigned students
    if (assignedStudents.includes(studentId)) {
      return;
    }
    
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const availableStudents = students.filter(s => !assignedStudents.includes(s.id));
    const availableStudentIds = availableStudents.map(s => s.id);
    
    if (selectedStudents.length === availableStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudentIds);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      addToast({
        type: 'warning',
        message: 'Please select at least one student to assign the quiz to.'
      });
      return;
    }

    setAssigning(true);
    try {
      const assignmentData: AssignQuizDto = {
        studentIds: selectedStudents,
        dueDate: dueDate || undefined,
      };

      await quizzesService.assignQuiz(quizId, assignmentData);
      
      // Get selected student names for toast notification
      const selectedStudentNames = students
        .filter(student => selectedStudents.includes(student.id))
        .map(student => `${student.user.firstName} ${student.user.lastName}`)
        .join(', ');
      
      addToast({
        type: 'success',
        title: 'Quiz Assigned Successfully!',
        message: `Quiz "${quiz?.title}" has been assigned to: ${selectedStudentNames}`,
        duration: 6000
      });
      
      // Redirect after a brief delay to show the toast, with created=true parameter to trigger refresh
      setTimeout(() => {
        router.push(`/quizzes/${quizId}?created=true`);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error assigning quiz:', err);
      let errorMessage = 'Failed to assign quiz. Please try again.';
      
      if (err.message?.includes('Quiz not found or not active')) {
        errorMessage = 'Quiz not found or is not active. Please check if the quiz exists and is not archived.';
      } else if (err.message?.includes('Students not found')) {
        errorMessage = 'One or more selected students were not found. Please refresh the page and try again.';
      } else if (err.message?.includes('already have assignments')) {
        errorMessage = 'Some selected students are already assigned to this quiz. The page will refresh to show current assignments.';
        // Refresh the page to show updated assignments
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      addToast({
        type: 'error',
        title: 'Assignment Failed',
        message: errorMessage
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignStudent = async (studentId: number) => {
    if (!confirm('Are you sure you want to unassign this student from the quiz? This action cannot be undone.')) {
      return;
    }

    try {
      setUnassigning(studentId);
      setError(null);
      
      const result = await quizzesService.removeQuizAssignment(quizId, studentId);
      
      // Remove from assigned students list
      setAssignedStudents(prev => prev.filter(id => id !== studentId));
      
      // Check if quiz was automatically unpublished
      if (result.message.includes('automatically unpublished')) {
        // Update quiz status if it was changed
        if (quiz) {
          setQuiz({ ...quiz, status: 'draft' });
        }
        
        addToast({
          type: 'warning',
          title: 'Student Unassigned & Quiz Unpublished',
          message: 'Student unassigned successfully. Quiz has been automatically unpublished since no students remain.',
          duration: 6000
        });
      } else {
        addToast({
          type: 'success',
          message: 'Student successfully unassigned from quiz'
        });
      }
    } catch (err: any) {
      console.error('Error unassigning student:', err);
      setError(err.message || 'Failed to unassign student');
      addToast({
        type: 'error',
        message: 'Failed to unassign student. Please try again.'
      });
    } finally {
      setUnassigning(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!quiz) return <div className="p-6">Quiz not found</div>;

  // Check if quiz is archived (archived quizzes cannot be assigned)
  if (quiz.status === 'archived') {
    return (
      <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Cannot Assign Quiz</h1>
            <p className="text-red-600">Archived quizzes cannot be assigned to students.</p>
          </div>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg">{quiz.title}</h3>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Status: <span className="font-medium capitalize">{quiz.status}</span>
              </p>
            </div>
            
            <div className="mt-6 flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
              >
                View Quiz Details
              </Button>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Assign Quiz</h1>
          <p className="text-gray-600">Assign "{quiz.title}" to students</p>
        </div>

        <form onSubmit={handleAssign} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-lg">{quiz.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  quiz.status === 'published' ? 'bg-green-100 text-green-800' :
                  quiz.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                </span>
              </div>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 mt-2">
                <span>{quiz.questions?.length || 0} questions</span>
                <span>{quiz.totalMarks || quiz.totalPoints || 0} points</span>
                {quiz.timeLimit && <span>{quiz.timeLimit} minutes</span>}
              </div>
              {quiz.status === 'draft' && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  <p><strong>Note:</strong> This quiz is in draft status. Students will only be able to take it after you publish it.</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Assignment Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
              <DateTimePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select due date and time"
                minDate={new Date()}
                className="max-w-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot select a date in the past</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Manage Student Assignments</h2>
                {assignedStudents.length > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''} currently assigned
                    <span className="text-gray-500 ml-1">(click "Unassign" to remove)</span>
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={students.filter(s => !assignedStudents.includes(s.id)).length === 0}
              >
                {selectedStudents.length === students.filter(s => !assignedStudents.includes(s.id)).length ? 'Deselect All' : 'Select All Available'}
              </Button>
            </div>

            {students.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No students found</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {students.map((student) => {
                  const isAlreadyAssigned = assignedStudents.includes(student.id);
                  const isSelected = selectedStudents.includes(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        isAlreadyAssigned 
                          ? 'bg-green-50 border-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <label className="flex items-center space-x-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAlreadyAssigned || isSelected}
                          onChange={() => handleStudentToggle(student.id)}
                          disabled={isAlreadyAssigned}
                          className={`w-4 h-4 ${isAlreadyAssigned ? 'opacity-50' : ''}`}
                        />
                        <div className="flex-1">
                          <div className={`font-medium flex items-center gap-2 ${
                            isAlreadyAssigned ? 'text-green-700' : ''
                          }`}>
                            {student.user.firstName} {student.user.lastName}
                            {isAlreadyAssigned && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Already Assigned
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${
                            isAlreadyAssigned ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {student.user.email}
                            {student.schoolGrade && ` • Grade ${student.schoolGrade}`}
                            {student.level && ` • Level: ${student.level}`}
                          </div>
                        </div>
                      </label>
                      
                      {isAlreadyAssigned && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnassignStudent(student.id)}
                          disabled={unassigning === student.id}
                          className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          {unassigning === student.id ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Removing...</span>
                            </div>
                          ) : (
                            'Unassign'
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedStudents.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {selectedStudents.length} new student{selectedStudents.length !== 1 ? 's' : ''} selected for assignment
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Click the "Assign" button below to save your changes
                    </p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {assignedStudents.length > 0 && students.filter(s => !assignedStudents.includes(s.id)).length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  All students are already assigned to this quiz. You can manage existing assignments from the quiz details page.
                </p>
              </div>
            )}
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
              type="submit"
              disabled={assigning || selectedStudents.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {assigning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Assigning...</span>
                </div>
              ) : (
                `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}