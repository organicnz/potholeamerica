'use client';

import { DualStatusBadge } from '@/components/cases/DualStatusBadge';
import { CivicMap } from '@/components/map/CivicMap';
import { HAZARD_CATEGORIES, useCategory } from '@/context/CategoryContext';
import type { CaseRecord } from '@/types/database.types';
import { AlertCircle, ArrowUpDown, Heart, List, Map as MapIcon, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type SortOption = 'urgent' | 'confirmed' | 'recent';

export function CivicHazardFeed() {
  const { activeCategory, searchQuery } = useCategory();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('urgent');
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

  const currentCategoryMeta = HAZARD_CATEGORIES.find((c) => c.id === activeCategory);

  // Sorted cases
  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === 'confirmed') {
      const countA = confirmedIds[a.id] ?? a.confirmation_count;
      const countB = confirmedIds[b.id] ?? b.confirmation_count;
      return countB - countA;
    }
    if (sortBy === 'urgent') {
      const severityScore = { DANGEROUS: 3, SIGNIFICANT: 2, MINOR: 1 };
      return severityScore[b.severity] - severityScore[a.severity];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="w-full h-[75vh] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <CivicMap />
          </div>
        ) : (
          /* Grid View */
          <>
            {/* Header info & quick sort row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">{currentCategoryMeta?.icon || '📋'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                      {currentCategoryMeta?.label || 'All Hazards'}
                    </h2>
                    <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      {loading ? 'Fetching...' : `${cases.length} active`}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Verified citizen reports · Sacramento Department of Public Works
                  </span>
                </div>
              </div>

              {/* Quick Sorting Pills */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold self-start sm:self-auto">
                <span className="text-[11px] text-slate-500 pl-1.5 pr-1 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  Sort:
                </span>
                <button
                  type="button"
                  onClick={() => setSortBy('urgent')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    sortBy === 'urgent'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Urgent First
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('confirmed')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    sortBy === 'confirmed'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Most Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    sortBy === 'recent'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recent
                </button>
              </div>
            </div>

            {/* Skeleton Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="flex flex-col gap-3 animate-pulse">
                    <div className="w-full aspect-[20/19] rounded-2xl bg-slate-800/60" />
                    <div className="h-4 w-3/4 rounded bg-slate-800/60" />
                    <div className="h-3 w-1/2 rounded bg-slate-800/60" />
                    <div className="h-3 w-1/3 rounded bg-slate-800/60" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && sortedCases.length === 0 && (
              <div className="text-center py-20 px-4 glass-card max-w-md mx-auto rounded-3xl border border-slate-800 shadow-2xl">
                <span className="text-5xl mb-3 block">🚧</span>
                <h3 className="text-lg font-bold text-slate-100 mb-1">No reported hazards here</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  {searchQuery
                    ? `No active cases match "${searchQuery}" in this category.`
                    : 'No active road defects reported in this category for Sacramento. Be the first to document one!'}
                </p>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                >
                  Report a Hazard
                </Link>
              </div>
            )}

            {/* Airbnb-Grade Listing Cards Grid */}
            {!loading && sortedCases.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
                {sortedCases.map((item) => {
                  const count = confirmedIds[item.id] ?? item.confirmation_count;
                  const isDangerous = item.severity === 'DANGEROUS';

                  return (
                    <Link
                      key={item.id}
                      href={`/case/${item.public_id}`}
                      className="group flex flex-col cursor-pointer"
                    >
                      {/* Card Image Container (20:19 Aspect Ratio) */}
                      <div className="relative w-full aspect-[20/19] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-3 shadow-md group-hover:shadow-2xl group-hover:shadow-amber-500/10 transition-all duration-300">
                        {item.photo_url ? (
                          <Image
                            src={item.photo_url}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
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
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                              isDangerous
                                ? 'bg-red-950/85 text-red-200 border border-red-500/50'
                                : item.severity === 'SIGNIFICANT'
                                  ? 'bg-amber-950/85 text-amber-200 border border-amber-500/50'
                                  : 'bg-blue-950/85 text-blue-200 border border-blue-500/50'
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
                            className="pointer-events-auto p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 text-slate-300 hover:text-amber-400 backdrop-blur-md border border-slate-700/80 transition-all hover:scale-110 active:scale-95 shadow-md flex items-center gap-1.5 text-[11px] font-bold"
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

                        {/* Bottom-Left Public ID Badge */}
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-950/85 text-amber-400 border border-slate-700/80 backdrop-blur-md">
                            {item.public_id}
                          </span>
                        </div>
                      </div>

                      {/* Card Details: Airbnb 4-Tier Hierarchy */}
                      <div className="flex flex-col gap-0.5">
                        {/* Line 1: Address & Severity Star Score */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                            {item.address}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-slate-200">
                            {isDangerous ? (
                              <span className="flex items-center gap-1 text-red-400 text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" /> High Risk
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{' '}
                                {item.severity === 'SIGNIFICANT' ? 'Level 2' : 'Level 1'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Line 2: Headline Defect Description */}
                        <p className="text-xs text-slate-400 line-clamp-1 font-medium">
                          {item.title}
                        </p>

                        {/* Line 3: Timeline / Statutory Notice */}
                        <p className="text-[11px] text-slate-500 pt-0.5">
                          Reported{' '}
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          · 14-day statutory clock
                        </p>

                        {/* Line 4: The Civic Weight & Dual Status */}
                        <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-800/60 text-xs">
                          <span className="font-extrabold text-slate-200">
                            {count} residents verified
                          </span>
                          <DualStatusBadge
                            communityStatus={item.community_status}
                            officialStatus={item.official_status}
                          />
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

      {/* Floating "Show map" / "Show list" Pill Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === 'grid' ? 'map' : 'grid'))}
          className="group flex items-center gap-2.5 px-5 py-3 rounded-full bg-slate-900/95 hover:bg-slate-850 text-slate-100 hover:text-white border border-slate-700/90 hover:border-amber-400/80 shadow-2xl backdrop-blur-2xl font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-black/90"
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
