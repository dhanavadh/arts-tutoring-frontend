import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Teacher } from '@/lib/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPublicImageUrl, getDefaultAvatar } from '@/lib/utils/public-image';

interface TeacherCardProps {
  teacher: Teacher;
  showBookButton?: boolean;
  onBookClick?: (teacherId: number) => void;
}

export function TeacherCard({ teacher, showBookButton = false, onBookClick }: TeacherCardProps) {
  const router = useRouter();

  const formatExperience = (years: number) => {
    if (years === 0) return 'New teacher';
    if (years === 1) return '1 year experience';
    return `${years} years experience`;
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free consultation' : `$${price}/hour`;
  };

  const getImageUrl = () => {
    if (teacher.user?.profileImage) {
      return getPublicImageUrl(teacher.user.profileImage);
    }
    return getDefaultAvatar(teacher.user?.firstName, teacher.user?.lastName, 'teacher');
  };

  const handleCardClick = () => {
    router.push(`/teachers/${teacher.id}`);
  };

  return (
    <div 
      className="cursor-pointer h-full"
      onClick={handleCardClick}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full group">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img
                src={getImageUrl()}
                alt={`${teacher.user?.firstName} ${teacher.user?.lastName}`}
                className="w-16 h-16 object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.currentTarget.src = getDefaultAvatar(teacher.user?.firstName, teacher.user?.lastName, 'teacher');
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                {teacher.user?.firstName} {teacher.user?.lastName}
              </h3>
              <p className="text-gray-600">{teacher.subject}</p>
              {teacher.isVerified && (
                <Badge className="bg-green-100 text-green-800 mt-1">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardBody>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Experience:</span>
              <span className="text-sm font-medium">
                {formatExperience(teacher.yearsExperience)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rate:</span>
              <span className="text-sm font-medium text-green-600">
                {formatPrice(teacher.hourlyRate)}
              </span>
            </div>

            {teacher.bio && (
              <div className="mt-3">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {teacher.bio}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking button
                router.push(`/teachers/${teacher.id}`);
              }}
            >
              View Profile
            </Button>
            
            {showBookButton && onBookClick && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when clicking book button
                  onBookClick(teacher.id);
                }}
                className="w-full"
              >
                Book Session
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
