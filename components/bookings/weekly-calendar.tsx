'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface TimeSlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isPublished: boolean;
  effectiveDate: string;
  expiryDate?: string;
}

interface WeeklyCalendarProps {
  teacherId?: number;
  isTeacher?: boolean;
  onSaveAvailability?: (slots: TimeSlot[]) => void;
  availabilitySlots?: TimeSlot[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function WeeklyCalendar({ 
  teacherId, 
  isTeacher = false, 
  onSaveAvailability,
  availabilitySlots = []
}: WeeklyCalendarProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [slotDuration, setSlotDuration] = useState(60);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Load existing availability slots
    const existingSlots = new Set<string>();
    availabilitySlots.forEach(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0]);
      const endHour = parseInt(slot.endTime.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour += slot.slotDuration / 60) {
        const timeKey = `${slot.dayOfWeek}-${hour.toString().padStart(2, '0')}:00`;
        existingSlots.add(timeKey);
      }
    });
    setSelectedSlots(existingSlots);
  }, [availabilitySlots]);

  const toggleTimeSlot = (dayOfWeek: number, time: string) => {
    if (!isTeacher) return;
    
    const key = `${dayOfWeek}-${time}`;
    const newSlots = new Set(selectedSlots);
    
    if (newSlots.has(key)) {
      newSlots.delete(key);
    } else {
      newSlots.add(key);
    }
    
    setSelectedSlots(newSlots);
    setIsDirty(true);
  };

  const isSlotSelected = (dayOfWeek: number, time: string) => {
    return selectedSlots.has(`${dayOfWeek}-${time}`);
  };

  const clearAll = () => {
    setSelectedSlots(new Set());
    setIsDirty(true);
  };

  const convertSlotsToAvailability = (): TimeSlot[] => {
    const availabilityMap = new Map<number, { start: string; end: string; times: string[] }>();
    
    // Group consecutive time slots by day
    selectedSlots.forEach(slot => {
      const [dayOfWeek, time] = slot.split('-');
      const day = parseInt(dayOfWeek);
      
      if (!availabilityMap.has(day)) {
        availabilityMap.set(day, { start: time, end: time, times: [] });
      }
      
      availabilityMap.get(day)!.times.push(time);
    });

    const availability: TimeSlot[] = [];
    
    availabilityMap.forEach((data, dayOfWeek) => {
      // Sort times and find consecutive blocks
      const sortedTimes = data.times.sort();
      let blockStart = sortedTimes[0];
      let blockEnd = sortedTimes[0];
      
      for (let i = 1; i < sortedTimes.length; i++) {
        const currentHour = parseInt(sortedTimes[i].split(':')[0]);
        const previousHour = parseInt(sortedTimes[i - 1].split(':')[0]);
        
        if (currentHour === previousHour + 1) {
          // Consecutive hour, extend block
          blockEnd = sortedTimes[i];
        } else {
          // Gap found, save current block and start new one
          const endHour = parseInt(blockEnd.split(':')[0]) + 1;
          availability.push({
            dayOfWeek,
            startTime: blockStart,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            slotDuration,
            isPublished: false,
            effectiveDate: new Date().toISOString().split('T')[0],
          });
          
          blockStart = sortedTimes[i];
          blockEnd = sortedTimes[i];
        }
      }
      
      // Add the last block
      const endHour = parseInt(blockEnd.split(':')[0]) + 1;
      availability.push({
        dayOfWeek,
        startTime: blockStart,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        slotDuration,
        isPublished: false,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    });
    
    return availability;
  };

  const handleSave = () => {
    if (onSaveAvailability) {
      const availability = convertSlotsToAvailability();
      onSaveAvailability(availability);
      setIsDirty(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Availability</h3>
        {isTeacher && (
          <div className="flex items-center gap-2">
            <label htmlFor="duration" className="text-sm">Slot Duration:</label>
            <select 
              id="duration"
              value={slotDuration} 
              onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
            <Button 
              onClick={clearAll} 
              variant="outline" 
              size="sm"
            >
              Clear All
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isDirty}
              size="sm"
            >
              Save
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-8 gap-1">
          {/* Header row */}
          <div className="p-2 text-sm font-medium">Time</div>
          {DAYS.map((day, index) => (
            <div key={day} className="p-2 text-sm font-medium text-center">
              {day}
            </div>
          ))}

          {/* Time slots */}
          {TIME_SLOTS.map((time) => (
            <>
              <div key={`time-${time}`} className="p-2 text-xs text-gray-600 border-r">
                {time}
              </div>
              {DAYS.map((_, dayIndex) => {
                const isSelected = isSlotSelected(dayIndex, time);
                return (
                  <button
                    key={`${dayIndex}-${time}`}
                    className={`
                      p-2 text-xs border-b border-r transition-colors
                      ${isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100'
                      }
                      ${!isTeacher ? 'cursor-default' : 'cursor-pointer'}
                    `}
                    onClick={() => toggleTimeSlot(dayIndex, time)}
                    disabled={!isTeacher}
                  >
                    {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </Card>

      {isTeacher && (
        <div className="text-sm text-gray-600">
          <p>Click on time slots to mark them as available. Selected slots will be converted to availability periods when saved.</p>
          <p className="mt-1">Blue slots are available, empty slots are not available.</p>
        </div>
      )}
    </div>
  );
}