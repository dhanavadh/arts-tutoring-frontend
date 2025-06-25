import { StudentRegisterForm } from '../../../components/auth/student-register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Registration - Arts Tutor Platform',
  description: 'Register as a student to learn arts with expert tutors',
};

export default function StudentRegisterPage() {
  return <StudentRegisterForm />;
}