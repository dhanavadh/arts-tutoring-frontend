'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/contexts/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardBody, CardHeader } from '../ui/card';
import { UserRole } from '../../lib/types';

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'STUDENT' as UserRole,
    // Student fields
    grade: '',
    school: '',
    parentContact: '',
    // Teacher fields
    subjects: '',
    qualifications: '',
    experience: '',
    hourlyRate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const registerData: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
      };

      if (formData.role === 'STUDENT') {
        if (formData.grade) registerData.grade = formData.grade;
        if (formData.school) registerData.school = formData.school;
        if (formData.parentContact) registerData.parentContact = formData.parentContact;
      } else if (formData.role === 'TEACHER') {
        if (formData.subjects) registerData.subjects = formData.subjects.split(',').map(s => s.trim());
        if (formData.qualifications) registerData.qualifications = formData.qualifications;
        if (formData.experience) registerData.experience = formData.experience;
        if (formData.hourlyRate) registerData.hourlyRate = parseFloat(formData.hourlyRate);
      }

      await register(registerData);
      router.push('/dashboard');
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
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800">
                  ⚠️ This is the legacy registration form. For a better experience, please use our 
                  <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                    new registration process
                  </a>
                </p>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Or{' '}
                <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  sign in to your existing account
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
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Email address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>

              {formData.role === 'STUDENT' && (
                <>
                  <Input
                    label="Grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                  />
                  <Input
                    label="School"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                  />
                  <Input
                    label="Parent Contact"
                    name="parentContact"
                    value={formData.parentContact}
                    onChange={handleChange}
                  />
                </>
              )}

              {formData.role === 'TEACHER' && (
                <>
                  <Input
                    label="Subjects (comma-separated)"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleChange}
                    helperText="e.g., Math, Science, English"
                  />
                  <Input
                    label="Qualifications"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                  />
                  <Input
                    label="Experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                  <Input
                    label="Hourly Rate ($)"
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                  />
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={!formData.email || !formData.password || !formData.name}
              >
                Create Account
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};