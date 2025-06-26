'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestQuestionsPage() {
  const [questions, setQuestions] = useState([
    { id: 'q-1', text: 'Initial question' }
  ]);

  const addQuestion = () => {
    console.log('🔴 Add button clicked');
    console.log('🔴 Current questions:', questions.length);
    
    const newQuestion = {
      id: `q-${Date.now()}`,
      text: `Question ${questions.length + 1}`
    };
    
    const newQuestions = [...questions, newQuestion];
    console.log('🔴 New questions:', newQuestions.length);
    
    setQuestions(newQuestions);
  };

  console.log('🔴 Rendering with questions:', questions.length);

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Test Questions ({questions.length})</h1>
      
      <Button onClick={addQuestion} className="mb-4">
        Add Question
      </Button>
      
      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="border p-4 rounded">
            <h3>Question {index + 1}: {q.text}</h3>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3>Debug Info:</h3>
        <p>Questions count: {questions.length}</p>
        <p>Questions array: {JSON.stringify(questions, null, 2)}</p>
      </div>
    </div>
  );
}