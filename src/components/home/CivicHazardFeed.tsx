'use client';

import { CivicMap } from '@/components/map/CivicMap';
import type { CaseRecord } from '@/types/database.types';
import { Heart, List, Map as MapIcon, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// Civic Hazard Category Tabs
const CATEGORIES = [
  { id: 'POTHOLE', label: 'Potholes', icon: '🕳️', count: 9 },
  { id: 'SINKHOLE', label: 'Sinkholes', icon: '⚠️', count: 1 },
  { id: 'CRACKED_ROAD', label: 'Cracked Asphalt', icon: '⚡', count: 1 },
  { id: 'MANHOLE', label: 'Manhole & Utility', icon: '🛡️', count: 1 },
  { id: 'OVERDUE', label: 'Overdue Cases', icon: '⏱️', count: 1 },
  { id: 'RESOLVED', label: 'Verified Fixed', icon: '✅', count: 2 },
  { id: 'ALL', label: 'All Hazards', icon: '📋', count: 12 },
];

export function CivicHazardFeed() {
  const [activeCategory, setActiveCategory] = useState<string>('POTHOLE');
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedIds, setConfirmedIds] = useState<Record<string, number>>({});

  // Fetch cases dynamically from Edge API (connected to Supabase)
  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/cases?';
      if (activeCategory === 'OVERDUE') {
        url += 'limit=50';
      } else if (activeCategory === 'RESOLVED') {
        url += 'status=RESOLVED';
      } else if (activeCategory !== 'ALL') {
        url += `category=${activeCategory}`;
      }

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      let data: CaseRecord[] = json.data || [];

      if (activeCategory === 'OVERDUE') {
        data = data.filter((c) => c.official_status === 'OVERDUE');
      }

      setCases(data);
    } catch (err) {
      console.error('Failed to fetch road hazards:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Quick confirmation handler
  const handleConfirm = async (e: React.MouseEvent, caseItem: CaseRecord) => {
    e.preventDefault();
    e.stopPropagation();

    const currentCount = confirmedIds[caseItem.id] ?? caseItem.confirmation_count;
    setConfirmedIds((prev) => ({ ...prev, [caseItem.id]: currentCount + 1 }));

    try {
      await fetch(`/api/cases/${caseItem.id}/confirm`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to confirm case:', err);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* 1. Filter & Search Bar */}
      <div className="sticky top-[72px] z-40 glass-panel border-b border-slate-800/80 bg-[#080c14]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3">
          {/* Top Search Pill */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl mx-auto md:mx-0">
              <div className="flex items-center rounded-full border border-slate-700/80 bg-slate-900/90 shadow-lg px-4 py-2 hover:border-amber-500/50 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by street (e.g. Broadway, J Street) or ID (PA-001824)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-200 ml-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sacramento Pilot (Live Edge Feed)</span>
            </div>
          </div>

          {/* Category Navigation Tabs Row */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pt-1 pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-1.5 pb-2 border-b-2 transition-all shrink-0 cursor-pointer group ${
                    isActive
                      ? 'border-amber-400 text-slate-100'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <span className="text-xs font-bold tracking-tight whitespace-nowrap flex items-center gap-1">
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
          </div>
        </div>
      </div>

      {/* 2. Main Body: Grid OR Map View */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="w-full h-[75vh] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <CivicMap />
          </div>
        ) : (
          /* Grid View */
          <>
            {/* Header info row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Road Defects'}
                </h2>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  {loading ? 'Fetching...' : `${cases.length} active cases`}
                </span>
              </div>

              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                Real-time citizen accountability · Sacramento, CA
              </span>
            </div>

            {/* Skeleton Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="flex flex-col gap-3 animate-pulse">
                    <div className="w-full aspect-[4/3] rounded-2xl bg-slate-800/60" />
                    <div className="h-4 w-3/4 rounded bg-slate-800/60" />
                    <div className="h-3 w-1/2 rounded bg-slate-800/60" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && cases.length === 0 && (
              <div className="text-center py-16 px-4 glass-card max-w-md mx-auto rounded-3xl">
                <span className="text-4xl mb-3 block">🚧</span>
                <h3 className="text-lg font-bold text-slate-100 mb-1">No reported hazards here</h3>
                <p className="text-xs text-slate-400 mb-6">
                  No active cases found in this category for Sacramento. Be the first to document
                  one!
                </p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                >
                  Report a Hazard
                </Link>
              </div>
            )}

            {/* Pothole Listings Grid */}
            {!loading && cases.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                {cases.map((item) => {
                  const count = confirmedIds[item.id] ?? item.confirmation_count;
                  const isDangerous = item.severity === 'DANGEROUS';
                  const isResolved = item.community_status === 'RESOLVED';

                  return (
                    <Link
                      key={item.id}
                      href={`/case/${item.public_id}`}
                      className="group flex flex-col cursor-pointer"
                    >
                      {/* Card Image Container */}
                      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-3 shadow-md group-hover:shadow-xl group-hover:shadow-amber-500/10 transition-all duration-300">
                        {item.photo_url ? (
                          <Image
                            src={item.photo_url}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-600">
                            <span className="text-4xl">🕳️</span>
                          </div>
                        )}

                        {/* Top Overlay Badges */}
                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                          {/* Severity Pill */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 backdrop-blur-md shadow-sm ${
                              isDangerous
                                ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                : item.severity === 'SIGNIFICANT'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDangerous
                                  ? 'bg-red-400 animate-pulse'
                                  : item.severity === 'SIGNIFICANT'
                                    ? 'bg-amber-400'
                                    : 'bg-blue-400'
                              }`}
                            />
                            {item.severity}
                          </span>

                          {/* Heart / Confirm Button */}
                          <button
                            type="button"
                            onClick={(e) => handleConfirm(e, item)}
                            className="pointer-events-auto p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-amber-400 backdrop-blur-md border border-slate-700/60 transition-all hover:scale-110 active:scale-95 shadow-md flex items-center gap-1 text-[11px] font-bold"
                            title="Confirm this hazard"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                count > item.confirmation_count
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-slate-300'
                              }`}
                            />
                            <span>{count}</span>
                          </button>
                        </div>

                        {/* Bottom Overlay: Public ID Pill */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-950/80 text-amber-400 border border-slate-700/80 backdrop-blur-md">
                            {item.public_id}
                          </span>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="flex flex-col gap-1">
                        {/* Title & Address */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                            {item.address}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-1">{item.title}</p>

                        {/* Status Row */}
                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span
                            className={`font-bold ${
                              isResolved
                                ? 'text-emerald-400'
                                : item.community_status === 'CONFIRMED'
                                  ? 'text-amber-400'
                                  : 'text-blue-400'
                            }`}
                          >
                            Community: {item.community_status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 truncate">
                            City: {item.official_status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Metric Row */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                          <span>{count} residents verified</span>
                          <span>·</span>
                          <span>
                            {new Date(item.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. Floating "Show map" / "Show list" Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'grid' ? 'map' : 'grid'))}
          className="group flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-100 hover:text-white border border-slate-700/80 hover:border-amber-500/60 shadow-2xl backdrop-blur-lg font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-black/80"
        >
          {viewMode === 'grid' ? (
            <>
              <span>Show map</span>
              <MapIcon className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            </>
          ) : (
            <>
              <span>Show list</span>
              <List className="w-4 h-4 text-amber-400 group-hover:-rotate-12 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
