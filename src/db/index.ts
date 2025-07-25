import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export interface Env {
    NKM_TEST: D1Database;
}

export function createDb(env: Env) {
    return drizzle(env.NKM_TEST, { schema });
}

export type Database = ReturnType<typeof createDb>;