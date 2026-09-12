import type { CaseEventRecord } from '@/types/database.types';
import { Building2, Camera, CheckCircle2, Clock, Send, Users } from 'lucide-react';

export function CaseTimeline({ events }: { events: CaseEventRecord[] }) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'REPORTED':
        return <Camera className="w-4 h-4 text-amber-400" />;
      case 'CONFIRMATION_ADDED':
      case 'CONFIRMATIONS_THRESHOLD':
        return <Users className="w-4 h-4 text-sky-400" />;
      case 'SUBMITTED_TO_AGENCY':
        return <Send className="w-4 h-4 text-orange-400" />;
      case 'AGENCY_ACKNOWLEDGED':
        return <Building2 className="w-4 h-4 text-indigo-400" />;
      case 'COMMUNITY_VERIFIED':
      case 'RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatEventTitle = (eventType: string) => {
    switch (eventType) {
      case 'REPORTED':
        return 'Pothole Reported with Photographic Evidence';
      case 'CONFIRMATION_ADDED':
        return 'Resident Confirmed Road Hazard';
      case 'CONFIRMATIONS_THRESHOLD':
        return 'Community Confirmation Milestone Reached';
      case 'SUBMITTED_TO_AGENCY':
        return 'Official Dispatch Sent to Department of Public Works';
      case 'AGENCY_ACKNOWLEDGED':
        return 'Agency Acknowledged Report (#311 Ticket Issued)';
      case 'COMMUNITY_VERIFIED':
        return 'Neighbor Verified Completed Repair';
      default:
        return eventType.replace(/_/g, ' ');
    }
  };

  if (!events || events.length === 0) {
    return <div className="text-slate-400 text-sm py-4">No timeline events recorded yet.</div>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-4 group">
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            {getEventIcon(event.event_type)}
          </div>
          <div className="flex-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-200">
                {formatEventTitle(event.event_type)}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(event.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {event.payload && (
              <p className="text-xs text-slate-400 mt-1">
                {(event.payload as any).note ||
                  (event.payload as any).notes ||
                  (event.payload as any).agency ||
                  ''}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
