import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export const useProtectedImage = (imagePath: string | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null' || imagePath === 'undefined') {
      // Use fallback SVG for no image
      setImageUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K');
      setLoading(false);
      setError(null);
      return;
    }

    if (imagePath.startsWith('http')) {
      // External image, use as-is
      setImageUrl(imagePath);
      setLoading(false);
      return;
    }

    // Protected image - fetch through our authenticated API
    const fetchProtectedImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Normalize the path to the protected endpoint
        let apiPath = imagePath;
        if (imagePath.startsWith('/uploads/')) {
          apiPath = imagePath.replace('/uploads/', '/uploads/files/');
        } else if (imagePath.startsWith('uploads/')) {
          apiPath = `/uploads/files/${imagePath.substring(8)}`;
        } else {
          apiPath = `/uploads/files/${imagePath}`;
        }

        // Fetch the image as a blob through our authenticated API client
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}${apiPath}`, {
          credentials: 'include',
          headers: {
            'Accept': 'image/*',
          },
        });

        if (!response.ok) {
          // Don't log 404 errors as they're expected when users don't have profile images
          if (response.status === 404) {
            // Silently fall back to default image for missing profile images
            setImageUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K');
            setLoading(false);
            return;
          }
          throw new Error(`Failed to load image: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
      } catch (err) {
        // Only log non-404 errors to avoid console spam for missing profile images
        if (!(err instanceof Error && err.message.includes('404'))) {
          console.error('Failed to load protected image:', err);
        }
        setError(err instanceof Error ? err.message : 'Failed to load image');
        // Set fallback image
        setImageUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjY0IiB5PSI3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5Qcm9maWxlPC90ZXh0Pgo8L3N2Zz4K');
      } finally {
        setLoading(false);
      }
    };

    fetchProtectedImage();

    // Cleanup blob URL when component unmounts or imagePath changes
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imagePath]);

  return { imageUrl, loading, error };
};
