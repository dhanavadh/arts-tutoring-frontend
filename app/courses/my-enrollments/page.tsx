'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { coursesApi } from '@/lib/api/services';
import { CourseEnrollment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/toast';

export default function MyEnrollmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyEnrollments();
  }, []);

  const loadMyEnrollments = async () => {
    try {
      const data = await coursesApi.getMyEnrollments();
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
      toast.error('Failed to load your enrollments');
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

  const getProgressBarColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (user?.role !== 'student') {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">Only students can view their enrollments.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your enrollments...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Course Enrollments</h1>
        <Link href="/courses">
          <Button>Browse More Courses</Button>
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No enrollments yet</h2>
          <p className="text-gray-600 mb-4">Enroll in courses to start learning!</p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{enrollment.course.title}</h3>
                    <Badge className={getStatusColor(enrollment.status)}>
                      {enrollment.status.replace('_', ' ').charAt(0).toUpperCase() + 
                       enrollment.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{enrollment.course.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{enrollment.course.level}</Badge>
                    <Badge variant="outline">{enrollment.course.category}</Badge>
                    {enrollment.course.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <span className="font-medium">Instructor:</span>{' '}
                      {enrollment.course.teacher.user.firstName} {enrollment.course.teacher.user.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Enrolled:</span>{' '}
                      {formatDate(enrollment.enrolledAt)}
                    </div>
                    {enrollment.completedAt && (
                      <div>
                        <span className="font-medium">Completed:</span>{' '}
                        {formatDate(enrollment.completedAt)}
                      </div>
                    )}
                    {enrollment.course.estimatedDuration && (
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {enrollment.course.estimatedDuration} hours
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right min-w-[150px]">
                  <div className="text-2xl font-bold mb-2">
                    {enrollment.progressPercentage.toFixed(1)}%
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full ${getProgressBarColor(enrollment.progressPercentage)}`}
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>

              {enrollment.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm font-medium text-blue-700 mb-1">Your Notes:</div>
                  <div className="text-sm text-blue-600">{enrollment.notes}</div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Link href={`/courses/${enrollment.course.id}`}>
                  <Button>Continue Learning</Button>
                </Link>
                
                {enrollment.status === 'completed' && (
                  <Button variant="outline">
                    View Certificate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {enrollments.length > 0 && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Learning Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {enrollments.filter(e => e.status === 'enrolled' || e.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">Active Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {enrollments.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / enrollments.length) || 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {enrollments.reduce((sum, e) => sum + (e.course.estimatedDuration || 0), 0)}h
              </div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}