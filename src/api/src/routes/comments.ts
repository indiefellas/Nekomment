import { Hono } from "hono";
import { env } from "cloudflare:workers";
import { createDb } from "../../db";
import * as schema from '../../db/schema';
import { eq } from "drizzle-orm";

const app = new Hono<{
    Bindings: Cloudflare
}>();
const db = createDb(env);

app.use(async (c, next) => {
    const { success } = await env.COMMENT_RATE_LIMIT.limit({ key: c.req.header('CF-Connecting-IP') || '0.0.0.0' });
    if (!success) {
        return c.text('rate limit exceeded', 429);
    }
    await next()
})

app.get("/:host/:path", async (c) => {
    const { host, path } = c.req.param();
    let hostPage = await db.select()
        .from(schema.comments)
        .where(eq(schema.comments.host, host));
    if (hostPage.length < 1) {
        return c.json([])
    }
    const comments = hostPage.map((c) => ({
        id: c.id,
        author: c.author,
        website: c.website,
        content: c.content
    }))
    return c.json(comments)
});

app.post("/:host/:path", async (c) => {
    const { host, path } = c.req.param();
    const { name, content, website } = await c.req.parseBody();
    let hostPage = await db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
    if (hostPage.length < 1) {
        return c.text('host not found', 404)
    }
    await db.insert(schema.comments).values({
        host: host,
        author: name.toString(),
        content: content.toString(),
        website: website.toString(),
        createdAt: Date.now(),
        address: c.req.header('CF-Connecting-IP') || '0.0.0.0'
    })
    return c.text(`created comment for host ${host} and path ${path}`)
});

app.post("/:host/:path/:id", async (c) => {
    const { host, path, id } = c.req.param();
    const { name, content, website } = await c.req.parseBody();
    let hostPage = await db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
    if (hostPage.length < 1) {
        return c.text('host not found', 404)
    }
    await db.insert(schema.comments).values({
        host: host,
        author: name.toString(),
        content: content.toString(),
        website: website.toString(),
        createdAt: Date.now(),
        parentId: parseInt(id, 10),
        address: c.req.header('CF-Connecting-IP') || '0.0.0.0'
    })
    return c.text(`created comment for host ${host}, parent id ${id} and path ${path}`)
});

app.delete("/:host/:path/:id", async (c) => {
    const { host, path, id } = c.req.param();
    return c.text(`delete comment ${host}, ${path}, ${id}`)
});

export default app;  