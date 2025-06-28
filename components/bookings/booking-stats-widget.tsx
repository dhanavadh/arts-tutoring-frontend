'use client';

import { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { bookingsApi } from '../../lib/api/services/bookings';

interface BookingStatsProps {
  userRole: 'student' | 'teacher' | 'admin';
  compact?: boolean;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

export default function BookingStatsWidget({ userRole, compact = false }: BookingStatsProps) {
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    upcoming: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingStats();
  }, [userRole]);

  const loadBookingStats = async () => {
    try {
      setLoading(true);
      
      let bookings: any[] = [];
      let upcomingBookings: any[] = [];

      if (userRole === 'admin') {
        const response = await bookingsApi.getAllBookings({ page: 1, limit: 100 });
        bookings = (response as any).bookings || (response as any).data || [];
        upcomingBookings = await bookingsApi.getUpcomingBookings();
      } else if (userRole === 'student') {
        const response = await bookingsApi.getMyBookings({ page: 1, limit: 100 });
        bookings = (response as any).bookings || (response as any).data || [];
        upcomingBookings = await bookingsApi.getUpcomingBookings();
      } else if (userRole === 'teacher') {
        const response = await bookingsApi.getMySchedule({ page: 1, limit: 100 });
        bookings = (response as any).bookings || (response as any).data || [];
        upcomingBookings = await bookingsApi.getUpcomingBookings();
      }

      const calculatedStats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
        upcoming: upcomingBookings.length,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to load booking stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  const getTitle = () => {
    switch (userRole) {
      case 'student':
        return 'My Bookings';
      case 'teacher':
        return 'My Schedule';
      case 'admin':
        return 'All Bookings';
      default:
        return 'Bookings';
    }
  };

  if (compact) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">{getTitle()}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{getTitle()}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
      </div>
    </Card>
  );
}