'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/contexts/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardBody, CardHeader } from '../ui/card';

export const StudentRegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gradeLevel: '',
    school: '',
    parentEmail: '',
    parentPhone: '',
    learningGoals: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Password and confirm password are required');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const registerData: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'student',
      };

      if (formData.gradeLevel) registerData.gradeLevel = formData.gradeLevel;
      if (formData.school) registerData.school = formData.school;
      if (formData.parentEmail) registerData.parentEmail = formData.parentEmail;
      if (formData.parentPhone) registerData.parentPhone = formData.parentPhone;
      if (formData.learningGoals) registerData.learningGoals = formData.learningGoals;

      const response = await register(registerData);
      
      // Check if OTP verification is required
      if (response && response.requiresVerification) {
        // Redirect to OTP verification page
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Admin registration - immediate login
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Student Registration
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Join as a student to learn arts with expert tutors
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Already have an account?{' '}
                <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </a>
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter your first name"
              />

              <Input
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter your last name"
              />

              <Input
                label="Email Address *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
              />

              <Input
                label="Password *"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password (min 6 characters)"
                helperText="Password must be at least 6 characters long"
              />

              <Input
                label="Confirm Password *"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Student Information (Optional)</h3>
                
                <Input
                  label="Grade/Year Level"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  placeholder="e.g., Grade 10, Year 2, etc."
                />

                <Input
                  label="School/Institution"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  placeholder="Enter your school name"
                />

                <Input
                  label="Parent/Guardian Email"
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  placeholder="parent@example.com"
                />

                <Input
                  label="Parent/Guardian Phone"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />

                <Input
                  label="Learning Goals"
                  name="learningGoals"
                  value={formData.learningGoals}
                  onChange={handleChange}
                  placeholder="What do you hope to achieve?"
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={
                  !formData.email?.trim() || 
                  !formData.password?.trim() || 
                  !formData.firstName?.trim() || 
                  !formData.lastName?.trim()
                }
              >
                Create Student Account
              </Button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Are you a teacher?{' '}
                  <a href="/register/teacher" className="font-medium text-blue-600 hover:text-blue-500">
                    Register as a teacher
                  </a>
                </p>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};