import type { User } from "../../../../api/db/schema";
import * as vm from "vm";

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

export async function safeRegexMatch(str: string, regex: RegExp) {
    let args = { regex, str, result: null };
    let context = vm.createContext(args);
    new vm.Script("result = str.match(regex)").runInContext(context, { timeout: 500 })
    return args.result as RegExpMatchArray | null;
}