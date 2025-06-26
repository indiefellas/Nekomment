import { Context, Hono } from "hono";
import { csrf } from 'hono/csrf'
import { createDb } from "../db";
import * as schema from '../db/schema';
import bcrypt from "bcryptjs";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { 
  Session,
  sessionMiddleware, 
  CookieStore 
} from 'hono-sessions';

const SESSION = env.SESSION;

type SessionDataTypes = {
  'token': string
}

const app = new Hono<{ 
  Bindings: Cloudflare,
  Variables: {
    session: Session<SessionDataTypes>,
    session_key_rotation: boolean
  }
 }>();
const db = createDb(env);

const store = new CookieStore()

app.use(
  sessionMiddleware({
    store,
    encryptionKey: SESSION,
    cookieOptions: {
      httpOnly: true,
      secure: env.ENV === 'PROD',
      sameSite: 'Lax',
      path: '/',
    },
  })
);


app.post("/api/v1/internals/user", async (c) => {
  const { name, password, email } = await c.req.parseBody();
  if (!name || !password || !email) {
    return c.text('name, password, and email is all required', 400);
  } else if (password.toString().length < 8) {
    return c.text('password must be 8 chars or longer', 400);
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toString())) {
    return c.text('email must be valid', 400);
  }
  console.log('creating user');
  await db.insert(schema.users).values({
    name: name.toString(),
    email: email.toString(),
    passwordHash: await bcrypt.hash(password.toString(), await bcrypt.genSalt(12)),
    type: 0
  });
  console.log('user created');
  return c.text(`user '${name}' created`);
});

app.patch("/api/v1/internals/user", async (c) => {
  return c.text(`update user`)
});

app.delete("/api/v1/internals/user", async (c) => {
  return c.text(`delete user`)
});

app.post("/api/v1/internals/login", async (c) => {
  const { name, password } = await c.req.parseBody();
  const session = c.get('session');
  if (!name || !password) {
    return c.text('name, and password is all required', 400);
  }
  let user = await db.select().from(schema.users).where(eq(schema.users.name, name.toString()));
  if (user.length < 1) {
    return c.text('incorrect username or password', 401);
  } else if (!await bcrypt.compare(password.toString(), user[0].passwordHash)) {
    return c.text('incorrect username or password', 401);
  }
  session.set('token', btoa(crypto.randomUUID()))
  return c.text('logged in');
});

app.get("/api/v1/getComments/:user/:path", async (c) => {
  const { user, path } = c.req.param();
  return c.text(`get comments ${user}, ${path}`)
});

app.post("/api/v1/getComments/:user/:path", async (c) => {
  const { user, path } = c.req.param();
  return c.text(`create comment ${user}, ${path}`)
});

app.post("/api/v1/getComments/:user/:path/:id", async (c) => {
  const { user, path, id } = c.req.param();
  return c.text(`create comment ${user}, ${path}, ${id}`)
});

app.delete("/api/v1/getComments/:user/:path/:id", async (c) => {
  const { user, path, id } = c.req.param();
  return c.text(`delete comment ${user}, ${path}, ${id}`)
});

app.get("/c/:user", async (c) => {
  const { user } = c.req.param();
  return c.text(`generate comment page for ${user}`)
})

export default app;
