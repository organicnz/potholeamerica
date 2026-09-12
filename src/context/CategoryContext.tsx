'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

export interface HazardCategory {
  id: string;
  label: string;
  icon: string;
  count: number;
}

export const HAZARD_CATEGORIES: HazardCategory[] = [
  { id: 'ALL', label: 'All Hazards', icon: '📋', count: 12 },
  { id: 'POTHOLE', label: 'Potholes', icon: '🕳️', count: 9 },
  { id: 'SINKHOLE', label: 'Sinkholes', icon: '⚠️', count: 1 },
  { id: 'CRACKED_ROAD', label: 'Cracked Asphalt', icon: '⚡', count: 1 },
  { id: 'MANHOLE', label: 'Manhole & Utility', icon: '🛡️', count: 1 },
  { id: 'OVERDUE', label: 'Overdue Cases', icon: '⏱️', count: 1 },
  { id: 'RESOLVED', label: 'Verified Fixed', icon: '✅', count: 2 },
];

interface CategoryContextType {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <CategoryContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}
