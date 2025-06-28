'use client';

import { useContext, useEffect, useState, Suspense } from 'react';
import { AuthContext } from '../../lib/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole, Teacher } from '../../lib/types';
import { teachersService } from '../../lib/api/services/teachers';
import StudentBookingView from '../../components/bookings/student-booking-view';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface TeacherWithProfile extends Teacher {
  subject: string;
  hourlyRate: number;
  bio: string;
  yearsExperience: number;
  isVerified: boolean;
}

function BookSessionContent() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('BookSessionPage must be used within an AuthProvider');
  }
  
  const { user, isAuthenticated } = context;
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get('teacherId');

  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== UserRole.STUDENT) {
      router.push('/dashboard');
      return;
    }

    loadTeachers();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (teacherId && teachers.length > 0) {
      const teacher = teachers.find(t => t.id === parseInt(teacherId));
      if (teacher) {
        setSelectedTeacher(teacher);
      }
    }
  }, [teacherId, teachers]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersService.getAllTeachers();
      setTeachers(response.teachers as any || []);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading teachers...</div>
      </div>
    );
  }

  if (selectedTeacher) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTeacher(null)}
              className="mb-4"
            >
              ← Back to Teachers
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Book a Session</h1>
          </div>

          <StudentBookingView 
            teacherId={selectedTeacher.id}
            teacherName={`${selectedTeacher.user.firstName} ${selectedTeacher.user.lastName}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Teacher</h1>
          <p className="text-gray-600 mt-2">
            Select a teacher and book a tutoring session that fits your schedule.
          </p>
        </div>

        {teachers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No teachers available at the moment.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {teacher.user.firstName} {teacher.user.lastName}
                      {teacher.isVerified && (
                        <span className="ml-2 text-green-600 text-sm">✓ Verified</span>
                      )}
                    </h3>
                    <p className="text-gray-600">{teacher.subject}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Experience:</span>
                      <span className="text-sm font-medium">{teacher.yearsExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rate:</span>
                      <span className="text-sm font-medium">${teacher.hourlyRate}/hour</span>
                    </div>
                  </div>

                  {teacher.bio && (
                    <div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {teacher.bio}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={() => setSelectedTeacher(teacher)}
                    className="w-full"
                  >
                    Book Session
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookSessionPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <BookSessionContent />
    </Suspense>
  );
}