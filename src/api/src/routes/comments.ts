import { Hono } from "hono";
import { env } from "cloudflare:workers";
import { createDb } from "../../db";
import * as schema from '../../db/schema';
import { eq, and } from "drizzle-orm";

const app = new Hono<{
    Bindings: Cloudflare
}>();
const db = createDb(env);

app.use(async (c, next) => {
    const { success } = await env.COMMENT_RATE_LIMIT.limit({ key: c.req.header('CF-Connecting-IP') || '0.0.0.0' });
    if (!success && c.req.method !== 'GET') {
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
    const { name, content, website, parentId, backPath } = await c.req.parseBody();
    let b = c.req.header('Referer') || `https://${host}${path}`;
    if (backPath) {
        b = backPath.toString();
    }
    let pId: string | undefined = parentId ? parentId?.toString() : undefined;
    let hostPage = await db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
    if (hostPage.length < 1) {
        return c.text('host not found', 404)
    }
    if (pId) {
        let parentComment = await db.select().from(schema.comments).where(
            and(
                eq(schema.comments.host, host),
                eq(schema.comments.id, pId)
            )
        )
        pId = parentComment[0].id;
        if (parentComment.length < 1) {
            pId = undefined;
        } else if (parentComment[0].parentId) {
            pId = parentComment[0].parentId
        }
    }
    await db.insert(schema.comments).values({
        host: host,
        author: name.toString(),
        content: content.toString(),
        website: website.toString(),
        createdAt: Date.now(),
        address: c.req.header('CF-Connecting-IP') || '0.0.0.0',
        pagePath: path,
        parentId: pId
    })
    return c.redirect(backPath.toString(), 303)
});

app.delete("/:host/:path/:id", async (c) => {
    const { host, path, id } = c.req.param();
    return c.redirect(`https://${host}${path}`, 303)
});

export default app;  