import type { APIRoute } from "astro";
import { createDb } from "../../../db";
import * as schema from '../../../db/schema';
import { text } from "../../../lib/responses";
import { AutoModBehavior, AutoModType, PostBehavior } from "../../../db/enums";
import { safeRegexMatch } from "../../../lib/sanitize";
import { eq, and } from "drizzle-orm";
import { Database } from "../../../lib/databaseInterface";

export const GET: APIRoute = async ({ params, request, locals }) => {
    const db = new Database(locals.runtime.env);
    let { host, path } = params;
    if (!path?.startsWith('/')) path = '/' + path;
    if (!path?.endsWith('/')) path = path + '/';
    console.log(host, decodeURIComponent(path ?? '/'))
    const comments = await db.getComments('', host ?? '', decodeURIComponent(path ?? '/'));
    return new Response(JSON.stringify(comments.data), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
    const db = new Database(locals.runtime.env);
    let { host, path } = params;
    if (!path?.startsWith('/')) path = '/' + path;
    if (!path?.endsWith('/')) path = path + '/';
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const content = formData.get('content')?.toString();
    const website = formData.get('website')?.toString();
    const parentId = formData.get('parentId')?.toString();
    const backPath = formData.get('backPath')?.toString() || new URL(path ?? '/', 'https://' + host);
    const cfTurnstileKey = formData.get('cfTurnstileKey')?.toString();
    const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
    console.log(host, decodeURIComponent(path ?? '/'))
    const commentCreate = await db.createComment(host ?? '', path ?? '/', name ?? '', content ?? '', ip, website, parentId, cfTurnstileKey);
    if (commentCreate.success) {
        return redirect(backPath.toString(), 303);
    } else {
        return new Response(commentCreate.message, {
            status: commentCreate.status ?? 500
        })
    }
}