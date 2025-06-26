'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { quizzesService } from '@/lib/api/services/quizzes';
import { studentsService } from '@/lib/api/services/students';
import { Quiz, Student, AssignQuizDto } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/lib/components/protected-route';

export default function AssignQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = parseInt(params.id as string);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizData, studentsData] = await Promise.all([
          quizzesService.getQuizById(quizId),
          studentsService.getAllStudents()
        ]);
        setQuiz(quizData);
        // Handle different possible response structures
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
        } else if (studentsData && studentsData.data && Array.isArray(studentsData.data)) {
          setStudents(studentsData.data);
        } else {
          setStudents([]);
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      router.push('/quizzes');
    } catch (err) {
      console.error('Error assigning quiz:', err);
      alert('Failed to assign quiz. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!quiz) return <div className="p-6">Quiz not found</div>;

  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Assign Quiz</h1>
          <p className="text-gray-600">Assign "{quiz.title}" to students</p>
        </div>

        <form onSubmit={handleAssign} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg">{quiz.title}</h3>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 mt-2">
                <span>{quiz.questions?.length || 0} questions</span>
                <span>{quiz.totalPoints} points</span>
                {quiz.timeLimit && <span>{quiz.timeLimit} minutes</span>}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Assignment Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Students</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {students.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No students found</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
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
            >
              {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}