'use client';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';

interface QuickActionsProps {
  userRole: 'student' | 'teacher' | 'admin';
}

export default function QuickActionsWidget({ userRole }: QuickActionsProps) {
  const getActions = () => {
    switch (userRole) {
      case 'student':
        return [
          {
            label: 'Book a Session',
            href: '/book-session',
            description: 'Find and book a tutoring session',
            variant: 'primary' as const,
          },
          {
            label: 'My Bookings',
            href: '/dashboard', // Could be expanded to specific bookings page
            description: 'View your upcoming sessions',
            variant: 'outline' as const,
          },
        ];
      
      case 'teacher':
        return [
          {
            label: 'Manage Availability',
            href: '/availability',
            description: 'Set your weekly schedule',
            variant: 'primary' as const,
          },
          {
            label: 'My Schedule',
            href: '/dashboard', // Could be expanded to specific schedule page
            description: 'View upcoming classes',
            variant: 'outline' as const,
          },
        ];
      
      case 'admin':
        return [
          {
            label: 'Manage Bookings',
            href: '/admin/bookings',
            description: 'Oversee all platform bookings',
            variant: 'primary' as const,
          },
          {
            label: 'Teacher Availability',
            href: '/admin/bookings?tab=availability',
            description: 'Manage teacher schedules',
            variant: 'outline' as const,
          },
        ];
      
      default:
        return [];
    }
  };

  const actions = getActions();
  const title = userRole === 'admin' ? 'Booking Management' : 'Quick Actions';

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Button 
              variant={action.variant} 
              className="w-full justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">{action.label}</div>
                <div className="text-sm opacity-80">{action.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}