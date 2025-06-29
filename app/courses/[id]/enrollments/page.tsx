'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api/services';
import { Course, CourseEnrollment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/toast';

export default function CourseEnrollmentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const courseId = parseInt(params.id as string);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourseAndEnrollments();
    }
  }, [courseId]);

  const loadCourseAndEnrollments = async () => {
    try {
      const [courseData, enrollmentsData] = await Promise.all([
        coursesApi.getCourse(courseId),
        coursesApi.getCourseEnrollments(courseId),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error(error.response?.data?.message || 'Failed to load course data');
      if (error.response?.status === 403) {
        router.push('/courses/my-courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">Only teachers and admins can view course enrollments.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading enrollments...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Course Not Found</h1>
          <p className="mt-2">The requested course could not be found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Course Enrollments</h1>
            <h2 className="text-xl text-gray-600 mb-4">{course.title}</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{enrollments.length}</div>
            <div className="text-sm text-gray-600">Total Enrollments</div>
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No enrollments yet</h3>
          <p className="text-gray-600">Students haven't enrolled in this course yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {enrollment.student.user.firstName} {enrollment.student.user.lastName}
                    </h3>
                    <Badge className={getStatusColor(enrollment.status)}>
                      {enrollment.status.replace('_', ' ').charAt(0).toUpperCase() + 
                       enrollment.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Email: {enrollment.student.user.email}</div>
                    <div>Enrolled: {formatDate(enrollment.enrolledAt)}</div>
                    {enrollment.completedAt && (
                      <div>Completed: {formatDate(enrollment.completedAt)}</div>
                    )}
                    {enrollment.student.schoolGrade && (
                      <div>Grade: {enrollment.student.schoolGrade}</div>
                    )}
                  </div>
                </div>
                
                <div className="text-right min-w-[120px]">
                  <div className="text-lg font-semibold mb-2">
                    {enrollment.progressPercentage.toFixed(1)}%
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(enrollment.progressPercentage)}`}
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {enrollment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-1">Student Notes:</div>
                  <div className="text-sm text-gray-600">{enrollment.notes}</div>
                </div>
              )}

              {enrollment.student.learningGoals && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm font-medium text-blue-700 mb-1">Learning Goals:</div>
                  <div className="text-sm text-blue-600">{enrollment.student.learningGoals}</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Enrollment Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {enrollments.filter(e => e.status === 'enrolled').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {enrollments.filter(e => e.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {enrollments.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {enrollments.filter(e => e.status === 'dropped').length}
            </div>
            <div className="text-sm text-gray-600">Dropped</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold text-gray-700">
            Average Progress: {
              enrollments.length > 0 
                ? (enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / enrollments.length).toFixed(1)
                : '0'
            }%
          </div>
        </div>
      </div>
    </div>
  );
}