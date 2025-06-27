import { Hono } from 'hono';
import internals from './routes/internals';
import comments from './routes/comments';
import { createDb } from "../db";
import * as schema from '../db/schema';
import { html, raw } from 'hono/html';
import { env } from 'cloudflare:workers';
import { and, eq, isNull } from "drizzle-orm";
import { CookieStore, Session, sessionMiddleware } from 'hono-sessions';

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

const store = new CookieStore();

app.use(async (c, next) => {
  c.res.headers.set('X-Powered-By', 'Nekomment')
  await next();
})

app.use(
  sessionMiddleware({
    store,
    encryptionKey: SESSION,
    cookieOptions: {
      httpOnly: true,
      secure: env.ENV === 'PROD',
      sameSite: 'Lax',
      domain: env.ENV === 'PROD' ? '.cmt.nkko.link' : 'localhost',
      path: '/',
    },
  })
);

app.route('/v1/internals', internals);
app.route('/v1/comments', comments);

app.post("/c/:name", async (c) => {
  const { name } = c.req.param();
  const { path, host, template } = await c.req.parseBody();
  if (!name || !host || !template) {
    return c.text(':name, host, and template is all required', 400);
  }
  const useReferer = !path;
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
  await db.insert(schema.pages).values({
    name: name.toString(),
    pagePath: path.toString(),
    userId: user[0].users?.id || 0,
    hostName: host.toString(),
    useReferer: useReferer,
    template: template.toString()
  });
  return c.text(`created comment page ${name} with host ${host}, path ${path} for user '${user[0].users?.name}'`)
})

app.get("/c/:name", async (c) => {
  const { name } = c.req.param();
  const pages = await db.select()
    .from(schema.pages)
    .where(eq(schema.pages.name, name));
  if (pages.length < 1) {
    return c.text('host not found', 404)
  }
  const path = pages[0].useReferer ? c.req.header('Referer') : pages[0].pagePath;
  if (!path && pages[0].useReferer) {
    return c.text('referer header required', 400)
  } else if (!path) {
    return c.text('malformed response from db', 400)
  }
  const comments = await db.query.comments.findMany({
    with: {
      replies: true
    },
    where: (comments, { and, eq, isNull }) => and(
      eq(comments.pagePath, path), 
      isNull(comments.parentId), 
      eq(comments.host, pages[0].hostName)
    )
  })
  return c.html(html`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nekomment Pages test for ${name}</title>
    <style>
        body, * {
            background: #333;
            color: white;
        }
    </style>
    </head>
    <body>
      ${raw(pages[0].template)}
      <h1>Nekomment Pages test for ${name}, path ${path}</h1>
      <p>we can have a templating for this</p>
      <p>create comment</p>
      <form method="post" action="/v1/comments/${pages[0].hostName}/${encodeURIComponent(pages[0].pagePath || '/')}">
          <input type="text" name="name" placeholder="author name">
          <input type="website" name="website" placeholder="website optional">
          <textarea name="content" placeholder="content"></textarea>
          <input type="submit">
          <input type="hidden" id="parentid" name="parentId" value="">
          <p id="parentname"></p>
      </form>
      ${comments.reverse().map((c) => html`
        <article data-cmt-id=${c.id}>
          <h3 id="author">${c.author}</h3>
          <a href=${c.website}>${c.website}</a>
          <p>${c.content}</p>
          <blockquote>
            ${c.replies.reverse().map((r) => html`
              <h4>${r.author} (replying to ${c.author})</h4>
              <a href=${r.website}>${r.website}</a>
              <p>${r.content}</p>
            `)}
          </blockquote>
          <button onclick="document.getElementById('parentid').value = this.parentElement.dataset.cmtId; document.getElementById('parentname').textContent = 'replying to ' + this.parentElement.querySelector('#author').textContent + '...'">Reply</button>
        </article>
      `)
    }
    </body>
    </html>  
  `)
})

//temporary
app.get("/", (c) => {
  return c.html(html`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body, * {
            background: #333;
            color: white;
        }
    </style>
</head>
<body>
    <h1>nekomment testing page, not done yet</h1>
    <p>note that api isn't done yet and this will be added with more stuff</p>
    <hr>
    <p>signup</p>
    <form method="post" action="/v1/internals/user">
        <input type="text" name="name" placeholder="username">
        <input type="text" name="email" placeholder="email">
        <input type="password" name="password" placeholder="password">
        <input type="submit">
    </form>
    <p>login</p>
    <form method="post" action="/v1/internals/login">
        <input type="text" name="name" placeholder="username">
        <input type="password" name="password" placeholder="password">
        <input type="submit">
    </form>
    <p>add domain button</p>
    <form method="post" action="/v1/internals/initAddHostToken">
        <input type="submit">
    </form>
    <p>add domain</p>
    <form method="post" action="/v1/internals/addHost">
        <input type="text" name="host" placeholder="host">
        <input type="text" name="method" placeholder="method">
        <input type="submit">
    </form>
    <p>to add domains, click the add domain button first, then copy the code, then create a file on /.well-known/nekomment and paste it there</p>
    <p>you need to log in for it</p>
    <h3>comments</h3>
    <form>
    <input type="text" placeholder="/[host]/[path]" oninput="document.querySelectorAll('.comments').forEach(el => el.action = '/v1/comments' + this.value)">
    </form>
    <p>get comments</p>
    <form class="comments" method="get" action="/v1/comments/:this/:that">
        <button type="submit">get comments of path above</button>
    </form>
    <p>create comment</p>
    <form class="comments" method="post" action="/v1/comments/:this/:that">
        <input type="text" name="parentId" placeholder="reply comment id">
        <input type="text" name="name" placeholder="author name">
        <input type="website" name="website" placeholder="website optional">
        <textarea name="content" placeholder="content"></textarea>
        <input type="submit">
    </form>
    <h3>pages</h3>
    <form>
    <input type="text" placeholder="/[name]" oninput="document.querySelectorAll('.pages').forEach(el => el.action = '/c' + this.value)">
    </form>
    <p>see comment page</p>
    <form method="get" class="pages" action="/c/:this">
        <input type="submit">
    </form>
    <p>create comment page</p>
    <form class="pages" method="post" action="/c/:this">
        <input type="host" name="host" placeholder="page host">
        <input type="host" name="path" placeholder="page path (leave blank to use referer header)">
        <textarea name="template" placeholder="template"></textarea>
        <input type="submit">
    </form>
    <p>nekomment is now using handlebars for it's templating, see <a href="https://handlebarsjs.com/guide/">the guide</a> for the correct syntax</p>
</body>
</html>
  `)
})

export default app;