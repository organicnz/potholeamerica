---
name: geospatial-maplibre-ui
description: >-
  High-performance interactive mapping and geospatial visualization using MapLibre GL.
  Use when building public maps, clustering points, handling viewport queries, or implementing draggable GPS pin pickers.
---

# Geospatial UI with MapLibre GL

## Core Principles
1. **Never re-instantiate the Map instance on state changes**: Store the `maplibregl.Map` reference in a `useRef` and attach event listeners once.
2. **Cluster on the Client via Web Workers**: Do not cluster on the SQL server during dynamic zooming. Feed GeoJSON into MapLibre's built-in GeoJSON source clustering (backed by Supercluster).
3. **Debounce Viewport Fetching**: Only query the backend for newly visible cases on `moveend` after a 300ms debounce.

---

## 1. Map Container Lifecycle Pattern

```tsx
'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
}

export function CivicMap({ initialCenter = [-121.4944, 38.5816], initialZoom = 13, onBoundsChange }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', // Open source zero-token vector tiles
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right');

    map.on('load', () => {
      // Add clustered GeoJSON source
      map.addSource('cases', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'cases',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#f59e0b', 10, '#f97316', 50, '#ef4444'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'cases',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-font': ['Open Sans Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Unclustered individual pins
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'cases',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'community_status'],
            'RESOLVED', '#10b981',
            'OPEN', '#ef4444',
            'CONFIRMED', '#f59e0b',
            '#64748b'
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    });

    // Debounced bounds change listener
    let timer: NodeJS.Timeout;
    map.on('moveend', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const bounds = map.getBounds();
        onBoundsChange?.([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
      }, 300);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, onBoundsChange]);

  return <div ref={containerRef} className="w-full h-full min-h-[500px] rounded-xl overflow-hidden" />;
}
```

---

## 2. Draggable Pin Location Picker with Reverse Geocoding

Used in the report flow (`/report`):

```tsx
export function LocationPicker({
  initialLat,
  initialLng,
  onLocationSelected,
}: {
  initialLat: number;
  initialLng: number;
  onLocationSelected: (loc: { lat: number; lng: number; address: string }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [initialLng, initialLat],
      zoom: 16,
    });

    const marker = new maplibregl.Marker({ draggable: true, color: '#f59e0b' })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    markerRef.current = marker;

    marker.on('dragend', async () => {
      const { lng, lat } = marker.getLngLat();
      const address = await reverseGeocode(lng, lat);
      onLocationSelected({ lat, lng, address });
    });

    return () => map.remove();
  }, [initialLat, initialLng, onLocationSelected]);

  return <div ref={containerRef} className="w-full h-72 rounded-lg border border-slate-700" />;
}
```
