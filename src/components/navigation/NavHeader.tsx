'use client';

import { MapPin, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavHeader() {
  const pathname = usePathname();

  const isPotholesActive = pathname === '/' || pathname === '';
  const isMapActive = pathname.startsWith('/map');
  const isReportActive = pathname.startsWith('/report');

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#080c14]/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between h-18">
      {/* 1. Left: Brand Logo & Title */}
      <Link href="/" className="flex items-center gap-2.5 group shrink-0">
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
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
            Pothole America
            <span className="text-[10px] uppercase font-mono font-bold bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/30">
              Pilot
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium leading-none hidden sm:inline">
            Civic Accountability
          </span>
        </div>
      </Link>

      {/* 2. Center: Tabs on the Nav Menu */}
      <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-2">
        {/* Potholes Tab */}
        <Link
          href="/"
          className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            isPotholesActive
              ? 'text-white bg-slate-800/90 shadow-inner border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
          }`}
        >
          <span className="text-base leading-none">🕳️</span>
          <span>Potholes</span>
          {isPotholesActive && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
          )}
        </Link>

        {/* Public Map Tab */}
        <Link
          href="/map"
          className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            isMapActive
              ? 'text-white bg-slate-800/90 shadow-inner border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
          }`}
        >
          <MapPin
            className={`w-4 h-4 ${
              isMapActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
            }`}
          />
          <span>Public Map</span>
          {isMapActive && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
          )}
        </Link>

        {/* Report Tab */}
        <Link
          href="/report"
          className={`relative hidden md:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
            isReportActive
              ? 'text-white bg-slate-800/90 shadow-inner border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
          }`}
        >
          <PlusCircle
            className={`w-4 h-4 ${
              isReportActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
            }`}
          />
          <span>Report Defect</span>
          {isReportActive && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
          )}
        </Link>
      </nav>

      {/* 3. Right: Pilot City Badge & Action Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sacramento Live</span>
        </div>

        <Link
          href="/report"
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">Report Hazard</span>
          <span className="inline xs:hidden sm:hidden">Report</span>
        </Link>
      </div>
    </header>
  );
}
