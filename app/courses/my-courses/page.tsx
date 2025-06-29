'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { coursesApi } from '@/lib/api/services';
import { Course } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/toast';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      const data = await coursesApi.getMyCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (courseId: number, status: 'published' | 'draft') => {
    try {
      await coursesApi.publishCourse(courseId, { status });
      toast.success(`Course ${status === 'published' ? 'published' : 'unpublished'} successfully!`);
      loadMyCourses();
    } catch (error: any) {
      console.error('Failed to update course status:', error);
      toast.error(error.response?.data?.message || 'Failed to update course status');
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await coursesApi.deleteCourse(courseId);
      toast.success('Course deleted successfully!');
      loadMyCourses();
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">Only teachers and admins can view this page.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading your courses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <div className="flex gap-4">
          <Link href="/courses">
            <Button variant="secondary">Browse All Courses</Button>
          </Link>
          <Link href="/courses/create">
            <Button>Create New Course</Button>
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
          <p className="text-gray-600 mb-4">Create your first course to get started!</p>
          <Link href="/courses/create">
            <Button>Create Course</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <Card key={course.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </Badge>
                    {course.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{course.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge variant="outline">{course.category}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{course.enrollmentCount}</div>
                  <div className="text-sm text-gray-600">Enrolled Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{course.viewCount}</div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const numPrice = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
                      return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">Price</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {course.estimatedDuration || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Duration (hours)</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/courses/${course.id}`}>
                  <Button variant="outline">View Course</Button>
                </Link>
                
                <Link href={`/courses/${course.id}/edit`}>
                  <Button variant="outline">Edit</Button>
                </Link>

                <Link href={`/courses/${course.id}/enrollments`}>
                  <Button variant="outline">
                    View Enrollments ({course.enrollmentCount})
                  </Button>
                </Link>

                {course.status === 'draft' ? (
                  <Button
                    onClick={() => handlePublish(course.id, 'published')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Publish
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePublish(course.id, 'draft')}
                    variant="secondary"
                  >
                    Unpublish
                  </Button>
                )}

                <Button
                  onClick={() => handleDelete(course.id)}
                  variant="destructive"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}