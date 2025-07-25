import type { APIRoute } from "astro";
import { createDb } from "../../../db";
import * as schema from '../../../db/schema';
import { text } from "../../../lib/responses";
import { AutoModBehavior, AutoModType, PostBehavior } from "../../../db/enums";
import { safeRegexMatch } from "../../../lib/sanitize";
import { eq, and } from "drizzle-orm";

export const GET: APIRoute = async ({ params, request, locals }) => {
    const db = createDb(locals.runtime.env);
    const { host, path } = params;
    console.log(host, path)
    const comments = await db.query.comments.findMany({
        with: {
            replies: true
        },
        where: (comments, { and, eq, isNull }) => and(
            path ?
                and(
                    eq(comments.host, host ?? ''),
                    eq(comments.pagePath, decodeURIComponent(path))
                ) :
                eq(comments.host, host ?? ''),
            isNull(comments.parentId)
        )
    })
    console.log(comments);
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
    return new Response(JSON.stringify(cmts.reverse()), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
    const db = createDb(locals.runtime.env);
    const { host, path } = params;
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const content = formData.get('content')?.toString();
    const website = formData.get('website')?.toString();
    const parentId = formData.get('parentId')?.toString();
    const backPath = formData.get('backPath')?.toString();
    const cfTurnstileKey = formData.get('cfTurnstileKey')?.toString();
    if (!name || !content || !host || !path) {
        return text('name and content are required', 400)
    }
    if (name.length > 64 || (website && website.length > 64) || content.length > 1024) {
        return text('comment is over the enforced length', 413)
    }
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    let b = request.headers.get('Referer') || `https://${host}${path}`;
    if (backPath) {
        b = backPath.toString();
    }
    let pId: string | undefined = parentId ? parentId?.toString() : undefined;
    let hostPage = await db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
    if (hostPage.length < 1) {
        return text('host not found', 404)
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
            return text('Comment blocked by AutoMod rule', 422)
        }
    }

    if (cfTurnstileKey || (backPath && backPath.toString().includes('cmt.nkko.link'))) {
        if (!cfTurnstileKey) {
            return text('security error, please close the tab', 403)
        }
        let formData = new FormData();
        formData.append("secret", locals.runtime.env.TURNSTILE_KEY);
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
        console.log('success');
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
        let cmts = await db.insert(schema.comments).values({
            host: host,
            author: name,
            content: content,
            website: website,
            createdAt: new Date(Date.now()),
            address: ip,
            pagePath: path,
            parentId: pId,
            approved: !(needsReview || ifReviewRequired),
            moderatedBy: reviewReason
        })
        .returning();

        console.log(cmts);
        if (!backPath) return text('done', (!needsReview || !ifReviewRequired) ? 202 : 200)
        return redirect(backPath, 303);
    }

    return text('security error, please close the tab', 403)
}