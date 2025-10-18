import { createDb } from "../db";
import * as schema from '../db/schema';
import bcrypt from "bcryptjs";
import { eq, and, inArray, or } from "drizzle-orm";
// @ts-ignore
import { resolveTxt } from "node:dns/promises";
import { genDefaultTemplate, genId } from "./generators";
import { AutoModBehavior, AutoModType, PostBehavior } from "../db/enums";
import lodash from "lodash";
import { safeRegexMatch } from "./sanitize";
const { chunk } = lodash;

export interface Response<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    status?: number;
}

export class Database {
    #db;
    #env;

    constructor(env: Cloudflare.Env) {
        this.#db = createDb(env);
        this.#env = env;
    }

    getDatabase() {
        return this.#db;
    }

    async getPage(name: string, path: string): Promise<Response<{
        // TODO abstract this type
        displayName: string;
        name: string;
        userId: number;
        hostName: string;
        template: string;
        pagePath: string | null;
        useReferer: boolean | null;
        comments: {
            id: string;
            host: string;
            address: string;
            pagePath: string;
            author: string;
            content: string;
            website: string | null;
            createdAt: Date | null;
            parentId: string | null;
            approved: boolean | null;
            moderatedBy: string | null;
            replies: {
                id: string;
                host: string;
                address: string;
                pagePath: string;
                author: string;
                content: string;
                website: string | null;
                createdAt: Date | null;
                parentId: string | null;
                approved: boolean | null;
                moderatedBy: string | null;
            }[];
        }[],
        flattenedComments: {
            id: string;
            host: string;
            address: string;
            pagePath: string;
            author: string;
            content: string;
            website: string | null;
            createdAt: Date | null;
            parentId: string | null;
            approved: boolean | null;
            moderatedBy: string | null;
        }[]
    }>> {
        const page = await this.#db.query.pages.findFirst({
            where: (page, { eq }) => eq(page.name, name),
        })
        if (!page) {
            return {
                success: false,
                message: 'Nekomment Page not found!',
                status: 404
            }
        }
        if (page.useReferer && !path) {
            return {
                success: false,
                message: 'Request must also include Referer header',
                status: 400
            }
        }
        // TODO we need to load comments separately to prevent this running for too long
        // on pages with many comments
        const comments = await this.#db.query.comments.findMany({
            with: {
                replies: true
            },
            where: (comments, { and, eq, isNull }) => and(
                path && page.useReferer ?
                    and(
                        eq(comments.host, page.hostName || ''),
                        eq(comments.pagePath, path)
                    ) :
                    eq(comments.host, page.hostName || ''),
                isNull(comments.parentId)
            )
        })
        const flattenedComments = await this.#db.query.comments.findMany({
            where: (comments, { and, eq, isNull }) =>
                path && page.useReferer ?
                    and(
                        eq(comments.host, page.hostName || ''),
                        eq(comments.pagePath, path)
                    ) :
                    eq(comments.host, page.hostName || ''),
        })
        return {
            success: true,
            data: {
                ...page,
                comments: comments,
                flattenedComments: flattenedComments
            }
        }
    }

    async getPageConfig(sessionToken: string, page: string, host: string): Promise<Response<schema.Page>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let pageCfg = await this.#db.query.pages.findFirst({
            where: (p, { eq, and }) => and(
                eq(p.name, page),
                eq(p.hostName, host)
            )
        })
        if (!pageCfg) {
            return {
                success: false,
                message: 'Page not found',
                status: 404
            }
        }
        return {
            success: true,
            data: pageCfg
        }
    }

    async getPagesConfig(sessionToken: string, host: string): Promise<Response<Array<schema.Page>>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let pageCfg = await this.#db.query.pages.findMany({
            where: (p, { eq }) => eq(p.hostName, host)
        })
        return {
            success: true,
            data: pageCfg
        }
    }

    async createUser(name: string, password: string, email: string): Promise<Response> {
        if (!name || !password || !email) {
            return { success: false, message: 'name, password, and email are all required', status: 400 };
        } else if (password.length < 8) {
            return { success: false, message: 'password must be 8 chars or longer', status: 400 };
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, message: 'email must be valid', status: 400 };
        }

        try {
            console.log('creating user via RPC');
            await this.#db.insert(schema.users).values({
                name: name,
                email: email,
                passwordHash: await bcrypt.hash(password, await bcrypt.genSalt(12)),
                type: 0
            });
            console.log('user created via RPC');
            return { success: true, message: `user '${name}' created` };
        } catch (error: any) {
            console.error("Error creating user:", error);
            return { success: false, message: `Failed to create user: ${error.message}`, status: 500 };
        }
    }

    async updateUser(): Promise<Response> {
        return { success: true, message: `update user (RPC)` };
    }

    async deleteUser(): Promise<Response> {
        return { success: true, message: `delete user (RPC)` };
    }

    async loginUser(name: string, password: string, userAgent: string, ipAddress: string): Promise<Response<{ token: string }>> {
        if (!name || !password) {
            return { success: false, message: 'name and password are all required', status: 400 };
        }

        try {
            let user = await this.#db.select().from(schema.users).where(eq(schema.users.name, name));

            if (user.length < 1 || !(await bcrypt.compare(password, user[0].passwordHash))) {
                return { success: false, message: 'incorrect username or password', status: 401 };
            }

            const token = btoa(genId(64) + Date.now());

            await this.#db.insert(schema.sessions).values({
                sessionToken: token,
                userId: user[0].id,
                userAgent: userAgent,
                address: ipAddress
            });
            return { success: true, message: 'logged in', data: { token } };
        } catch (error: any) {
            console.error("Error logging in user:", error);
            return { success: false, message: `Login failed: ${error.message}`, status: 500 };
        }
    }

    async checkUser(sessionToken: string): Promise<Response<schema.User>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        return {
            success: true,
            message: 'User found',
            data: userSession[0].users
        }
    }

    async importComments(sessionToken: string, host: string, comments: schema.Comment[]): Promise<Response> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hosts = await this.#db.select()
            .from(schema.hosts)
            .where(
                and(
                    eq(schema.hosts.ownerId, userSession[0].users.id),
                    eq(schema.hosts.host, host)
                )
            );
        if (hosts.length < 1) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        const commentChunks = chunk(comments, 5);
        for (let i = 0; i < commentChunks.length; i++) {
            if (!!commentChunks[i]) {
            try {
                await this.#db.insert(schema.comments).values(commentChunks[i]);
                } catch {
                    try {
                        for (let c = 0; c < commentChunks[i].length; i++) {
                            await this.#db.insert(schema.comments).values(commentChunks[i][c]);   
                        }
                    } catch {}
                }
            }
        }
        return {
            success: true,
            status: 200
        }
    }

    async getSessionsFromUser(user: schema.User): Promise<Response<schema.Session[]>> {
        let userSessions = await this.#db.query.sessions.findMany({
            where: (u, { eq }) => eq(u.userId, user.id)
        });

        return {
            success: true,
            data: userSessions
        }
    }

    async changePassword(sessionToken: string, currentPassword: string, newPassword: string): Promise<Response<string>> {
        if (!sessionToken) {
            return { success: false, message: 'authentication required', status: 401 };
        }
        if (!currentPassword || !newPassword) {
            return { success: false, message: 'old password and new password are required', status: 400 };
        }
        if (newPassword.length < 8) {
            return { success: false, message: 'new password must be 8 characters or longer', status: 400 };
        }

        try {
            let userSession = await this.#db.select()
                .from(schema.sessions)
                .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
                .where(eq(schema.sessions.sessionToken, sessionToken));

            if (userSession.length < 1 || !userSession[0].users) {
                return { success: false, message: 'authentication required', status: 401 };
            }

            const user = userSession[0].users;

            const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentValid) {
                return { success: false, message: 'current password is incorrect', status: 400 }
            }

            await this.#db.update(schema.users)
                .set({ passwordHash: await bcrypt.hash(newPassword, await bcrypt.genSalt(12)) })
                .where(eq(schema.users.id, user.id));

            console.log(`successfully changed password for user: ${user.name}`);
            return { success: true, message: 'password changed successfully' }
        } catch (err: any) {
            console.log(`error changing password:`, err);
            return { success: false, message: `failed to change password: ${err.message}`, status: 500 }
        }
    }

    async initializeAddHostToken(sessionToken: string): Promise<Response<string>> {
        if (!sessionToken) {
            return { success: false, message: 'authentication required', status: 401 };
        }

        try {
            let userSession = await this.#db.select()
                .from(schema.sessions)
                .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
                .where(eq(schema.sessions.sessionToken, sessionToken));

            if (userSession.length < 1 || !userSession[0].users) {
                return { success: false, message: 'authentication required', status: 401 };
            }

            let hostToken = userSession[0].users.hostToken;
            if (!hostToken) {
                hostToken = crypto.randomUUID();
                await this.#db.update(schema.users)
                    .set({ hostToken })
                    .where(eq(schema.users.id, userSession[0].users.id))
            }

            return { success: true, data: hostToken };
        } catch (error: any) {
            console.error("Error initializing add host token:", error);
            return { success: false, message: `Failed to initialize host token: ${error.message}`, status: 500 };
        }
    }


    async addHost(sessionToken: string, host: string, method: string): Promise<Response> {
        if (!sessionToken) {
            return { success: false, message: 'authentication required', status: 401 };
        }
        if (!host) {
            return { success: false, message: 'host required', status: 400 };
        }

        try {
            let userSession = await this.#db.select()
                .from(schema.sessions)
                .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
                .where(eq(schema.sessions.sessionToken, sessionToken));

            if (userSession.length < 1 || !userSession[0].users) {
                return { success: false, message: 'authentication required', status: 401 };
            }

            const hostToken = userSession[0].users.hostToken;
            if (!hostToken) {
                return { success: false, message: 'host token not yet initialized', status: 401 };
            }

            switch (method) {
                case 'dns': {
                    const content = await resolveTxt(`_nekomment.${host}`);
                    if (!content[0] || content[0][0] !== 'nekomment-token=' + hostToken) {
                        return { success: false, message: 'host token does not match (TXT record)', status: 403 };
                    }
                    break;
                }
                default: {
                    const response = await fetch(`https://${host}/.well-known/nekomment`);
                    const text = await response.text();
                    if (!text || text.trim() !== hostToken) {
                        return { success: false, message: 'host token does not match (well-known file)', status: 403 };
                    }
                    break;
                }
            }

            await this.#db.insert(schema.hostSettings).values({
                hostUri: host,
                postBehavior: PostBehavior.AutoPublish
            });
            let hostSettings = await this.#db.query.hostSettings.findFirst({
                where: (s, { eq }) => eq(s.hostUri, host)
            })
            await this.#db.insert(schema.hosts).values({
                host: host,
                ownerId: userSession[0].users?.id || 0,
                settingsId: hostSettings?.id
            });

            return { success: true, message: `host '${host}' added to account '${userSession[0].users?.name}'` };
        } catch (error: any) {
            console.error("Error adding host:", error);
            return { success: false, message: `Failed to add host: ${error.message}`, status: 500 };
        }
    }

    // TODO we probably don't need to return every single comment ever made on an user's host
    async getHosts(sessionToken: string): Promise<Response<{
        host: string;
        ownerId: number;
        settingsId: number | null;
        comments: {
            id: string;
            host: string;
            address: string;
            pagePath: string;
            author: string;
            content: string;
            website: string | null;
            createdAt: Date | null;
            parentId: string | null;
            approved: boolean | null;
            moderatedBy: string | null;
        }[];
    }[]>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hosts = await this.#db.query.hosts.findMany({
            with: {
                comments: true
            },
            where: (host, { eq }) => eq(host.ownerId, userSession[0].users?.id || 0)
        })
        return {
            success: true,
            data: hosts
        }
    }

    async getHost(sessionToken: string, host: string): Promise<Response<schema.Host>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hosts = await this.#db.select()
            .from(schema.hosts)
            .where(
                and(
                    eq(schema.hosts.ownerId, userSession[0].users.id),
                    eq(schema.hosts.host, host)
                )
            );
        if (hosts.length < 1) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        return {
            success: true,
            data: hosts[0]
        }
    }

    async deletePage(sessionToken: string, host: string, name: string): Promise<Response> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hostName = await this.#db.query.hosts.findFirst({
            where: (sHost, { eq }) => eq(sHost.host, host)
        })
        if (!hostName) {
            return {
                success: false,
                message: 'host not found',
                status: 404
            }
        }
        let pageCfg = await this.#db.query.pages.findFirst({
            where: (p, { eq, and }) => and(
                eq(p.name, name),
                eq(p.hostName, host)
            )
        })
        if (!pageCfg) {
            return {
                success: false,
                message: 'Page not found',
                status: 404
            }
        }
        await this.#db.delete(schema.pages)
            .where(and(
                eq(schema.pages.name, name),
                eq(schema.pages.hostName, host)
            ))
        return {
            success: true,
            message: 'Successfully deleted page ' + name
        }
    }

    async createPage(sessionToken: string, displayName: string, name: string, host: string, theme: string, pagePath?: string): Promise<Response> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hostName = await this.#db.query.hosts.findFirst({
            where: (sHost, { eq }) => eq(sHost.host, host)
        })
        if (!hostName) {
            return {
                success: false,
                message: 'host not found',
                status: 404
            }
        }
        await this.#db.insert(schema.pages).values({
            displayName: displayName,
            name: name,
            hostName: host,
            userId: userSession[0].users.id,
            useReferer: !!pagePath,
            pagePath: pagePath,
            template: genDefaultTemplate(theme)
        })
        return {
            success: true,
            message: 'Page successfully created'
        }
    }

    async getPages(sessionToken: string): Promise<Response<{
        displayName: string;
        name: string;
        userId: number;
        hostName: string;
        template: string;
        pagePath: string | null;
        useReferer: boolean | null;
    }[]>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let pages = await this.#db.query.pages.findMany({
            where: eq(schema.pages.userId, userSession[0].users.id)
        })
        return {
            success: true,
            data: pages
        }
    }

    async getComments(sessionToken: string, host: string, path?: string): Promise<Response<{
        id: string;
        host: string;
        address: string;
        pagePath: string;
        author: string;
        content: string;
        website: string | null;
        createdAt: Date | null;
        parentId: string | null;
        approved: boolean | null;
        moderatedBy: string | null;
        replies: {
            id: string;
            host: string;
            address: string;
            pagePath: string;
            author: string;
            content: string;
            website: string | null;
            createdAt: Date | null;
            parentId: string | null;
            approved: boolean | null;
            moderatedBy: string | null;
        }[];
    }[]>> {
        let comments = await this.#db.query.comments.findMany({
            with: {
                replies: true
            },
            where: (comments, { and, eq, isNull }) => and(
                eq(comments.host, host || ''),
                or(isNull(comments.parentId), eq(comments.parentId, ''))
            )
        })
        if (!!path) {
            console.log('filtering');
            comments = comments.filter(c => c.pagePath === path);
        }
        console.log(path);
        const userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        let cmts: any = comments;
        if (userSession.length === 0) {
            cmts = comments.map(c => {
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
        }
        return {
            success: true,
            data: cmts
        }
    }

    async getRules(sessionToken: string, host: string): Promise<Response<schema.AutoModRule[]>> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        const userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        const hostData = await this.#db.query.hosts.findFirst({
            where: (h, { eq, and }) => and(
                eq(h.ownerId, userSession[0].users?.id || 0),
                eq(h.host, host)
            ),
            with: {
                settings: true
            }
        });
        if (!hostData) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        let rules = await this.#db.query.autoModRules.findMany({
            where: (r, { eq }) => eq(r.hostSettingsId, hostData.settingsId || 0)
        });
        return {
            success: true,
            data: rules
        }
    }

    async createRule(sessionToken: string, host: string, name: string, rule: string, type: number, action: number): Promise<Response> {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        const userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        const hostData = await this.#db.query.hosts.findFirst({
            where: (h, { eq, and }) => and(
                eq(h.ownerId, userSession[0].users?.id || 0),
                eq(h.host, host)
            ),
            with: {
                settings: true
            }
        });
        if (!hostData) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        let hostSettings = hostData.settings;
        if (!hostSettings) {
            await this.#db.insert(schema.hostSettings).values({
                hostUri: host,
                postBehavior: PostBehavior.AutoPublish
            });
            hostSettings = await this.#db.query.hostSettings.findFirst({
                where: (s, { eq }) => eq(s.hostUri, host)
            }) as schema.HostSettings
        }
        await this.#db.insert(schema.autoModRules).values({
            name: name,
            rule: rule,
            type: type,
            settingsId: hostSettings.id,
            behavior: action,
            enabled: true
        })
        return {
            success: true
        }
    }

    async deleteComment(sessionToken: string, host: string, id: string) {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        const userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hostPage = await this.#db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
        if (hostPage.length < 1) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        let idChunks = chunk(id.split(','), 25);
        let comments = [...idChunks.map(async c => await this.#db.delete(schema.comments).where(inArray(schema.comments.id, c)).returning())]
        if (comments.length === 0) {
            return {
                success: false,
                message: 'Comment not found',
                status: 404
            }
        }
        return {
            success: true,
            message: `Comment ${id} deleted`,
            status: 200
        }
    }

    async ipBanUser(sessionToken: string, host: string, ids: string, deleteComments: boolean = false) {
        if (!sessionToken) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        const userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken));
        if (userSession.length < 1 || !userSession[0].users) {
            return {
                success: false,
                message: 'User not logged in or session expired',
                status: 401
            }
        }
        let hostPage = await this.#db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
        if (hostPage.length < 1) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        let hostCfg = await this.#db.query.hostSettings.findFirst({
            with: {
                autoModRules: true
            },
            where: (p, { eq }) => eq(p.id, hostPage[0].settingsId ?? 0)
        })
        if (!hostCfg) {
            await this.#db.insert(schema.hostSettings).values({
                hostUri: hostPage[0].host
            });
            hostCfg = await this.#db.query.hostSettings.findFirst({
                with: {
                    autoModRules: true
                },
                where: (p, { eq }) => eq(p.hostUri, hostPage[0].host)
            });
            await this.#db.update(schema.hosts)
                .set({ settingsId: hostCfg?.id || 0 })
                .where(eq(schema.hosts.host, hostPage[0].host));
        }
        let blockedComments = await this.#db.query.comments.findMany({
            where: (cmt, { and, eq, inArray }) => and(eq(cmt.host, host), inArray(cmt.id, ids.split(',')))
        })
        if (deleteComments) {
            let comments = await this.#db.delete(schema.comments).where(and(eq(schema.comments.host, host), inArray(schema.comments.address, blockedComments.map(x => x.address)))).returning();
            console.log(comments);
        }
        await this.#db.insert(schema.blockedAddresses).values(blockedComments.map(b => ({
            settingsId: hostCfg?.id ?? 0,
            address: b.address,
            reason: "Blocked by comment admin"
        })))
        return {
            success: true,
            message: `IP(s) ${blockedComments.map(x => x.address).join(', ')} banned, deleted all comments`,
            status: 200
        }
    }

    async createComment(host: string, path: string, name: string, content: string, ip: string = '0.0.0.0', website?: string, parentId?: string, turnstileKey?: string, sessionToken?: string): Promise<Response> {
        console.log(host, path, name, content)       
        if (name.length > 64 || (website && website.length > 64) || content.length > 1024) {
            return {
                success: false,
                message: 'Comment is over the enforced length',
                status: 413
            }
        }
        let hostPage = await this.#db.select().from(schema.hosts).where(eq(schema.hosts.host, host));
        if (hostPage.length < 1) {
            return {
                success: false,
                message: 'Host not found',
                status: 404
            }
        }
        let outcome: { success: boolean } = {
            success: false
        }
        let pathCfg = await this.#db.query.paths.findFirst({
            where: (p, { eq }) => eq(p.host, hostPage[0].host)
        })
        let hostCfg = await this.#db.query.hostSettings.findFirst({
            with: {
                autoModRules: true
            },
            where: (p, { eq }) => eq(p.id, hostPage[0].settingsId ?? 0)
        })

        if (!pathCfg) {
            await this.#db.insert(schema.paths).values({
                path: path,
                host: hostPage[0].host
            });
            pathCfg = await this.#db.query.paths.findFirst({
                where: (p, { eq }) => eq(p.host, hostPage[0].host)
            })
        }
        if (!hostCfg) {
            await this.#db.insert(schema.hostSettings).values({
                hostUri: hostPage[0].host
            });
            hostCfg = await this.#db.query.hostSettings.findFirst({
                with: {
                    autoModRules: true
                },
                where: (p, { eq }) => eq(p.hostUri, hostPage[0].host)
            });
            await this.#db.update(schema.hosts)
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
            if (needsReview) return {
                success: true,
                message: "Comment created",
                status: 202
            };
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
                return {
                    success: false,
                    message: 'Comment is blocked by a certain Auto Moderation rule',
                    status: 422
                }
            }
        }

        let userSession = await this.#db.select()
            .from(schema.sessions)
            .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
            .where(eq(schema.sessions.sessionToken, sessionToken || ''));

        if (turnstileKey && userSession.length > 0) {
            let formData = new FormData();
            formData.append("secret", this.#env.TURNSTILE_KEY);
            formData.append("response", turnstileKey.toString());
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
            if (parentId) {
                let parentComment = await this.#db.select().from(schema.comments).where(
                    and(
                        eq(schema.comments.host, host),
                        eq(schema.comments.id, parentId)
                    )
                )
                parentId = parentComment[0].id;
                if (parentComment.length < 1) {
                    parentId = undefined;
                } else if (parentComment[0].parentId) {
                    parentId = parentComment[0].parentId
                }
            }
            let cmts = await this.#db.insert(schema.comments).values({
                host: host,
                author: name,
                content: content,
                website: website,
                createdAt: new Date(Date.now()),
                address: ip,
                pagePath: path,
                parentId: parentId,
                approved: !(needsReview || ifReviewRequired),
                moderatedBy: reviewReason
            })
                .returning();

            console.log(cmts);
            return {
                success: true,
                message: "Comment created, id: " + cmts[0].id
            }
        }

        return {
            success: false,
            message: "Security error, please close this tab",
            status: 403
        }
    }
}