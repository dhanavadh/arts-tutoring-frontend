import { TeacherRegisterForm } from '../../../components/auth/teacher-register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Registration - Arts Tutor Platform',
  description: 'Register as a teacher to share your expertise in arts education',
};

export default function TeacherRegisterPage() {
  return <TeacherRegisterForm />;
}