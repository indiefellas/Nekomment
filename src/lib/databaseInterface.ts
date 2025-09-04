import { createDb } from "../db";
import * as schema from '../db/schema';
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
// @ts-ignore
import { resolveTxt } from "node:dns/promises";
import { genDefaultTemplate, genId } from "./generators";
import { PostBehavior } from "../db/enums";

export interface Response<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    status?: number;
}

export class Database {
    #db;

    constructor(env: Cloudflare.Env) {
        this.#db = createDb(env);
    }

    getDatabase() {
        return this.#db;
    }

    async getPage(name: string, path: string): Promise<Response<{
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

    async createPage(sessionToken: string, name: string, host: string, theme: string, pagePath?: string): Promise<Response> {
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
        let sHost = await this.getHost(sessionToken, host);
        if (!sHost.success) return sHost as Response<any>;
        const comments = await this.#db.query.comments.findMany({
            with: {
                replies: true
            },
            where: (comments, { and, eq, isNull }) => and(
                path ?
                    and(
                        eq(comments.host, sHost.data?.host || ''),
                        eq(comments.pagePath, path)
                    ) :
                    eq(comments.host, sHost.data?.host || ''),
                isNull(comments.parentId)
            )
        })
        return {
            success: true,
            data: comments
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
            where: (r, { eq }) => eq(r.settingsId, hostData.settingsId || 0)
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
}