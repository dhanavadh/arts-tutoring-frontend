import { API_CONFIG } from '../api/config';

/**
 * Get public image URL for profile images (no authentication required)
 */
export const getPublicImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === 'undefined') {
    // Return a default profile image SVG
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K';
  }

  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Convert relative path to public API URL
  let apiPath = imagePath;
  
  if (imagePath.startsWith('/uploads/')) {
    // Path like: /uploads/profiles/file.png -> /uploads/files/profiles/file.png
    apiPath = imagePath.replace('/uploads/', '/uploads/files/');
  } else if (imagePath.startsWith('uploads/')) {
    // Path like: uploads/profiles/file.png -> /uploads/files/profiles/file.png
    apiPath = `/uploads/files/${imagePath.substring(8)}`;
  } else {
    // Path like: profiles/file.png -> /uploads/files/profiles/file.png
    apiPath = `/uploads/files/${imagePath}`;
  }
  
  const fullUrl = `${API_CONFIG.BASE_URL}${apiPath}`;
  return fullUrl;
};

/**
 * Get default avatar with initials
 */
export const getDefaultAvatar = (firstName?: string, lastName?: string, role?: string): string => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  
  // Create a simple SVG with initials
  const svg = `
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="#6366f1"/>
      <text x="64" y="75" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="bold">${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
