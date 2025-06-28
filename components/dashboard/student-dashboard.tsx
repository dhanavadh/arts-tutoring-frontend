'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import { api } from '../../lib/api';
import { Booking, QuizAssignment } from '../../lib/types';
import BookingStatsWidget from '../bookings/booking-stats-widget';
import UpcomingBookingsWidget from '../bookings/upcoming-bookings-widget';
import QuickActionsWidget from '../bookings/quick-actions-widget';

export const StudentDashboard: React.FC = () => {
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState<QuizAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, quizzesResponse] = await Promise.allSettled([
        api.bookings.getUpcomingBookings(),
        api.quizzes.getAssignedQuizzes(),
      ]);

      if (bookingsResponse.status === 'fulfilled') {
        const bookingsData = bookingsResponse.value || [];
        setUpcomingBookings(Array.isArray(bookingsData) ? bookingsData : []);
      }

      if (quizzesResponse.status === 'fulfilled') {
        const quizzesData = quizzesResponse.value || [];
        setAssignedQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Booking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BookingStatsWidget userRole="student" compact />
        <QuickActionsWidget userRole="student" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enhanced Upcoming Bookings */}
        <UpcomingBookingsWidget userRole="student" limit={3} />

        {/* Assigned Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Assigned Quizzes</h2>
              <Button size="sm" variant="outline">
                <a href="/quizzes">View All</a>
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {!assignedQuizzes || assignedQuizzes.length === 0 ? (
              <p className="text-gray-500">No assigned quizzes</p>
            ) : (
              <div className="space-y-3">
                {assignedQuizzes.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{assignment.quiz.title}</p>
                        <p className="text-sm text-gray-600">
                          {assignment.quiz.totalPoints} points
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600">
                          Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Additional Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">More Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col" variant="outline">
              <a href="/articles" className="flex flex-col items-center">
                <span className="text-2xl mb-2">📚</span>
                Read Articles
              </a>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <a href="/profile" className="flex flex-col items-center">
                <span className="text-2xl mb-2">👤</span>
                Edit Profile
              </a>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <a href="/quizzes" className="flex flex-col items-center">
                <span className="text-2xl mb-2">✏️</span>
                Take Quiz
              </a>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <a href="/logout" className="flex flex-col items-center">
                <span className="text-2xl mb-2">🚪</span>
                Logout
              </a>
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};