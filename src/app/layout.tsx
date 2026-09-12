import { MapPin, PlusCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pothole America — Public Infrastructure Accountability',
  description:
    'Every pothole becomes an open community case—not a private 311 ticket. Neighbors confirm, cities respond, and the community verifies the fix.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform p-0.5">
              <Image
                src="/logo.png"
                alt="Pothole America Crest"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Pothole America
                <span className="text-[10px] uppercase font-mono font-bold bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/30">
                  Pilot
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-none">
                Civic Accountability
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5 md:gap-3">
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Public Map</span>
            </Link>

            <Link
              href="/report"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Hazard</span>
            </Link>
          </nav>
        </header>

        {/* Content Body */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Footer */}
        <footer className="glass-panel border-t border-slate-800/60 py-6 px-6 text-center text-xs text-slate-500">
          <p className="max-w-xl mx-auto">
            Not for emergencies. If a road defect poses immediate physical danger, call 911. Pothole
            America is an independent open civic platform modeled for community-verified public
            accountability.
          </p>
        </footer>
      </body>
    </html>
  );
}
