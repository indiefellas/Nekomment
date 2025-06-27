import { Hono } from "hono";
import { createDb } from "../../db";
import * as schema from '../../db/schema';
import bcrypt from "bcryptjs";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
// @ts-ignore
import { resolveTxt } from "node:dns/promises";
import { 
  Session,
  sessionMiddleware, 
  CookieStore 
} from 'hono-sessions';

const SESSION = env.SESSION;

type SessionDataTypes = {
  'token': string,
  'host-token': string
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
      domain: '.cmt.nkko.link',
      path: '/',
    },
  })
);

app.post("/user", async (c) => {
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

app.patch("/user", async (c) => {
  return c.text(`update user`)
});

app.delete("/user", async (c) => {
  return c.text(`delete user`)
});

app.post("/login", async (c) => {
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
  const token = btoa(crypto.randomUUID());
  session.set('token', token);
  await db.insert(schema.sessions).values({
    sessionToken: token,
    userId: user[0].id,
    userAgent: c.req.header('User-Agent') || 'None',
    address: c.req.header('CF-Connecting-IP') || '0.0.0.0'
  })
  return c.text('logged in');
});

app.post("/initAddHostToken", async (c) => {
  const session = c.get('session');
  const token = session.get('token');
  if (!token) {
    return c.text('authentication required', 401);
  }
  let user = await db.select()
    .from(schema.sessions)
    .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.sessionToken, token));
  if (user.length < 1) {
    return c.text('authentication required', 401);
  }
  const hostToken = crypto.randomUUID();
  session.set('host-token', hostToken);
  return c.newResponse(hostToken);
})

app.post("/addHost", async (c) => {
  const { host, method } = await c.req.parseBody();
  const session = c.get('session');
  const token = session.get('token');
  if (!token) {
    return c.text('authentication required', 401);
  }
  let user = await db.select()
    .from(schema.sessions)
    .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.sessionToken, token));
  if (user.length < 1) {
    return c.text('authentication required', 401);
  } else if (!host) {
    return c.text('host required', 400)
  }
  const hostToken = session.get('host-token');
  if (!hostToken) {
    return c.text('host token required', 400)
  }
  switch (method) {
    case '1': {
      const content = await resolveTxt(`_nekomment.${host}`);
      if (content[0][0] !== 'nekomment-token=' + hostToken) {
        return c.text('host token does not match', 403)
      }
      break;
    }
    default: {
      const response = await fetch(`https://${host}/.well-known/nekomment`);
      const text = await response.text();
      if (!text || text !== hostToken) {
        return c.text('host token does not match', 403)
      }
      break;
    }
  }
  await db.insert(schema.hosts).values({
    host: host.toString(),
    ownerId: user[0].users?.id || 0 
  });
  return c.text(`host '${host}' added to account '${user[0].users?.name}'`);
})

export default app;