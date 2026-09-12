import type { AppType } from '@/app/api/[[...route]]/route';
import { hc } from 'hono/client';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

export const client = hc<AppType>(getBaseUrl());
