'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/contexts/auth-context';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardBody, CardHeader } from '../ui/card';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('teacher@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('Login attempt:', { email, password: '***' });

    try {
      console.log('Calling login function...');
      await login(email, password);
      console.log('Login successful, redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Check if error is due to unverified account
      if (err.message && err.message.includes('verify your account')) {
        setError(
          <div>
            {err.message}{' '}
            <a 
              href={`/verify-otp?email=${encodeURIComponent(email)}`}
              className="font-medium text-blue-600 hover:text-blue-500 underline"
            >
              Verify now
            </a>
          </div>
        );
      } else {
        setError(err.message || 'Login failed');
      }
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
              <h2 className="text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Register here
                </a>
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={(e) => {
              console.log('Form submitted!');
              handleSubmit(e);
            }}>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={!email || !password}
                onClick={() => console.log('Button clicked!')}
              >
                Sign in
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};