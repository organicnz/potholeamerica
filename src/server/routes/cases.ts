import { supabaseServer } from '@/lib/supabase/server';
import type { CaseRecord } from '@/types/database.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { INITIAL_CASES, INITIAL_EVENTS } from '../mock-data';

// In-memory fallback cases list initialized from mock data
let casesStore: CaseRecord[] = [...INITIAL_CASES];
const eventsStore = [...INITIAL_EVENTS];

const nearbySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
  radius: z.coerce.number().default(100), // meters
});

const createCaseSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().optional(),
  category: z.string().default('POTHOLE'),
  address: z.string().min(3),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  severity: z.enum(['MINOR', 'SIGNIFICANT', 'DANGEROUS']).default('SIGNIFICANT'),
  photo_url: z.string().optional(),
});

export const casesRoute = new Hono()
  // List cases dynamically from database
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        category: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.coerce.number().optional().default(50),
      })
    ),
    async (c) => {
      const { category, status, search, limit } = c.req.valid('query');

      try {
        const filterCat = category && category !== 'ALL' ? category : null;
        const filterStat = status && status !== 'ALL' ? status : null;

        const { data, error } = await supabaseServer.rpc('get_cases_feed', {
          filter_category: filterCat,
          filter_status: filterStat,
          limit_count: limit,
          offset_count: 0,
        });

        if (!error && data && data.length > 0) {
          interface FeedRow {
            id: string;
            public_id: string;
            title: string;
            description: string | null;
            category: string;
            lat: number;
            lng: number;
            address: string;
            community_status: CaseRecord['community_status'];
            official_status: CaseRecord['official_status'];
            severity: CaseRecord['severity'];
            confirmation_count: number;
            follower_count: number;
            comment_count: number;
            photo_url: string | null;
            created_at: string;
            submitted_at: string | null;
            resolved_at: string | null;
          }

          let formatted: CaseRecord[] = (data as FeedRow[]).map((row) => ({
            id: row.id,
            public_id: row.public_id,
            reporter_id: null,
            jurisdiction_id: null,
            agency_id: null,
            title: row.title,
            description: row.description,
            category: row.category,
            location: {
              lat: row.lat,
              lng: row.lng,
            },
            address: row.address,
            community_status: row.community_status,
            official_status: row.official_status,
            severity: row.severity,
            confirmation_count: row.confirmation_count,
            follower_count: row.follower_count,
            comment_count: row.comment_count,
            photo_url: row.photo_url,
            created_at: row.created_at,
            submitted_at: row.submitted_at,
            resolved_at: row.resolved_at,
          }));

          if (search) {
            const q = search.toLowerCase();
            formatted = formatted.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                item.address.toLowerCase().includes(q) ||
                item.public_id.toLowerCase().includes(q)
            );
          }

          return c.json({
            success: true,
            data: formatted,
            total: formatted.length,
            source: 'supabase_edge',
          });
        }
      } catch (err) {
        console.error('Failed to query Supabase cases:', err);
      }

      // Fallback to in-memory store
      let results = [...casesStore];
      if (category && category !== 'ALL') {
        results = results.filter((item) => item.category === category);
      }
      if (status && status !== 'ALL') {
        results = results.filter((item) => item.community_status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.address.toLowerCase().includes(q) ||
            item.public_id.toLowerCase().includes(q)
        );
      }

      return c.json({
        success: true,
        data: results,
        total: results.length,
        source: 'in_memory_fallback',
      });
    }
  )

  // Proximity check for duplicate detection during reporting
  .get('/nearby', zValidator('query', nearbySchema), (c) => {
    const { lng, lat, radius } = c.req.valid('query');

    // Haversine distance calculation in meters
    const nearby = casesStore.filter((item) => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = (lat * Math.PI) / 180;
      const φ2 = (item.location.lat * Math.PI) / 180;
      const Δφ = ((item.location.lat - lat) * Math.PI) / 180;
      const Δλ = ((item.location.lng - lng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return dist <= radius && item.community_status !== 'RESOLVED';
    });

    return c.json({
      success: true,
      data: nearby,
    });
  })

  // Get specific case by public ID with timeline events
  .get('/:publicId', (c) => {
    const publicId = c.req.param('publicId');
    const caseRecord = casesStore.find(
      (item) => item.public_id === publicId || item.id === publicId
    );

    if (!caseRecord) {
      return c.json({ success: false, error: 'Case not found' }, 404);
    }

    const events = eventsStore.filter((e) => e.case_id === caseRecord.id);

    return c.json({
      success: true,
      data: {
        ...caseRecord,
        events,
      },
    });
  })

  // Create new public case
  .post('/', zValidator('json', createCaseSchema), async (c) => {
    const body = c.req.valid('json');
    const newId = `c${Date.now()}`;
    const publicId = `PA-${Math.floor(100000 + Math.random() * 900000)}`;

    const newCase: CaseRecord = {
      id: newId,
      public_id: publicId,
      reporter_id: null,
      jurisdiction_id: 'sac-01',
      agency_id: 'dpw-01',
      title: body.title,
      description: body.description || null,
      category: body.category,
      location: { lat: body.lat, lng: body.lng },
      address: body.address,
      community_status: 'NEW',
      official_status: 'NOT_SUBMITTED',
      severity: body.severity,
      confirmation_count: 1,
      follower_count: 1,
      comment_count: 0,
      created_at: new Date().toISOString(),
      submitted_at: null,
      resolved_at: null,
    };

    casesStore = [newCase, ...casesStore];

    eventsStore.push({
      id: `e-${Date.now()}`,
      case_id: newId,
      event_type: 'REPORTED',
      actor_type: 'USER',
      actor_id: null,
      payload: { address: body.address, initial_severity: body.severity },
      created_at: new Date().toISOString(),
    });

    return c.json(
      {
        success: true,
        data: newCase,
      },
      201
    );
  })

  // Confirm an existing case ("I See This Too")
  .post('/:id/confirm', (c) => {
    const caseId = c.req.param('id');
    const target = casesStore.find((item) => item.id === caseId || item.public_id === caseId);

    if (!target) {
      return c.json({ success: false, error: 'Case not found' }, 404);
    }

    target.confirmation_count += 1;
    if (target.community_status === 'NEW') {
      target.community_status = 'CONFIRMED';
    }

    eventsStore.push({
      id: `e-${Date.now()}`,
      case_id: target.id,
      event_type: 'CONFIRMATION_ADDED',
      actor_type: 'USER',
      actor_id: null,
      payload: { new_count: target.confirmation_count },
      created_at: new Date().toISOString(),
    });

    return c.json({
      success: true,
      confirmation_count: target.confirmation_count,
      community_status: target.community_status,
    });
  });
