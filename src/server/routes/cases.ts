import type { CaseRecord } from '@/types/database.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { INITIAL_CASES, INITIAL_EVENTS } from '../mock-data';

// In-memory active cases list initialized from mock data
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
});

export const casesRoute = new Hono()
  // List cases (supports spatial bounding or nearby search)
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        lng: z.coerce.number().optional(),
        lat: z.coerce.number().optional(),
        radius: z.coerce.number().optional(),
        status: z.string().optional(),
      })
    ),
    (c) => {
      const { status } = c.req.valid('query');
      let results = [...casesStore];

      if (status) {
        results = results.filter((item) => item.community_status === status);
      }

      return c.json({
        success: true,
        data: results,
        total: results.length,
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
