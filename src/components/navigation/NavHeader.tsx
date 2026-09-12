'use client';

import { HAZARD_CATEGORIES, useCategory } from '@/context/CategoryContext';
import { MapPin, PlusCircle, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeCategory, setActiveCategory, searchQuery, setSearchQuery } = useCategory();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (pathname !== '/' && val.trim() !== '') {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#080c14]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-[1560px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-900 flex items-center justify-center shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform p-0.5">
            <Image
              src="/logo.png"
              alt="Pothole America Crest"
              width={36}
              height={36}
              className="w-full h-full object-cover rounded-lg"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              Pothole America
              <span className="text-[9px] uppercase font-mono font-extrabold bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/30">
                Pilot
              </span>
            </span>
          </div>
        </Link>

        {/* 2. Center: Unified Category Dock */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-1 sm:px-3">
          <nav
            aria-label="Hazard Categories"
            className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner overflow-x-auto no-scrollbar max-w-full"
          >
            {HAZARD_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id && pathname === '/';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span className="text-sm leading-none">{cat.icon}</span>
                  <span className="whitespace-nowrap tracking-tight">{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                      isActive ? 'bg-amber-400/25 text-amber-200' : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. Right: Search, Public Map, and Report Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Pill (Expanding on focus / mobile click) */}
          <div className="relative">
            {isSearchExpanded ? (
              <div className="flex items-center rounded-full border border-amber-500/70 bg-slate-900 shadow-lg px-3 py-1.5 transition-all">
                <Search className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search street or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setIsSearchExpanded(false);
                  }}
                  className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-36 sm:w-48 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchExpanded(false);
                  }}
                  className="text-slate-400 hover:text-slate-200 ml-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                {/* Desktop Always-Available Compact Search */}
                <div className="hidden lg:flex items-center rounded-full border border-slate-800 bg-slate-900/80 shadow-inner px-3 py-1.5 hover:border-slate-700 focus-within:border-amber-500/60 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search hazards..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-28 xl:w-36 focus:w-48 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-200 ml-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Mobile / Tablet Quick Search Button */}
                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(true)}
                  className="lg:hidden p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Search hazards"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Public Map Link */}
          <Link
            href="/map"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              pathname === '/map'
                ? 'text-amber-400 bg-slate-800 border-slate-700 shadow-sm'
                : 'text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
            }`}
            title="Public Map"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Map</span>
          </Link>

          {/* Report Hazard CTA */}
          <Link
            href="/report"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Report</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
