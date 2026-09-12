import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CommunityStatus, OfficialStatus } from '@/types/database.types';

export function DualStatusBadge({
  communityStatus,
  officialStatus,
  className,
}: {
  communityStatus: CommunityStatus;
  officialStatus: OfficialStatus;
  className?: string;
}) {
  const getCommunityVariant = (status: CommunityStatus) => {
    switch (status) {
      case 'RESOLVED':
        return 'success';
      case 'OPEN':
      case 'REOPENED':
        return 'destructive';
      case 'NEW':
      case 'CONFIRMED':
        return 'default';
      case 'FIXED_PENDING_VERIFICATION':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatText = (text: string) => text.replace(/_/g, ' ');

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Official Status */}
      <Badge variant="outline" className="border-slate-700 bg-slate-900/80 text-slate-300">
        Gov: {formatText(officialStatus)}
      </Badge>

      {/* Community Status */}
      <Badge variant={getCommunityVariant(communityStatus)}>
        Community: {formatText(communityStatus)}
      </Badge>
    </div>
  );
}
