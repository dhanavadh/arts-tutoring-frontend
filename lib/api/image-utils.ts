import { API_CONFIG } from './config';

/**
 * Convert relative image paths to protected API URLs
 */
export const getProtectedImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) {
    // Use a simple, working base64 encoded SVG as default
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K';
  }
  if (imagePath.startsWith('http')) return imagePath;
  
  // Normalize the path and convert to protected API endpoint
  let apiPath = imagePath;
  
  if (imagePath.startsWith('/uploads/')) {
    // Path like: /uploads/profiles/file.png -> /uploads/files/profiles/file.png
    apiPath = imagePath.replace('/uploads/', '/uploads/files/');
  } else if (imagePath.startsWith('uploads/')) {
    // Path like: uploads/profiles/file.png -> /uploads/files/profiles/file.png
    apiPath = `/uploads/files/${imagePath.substring(8)}`; // Remove 'uploads/' and prepend '/uploads/files/'
  } else {
    // Path like: profiles/file.png -> /uploads/files/profiles/file.png
    apiPath = `/uploads/files/${imagePath}`;
  }
  
  const fullUrl = `${API_CONFIG.BASE_URL}${apiPath}`;
  
  // Add cache-busting timestamp to force image refresh
  const cacheBuster = `?t=${Date.now()}`;
  return fullUrl + cacheBuster;
};

/**
 * Get default profile image URL based on user role
 */
export const getDefaultProfileImage = (role?: string): string => {
  switch (role) {
    case 'student':
      return 'https://artstutoring01.iconroof.co.th/student.png';
    case 'teacher':
      return 'https://artstutoring01.iconroof.co.th/teacher.png';
    case 'admin':
      return 'https://artstutoring01.iconroof.co.th/admin.png';
    default:
      // Use a simple, working base64 encoded SVG as default
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K';
  }
};
