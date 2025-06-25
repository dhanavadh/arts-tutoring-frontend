'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '../ui/card';
import { Button } from '../ui/button';

export const RegistrationSelection: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Arts Tutor Platform
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Choose your role to get started
          </p>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Student Registration */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-gray-900">Student</h2>
                <p className="text-gray-600 mt-2">
                  Learn arts with expert tutors
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Book sessions with certified teachers
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Take interactive quizzes and assessments
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Access educational articles and resources
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Track your learning progress
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Connect with fellow art students
                </div>
              </div>
              
              <Link href="/register/student">
                <Button className="w-full" size="lg">
                  Register as Student
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Teacher Registration */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="text-center">
                <div className="text-6xl mb-4">👨‍🏫</div>
                <h2 className="text-2xl font-bold text-gray-900">Teacher</h2>
                <p className="text-gray-600 mt-2">
                  Share your expertise in arts education
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Manage your teaching schedule
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Create engaging educational content
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Design custom quizzes and assessments
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Monitor student progress and performance
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Set your own rates and availability
                </div>
              </div>
              
              <Link href="/register/teacher">
                <Button className="w-full" size="lg" variant="outline">
                  Register as Teacher
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help choosing? Contact our support team for guidance.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Testing? <a href="/register/admin" className="text-blue-500 hover:text-blue-600">Register as Admin</a>
          </p>
        </div>
      </div>
    </div>
  );
};