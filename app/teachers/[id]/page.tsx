'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { teachersService } from '@/lib/api/services/teachers';
import { coursesApi } from '@/lib/api/services/courses';
import { Teacher, Course } from '@/lib/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { getPublicImageUrl, getDefaultAvatar } from '@/lib/utils/public-image';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const teacherId = parseInt(params.id as string);
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teacherId) {
      loadTeacherProfile();
    }
  }, [teacherId]);

  const loadTeacherProfile = async () => {
    try {
      setLoading(true);
      
      // Load teacher profile
      const teacherData = await teachersService.getTeacherById(teacherId);
      setTeacher(teacherData);

      // Load teacher's courses
      try {
        const allCourses = await coursesApi.getPublishedCourses();
        const teacherCourses = allCourses.filter(course => course.teacherId === teacherId);
        setCourses(teacherCourses);
      } catch (courseError) {
        console.warn('Could not load teacher courses:', courseError);
        setCourses([]);
      }
    } catch (error: any) {
      console.error('Failed to load teacher profile:', error);
      toast.error('Failed to load teacher profile');
      router.push('/teachers');
    } finally {
      setLoading(false);
    }
  };

  const formatExperience = (years: number) => {
    if (years === 0) return 'New teacher';
    if (years === 1) return '1 year of experience';
    return `${years} years of experience`;
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free consultation' : `$${price}/hour`;
  };

  const handleBookSession = () => {
    if (!user) {
      toast.error('Please login to book a session');
      router.push('/login');
      return;
    }
    
    if (user.role !== 'student') {
      toast.error('Only students can book sessions');
      return;
    }

    router.push(`/book-session?teacherId=${teacherId}`);
  };

  const handleSendMessage = () => {
    if (!user) {
      toast.error('Please login to send a message');
      router.push('/login');
      return;
    }
    
    // This would open a messaging interface
    toast.info('Messaging feature coming soon!');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading teacher profile...</div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Teacher Not Found</h1>
          <p className="mt-2">The requested teacher profile could not be found.</p>
          <Link href="/teachers">
            <Button className="mt-4">Browse All Teachers</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Back button */}
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        ← Back to Teachers
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teacher Profile Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={teacher.user?.profileImage ? 
                      getPublicImageUrl(teacher.user.profileImage) : 
                      getDefaultAvatar(teacher.user?.firstName, teacher.user?.lastName, 'teacher')
                    }
                    alt={`${teacher.user?.firstName} ${teacher.user?.lastName}`}
                    className="w-32 h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultAvatar(teacher.user?.firstName, teacher.user?.lastName, 'teacher');
                    }}
                  />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">
                  {teacher.user?.firstName} {teacher.user?.lastName}
                </h1>
                
                <p className="text-lg text-gray-600 mb-2">{teacher.subject}</p>
                
                <div className="flex justify-center gap-2 mb-4">
                  {teacher.isVerified && (
                    <Badge className="bg-green-100 text-green-800">
                      ✓ Verified Teacher
                    </Badge>
                  )}
                </div>

                <div className="text-2xl font-bold text-green-600 mb-4">
                  {formatPrice(teacher.hourlyRate)}
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    {formatExperience(teacher.yearsExperience)}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleBookSession}
                    className="w-full"
                    size="lg"
                  >
                    📅 Book a Session
                  </Button>
                  
                  <Button 
                    onClick={handleSendMessage}
                    variant="outline"
                    className="w-full"
                  >
                    💬 Send Message
                  </Button>
                </div>

                {teacher.user?.websiteUrl && (
                  <div className="pt-4 border-t">
                    <a
                      href={teacher.user.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      🌐 Visit Website
                    </a>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Teacher Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">About {teacher.user?.firstName}</h2>
            </CardHeader>
            <CardBody>
              {teacher.bio ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{teacher.bio}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No bio available.</p>
              )}
            </CardBody>
          </Card>

          {/* Teaching Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Teaching Information</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{teacher.yearsExperience}</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{courses.length}</div>
                  <div className="text-sm text-gray-600">Active Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{teacher.subject}</div>
                  <div className="text-sm text-gray-600">Specialization</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Courses Section */}
          {courses.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Courses by {teacher.user?.firstName}</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="outline">{course.level}</Badge>
                        <span className="text-green-600 font-semibold">
                          {course.price === 0 ? 'Free' : `$${course.price}`}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <span>{course.enrollmentCount} enrolled</span>
                        {course.estimatedDuration && (
                          <span>{course.estimatedDuration} hours</span>
                        )}
                      </div>

                      <Link href={`/courses/${course.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Course
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Get in Touch</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Ready to start your artistic journey with {teacher.user?.firstName}? 
                  Book a session or send a message to get started!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleBookSession}
                    className="flex-1"
                  >
                    📅 Book Session
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    variant="outline"
                    className="flex-1"
                  >
                    💬 Send Message
                  </Button>
                </div>

                {!user && (
                  <div className="text-center text-sm text-gray-500 mt-4">
                    <Link href="/login" className="text-blue-600 hover:text-blue-800">
                      Login
                    </Link> or{' '}
                    <Link href="/register" className="text-blue-600 hover:text-blue-800">
                      create an account
                    </Link> to book sessions
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
