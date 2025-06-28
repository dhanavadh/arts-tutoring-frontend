'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../lib/types';
import AvailabilityManager from '../../components/bookings/availability-manager';
import { teachersService } from '../../lib/api/services/teachers';

export default function AvailabilityPage() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('AvailabilityPage must be used within an AuthProvider');
  }
  
  const { user, isAuthenticated } = context;
  const router = useRouter();
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== UserRole.TEACHER) {
      router.push('/dashboard');
      return;
    }

    loadTeacherProfile();
  }, [isAuthenticated, user, router]);

  const loadTeacherProfile = async () => {
    try {
      setLoading(true);
      const profile = await teachersService.getMyProfile();
      setTeacherProfile(profile);
    } catch (error) {
      console.error('Failed to load teacher profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!teacherProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Failed to load teacher profile. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
          <p className="text-gray-600 text-sm mt-1">
            Set your schedule for students to book sessions
          </p>
        </div>

        <AvailabilityManager 
          teacherId={teacherProfile.id} 
          isOwnProfile={true} 
        />
      </div>
    </div>
  );
}