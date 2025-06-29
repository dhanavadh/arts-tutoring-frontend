'use client';

import { useState, useEffect } from 'react';
import { teachersService } from '@/lib/api/services/teachers';
import { Teacher } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { TeacherCard } from '@/components/teachers/teacher-card';

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await teachersService.getAllTeachers();
      setTeachers(data.teachers);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      console.error('Failed to load teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Our Teachers</h1>
        <p className="text-gray-600 text-lg">
          Discover talented and experienced art teachers ready to help you learn and grow.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          {total} teacher{total !== 1 ? 's' : ''} available
        </div>
      </div>

      {teachers.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No teachers found</h2>
          <p className="text-gray-600">Check back later for new teachers!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}

      {/* Pagination would go here if needed */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <p className="text-gray-500">
            Page {page} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
