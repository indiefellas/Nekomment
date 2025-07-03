import type { User } from "../../../api/db/schema";

export type SafeUser = {
    id: number;
    name: string;
    type: number;
}

export function sanitizeUser(user: User): SafeUser {
    let userSanitized: SafeUser & Partial<User> = { ...user };
    delete userSanitized.email;
    delete userSanitized.passwordHash;
    return userSanitized;
}