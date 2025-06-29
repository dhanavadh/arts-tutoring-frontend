'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { coursesApi } from '@/lib/api/services';
import { Course } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { CourseContentRenderer } from '@/components/courses/course-content-renderer';
import { TeacherDetailsModal } from '@/components/courses/teacher-details-modal';

export default function CourseDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const data = await coursesApi.getCourse(courseId);
      setCourse(data);
      
      // Check if user is already enrolled
      if (user?.role === 'student' && data.enrollments) {
        const userEnrollment = data.enrollments.find(
          enrollment => enrollment.student.user.id === user.id
        );
        setIsEnrolled(!!userEnrollment);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    // Redirect to login if user is not authenticated
    if (!user) {
      toast.error('Please login to enroll in courses');
      router.push('/login');
      return;
    }

    if (user.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }

    setEnrolling(true);
    try {
      await coursesApi.enrollInCourse({ courseId });
      toast.success('Successfully enrolled in course!');
      setIsEnrolled(true);
      loadCourse(); // Refresh to update enrollment count
    } catch (error: any) {
      console.error('Failed to enroll:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProfileImageUrl = (profileImage: string | null) => {
    if (!profileImage) return null;
    // If it's already a full URL (starts with http), return as is
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    // Otherwise, assume it's a filename in uploads directory
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}/uploads/users/${profileImage}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Course Not Found</h1>
          <p className="mt-2">The requested course could not be found.</p>
          <Link href="/courses" className="mt-4 inline-block">
            <Button>Browse Courses</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const canEnroll = user?.role === 'student' && 
                   course.status === 'published' && 
                   !isEnrolled &&
                   (!course.maxEnrollments || course.enrollmentCount < course.maxEnrollments);

  const isOwner = (user?.role === 'teacher' || user?.role === 'admin') && 
                  course.teacherId === user.teacher?.id;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/courses">
            <Button variant="outline">← Back to Courses</Button>
          </Link>
        </div>

        {course.featuredImage && course.featuredImage.trim() !== '' && (
          <div className="mb-8">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}/uploads/courses/${course.featuredImage}`}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getLevelColor(course.level)}>
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </Badge>
                  <Badge variant="outline">{course.category}</Badge>
                  {course.isFeatured && (
                    <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                  )}
                  {course.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-lg text-gray-700 mb-6">{course.description}</p>

            {/* Teacher Details Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">About the Instructor</h2>
              <div 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => {
                  setIsTeacherModalOpen(true);
                }}
              >
                <Card className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      {course.teacher.user.profileImage ? (
                        <img
                          src={course.teacher.user.profileImage.startsWith('http') 
                            ? course.teacher.user.profileImage 
                            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${course.teacher.user.profileImage}`
                          }
                          alt={`${course.teacher.user.firstName} ${course.teacher.user.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <span className={`text-xl font-semibold text-gray-600 ${course.teacher.user.profileImage ? 'hidden' : ''}`}>
                        {course.teacher.user.firstName[0]}{course.teacher.user.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2">
                      {course.teacher.user.firstName} {course.teacher.user.lastName}
                    </h3>
                    {course.teacher.isVerified && (
                      <Badge className="bg-blue-100 text-blue-800 mb-2">
                        ✓ Verified Teacher
                      </Badge>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Subject:</span> {course.teacher.subject}
                      </div>
                      <div>
                        <span className="font-medium">Experience:</span> {course.teacher.yearsExperience} years
                      </div>
                      {course.teacher.hourlyRate > 0 && (
                        <div>
                          <span className="font-medium">Hourly Rate:</span> ${course.teacher.hourlyRate}/hour
                        </div>
                      )}
                    </div>
                    {course.teacher.bio && (
                      <p className="text-gray-700">{course.teacher.bio}</p>
                    )}
                    <div className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-800">
                      Click to view detailed profile →
                    </div>
                  </div>
                </div>
                </Card>
              </div>
            </div>

            {course.content && (
              <div className="max-w-none">
                <h2 className="text-2xl font-semibold mb-6">Course Content</h2>
                <CourseContentRenderer content={course.content} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPrice(course.price)}
                </div>
                <div className="text-sm text-gray-600">Course Price</div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Instructor:</span>
                  <span className="text-sm font-medium">
                    {course.teacher.user.firstName} {course.teacher.user.lastName}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Level:</span>
                  <span className="text-sm font-medium">
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>

                {course.estimatedDuration && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">{course.estimatedDuration} hours</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Students Enrolled:</span>
                  <span className="text-sm font-medium">
                    {course.enrollmentCount}
                    {course.maxEnrollments && ` / ${course.maxEnrollments}`}
                  </span>
                </div>

                {course.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Published:</span>
                    <span className="text-sm font-medium">{formatDate(course.publishedAt)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {isOwner && (
                  <>
                    <Link href={`/courses/${course.id}/edit`} className="block">
                      <Button className="w-full">Edit Course</Button>
                    </Link>
                    <Link href={`/courses/${course.id}/enrollments`} className="block">
                      <Button variant="outline" className="w-full">
                        View Enrollments ({course.enrollmentCount})
                      </Button>
                    </Link>
                  </>
                )}

                {canEnroll && (
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                )}

                {isEnrolled && (
                  <div className="text-center">
                    <Badge className="bg-green-100 text-green-800 px-4 py-2">
                      ✓ Enrolled
                    </Badge>
                    <Link href="/courses/my-enrollments" className="block mt-2">
                      <Button variant="outline" className="w-full">
                        View My Progress
                      </Button>
                    </Link>
                  </div>
                )}

                {!user && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Sign in to enroll in this course
                    </p>
                    <Link href="/login">
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </div>
                )}

                {user?.role === 'teacher' && !isOwner && (
                  <div className="text-center text-sm text-gray-600">
                    Teachers cannot enroll in courses
                  </div>
                )}

                {course.maxEnrollments && course.enrollmentCount >= course.maxEnrollments && !isEnrolled && (
                  <div className="text-center">
                    <Badge className="bg-red-100 text-red-800 px-4 py-2">
                      Course Full
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Teacher Details Modal */}
        {course && (
          <TeacherDetailsModal 
            teacher={course.teacher}
            isOpen={isTeacherModalOpen}
            onClose={() => setIsTeacherModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}