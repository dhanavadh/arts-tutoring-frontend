'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api/services';
import { CreateCourseDto, CourseLevelEnum } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';

// Dynamically import CourseEditor to avoid SSR issues
const CourseEditor = dynamic(
  () => import('@/components/courses/course-editor').then((mod) => mod.CourseEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }
);

// Import the ref type directly
import type { CourseEditorRef } from '@/components/courses/course-editor';
import { CourseBannerUpload } from '@/components/courses/course-banner-upload';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const editorRef = useRef<CourseEditorRef>(null);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CreateCourseDto>({
    title: '',
    description: '',
    level: CourseLevelEnum.BEGINNER,
    category: '',
    tags: [],
    estimatedDuration: 1,
    price: 0,
    maxEnrollments: undefined,
    isFeatured: false,
    featuredImage: '',
  });
  const [editorData, setEditorData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get editor content
      let content = '';
      if (editorRef.current) {
        const editorContent = await editorRef.current.save();
        content = JSON.stringify(editorContent);
      }

      const courseData = {
        ...formData,
        content,
      };

      // Create the course
      const course = await coursesApi.createCourse(courseData);
      setCourseId(course.id);
      
      // If a banner file was selected, it will automatically upload via the useEffect in the banner component
      
      toast.success('Course created successfully!');
      router.push(`/courses/${course.id}`);
    } catch (error: any) {
      console.error('Failed to create course:', error);
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateCourseDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    handleChange('tags', tags);
  };

  const handleBannerUploaded = (bannerUrl: string) => {
    handleChange('featuredImage', bannerUrl);
  };

  const handleBannerFileSelected = (file: File) => {
    setBannerFile(file);
  };

  const handleEditorChange = useCallback((data: any) => {
    // Ensure proper data format
    if (data && data.blocks && Array.isArray(data.blocks)) {
      const validatedData = {
        ...data,
        blocks: data.blocks.map((block: any) => ({
          ...block,
          id: block.id || Math.random().toString(36).substr(2, 9)
        }))
      };
      setEditorData(validatedData);
    } else {
      setEditorData(data);
    }
  }, []);

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">Only teachers and admins can create courses.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Course</h1>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Course Title *
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                placeholder="Enter course title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                placeholder="Enter course description"
              />
            </div>

            <CourseBannerUpload
              courseId={courseId}
              currentBanner={formData.featuredImage}
              onBannerUploaded={handleBannerUploaded}
              onFileSelected={handleBannerFileSelected}
              className="mb-6"
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Course Content
              </label>
              <CourseEditor
                ref={editorRef}
                data={editorData}
                onChange={handleEditorChange}
                placeholder="Start creating your course content. Use headings for sections, lists for objectives, and rich formatting to make your content engaging..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="level" className="block text-sm font-medium mb-2">
                  Course Level *
                </label>
                <select
                  id="level"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                  required
                >
                  <option value={CourseLevelEnum.BEGINNER}>Beginner</option>
                  <option value={CourseLevelEnum.INTERMEDIATE}>Intermediate</option>
                  <option value={CourseLevelEnum.ADVANCED}>Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                  placeholder="e.g., Mathematics, Science, Art"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="e.g., algebra, equations, mathematics"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium mb-2">
                  Duration (hours)
                </label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => handleChange('estimatedDuration', parseFloat(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-2">
                  Price ($)
                </label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="maxEnrollments" className="block text-sm font-medium mb-2">
                  Max Enrollments
                </label>
                <Input
                  id="maxEnrollments"
                  type="number"
                  min="1"
                  value={formData.maxEnrollments || ''}
                  onChange={(e) => handleChange('maxEnrollments', parseInt(e.target.value) || undefined)}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured || false}
                  onChange={(e) => handleChange('isFeatured', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Featured Course</span>
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}