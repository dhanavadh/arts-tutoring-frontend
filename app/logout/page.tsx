import { LogoutPage } from '../../components/auth/logout-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logging Out - Arts Tutor Platform',
  description: 'Securely logging you out of Arts Tutor Platform',
};

export default function Logout() {
  return <LogoutPage />;
}