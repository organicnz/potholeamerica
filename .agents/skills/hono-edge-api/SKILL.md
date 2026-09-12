---
name: hono-edge-api
description: >-
  Guidelines for building lightweight, type-safe Edge APIs using Hono and Zod.
  Use when creating or updating API routes, validating payloads, handling civic webhooks, or setting up RPC clients.
---

# Hono Edge API Architecture

## Overview
We use **Hono** for high-performance edge API routing. It runs either inside Next.js route handlers (`app/api/[[...route]]/route.ts`) or within Supabase Edge Functions, sharing Zod validation schemas and providing full End-to-End Type Safety (RPC) to client applications.

---

## 1. Next.js Route Handler Integration

```typescript
// app/api/[[...route]]/route.ts
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { casesRoute } from '@/server/routes/cases';
import { civicRoute } from '@/server/routes/civic';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

// Mount modular sub-routers
const routes = app
  .route('/cases', casesRoute)
  .route('/civic', civicRoute);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

// Export router type for client-side RPC
export type AppType = typeof routes;
```

---

## 2. Modular Sub-Router with Zod Validation

```typescript
// src/server/routes/cases.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const nearbyQuerySchema = z.object({
  lng: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
  radius: z.coerce.number().default(50),
});

export const casesRoute = new Hono()
  .get(
    '/nearby',
    zValidator('query', nearbyQuerySchema),
    async (c) => {
      const { lng, lat, radius } = c.req.valid('query');
      
      // Perform PostGIS spatial query
      const results = await getNearbyCases(lng, lat, radius);
      
      return c.json({
        success: true,
        data: results,
      });
    }
  );
```

---

## 3. End-to-End Type-Safe Client (RPC)

Clients consume the API directly via Hono Client (`hc`), completely eliminating manual fetch wrappers and out-of-sync API contracts:

```typescript
// src/lib/api-client.ts
import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

// Base URL points to origin in browser or explicit domain on server
export const client = hc<AppType>(
  typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
);
```

### Usage Example
```typescript
const res = await client.api.cases.nearby.$get({
  query: { lng: -121.4944, lat: 38.5816, radius: 50 },
});

if (res.ok) {
  const { data } = await res.json();
  console.log(data); // Fully typed response!
}
```

---

## 4. Supabase Auth Middleware in Hono
```typescript
import { createMiddleware } from 'hono/factory';
import { createServerClient } from '@supabase/ssr';

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createServerClient(/* credentials */);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
});
```
