import { MockCivicConnector } from '@/lib/connectors/mock';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const mockConnector = new MockCivicConnector();

export const civicRoute = new Hono()
  // List available civic services
  .get('/services', async (c) => {
    const services = await mockConnector.getServices();
    return c.json({ success: true, data: services });
  })

  // Submit case to responsible agency via connector
  .post(
    '/dispatch',
    zValidator(
      'json',
      z.object({
        caseId: z.string(),
        publicId: z.string(),
        serviceCode: z.string().default('POTHOLE'),
        lat: z.number(),
        lng: z.number(),
        address: z.string(),
        description: z.string(),
        mediaUrls: z.array(z.string()).default([]),
      })
    ),
    async (c) => {
      const payload = c.req.valid('json');
      const response = await mockConnector.submitCase({
        ...payload,
        reporter: {},
      });

      return c.json({
        success: response.success,
        externalCaseId: response.externalCaseId,
        data: response,
      });
    }
  );
