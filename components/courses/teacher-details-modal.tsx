'use client';

import { Teacher } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Mail, Phone, Calendar, Award, BookOpen } from '@/components/ui/icons';

interface TeacherDetailsModalProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherDetailsModal({ teacher, isOpen, onClose }: TeacherDetailsModalProps) {
  const getProfileImageUrl = (profileImage: string | null) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${profileImage}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Teacher Profile"
      size="lg"
    >
      <div className="space-y-6">

        {/* Teacher Profile Section */}
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {teacher.user.profileImage ? (
                <img
                  src={getProfileImageUrl(teacher.user.profileImage) || ''}
                  alt={`${teacher.user.firstName} ${teacher.user.lastName}`}
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-2xl font-semibold text-gray-600 ${teacher.user.profileImage ? 'hidden' : ''}`}>
                {teacher.user.firstName[0]}{teacher.user.lastName[0]}
              </span>
            </div>
          </div>
          
          <div className="flex-grow">
            <h3 className="text-2xl font-semibold mb-2">
              {teacher.user.firstName} {teacher.user.lastName}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {teacher.isVerified && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Award className="w-3 h-3 mr-1" />
                  Verified Teacher
                </Badge>
              )}
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <BookOpen className="w-3 h-3 mr-1" />
                {teacher.subject}
              </Badge>
            </div>

            {teacher.bio && (
              <p className="text-gray-700">{teacher.bio}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <Card className="p-4">
          <h4 className="text-lg font-semibold mb-3 flex items-center">
            <Mail className="w-4 h-4 mr-2" />
            Contact Information
          </h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span>{teacher.user.email}</span>
            </div>
            {teacher.user.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span>{teacher.user.phone}</span>
              </div>
            )}
            {teacher.user.websiteUrl && (
              <div className="flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <a 
                  href={teacher.user.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Line Profile
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Professional Details */}
        <Card className="p-4">
          <h4 className="text-lg font-semibold mb-3">Professional Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Subject Specialization:</span>
              <p className="text-gray-600">{teacher.subject}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Years of Experience:</span>
              <p className="text-gray-600">{teacher.yearsExperience} years</p>
            </div>
            {teacher.hourlyRate > 0 && (
              <div>
                <span className="font-medium text-gray-700">Hourly Rate:</span>
                <p className="text-gray-600">${teacher.hourlyRate}/hour</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Verification Status:</span>
              <p className={`font-medium ${teacher.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {teacher.isVerified ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
          </div>
        </Card>

        {/* Availability Schedule */}
        {teacher.availabilitySchedule && (
          <Card className="p-4">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Availability Schedule
            </h4>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {teacher.availabilitySchedule}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {teacher.user.websiteUrl ? (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open(teacher.user.websiteUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Line Contact
              </Button>
              <Button 
                onClick={() => {
                  window.location.href = `mailto:${teacher.user.email}`;
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Teacher
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => {
                window.location.href = `mailto:${teacher.user.email}`;
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Teacher
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}