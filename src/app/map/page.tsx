import { CivicMap } from '@/components/map/CivicMap';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Public Civic Map — Pothole America',
  description: 'Interactive map of all open public road hazard cases and repair statuses.',
};

export default function MapPage() {
  return (
    <main className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 flex items-center justify-center shadow-md p-0.5 shrink-0">
            <Image
              src="/logo.png"
              alt="Pothole America Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-lg"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2">
              <span>Sacramento Civic Map</span>
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Live Pilot
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Click any pin or cluster to view confirmed hazards, agency statuses, and public
              evidence.
            </p>
          </div>
        </div>

        <Link href="/report">
          <Button className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold gap-2 shadow-lg shadow-amber-500/20">
            <PlusCircle className="w-4 h-4" />
            Report Hazard Here
          </Button>
        </Link>
      </div>

      <div className="flex-1 min-h-[650px] w-full">
        <CivicMap />
      </div>
    </main>
  );
}
