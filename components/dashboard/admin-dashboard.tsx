'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/loading';
import { api } from '../../lib/api';
import { DashboardStats } from '../../lib/types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await api.admin.getDashboardStats();
      setStats(statsData);
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management tools.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-gray-600">Total Users</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalStudents}</div>
                <div className="text-gray-600">Students</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalTeachers}</div>
                <div className="text-gray-600">Teachers</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.totalBookings}</div>
                <div className="text-gray-600">Total Bookings</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.activeBookings}</div>
                <div className="text-gray-600">Active Bookings</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{stats.totalArticles}</div>
                <div className="text-gray-600">Total Articles</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-teal-600">{stats.publishedArticles}</div>
                <div className="text-gray-600">Published Articles</div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="text-3xl font-bold text-pink-600">{stats.totalQuizzes}</div>
                <div className="text-gray-600">Total Quizzes</div>
              </CardBody>
            </Card>
          </div>

          {/* Management Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">User Management</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <a href="/admin/users">Manage Users</a>
                  </Button>
                  <Button className="w-full" variant="outline">
                    <a href="/admin/students">Manage Students</a>
                  </Button>
                  <Button className="w-full" variant="outline">
                    <a href="/admin/teachers">Manage Teachers</a>
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Content Management</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <a href="/admin/articles">Review Articles</a>
                  </Button>
                  <Button className="w-full" variant="outline">
                    <a href="/admin/quizzes">Review Quizzes</a>
                  </Button>
                  <Button className="w-full" variant="outline">
                    <a href="/admin/bookings">Manage Bookings</a>
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* System Tools */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">System Tools</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-20 flex-col" variant="outline">
                  <a href="/admin/reports" className="flex flex-col items-center">
                    <span className="text-2xl mb-2">📊</span>
                    Reports
                  </a>
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <a href="/admin/health" className="flex flex-col items-center">
                    <span className="text-2xl mb-2">🏥</span>
                    System Health
                  </a>
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <a href="/admin/settings" className="flex flex-col items-center">
                    <span className="text-2xl mb-2">⚙️</span>
                    Settings
                  </a>
                </Button>
                <Button className="h-20 flex-col" variant="outline">
                  <a href="/admin/logs" className="flex flex-col items-center">
                    <span className="text-2xl mb-2">📋</span>
                    Logs
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
        </>
      )}
    </div>
  );
};