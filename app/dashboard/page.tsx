import { Dashboard } from '../../components/dashboard';
import { AppLayout } from '../../components/layout/app-layout';
import { ProtectedRoute } from '../../lib/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </ProtectedRoute>
  );
}