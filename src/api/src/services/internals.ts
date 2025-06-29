// src/services/internal.ts
import { env, WorkerEntrypoint } from "cloudflare:workers";
import { createDb } from "../../db";
import * as schema from '../../db/schema';
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
// @ts-ignore
import { resolveTxt } from "node:dns/promises";

const db = createDb(env);

interface RpcResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  status?: number;
}

export class InternalService extends WorkerEntrypoint {
  async fetch() { return new Response(null, { status: 404 }); }

  getDatabase() {
    return db;
  }

  async getPage(name: string, path: string): Promise<RpcResponse<{
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
      createdAt: number | null;
      parentId: string | null;
      replies: {
        id: string;
        host: string;
        address: string;
        pagePath: string;
        author: string;
        content: string;
        website: string | null;
        createdAt: number | null;
        parentId: string | null;
      }[];
    }[]
  }>> {
    const page = await db.query.pages.findFirst({
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
    const comments = await db.query.comments.findMany({
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
    return {
      success: true,
      data: {
        ...page,
        comments: comments
      }
    }
  }

  async createUser(name: string, password: string, email: string): Promise<RpcResponse> {
    if (!name || !password || !email) {
      return { success: false, message: 'name, password, and email are all required', status: 400 };
    } else if (password.length < 8) {
      return { success: false, message: 'password must be 8 chars or longer', status: 400 };
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: 'email must be valid', status: 400 };
    }

    try {
      console.log('creating user via RPC');
      await db.insert(schema.users).values({
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

  async updateUser(): Promise<RpcResponse> {
    return { success: true, message: `update user (RPC)` };
  }

  async deleteUser(): Promise<RpcResponse> {
    return { success: true, message: `delete user (RPC)` };
  }

  async loginUser(name: string, password: string): Promise<RpcResponse<{ token: string }>> {
    if (!name || !password) {
      return { success: false, message: 'name and password are all required', status: 400 };
    }

    try {
      let user = await db.select().from(schema.users).where(eq(schema.users.name, name));

      if (user.length < 1 || !(await bcrypt.compare(password, user[0].passwordHash))) {
        return { success: false, message: 'incorrect username or password', status: 401 };
      }

      const token = btoa(crypto.randomUUID());


      await db.insert(schema.sessions).values({
        sessionToken: token,
        userId: user[0].id,
        userAgent: 'RPC_CALL',
        address: 'RPC_CALL_IP'
      });
      return { success: true, message: 'logged in', data: { token } };
    } catch (error: any) {
      console.error("Error logging in user:", error);
      return { success: false, message: `Login failed: ${error.message}`, status: 500 };
    }
  }

  async checkUser(sessionToken: string): Promise<RpcResponse<schema.User>> {
    if (!sessionToken) {
      return {
        success: false,
        message: 'User not logged in or session expired',
        status: 401
      }
    }
    let userSession = await db.select()
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

  async initializeAddHostToken(sessionToken: string): Promise<RpcResponse> {
    if (!sessionToken) {
      return { success: false, message: 'authentication required', status: 401 };
    }

    try {
      let userSession = await db.select()
        .from(schema.sessions)
        .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
        .where(eq(schema.sessions.sessionToken, sessionToken));

      if (userSession.length < 1 || !userSession[0].users) {
        return { success: false, message: 'authentication required', status: 401 };
      }

      const hostToken = crypto.randomUUID();


      return { success: true, data: { hostToken } };
    } catch (error: any) {
      console.error("Error initializing add host token:", error);
      return { success: false, message: `Failed to initialize host token: ${error.message}`, status: 500 };
    }
  }


  async addHost(sessionToken: string, hostToken: string, host: string, method: '1' | 'default'): Promise<RpcResponse> {
    if (!sessionToken) {
      return { success: false, message: 'authentication required', status: 401 };
    }
    if (!host) {
      return { success: false, message: 'host required', status: 400 };
    }
    if (!hostToken) {
      return { success: false, message: 'host token required', status: 400 };
    }

    try {
      let userSession = await db.select()
        .from(schema.sessions)
        .leftJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
        .where(eq(schema.sessions.sessionToken, sessionToken));

      if (userSession.length < 1 || !userSession[0].users) {
        return { success: false, message: 'authentication required', status: 401 };
      }

      switch (method) {
        case '1': {
          const content = await resolveTxt(`_nekomment.${host}`);
          if (!content[0] || content[0][0] !== 'nekomment-token=' + hostToken) {
            return { success: false, message: 'host token does not match (TXT record)', status: 403 };
          }
          break;
        }
        default: {
          const response = await fetch(`https://${host}/.well-known/nekomment`);
          const text = await response.text();
          if (!text || text !== hostToken) {
            return { success: false, message: 'host token does not match (well-known file)', status: 403 };
          }
          break;
        }
      }

      await db.insert(schema.hosts).values({
        host: host,
        ownerId: userSession[0].users?.id || 0
      });
      return { success: true, message: `host '${host}' added to account '${userSession[0].users?.name}'` };
    } catch (error: any) {
      console.error("Error adding host:", error);
      return { success: false, message: `Failed to add host: ${error.message}`, status: 500 };
    }
  }

  async getHosts(sessionToken: string): Promise<RpcResponse<schema.Host[]>> {
    if (!sessionToken) {
      return {
        success: false,
        message: 'User not logged in or session expired',
        status: 401
      }
    }
    let userSession = await db.select()
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
    let hosts = await db.select()
      .from(schema.hosts)
      .where(eq(schema.hosts.ownerId, userSession[0].users.id));
    return {
      success: true,
      data: hosts
    }
  }

  async getHost(sessionToken: string, host: string): Promise<RpcResponse<schema.Host>> {
    if (!sessionToken) {
      return {
        success: false,
        message: 'User not logged in or session expired',
        status: 401
      }
    }
    let userSession = await db.select()
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
    let hosts = await db.select()
      .from(schema.hosts)
      .where(
        and(
          eq(schema.hosts.ownerId, userSession[0].users.id),
          eq(schema.hosts.host, host)
        )
      );
    if (host.length < 1) {
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

  async getComments(sessionToken: string, host: string, path?: string): Promise<RpcResponse<{
    id: string;
    host: string;
    address: string;
    pagePath: string;
    author: string;
    content: string;
    website: string | null;
    createdAt: number | null;
    parentId: string | null;
    replies: {
      id: string;
      host: string;
      address: string;
      pagePath: string;
      author: string;
      content: string;
      website: string | null;
      createdAt: number | null;
      parentId: string | null;
    }[];
  }[]>> {
    let sHost = await this.getHost(sessionToken, host);
    if (!sHost.success) return sHost as RpcResponse<any>;
    const comments = await db.query.comments.findMany({
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
}
