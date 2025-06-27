'use client';

import { QuizPage } from './QuizPage';

export default function QuizPageWrapper({ params }: { params: { id: string } }) {
  return <QuizPage id={params.id} />;
}
