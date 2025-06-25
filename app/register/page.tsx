import { RegistrationSelection } from '../../components/auth/registration-selection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - Arts Tutor Platform',
  description: 'Join Arts Tutor Platform as a student or teacher',
};

export default function RegisterPage() {
  return <RegistrationSelection />;
}