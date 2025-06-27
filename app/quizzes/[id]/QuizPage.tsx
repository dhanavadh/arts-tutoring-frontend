'use client';

import { Suspense } from 'react';
import QuizDetailClient from './quiz-detail-client';
import { ProtectedRoute } from '@/lib/components/protected-route';

export function QuizPage({ id }: { id: string }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }>
        <QuizDetailClient id={id} />
      </Suspense>
    </ProtectedRoute>
  );
}
