'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';

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

interface MinimalWeeklyCalendarProps {
  teacherId?: number;
  isTeacher?: boolean;
  onSaveAvailability?: (slots: TimeSlot[], weekStart: Date) => void;
  availabilitySlots?: TimeSlot[];
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = (i + 6).toString().padStart(2, '0'); // 6 AM to 10 PM
  return `${hour}:00`;
});

export default function MinimalWeeklyCalendar({ 
  teacherId, 
  isTeacher = false, 
  onSaveAvailability,
  availabilitySlots = []
}: MinimalWeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [slotDuration, setSlotDuration] = useState(60);
  const [isDirty, setIsDirty] = useState(false);

  // Get the start of the current week (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Get week dates
  const getWeekDates = (weekStart: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekStart = getWeekStart(currentWeek);
  const weekDates = getWeekDates(weekStart);

  useEffect(() => {
    loadAvailabilityForWeek();
  }, [availabilitySlots, currentWeek]);

  const loadAvailabilityForWeek = () => {
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const existingSlots = new Set<string>();
    
    availabilitySlots.forEach(slot => {
      // Only load slots for the current week
      if (slot.effectiveDate === weekStartStr || !slot.effectiveDate) {
        const startHour = parseInt(slot.startTime.split(':')[0]);
        const endHour = parseInt(slot.endTime.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour += slot.slotDuration / 60) {
          if (hour >= 6 && hour < 22) { // Only show 6 AM to 10 PM
            const timeKey = `${slot.dayOfWeek}-${hour.toString().padStart(2, '0')}:00`;
            existingSlots.add(timeKey);
          }
        }
      }
    });
    setSelectedSlots(existingSlots);
    setIsDirty(false);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');

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

  const handleMouseDown = (dayOfWeek: number, time: string) => {
    if (!isTeacher) return;
    
    const key = `${dayOfWeek}-${time}`;
    const isCurrentlySelected = selectedSlots.has(key);
    
    setIsSelecting(true);
    setSelectionMode(isCurrentlySelected ? 'remove' : 'add');
    
    const newSlots = new Set(selectedSlots);
    if (isCurrentlySelected) {
      newSlots.delete(key);
    } else {
      newSlots.add(key);
    }
    
    setSelectedSlots(newSlots);
    setIsDirty(true);
  };

  const handleMouseEnter = (dayOfWeek: number, time: string) => {
    if (!isSelecting || !isTeacher) return;
    
    const key = `${dayOfWeek}-${time}`;
    const newSlots = new Set(selectedSlots);
    
    if (selectionMode === 'add') {
      newSlots.add(key);
    } else {
      newSlots.delete(key);
    }
    
    setSelectedSlots(newSlots);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const isSlotSelected = (dayOfWeek: number, time: string) => {
    return selectedSlots.has(`${dayOfWeek}-${time}`);
  };

  const clearWeek = () => {
    setSelectedSlots(new Set());
    setIsDirty(true);
  };

  const convertSlotsToAvailability = (): TimeSlot[] => {
    const availabilityMap = new Map<number, { times: string[] }>();
    
    // Group time slots by day
    selectedSlots.forEach(slot => {
      const [dayOfWeek, time] = slot.split('-');
      const day = parseInt(dayOfWeek);
      
      if (!availabilityMap.has(day)) {
        availabilityMap.set(day, { times: [] });
      }
      
      availabilityMap.get(day)!.times.push(time);
    });

    const availability: TimeSlot[] = [];
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    availabilityMap.forEach((data, dayOfWeek) => {
      // Sort times and find consecutive blocks
      const sortedTimes = data.times.sort();
      let blockStart = sortedTimes[0];
      let blockEnd = sortedTimes[0];
      
      for (let i = 1; i < sortedTimes.length; i++) {
        const currentHour = parseInt(sortedTimes[i].split(':')[0]);
        const previousHour = parseInt(sortedTimes[i - 1].split(':')[0]);
        
        if (currentHour === previousHour + 1) {
          blockEnd = sortedTimes[i];
        } else {
          // Save current block and start new one
          const endHour = parseInt(blockEnd.split(':')[0]) + 1;
          availability.push({
            dayOfWeek,
            startTime: blockStart,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            slotDuration,
            isPublished: false,
            effectiveDate: weekStartStr,
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
        effectiveDate: weekStartStr,
      });
    });
    
    return availability;
  };

  const handleSave = () => {
    if (onSaveAvailability) {
      const availability = convertSlotsToAvailability();
      onSaveAvailability(availability, weekStart);
      setIsDirty(false);
    }
  };

  const formatWeekRange = () => {
    const endDate = new Date(weekStart);
    endDate.setDate(weekStart.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = weekStart.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    const year = weekStart.getFullYear();
    
    return `${startStr} - ${endStr}, ${year}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateWeek('prev')}
          >
            ←
          </Button>
          <h3 className="text-lg font-medium min-w-0">
            {formatWeekRange()}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateWeek('next')}
          >
            →
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
          >
            Today
          </Button>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-2">
            <select 
              value={slotDuration} 
              onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={60}>60min</option>
              <option value={30}>30min</option>
              <option value={90}>90min</option>
              <option value={120}>120min</option>
            </select>
            <Button 
              onClick={clearWeek} 
              variant="outline" 
              size="sm"
            >
              Clear
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

      {/* Calendar Grid */}
      <div className="bg-white border rounded-lg overflow-hidden select-none">
        {/* Header */}
        <div className="grid grid-cols-8 bg-gray-50 border-b">
          <div className="p-3 text-sm font-medium text-gray-600">Time</div>
          {weekDates.map((date, index) => (
            <div key={index} className="p-3 text-center">
              <div className="text-sm font-medium text-gray-900">
                {DAYS_SHORT[index]}
              </div>
              <div className="text-xs text-gray-500">
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {TIME_SLOTS.map((time) => (
          <div key={time} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50">
            <div className="p-3 text-sm text-gray-600 border-r border-gray-100">
              {time}
            </div>
            {DAYS_SHORT.map((_, dayIndex) => {
              const isSelected = isSlotSelected(dayIndex, time);
              return (
                <div
                  key={dayIndex}
                  className={`
                    p-3 text-center transition-colors border-r border-gray-100
                    ${isSelected 
                      ? 'bg-blue-500 text-white' 
                      : 'hover:bg-blue-50'
                    }
                    ${!isTeacher ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  onMouseDown={() => handleMouseDown(dayIndex, time)}
                  onMouseEnter={() => handleMouseEnter(dayIndex, time)}
                >
                  {isSelected && (
                    <div className="w-full h-6 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Instructions */}
      {isTeacher && (
        <div className="text-sm text-gray-500 text-center">
          Click and drag to select time ranges • Navigate weeks to schedule future periods
        </div>
      )}
    </div>
  );
}