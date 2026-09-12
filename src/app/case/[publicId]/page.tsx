import { CaseTimeline } from '@/components/cases/CaseTimeline';
import { ConfirmButton } from '@/components/cases/ConfirmButton';
import { DualStatusBadge } from '@/components/cases/DualStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INITIAL_CASES, INITIAL_EVENTS } from '@/server/mock-data';
import { ArrowLeft, Building2, MapPin, Share2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicId } = await params;
  const caseItem = INITIAL_CASES.find((c) => c.public_id === publicId);

  if (!caseItem) {
    return { title: 'Case Not Found — Pothole America' };
  }

  return {
    title: `${caseItem.public_id}: ${caseItem.title} — Pothole America`,
    description: `Public case at ${caseItem.address}. ${caseItem.confirmation_count} residents confirmed. Community status: ${caseItem.community_status}.`,
  };
}

export default async function CasePage({ params }: PageProps) {
  const { publicId } = await params;
  const caseItem = INITIAL_CASES.find((c) => c.public_id === publicId);

  if (!caseItem) {
    notFound();
  }

  const events = INITIAL_EVENTS.filter((e) => e.case_id === caseItem.id);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
      {/* Back Link */}
      <Link
        href="/map"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Map
      </Link>

      {/* Main Case Header Card */}
      <Card className="glass-panel border-slate-800 overflow-hidden shadow-2xl">
        <CardHeader className="p-6 md:p-8 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="text-sm font-mono font-extrabold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-lg border border-amber-800/80">
              {caseItem.public_id}
            </span>

            <DualStatusBadge
              communityStatus={caseItem.community_status}
              officialStatus={caseItem.official_status}
            />
          </div>

          <CardTitle className="text-2xl md:text-3xl font-black text-slate-100 leading-snug">
            {caseItem.title}
          </CardTitle>

          <div className="flex items-center gap-2 text-sm text-slate-400 pt-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{caseItem.address}</span>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <ConfirmButton caseId={caseItem.id} initialCount={caseItem.confirmation_count} />

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Case
              </button>
            </div>
          </div>

          {/* Description */}
          {caseItem.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Citizen Description
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/60">
                {caseItem.description}
              </p>
            </div>
          )}

          {/* Responsible Agency Info */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Responsible Agency
              </h4>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                Sacramento Department of Public Works
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Official Ticket: <span className="font-mono text-slate-300">#311-938271</span>
              </p>
            </div>
          </div>

          {/* Immutable Audit Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Public Case Timeline & Audit Trail
            </h4>
            <CaseTimeline events={events} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
