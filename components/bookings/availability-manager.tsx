'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import MinimalWeeklyCalendar from './minimal-weekly-calendar';
import { bookingsApi } from '../../lib/api/services/bookings';

interface AvailabilitySlot {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isPublished: boolean;
  effectiveDate: string;
  expiryDate?: string;
}

interface AvailabilityManagerProps {
  teacherId: number;
  isOwnProfile?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityManager({ teacherId, isOwnProfile = false }: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [teacherId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await bookingsApi.getTeacherAvailability(teacherId);
      setAvailability(response || []);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async (newSlots: any[], weekStart: Date) => {
    try {
      setSaving(true);
      
      // First, remove existing availability for this week
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const existingSlotsForWeek = availability.filter(slot => 
        slot.effectiveDate === weekStartStr
      );
      
      for (const slot of existingSlotsForWeek) {
        await bookingsApi.deleteAvailability(slot.id);
      }
      
      // Create new availability slots
      for (const slot of newSlots) {
        await bookingsApi.createAvailability({
          ...slot,
          teacherId,
        });
      }
      
      // Reload availability
      await loadAvailability();
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (slotId: number, isPublished: boolean) => {
    try {
      if (isPublished) {
        await bookingsApi.unpublishAvailability(slotId);
      } else {
        await bookingsApi.publishAvailability(slotId);
      }
      
      // Update local state
      setAvailability(prev => 
        prev.map(slot => 
          slot.id === slotId 
            ? { ...slot, isPublished: !isPublished }
            : slot
        )
      );
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      await bookingsApi.deleteAvailability(slotId);
      setAvailability(prev => prev.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('Failed to delete availability slot:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading availability...</div>;
  }

  return (
    <div className="space-y-6">
      <MinimalWeeklyCalendar
        teacherId={teacherId}
        isTeacher={isOwnProfile}
        availabilitySlots={availability}
        onSaveAvailability={handleSaveAvailability}
      />

      {isOwnProfile && availability.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Saved Schedules</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManagement(!showManagement)}
            >
              {showManagement ? 'Hide Details' : 'Manage Slots'}
            </Button>
          </div>

          {showManagement && (
            <Card className="p-4">
              <div className="space-y-3">
                {availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">
                        {DAYS[slot.dayOfWeek]} - {slot.startTime} to {slot.endTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {slot.slotDuration} minute slots • 
                        {slot.isPublished ? (
                          <span className="text-green-600 ml-1">Published</span>
                        ) : (
                          <span className="text-orange-600 ml-1">Draft</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={slot.isPublished ? "outline" : "primary"}
                        onClick={() => handlePublishToggle(slot.id, slot.isPublished)}
                      >
                        {slot.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!isOwnProfile && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Published Availability</h3>
          
          {availability.filter(slot => slot.isPublished).length === 0 ? (
            <p className="text-gray-600">This teacher has not published any availability yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability
                .filter(slot => slot.isPublished)
                .map((slot) => (
                  <div key={slot.id} className="p-3 border rounded">
                    <div className="font-medium">{DAYS[slot.dayOfWeek]}</div>
                    <div className="text-sm text-gray-600">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-xs text-gray-500">
                      {slot.slotDuration} min slots
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}