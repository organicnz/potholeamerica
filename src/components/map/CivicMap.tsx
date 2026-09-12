'use client';

import maplibregl from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CaseRecord } from '@/types/database.types';
import Link from 'next/link';

interface CivicMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
}

export function CivicMap({
  initialCenter = [-121.48291, 38.57283], // Sacramento Pilot
  initialZoom = 13,
}: CivicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
      // Fetch cases from Edge API
      try {
        const res = await fetch('/api/cases');
        const json = await res.json();
        const cases: CaseRecord[] = json.data || [];

        const geojsonFeatures = cases.map((c) => ({
          type: 'Feature' as const,
          properties: {
            id: c.id,
            public_id: c.public_id,
            title: c.title,
            address: c.address,
            community_status: c.community_status,
            official_status: c.official_status,
            confirmation_count: c.confirmation_count,
            severity: c.severity,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [c.location.lng, c.location.lat],
          },
        }));

        map.addSource('cases-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: geojsonFeatures,
          },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        // Cluster Circles
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'cases-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#f59e0b',
              5,
              '#f97316',
              20,
              '#ef4444',
            ],
            'circle-radius': ['step', ['get', 'point_count'], 18, 5, 24, 20, 32],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0f172a',
          },
        });

        // Cluster Count Labels
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'cases-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['Open Sans Bold'],
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Individual Unclustered Pins
        map.addLayer({
          id: 'unclustered-pins',
          type: 'circle',
          source: 'cases-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match',
              ['get', 'community_status'],
              'RESOLVED',
              '#10b981',
              'OPEN',
              '#ef4444',
              'CONFIRMED',
              '#f59e0b',
              '#f59e0b',
            ],
            'circle-radius': 9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Click unclustered point
        map.on('click', 'unclustered-pins', (e) => {
          if (!e.features || !e.features[0]) return;
          const props = e.features[0].properties as any;
          setSelectedCase({
            id: props.id,
            public_id: props.public_id,
            reporter_id: null,
            jurisdiction_id: null,
            agency_id: null,
            title: props.title,
            description: null,
            category: 'POTHOLE',
            location: {
              lng: (e.features[0].geometry as any).coordinates[0],
              lat: (e.features[0].geometry as any).coordinates[1],
            },
            address: props.address,
            community_status: props.community_status,
            official_status: props.official_status,
            severity: props.severity,
            confirmation_count: props.confirmation_count,
            follower_count: 1,
            comment_count: 0,
            created_at: new Date().toISOString(),
            submitted_at: null,
            resolved_at: null,
          });
        });

        // Change cursor to pointer over points
        map.on('mouseenter', 'unclustered-pins', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-pins', () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        console.error('Error fetching cases for map:', err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  return (
    <div className="relative w-full h-full min-h-[600px]">
      <div
        ref={containerRef}
        className="w-full h-full min-h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
      />

      {/* Floating Selected Case Card */}
      {selectedCase && (
        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 glass-panel p-5 rounded-xl shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              {selectedCase.public_id}
            </span>
            <button
              type="button"
              onClick={() => setSelectedCase(null)}
              className="text-slate-400 hover:text-white text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
          <h4 className="font-bold text-slate-100 text-base mb-1">{selectedCase.title}</h4>
          <p className="text-xs text-slate-400 mb-3">{selectedCase.address}</p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-300 font-medium">
              👥 {selectedCase.confirmation_count} confirmed
            </span>
            <Link
              href={`/case/${selectedCase.public_id}`}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              View Public Case →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
