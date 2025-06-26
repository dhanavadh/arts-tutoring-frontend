'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/contexts/auth-context';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { Card, CardBody, CardHeader } from '../ui/card';

export const TeacherRegisterForm: React.FC = () => {
  const [formData, setFormData] = useState(() => ({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    subject: '',
    qualifications: '',
    experienceYears: '',
    hourlyRate: '',
    bio: '',
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      setError('');

      // Safety checks for form data
      if (!formData || typeof formData !== 'object') {
        setError('Form data is invalid');
        setIsLoading(false);
        return;
      }

      const { password = '', confirmPassword = '', email = '', firstName = '', lastName = '', subject = '' } = formData;

      if (!password || !confirmPassword) {
        setError('Password and confirm password are required');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      if (!email || !firstName || !lastName || !subject) {
        setError('Required fields are missing');
        setIsLoading(false);
        return;
      }

      const registerData: any = {
        email,
        password,
        firstName,
        lastName,
        role: 'teacher',
      };

      if (formData.subject) registerData.subject = formData.subject;
      if (formData.qualifications) registerData.qualifications = formData.qualifications;
      if (formData.experienceYears && formData.experienceYears.trim()) {
        const years = parseInt(formData.experienceYears);
        if (!isNaN(years)) registerData.experienceYears = years;
      }
      if (formData.hourlyRate && formData.hourlyRate.trim()) {
        const rate = parseFloat(formData.hourlyRate);
        if (!isNaN(rate)) registerData.hourlyRate = rate;
      }
      if (formData.bio) registerData.bio = formData.bio;

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
      console.error('Teacher registration error:', err);
      setError(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  // Safety check to ensure formData is properly initialized
  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="text-center">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Teacher Registration
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Join as a teacher to share your expertise in arts education
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
                placeholder="Enter your professional email"
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
                <h3 className="text-sm font-medium text-gray-700 mb-3">Teaching Information</h3>
                
                <Input
                  label="Primary Subject *"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Drawing, Painting, Music Theory, Dance"
                  helperText="Your main area of expertise"
                />

                <Textarea
                  label="Qualifications"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="Your educational background, certifications, degrees..."
                  rows={3}
                />

                <Input
                  label="Years of Experience"
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  helperText="Number of years teaching"
                />

                <Input
                  label="Hourly Rate (USD)"
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  placeholder="e.g., 25"
                  helperText="Your preferred hourly teaching rate"
                />

                <Textarea
                  label="Bio/About You"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell students about yourself, your teaching style, and experience..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={
                  !formData.email || 
                  !formData.password || 
                  !formData.firstName || 
                  !formData.lastName || 
                  !formData.subject
                }
              >
                Create Teacher Account
              </Button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Are you a student?{' '}
                  <a href="/register/student" className="font-medium text-blue-600 hover:text-blue-500">
                    Register as a student
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