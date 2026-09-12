import { casesRoute } from '@/server/routes/cases';
import { civicRoute } from '@/server/routes/civic';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

const routes = app.route('/cases', casesRoute).route('/civic', civicRoute);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
