'use client';

import { useState, useRef } from 'react';
import { CourseEditor, type CourseEditorRef } from '@/components/courses/course-editor';
import { ArticleEditor, type ArticleEditorRef } from '@/components/editor/ArticleEditor';
import CourseEditorDebug from '@/components/courses/course-editor-debug';
import { CourseEditorSimple, type CourseEditorSimpleRef } from '@/components/courses/course-editor-simple';
import { Card } from '@/components/ui/card';

export default function TestEditorsPage() {
  const courseEditorRef = useRef<CourseEditorRef>(null);
  const articleEditorRef = useRef<ArticleEditorRef>(null);
  const simpleEditorRef = useRef<CourseEditorSimpleRef>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [articleData, setArticleData] = useState<any>(null);
  const [simpleData, setSimpleData] = useState<any>(null);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Editor Comparison Test</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Simple Course Editor (Basic Tools Only)</h2>
        <CourseEditorSimple
          ref={simpleEditorRef}
          data={simpleData}
          onChange={setSimpleData}
          placeholder="Test simple editor - Header, Paragraph, List only..."
        />
      </Card>

      <Card className="p-6">
        <CourseEditorDebug />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Article Editor (Working Reference)</h2>
        <ArticleEditor
          ref={articleEditorRef}
          data={articleData}
          onChange={setArticleData}
          placeholder="Test article editor - try adding headings..."
        />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Full Course Editor</h2>
        <CourseEditor
          ref={courseEditorRef}
          data={courseData}
          onChange={setCourseData}
          placeholder="Test course editor - try adding headings..."
        />
      </Card>
    </div>
  );
}