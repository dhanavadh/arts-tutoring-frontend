'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { bookingsApi } from '../../lib/api/services/bookings';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  available: boolean;
}

interface StudentBookingViewProps {
  teacherId: number;
  teacherName: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentBookingView({ teacherId, teacherName }: StudentBookingViewProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    subject: '',
    notes: '',
  });

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, teacherId]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const slots = await bookingsApi.getAvailableTimeSlots(teacherId, selectedDate);
      setAvailableSlots(slots || []);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    try {
      setBooking(true);
      
      await bookingsApi.createBooking({
        teacherId,
        startTime: selectedSlot.startTime.toISOString(),
        endTime: selectedSlot.endTime.toISOString(),
        subject: bookingDetails.subject,
        notes: bookingDetails.notes,
      });

      // Reset form and reload slots
      setSelectedSlot(null);
      setBookingDetails({ subject: '', notes: '' });
      await loadAvailableSlots();
      
      alert('Booking created successfully! The teacher will confirm your booking.');
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDateFromString = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayName: DAYS[date.getDay()],
      formatted: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  };

  const dateInfo = selectedDate ? getDateFromString(selectedDate) : null;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Book a Session with {teacherName}</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Select Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="border rounded px-3 py-2 w-full max-w-xs"
            />
            {dateInfo && (
              <p className="text-sm text-gray-600 mt-1">{dateInfo.formatted}</p>
            )}
          </div>

          {selectedDate && (
            <div>
              <h3 className="text-lg font-medium mb-3">Available Time Slots</h3>
              
              {loading ? (
                <p className="text-gray-600">Loading available slots...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-gray-600">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotSelect(slot)}
                      className={`
                        p-3 border rounded text-sm transition-colors
                        ${selectedSlot === slot
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      <div className="text-xs opacity-75">
                        ({slot.duration} min)
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-medium mb-3">Booking Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Selected Time Slot:</p>
                  <p className="font-medium">
                    {dateInfo?.dayName}, {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </p>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject/Topic
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={bookingDetails.subject}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Math - Algebra"
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any specific topics or questions you'd like to focus on..."
                    rows={3}
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleBooking}
                    disabled={booking || !bookingDetails.subject.trim()}
                    className="flex-1"
                  >
                    {booking ? 'Booking...' : 'Book Session'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSlot(null)}
                    disabled={booking}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}