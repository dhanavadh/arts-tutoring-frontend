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

export default function CoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getPublishedCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    if (!user || user.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    setEnrollingCourseId(courseId);
    try {
      await coursesApi.enrollInCourse({ courseId });
      toast.success('Successfully enrolled in course!');
      loadCourses(); // Refresh to update enrollment count
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Courses</h1>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <div className="flex gap-4">
            <Link href="/courses/my-courses">
              <Button variant="secondary">My Courses</Button>
            </Link>
            <Link href="/courses/create">
              <Button>Create Course</Button>
            </Link>
          </div>
        )}
        {user?.role === 'student' && (
          <Link href="/courses/my-enrollments">
            <Button variant="secondary">My Enrollments</Button>
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No courses available</h2>
          <p className="text-gray-600">Check back later for new courses!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
              {course.featuredImage && course.featuredImage.trim() !== '' && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}/uploads/courses/${course.featuredImage}`}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold">{course.title}</h3>
                {course.isFeatured && (
                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                )}
              </div>

              <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getLevelColor(course.level)}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </Badge>
                <Badge variant="outline">{course.category}</Badge>
                {course.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Instructor:</span>
                  <span>{course.teacher.user.firstName} {course.teacher.user.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{course.estimatedDuration ? `${course.estimatedDuration}h` : 'Self-paced'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enrolled:</span>
                  <span>
                    {course.enrollmentCount}
                    {course.maxEnrollments && ` / ${course.maxEnrollments}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-semibold">{formatPrice(course.price)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/courses/${course.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                
                {user?.role === 'student' && (
                  <Button
                    onClick={() => handleEnroll(course.id)}
                    disabled={
                      enrollingCourseId === course.id ||
                      (course.maxEnrollments && course.enrollmentCount >= course.maxEnrollments)
                    }
                    className="flex-1"
                  >
                    {enrollingCourseId === course.id
                      ? 'Enrolling...'
                      : course.maxEnrollments && course.enrollmentCount >= course.maxEnrollments
                      ? 'Full'
                      : 'Enroll'
                    }
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}