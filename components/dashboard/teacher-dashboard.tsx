'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import { api } from '../../lib/api';
import { Booking, Article, Quiz } from '../../lib/types';

export const TeacherDashboard: React.FC = () => {
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [scheduleResponse, articlesResponse, quizzesResponse] = await Promise.allSettled([
        api.bookings.getMySchedule({ limit: 5 }),
        api.articles.getMyArticles(),
        api.quizzes.getMyQuizzes(),
      ]);

      if (scheduleResponse.status === 'fulfilled') {
        const bookingsData = scheduleResponse.value?.data || [];
        setUpcomingBookings(Array.isArray(bookingsData) ? bookingsData : []);
      }

      if (articlesResponse.status === 'fulfilled') {
        const articlesData = articlesResponse.value || [];
        setRecentArticles(Array.isArray(articlesData) ? articlesData.slice(0, 3) : []);
      }

      if (quizzesResponse.status === 'fulfilled') {
        const quizzesData = quizzesResponse.value || [];
        setRecentQuizzes(Array.isArray(quizzesData) ? quizzesData.slice(0, 3) : []);
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
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage your teaching activities and content.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Today's Schedule</h2>
              <Button size="sm" variant="outline">
                <a href="/schedule">View All</a>
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {!upcomingBookings || upcomingBookings.length === 0 ? (
              <p className="text-gray-500">No sessions today</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">{booking.student.user.firstName} {booking.student.user.lastName}</p>
                      <p className="text-sm text-gray-600">{booking.subject}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Articles</h2>
              <Button size="sm" variant="outline">
                <a href="/articles">Manage</a>
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {!recentArticles || recentArticles.length === 0 ? (
              <p className="text-gray-500">No articles yet</p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <div key={article.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">{article.title}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {article.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Recent Quizzes</h2>
              <Button size="sm" variant="outline">
                <a href="/quiz-management">Manage</a>
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {!recentQuizzes || recentQuizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes yet</p>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="border-l-4 border-purple-500 pl-4 py-2">
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-gray-600">
                        {quiz.questions.length} questions
                      </p>
                      <p className="text-sm text-gray-500">
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col">
              <a href="/articles/new" className="flex flex-col items-center">
                <span className="text-2xl mb-2">✍️</span>
                Write Article
              </a>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <a href="/quiz-management/new" className="flex flex-col items-center">
                <span className="text-2xl mb-2">📝</span>
                Create Quiz
              </a>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <a href="/schedule" className="flex flex-col items-center">
                <span className="text-2xl mb-2">📅</span>
                View Schedule
              </a>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <a href="/profile" className="flex flex-col items-center">
                <span className="text-2xl mb-2">👤</span>
                Edit Profile
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