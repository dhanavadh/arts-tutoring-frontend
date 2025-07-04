'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/contexts/auth-context';
import { authService } from '../../lib/api/services/auth';
import { uploadsService } from '../../lib/api/services/uploads';
import { teachersService } from '../../lib/api/services/teachers';
import { apiClient } from '../../lib/api/client';
import { API_CONFIG } from '../../lib/api/config';
import { getProtectedImageUrl } from '../../lib/api/image-utils';
import { useProtectedImage } from '../../lib/hooks/useProtectedImage';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { Card, CardBody, CardHeader } from '../ui/card';
import { Modal } from '../ui/modal';
import { useToast } from '../ui/toast';

interface ProfileData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Social media/contact fields
  websiteUrl?: string;
  
  // Teacher specific fields
  subject?: string;
  hourlyRate?: number;
  bio?: string;
  yearsExperience?: number;
  qualifications?: string;
  
  // Student specific fields
  gradeLevel?: string;
  school?: string;
  parentEmail?: string;
  parentPhone?: string;
  learningGoals?: string;
}

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  
  // Use the protected image hook for profile image
  const { imageUrl: profileImageUrl, loading: imageLoading } = useProtectedImage(profileData?.profileImage);
  
  // Helper function to convert relative image paths to full URLs
  const getFullImageUrl = (imagePath: string | undefined): string => {
    const result = getProtectedImageUrl(imagePath);
    console.log('🔗 Image URL generated:', { input: imagePath, output: result });
    return result;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({
    firstName: '',
    lastName: '',
    phone: '',
    profileImage: '',
    websiteUrl: '',
    subject: '',
    qualifications: '',
    yearsExperience: 0,
    hourlyRate: 0,
    bio: '',
    gradeLevel: '',
    school: '',
    parentEmail: '',
    parentPhone: '',
    learningGoals: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // First try to get profile from API
      try {
        const profile = await authService.getProfile();
        
        // Initialize the mapped profile with user data
        let mappedProfile: ProfileData = {
          id: profile.id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || '',
          profileImage: profile.profileImage,
          role: String(profile.role),
          isActive: profile.isActive,
          isVerified: (profile as any).isVerified ?? false,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          
          // Social media/contact fields
          websiteUrl: (profile as any).websiteUrl || '',
          
          // Default values for role-specific fields
          subject: '',
          hourlyRate: 0,
          bio: '',
          yearsExperience: 0,
          qualifications: '',
          gradeLevel: '',
          school: '',
          parentEmail: '',
          parentPhone: '',
          learningGoals: ''
        };
        
        // If user is a teacher, fetch teacher-specific data
        if (profile.role === 'teacher') {
          try {
            const teacherProfile = await teachersService.getMyProfile();
            mappedProfile = {
              ...mappedProfile,
              subject: teacherProfile.subject || '',
              hourlyRate: teacherProfile.hourlyRate || 0,
              bio: teacherProfile.bio || '',
              yearsExperience: teacherProfile.yearsExperience || 0,
              qualifications: '' // teacher entity doesn't have this field as string
            };
          } catch (teacherError) {
            console.log('Failed to load teacher profile:', teacherError);
          }
        }
        
        // TODO: Add student profile fetching if needed
        // if (profile.role === 'student') { ... }
        
        setProfileData(mappedProfile);
        // Ensure all form fields have default values to prevent controlled/uncontrolled warnings
        setEditForm({
          ...mappedProfile,
          firstName: mappedProfile.firstName || '',
          lastName: mappedProfile.lastName || '',
          phone: mappedProfile.phone || '',
          profileImage: mappedProfile.profileImage || '',
          websiteUrl: mappedProfile.websiteUrl || '',
          subject: mappedProfile.subject || '',
          qualifications: mappedProfile.qualifications || '',
          yearsExperience: mappedProfile.yearsExperience || 0,
          hourlyRate: mappedProfile.hourlyRate || 0,
          bio: mappedProfile.bio || '',
          gradeLevel: mappedProfile.gradeLevel || '',
          school: mappedProfile.school || '',
          parentEmail: mappedProfile.parentEmail || '',
          parentPhone: mappedProfile.parentPhone || '',
          learningGoals: mappedProfile.learningGoals || ''
        });
        return;
      } catch (apiError) {
        console.log('API profile fetch failed, using auth context user:', apiError);
      }
      
      // Fallback to auth context user data
      if (user) {
        // Map User to ProfileData for fallback case
        const fallbackProfile: ProfileData = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone || '',
          profileImage: user.profileImage,
          role: String(user.role),
          isActive: user.isActive,
          isVerified: (user as any).isVerified ?? false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          
          // Default values for additional fields
          subject: (user as any).subject || '',
          hourlyRate: (user as any).hourlyRate || 0,
          bio: (user as any).bio || '',
          yearsExperience: (user as any).yearsExperience || 0,
          qualifications: (user as any).qualifications || '',
          gradeLevel: (user as any).gradeLevel || '',
          school: (user as any).school || '',
          parentEmail: (user as any).parentEmail || '',
          parentPhone: (user as any).parentPhone || '',
          learningGoals: (user as any).learningGoals || ''
        };
        
        setProfileData(fallbackProfile);
        // Ensure all form fields have default values
        setEditForm({
          ...user,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          websiteUrl: (user as any).websiteUrl || '',
          subject: (user as any).subject || '',
          qualifications: (user as any).qualifications || '',
          yearsExperience: (user as any).yearsExperience || 0,
          hourlyRate: (user as any).hourlyRate || 0,
          bio: (user as any).bio || '',
          gradeLevel: (user as any).gradeLevel || '',
          school: (user as any).school || '',
          parentEmail: (user as any).parentEmail || '',
          parentPhone: (user as any).parentPhone || '',
          learningGoals: (user as any).learningGoals || ''
        });
      } else {
        setError('No profile data available. Please log in again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Separate user profile fields from role-specific fields
      const userProfileData: any = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        profileImage: editForm.profileImage
      };

      // Only include social media URLs if they are not empty and look like valid URLs
      const socialMediaFields = {
        websiteUrl: editForm.websiteUrl
      };

      // Add social media fields only if they have values and look like URLs
      Object.entries(socialMediaFields).forEach(([key, value]) => {
        if (value && value.trim() && (value.trim().startsWith('http://') || value.trim().startsWith('https://'))) {
          userProfileData[key] = value.trim();
        }
      });
      
      // Remove any undefined values from user profile data
      Object.keys(userProfileData).forEach(key => {
        if ((userProfileData as any)[key] === undefined || (userProfileData as any)[key] === null) {
          delete (userProfileData as any)[key];
        }
      });
      
      console.log('Saving user profile data:', userProfileData);
      
      // Update user profile
      const userResponse = await apiClient.patch(`${API_CONFIG.ENDPOINTS.USERS}/profile`, userProfileData);
      
      // Update role-specific data if user is a teacher
      if (user?.role === 'teacher') {
        const teacherData: any = {};
        
        // Only add fields that have valid values
        if (editForm.subject && editForm.subject.trim()) {
          teacherData.subject = editForm.subject.trim();
        }
        
        if (editForm.yearsExperience !== undefined && editForm.yearsExperience >= 0) {
          teacherData.yearsExperience = editForm.yearsExperience;
        }
        
        if (editForm.hourlyRate !== undefined) {
          teacherData.hourlyRate = editForm.hourlyRate;
        }
        
        if (editForm.bio && editForm.bio.trim()) {
          teacherData.bio = editForm.bio.trim();
        }
        
        if (Object.keys(teacherData).length > 0) {
          console.log('Saving teacher profile data:', teacherData);
          await teachersService.updateMyProfile(teacherData);
        }
      }
      
      // TODO: Add student profile update logic if needed
      // if (user?.role === 'student' && user?.student?.id) { ... }
      
      // Reload the complete profile data to get both user and role-specific updates
      console.log('Both profile updates completed, reloading profile data...');
      await loadProfile();
      
      setEditing(false);
      
      // Show success message
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!'
      });
    } catch (err: any) {
      console.error('Profile save error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');
      
      // Use the working profile image upload endpoint instead of general uploads
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('Uploading image with details:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        endpoint: `${API_CONFIG.ENDPOINTS.USERS}/profile/upload-image`,
        hasToken: !!localStorage.getItem('access_token')
      });
      
      const response = await apiClient.upload(`${API_CONFIG.ENDPOINTS.USERS}/profile/upload-image`, formData);
      
      if (response.success || response.data) {
        console.log('Full upload response:', JSON.stringify(response, null, 2));
         // The backend returns the complete updated user object in response.data
        if (response.data && (response.data as any).profileImage) {
          const updatedUserData = response.data as ProfileData;
          const imageUrl = updatedUserData.profileImage;
          
          console.log('Extracted image URL:', imageUrl);
          console.log('Updated user data:', updatedUserData);
          
          // Update all state with the complete updated user data
          setProfileData(updatedUserData);
          setEditForm(prev => ({
            ...prev,
            profileImage: updatedUserData.profileImage || ''
          }));

          // Update auth context user with basic user fields
          setUser({
            ...updatedUserData,
            role: updatedUserData.role as any // Cast role to match UserRole type
          } as any);
          
          console.log('Successfully updated profile image');
        } else {
          console.log('Upload successful but no updated user data found');
          // Force reload profile to get updated image from server
          loadProfile();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await authService.changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully!'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load profile data</p>
        <Button onClick={loadProfile} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowChangePassword(true)}
          >
            Change Password
          </Button>
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  // Reset form with proper default values
                  setEditForm({
                    ...profileData,
                    firstName: profileData.firstName || '',
                    lastName: profileData.lastName || '',
                    phone: profileData.phone || '',
                    profileImage: profileData.profileImage || '',
                    websiteUrl: profileData.websiteUrl || '',
                    subject: profileData.subject || '',
                    qualifications: profileData.qualifications || '',
                    yearsExperience: profileData.yearsExperience || 0,
                    hourlyRate: profileData.hourlyRate || 0,
                    bio: profileData.bio || '',
                    gradeLevel: profileData.gradeLevel || '',
                    school: profileData.school || '',
                    parentEmail: profileData.parentEmail || '',
                    parentPhone: profileData.parentPhone || '',
                    learningGoals: profileData.learningGoals || ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                isLoading={saving}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Image & Basic Info */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Profile Picture</h2>
          </CardHeader>
          <CardBody className="text-center">
            <div className="relative inline-block">
              {imageLoading ? (
                <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse mx-auto border-4 border-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Loading...</span>
                </div>
              ) : (
                <img
                  key={profileData?.profileImage || 'default'} // Force re-render when image changes
                  src={profileImageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                />
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? '...' : '📷'}
                </label>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-medium">
                {profileData.firstName} {profileData.lastName}
              </h3>
              <p className="text-gray-600 capitalize">{profileData.role}</p>
              <div className="flex justify-center space-x-4 text-sm">
                <span className={`px-2 py-1 rounded ${profileData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profileData.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-1 rounded ${profileData.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {profileData.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={editing ? editForm.firstName || '' : profileData.firstName}
                  onChange={(e) => handleEditChange('firstName', e.target.value)}
                  readOnly={!editing}
                />
                <Input
                  label="Last Name"
                  value={editing ? editForm.lastName || '' : profileData.lastName}
                  onChange={(e) => handleEditChange('lastName', e.target.value)}
                  readOnly={!editing}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={profileData.email}
                readOnly
                helperText="Email cannot be changed"
              />
              <Input
                label="Phone"
                value={editing ? editForm.phone || '' : profileData.phone || ''}
                onChange={(e) => handleEditChange('phone', e.target.value)}
                readOnly={!editing}
                placeholder="Enter phone number"
              />
            </CardBody>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Contact Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="LineURL"
                type="url"
                value={editing ? editForm.websiteUrl || '' : profileData.websiteUrl || ''}
                onChange={(e) => handleEditChange('websiteUrl', e.target.value)}
                readOnly={!editing}
                placeholder="https://line.me/ti/p/your-line-id"
                helperText={editing ? "Include http:// or https://" : undefined}
              />
              {!editing && profileData.websiteUrl && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Link</h3>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={profileData.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.4 12L10.1 8.7l1.4-1.4 4.6 4.6-4.6 4.6-1.4-1.4L13.4 12zM7.8 12L4.5 8.7l1.4-1.4 4.6 4.6-4.6 4.6-1.4-1.4L7.8 12z"/>
                      </svg>
                      Line
                    </a>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Role-specific Information */}
          {profileData.role === 'teacher' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Teaching Information</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Subject"
                    value={editing ? editForm.subject || '' : profileData.subject || ''}
                    onChange={(e) => handleEditChange('subject', e.target.value)}
                    readOnly={!editing}
                    placeholder="e.g., Drawing, Painting, Music"
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={editing ? editForm.yearsExperience || '' : profileData.yearsExperience || ''}
                    onChange={(e) => handleEditChange('yearsExperience', parseInt(e.target.value) || 0)}
                    readOnly={!editing}
                    placeholder="Years teaching"
                  />
                </div>
                <Input
                  label="Hourly Rate (USD)"
                  type="number"
                  value={editing ? editForm.hourlyRate || '' : profileData.hourlyRate || ''}
                  onChange={(e) => handleEditChange('hourlyRate', parseFloat(e.target.value) || 0)}
                  readOnly={!editing}
                  placeholder="Your hourly rate"
                />
                <Textarea
                  label="Qualifications"
                  value={editing ? editForm.qualifications || '' : profileData.qualifications || ''}
                  onChange={(e) => handleEditChange('qualifications', e.target.value)}
                  readOnly={!editing}
                  placeholder="Your educational background and certifications"
                  rows={3}
                />
                <Textarea
                  label="Bio"
                  value={editing ? editForm.bio || '' : profileData.bio || ''}
                  onChange={(e) => handleEditChange('bio', e.target.value)}
                  readOnly={!editing}
                  placeholder="Tell students about yourself and your teaching style"
                  rows={4}
                />
              </CardBody>
            </Card>
          )}

          {profileData.role === 'student' && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Student Information</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Grade Level"
                    value={editing ? editForm.gradeLevel || '' : profileData.gradeLevel || ''}
                    onChange={(e) => handleEditChange('gradeLevel', e.target.value)}
                    readOnly={!editing}
                    placeholder="e.g., 10th Grade, College"
                  />
                  <Input
                    label="School"
                    value={editing ? editForm.school || '' : profileData.school || ''}
                    onChange={(e) => handleEditChange('school', e.target.value)}
                    readOnly={!editing}
                    placeholder="Your school name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Parent Email"
                    type="email"
                    value={editing ? editForm.parentEmail || '' : profileData.parentEmail || ''}
                    onChange={(e) => handleEditChange('parentEmail', e.target.value)}
                    readOnly={!editing}
                    placeholder="Parent/Guardian email"
                  />
                  <Input
                    label="Parent Phone"
                    value={editing ? editForm.parentPhone || '' : profileData.parentPhone || ''}
                    onChange={(e) => handleEditChange('parentPhone', e.target.value)}
                    readOnly={!editing}
                    placeholder="Parent/Guardian phone"
                  />
                </div>
                <Textarea
                  label="Learning Goals"
                  value={editing ? editForm.learningGoals || '' : profileData.learningGoals || ''}
                  onChange={(e) => handleEditChange('learningGoals', e.target.value)}
                  readOnly={!editing}
                  placeholder="What would you like to learn or achieve?"
                  rows={3}
                />
              </CardBody>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Account Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Account Created:</strong></p>
                  <p>{new Date(profileData.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><strong>Last Updated:</strong></p>
                  <p>{new Date(profileData.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Change Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            required
            helperText="Minimum 6 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowChangePassword(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={saving}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};