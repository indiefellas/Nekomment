import { Hono } from "hono";
import { env } from "cloudflare:workers";
import { createDb } from "../../db";
import * as schema from '../../db/schema';
import { eq, and } from "drizzle-orm";
import { chunk } from "lodash";
import { cors } from "hono/cors";
import { safeRegexMatch } from "../utils";
import { AutoModBehavior, AutoModType, PostBehavior } from "../../db/enums";

const app = new Hono<{
    Bindings: Cloudflare
}>();
const db = createDb(env);

app.use('/:host/:path', cors({
    origin: (origin, c) => {
        if (/^https:\/\/(.+\.)?cmt\.nkko\.link/.test(origin)) return origin;
        const { host } = c.req.param();
        if (host) {
            return `https://${host}`
        } else {
            return origin
        }
    },
    allowMethods: (origin, c) => {
        if (/^https:\/\/(.+\.)?cmt\.nkko\.link/.test(origin)) return ['GET', 'POST']; // same-host (api.cmt.nkko.link and cmt.nkko.link)
        const { host } = c.req.param();
        if (host) {
            return ['GET', 'POST'];
        }
        return ['GET'];
    }
}))

app.use(async (c, next) => {
    const { success } = await env.COMMENT_RATE_LIMIT.limit({ key: c.req.header('CF-Connecting-IP') || '0.0.0.0' });
    if (!success && c.req.method !== 'GET') {
        return c.text('rate limit exceeded', 429);
    }
    await next()
})

app.get("/:host/:path", async (c) => {
    const { host, path } = c.req.param();
    const comments = await db.query.comments.findMany({
        with: {
            replies: true
        },
        where: (comments, { and, eq, isNull }) => and(
            path ?
                and(
                    eq(comments.host, host),
                    eq(comments.pagePath, path)
                ) :
                eq(comments.host, host),
            isNull(comments.parentId)
        )
    })
    const cmts = comments.map(c => {
        const { address, parentId, moderatedBy, replies, ...rest } = c;
        const repl = replies.map(r => {
            const { address, parentId, moderatedBy, ...rest } = r;
            return rest;
        }).reverse();
        return {
            ...rest,
            replies: repl
        };
    })
    return c.json(cmts.reverse())
});

app.post("/:host/:path", async (c) => {
    const { host, path } = c.req.param();
    const { name, content, website, parentId, backPath, cfTurnstileKey } = await c.req.parseBody();
    if (!name || !content) {
        return c.text('name and content are required', 400)
    }
    const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0';
    let b = c.req.header('Referer') || `https://${host}${path}`;
    if (backPath) {
        b = backPath.toString();
    }
    let pId: string | undefined = parentId ? parentId?.toString() : undefined;
    let hostPage = await db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
    if (hostPage.length < 1) {
        return c.text('host not found', 404)
    }
    let outcome: { success: boolean } = {
        success: false
    }

    let pathCfg = await db.query.paths.findFirst({
        where: (p, { eq }) => eq(p.host, hostPage[0].host)
    })
    let hostCfg = await db.query.hostSettings.findFirst({
        with: {
            autoModRules: true
        },
        where: (p, { eq }) => eq(p.id, hostPage[0].settingsId ?? 0)
    })

    if (!pathCfg) {
        await db.insert(schema.paths).values({
            path: path,
            host: hostPage[0].host
        });
        pathCfg = await db.query.paths.findFirst({
            where: (p, { eq }) => eq(p.host, hostPage[0].host)
        })
    }
    if (!hostCfg) {
        await db.insert(schema.hostSettings).values({
            hostUri: hostPage[0].host
        });
        hostCfg = await db.query.hostSettings.findFirst({
            with: {
                autoModRules: true
            },
            where: (p, { eq }) => eq(p.hostUri, hostPage[0].host)
        });
        await db.update(schema.hosts)
            .set({ settingsId: hostCfg?.id || 0 })
            .where(eq(schema.hosts.host, hostPage[0].host));
    }

    const ifReviewRequired =
        pathCfg?.postBehavior == PostBehavior.HoldForReview ||
        hostCfg?.postBehavior == PostBehavior.HoldForReview;

    let reviewReason =
        pathCfg?.postBehavior == PostBehavior.HoldForReview ? 'Required by path rules' :
            hostCfg?.postBehavior == PostBehavior.HoldForReview ? 'Required by host rules' :
                ''

    let needsReview = false;

    let rules = hostCfg?.autoModRules.filter(v => v.enabled)
    for (const v of rules || []) {
        if (needsReview) return;
        let isMatched = false;
        switch (v.type) {
            case AutoModType.Regex: {
                let ruleSplit = v.rule.split('/');
                let re = new RegExp(ruleSplit[1], ruleSplit[2] ?? '');
                try {
                    if (await safeRegexMatch(name.toString(), re) || await safeRegexMatch(content.toString(), re)) {
                        needsReview = true;
                        isMatched = true;
                        reviewReason = `Flagged by AutoMod rule '${v.name}'`;
                    }
                } catch {
                    needsReview = true;
                    reviewReason = `AutoMod rule '${v.name}' took too long to execute so we automatically marked this comment for review. `
                        + `Please check your regular expression of this rule for possible performance issues.`;
                }
                break;
            }
            case AutoModType.KeywordList: default: {
                let valueSplit = v.rule.split(',').map(v => v.trim());
                if (valueSplit.filter(s => name.toString().includes(s) || content.toString().includes(s)).length > 0) {
                    needsReview = true;
                    isMatched = true;
                    reviewReason = `Flagged by AutoMod rule '${v.name}'`;
                }
                break;
            }
        }

        if (v.behavior === AutoModBehavior.Block && needsReview && isMatched) {
            return c.text('Comment blocked by AutoMod rule', 422)
        }
    }

    if (cfTurnstileKey || (backPath && backPath.toString().includes('cmt.nkko.link'))) {
        if (!cfTurnstileKey) {
            return c.text('security error, please close the tab', 403)
        }
        let formData = new FormData();
        formData.append("secret", env.TURNSTILE_KEY);
        formData.append("response", cfTurnstileKey.toString());
        formData.append("remoteip", ip);

        const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
        const result = await fetch(url, {
            body: formData,
            method: "POST",
        });
        outcome = await result.json();
    } else {
        outcome = {
            success: true
        }
    }

    if (outcome.success) {
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
            createdAt: new Date(Date.now()),
            address: ip,
            pagePath: path,
            parentId: pId,
            approved: !(needsReview || ifReviewRequired),
            moderatedBy: reviewReason
        })
        if (!backPath) return c.text('done', (!needsReview || !ifReviewRequired) ? 202 : 200)
        return c.redirect(backPath.toString(), 303);
    } else {
        return c.text('security error, please close the tab', 403)
    }
});

export default app;  