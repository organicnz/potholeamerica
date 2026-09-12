'use client';

import { HAZARD_CATEGORIES, useCategory } from '@/context/CategoryContext';
import { MapPin, PlusCircle, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeCategory, setActiveCategory, searchQuery, setSearchQuery } = useCategory();

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
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#080c14]/95 backdrop-blur-md">
      {/* 1. Primary Navbar: Brand, Search, and Civic Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
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
              Civic Infrastructure Accountability
            </span>
          </div>
        </Link>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-lg hidden md:block">
          <div className="flex items-center rounded-full border border-slate-700/80 bg-slate-900/90 shadow-lg px-4 py-2 hover:border-amber-500/50 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search by street (e.g. Broadway, J Street) or ID (PA-001824)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-200 ml-2 shrink-0 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Status Pill, Map Link, Report Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sacramento Pilot (Live Edge Feed)</span>
          </div>

          <Link
            href="/map"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              pathname === '/map'
                ? 'text-amber-400 bg-slate-800 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Public Map</span>
          </Link>

          <Link
            href="/report"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Report Hazard</span>
            <span className="inline xs:hidden sm:hidden">Report</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden px-4 pb-2.5 pt-0.5">
        <div className="flex items-center rounded-full border border-slate-700/80 bg-slate-900/90 shadow px-3.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by street or ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200 ml-1.5 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Tabs on the Navbar */}
      <div className="border-t border-slate-800/60 bg-[#06090f]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Hazard Categories"
            className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-2"
          >
            {HAZARD_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id && pathname === '/';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex flex-col items-center gap-1.5 pb-2.5 border-b-2 transition-all shrink-0 cursor-pointer group ${
                    isActive
                      ? 'border-amber-400 text-slate-100 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 font-medium'
                  }`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <span className="text-xs tracking-tight whitespace-nowrap flex items-center gap-1">
                    {cat.label}
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                        isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
