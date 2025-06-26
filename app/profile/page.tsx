import { Profile } from '../../components/profile';
import { AppLayout } from '../../components/layout/app-layout';
import { ProtectedRoute } from '../../lib/components/protected-route';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - Arts Tutor Platform',
  description: 'Manage your profile and account settings',
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Profile />
      </AppLayout>
    </ProtectedRoute>
  );
}