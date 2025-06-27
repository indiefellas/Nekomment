import { Hono } from 'hono';
import internals from './routes/internals';
import comments from './routes/comments';
import { createDb } from "../db";
import * as schema from '../db/schema';
import { html } from 'hono/html';
import { env } from 'cloudflare:workers';
import { eq } from "drizzle-orm";

const app = new Hono<{
    Bindings: Cloudflare
}>();
const db = createDb(env);

app.use(async (c, next) => {
  c.res.headers.set('X-Powered-By', 'Nekomment')
  await next();
})

app.route('/v1/internals', internals);
app.route('/v1/comments', comments);

app.get("/c/:host", async (c) => {
  const { host } = c.req.param();
  let hostPage = await db.select()
    .from(schema.comments)
    .where(eq(schema.comments.host, host));
  return c.html(html`
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nekomment Pages test for ${host}</title>
    <style>
        body, * {
            background: #333;
            color: white;
        }
    </style>
    </head>
    <body>
      <h1>Nekomment Pages test for ${host}</h1>
      <p>we can have a templating for this</p>
      ${
        hostPage.map((c) => html`<h3>${c.author}</h3><p>${c.website}</p><p>${c.content}</p>`)
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
    <p>comments</p>
    <p>add /[comment_id] after /[path] to reply to comment</p>
    <form>
    <input type="text" placeholder="/[host]/[path]" oninput="document.querySelectorAll('.comments').forEach(el => el.action = '/v1/comments' + this.value)">
    </form>
    <p>get comments</p>
    <form class="comments" method="get" action="/v1/comments/:this/:that">
        <button type="submit">get comments of path above</button>
    </form>
    <p>create comment</p>
    <form class="comments" method="post" action="/v1/comments/:this/:that">
        <input type="text" name="name" placeholder="author name">
        <input type="website" name="website" placeholder="website optional">
        <textarea name="content" placeholder="content"></textarea>
        <input type="submit">
    </form>
</body>
</html>
  `)
})

export default app;