---
name: supabase-realtime-events
description: >-
  Reactive UI updates, live collaborative case timelines, and optimistic mutations.
  Use when connecting Supabase Realtime channels, streaming case events, broadcasting map pin changes, or applying React 19 useOptimistic.
---

# Supabase Realtime & Optimistic Events

## Architecture Overview
Every action on a case (a neighbor confirming, agency acknowledgement, work crew repair photo) emits an event into `case_events`. Clients listen over Supabase Realtime WebSockets to update timelines and map pins with zero polling.

---

## 1. Live Map Pin Synchronization

Listen for changes across all active cases on the map viewport:

```tsx
'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Map as MapLibreMap } from 'maplibre-gl';

export function useRealtimeMapPins(map: MapLibreMap | null) {
  useEffect(() => {
    if (!map) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('public:cases_map')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases' },
        (payload) => {
          const updatedCase = payload.new;
          const source = map.getSource('cases') as any;
          if (!source) return;

          const data = source._data;
          const featureIndex = data.features.findIndex(
            (f: any) => f.properties.id === updatedCase.id
          );

          if (featureIndex !== -1) {
            data.features[featureIndex].properties.community_status = updatedCase.community_status;
            data.features[featureIndex].properties.official_status = updatedCase.official_status;
            data.features[featureIndex].properties.confirmation_count = updatedCase.confirmation_count;
            source.setData(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [map]);
}
```

---

## 2. Live Public Case Timeline Stream

Subscribing to new events on `/case/[publicId]`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export interface CaseEvent {
  id: string;
  event_type: string;
  actor_type: 'USER' | 'AGENCY' | 'SYSTEM';
  payload: Record<string, unknown>;
  created_at: string;
}

export function useCaseEvents(caseId: string, initialEvents: CaseEvent[]) {
  const [events, setEvents] = useState<CaseEvent[]>(initialEvents);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`case:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_events',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as CaseEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  return events;
}
```

---

## 3. React 19 Optimistic Case Confirmations

```tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { confirmCaseAction } from '@/actions/cases';

export function OptimisticConfirmButton({
  caseId,
  initialCount,
  hasConfirmed,
}: {
  caseId: string;
  initialCount: number;
  hasConfirmed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    { count: initialCount, confirmed: hasConfirmed },
    (state) => ({
      count: state.confirmed ? state.count : state.count + 1,
      confirmed: true,
    })
  );

  const handleConfirm = () => {
    startTransition(async () => {
      setOptimisticState(true);
      await confirmCaseAction(caseId);
    });
  };

  return (
    <button
      onClick={handleConfirm}
      disabled={optimisticState.confirmed || isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 font-bold text-slate-950 disabled:opacity-75"
    >
      <span>👥 {optimisticState.count} Confirmations</span>
      {optimisticState.confirmed && <span>(Confirmed)</span>}
    </button>
  );
}
```
