'use client';

import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { bookingsApi } from '../../lib/api/services/bookings';
import Link from 'next/link';

interface UpcomingBookingsProps {
  userRole: 'student' | 'teacher' | 'admin';
  limit?: number;
}

interface Booking {
  id: number;
  student?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  teacher?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  startTime: string;
  endTime: string;
  subject?: string;
  status: string;
}

export default function UpcomingBookingsWidget({ userRole, limit = 5 }: UpcomingBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingBookings();
  }, [userRole]);

  const loadUpcomingBookings = async () => {
    try {
      setLoading(true);
      const upcomingBookings = await bookingsApi.getUpcomingBookings();
      setBookings(upcomingBookings.slice(0, limit));
    } catch (error) {
      console.error('Failed to load upcoming bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayName = (booking: Booking) => {
    if (userRole === 'student' && booking.teacher) {
      return `${booking.teacher.user.firstName} ${booking.teacher.user.lastName}`;
    } else if (userRole === 'teacher' && booking.student) {
      return `${booking.student.user.firstName} ${booking.student.user.lastName}`;
    } else if (userRole === 'admin') {
      const studentName = booking.student ? `${booking.student.user.firstName} ${booking.student.user.lastName}` : 'Unknown';
      const teacherName = booking.teacher ? `${booking.teacher.user.firstName} ${booking.teacher.user.lastName}` : 'Unknown';
      return `${studentName} with ${teacherName}`;
    }
    return 'Unknown';
  };

  const getTitle = () => {
    switch (userRole) {
      case 'student':
        return 'Upcoming Sessions';
      case 'teacher':
        return 'Upcoming Classes';
      case 'admin':
        return 'Upcoming Bookings';
      default:
        return 'Upcoming Bookings';
    }
  };

  const getViewAllLink = () => {
    switch (userRole) {
      case 'admin':
        return '/admin/bookings';
      default:
        return '/dashboard'; // Could be expanded to specific booking pages
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{getTitle()}</h3>
        {bookings.length > 0 && (
          <Link href={getViewAllLink()}>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No upcoming bookings</p>
          {userRole === 'student' && (
            <Link href="/book-session">
              <Button className="mt-3">Book a Session</Button>
            </Link>
          )}
          {userRole === 'teacher' && (
            <Link href="/availability">
              <Button className="mt-3">Manage Availability</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const { date, time } = formatDateTime(booking.startTime);
            return (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {getDisplayName(booking)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.subject || 'General Session'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {date} at {time}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            );
          })}
          
          {bookings.length === limit && (
            <div className="text-center pt-3">
              <Link href={getViewAllLink()}>
                <Button variant="outline" size="sm">
                  View More
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}