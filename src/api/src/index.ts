import { Hono } from 'hono';
import comments from './routes/comments';
import { createDb } from "../db";
import * as schema from '../db/schema';
import { html, raw } from 'hono/html';
import { env } from 'cloudflare:workers';
import { and, eq, isNull } from "drizzle-orm";
import { CookieStore, Session, sessionMiddleware } from 'hono-sessions';
import { InternalService } from './services/internals';

const app = new Hono<{
  Bindings: Cloudflare
}>();
const db = createDb(env);

const store = new CookieStore();

app.use(async (c, next) => {
  c.res.headers.set('X-Powered-By', 'Nekomment')
  await next();
})

app.route('/v1/comments', comments);

app.get('/', (c) => {
  return c.text(`
`)
})

export default app;
export { InternalService };