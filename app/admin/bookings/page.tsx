'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../../lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../../lib/types';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { bookingsApi } from '../../../lib/api/services/bookings';
import { teachersService } from '../../../lib/api/services/teachers';
import AvailabilityManager from '../../../components/bookings/availability-manager';

interface Booking {
  id: number;
  student: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  startTime: string;
  endTime: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface Teacher {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subject: string;
  isVerified: boolean;
}

export default function AdminBookingsPage() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('AdminBookingsPage must be used within an AuthProvider');
  }
  
  const { user, isAuthenticated } = context;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, teachersResponse] = await Promise.all([
        bookingsApi.getAllBookings({ page: 1, limit: 50 }),
        teachersService.getAllTeachers(),
      ]);

      const bookingsData = Array.isArray(bookingsResponse) ? bookingsResponse : ((bookingsResponse as any).bookings || (bookingsResponse as any).data || []);
      const teachersData = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse.teachers || (teachersResponse as any).data || []);
      
      setBookings(bookingsData as Booking[]);
      setTeachers(teachersData as Teacher[]);

      // Calculate booking statistics
      const stats = {
        total: bookingsData.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      bookingsData.forEach((booking: Booking) => {
        switch (booking.status) {
          case 'PENDING':
            stats.pending++;
            break;
          case 'CONFIRMED':
            stats.confirmed++;
            break;
          case 'COMPLETED':
            stats.completed++;
            break;
          case 'CANCELLED':
            stats.cancelled++;
            break;
        }
      });

      setBookingStats(stats);
    } catch (error) {
      console.error('Failed to load admin booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingStatusUpdate = async (bookingId: number, status: string) => {
    try {
      await bookingsApi.updateBookingStatus(bookingId, status as any);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading admin booking data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all bookings and teacher availability across the platform.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-2xl font-bold text-gray-900">{bookingStats.total}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{bookingStats.confirmed}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{bookingStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('bookings')}
          >
            All Bookings
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'availability'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('availability')}
          >
            Teacher Availability
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'bookings' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Bookings</h2>
            
            {bookings.length === 0 ? (
              <p className="text-gray-600">No bookings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Teacher</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date & Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-t">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">
                              {booking.student.user.firstName} {booking.student.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{booking.student.user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {booking.teacher.user.firstName} {booking.teacher.user.lastName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{booking.subject || 'Not specified'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{formatDateTime(booking.startTime)}</div>
                            <div className="text-gray-600">to {formatDateTime(booking.endTime)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            {booking.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'CONFIRMED')}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'CANCELLED')}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {booking.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleBookingStatusUpdate(booking.id, 'COMPLETED')}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Teacher Availability Management</h2>
              
              {!selectedTeacher ? (
                <div>
                  <p className="text-gray-600 mb-4">Select a teacher to manage their availability:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teachers.map((teacher) => (
                      <Card key={teacher.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="space-y-2">
                          <div className="font-medium">
                            {teacher.user.firstName} {teacher.user.lastName}
                            {teacher.isVerified && (
                              <span className="ml-2 text-green-600 text-sm">✓ Verified</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{teacher.subject}</div>
                          <div className="text-sm text-gray-600">{teacher.user.email}</div>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedTeacher(teacher)}
                            className="w-full"
                          >
                            Manage Availability
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-medium">
                        Managing availability for {selectedTeacher.user.firstName} {selectedTeacher.user.lastName}
                      </h3>
                      <p className="text-gray-600">{selectedTeacher.subject}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTeacher(null)}
                    >
                      Back to Teachers
                    </Button>
                  </div>
                  
                  <AvailabilityManager 
                    teacherId={selectedTeacher.id} 
                    isOwnProfile={false} 
                  />
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}