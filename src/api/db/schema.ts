import { InferInsertModel, InferSelectModel, relations, sql } from "drizzle-orm";
import { blob, int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { genId } from "../src/utils";
import { AutoModBehavior, AutoModType, PostBehavior } from "./enums";

export const users = sqliteTable("users", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	email: text().notNull().unique(),
	hostToken: text(),
	type: int().notNull(),
	passwordHash: text().notNull()
});

export const usersRelations = relations(users, ({ one, many }) => ({
	hosts: many(hosts),
	sessions: many(sessions)
}))

export const sessions = sqliteTable("sessions", {
	sessionToken: text().primaryKey(),
	userId: int().notNull(),
	userAgent: text().notNull(),
	address: text().notNull()
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}))

export const pages = sqliteTable("pages", {
	name: text().primaryKey(),
	userId: int().notNull(),
	hostName: text().notNull(),
	template: text().notNull(),
	pagePath: text().default(''),
	useReferer: integer<"boolean">().default(false)
})

export const pagesRelations = relations(pages, ({ one, many }) => ({
	user: one(users, {
		fields: [pages.userId],
		references: [users.id]
	}),
	host: one(hosts, {
		fields: [pages.hostName],
		references: [hosts.host]
	}),
	comments: many(comments)
}))

export const hosts = sqliteTable("hosts", {
	host: text().primaryKey(),
	ownerId: int().notNull(),
	settingsId: int()
});

export const hostsRelations = relations(hosts, ({ one, many }) => ({
	owner: one(users, {
		fields: [hosts.ownerId],
		references: [users.id]
	}),
	settings: one(hostSettings, {
		fields: [hosts.settingsId],
		references: [hostSettings.id]
	}),
	comments: many(comments)
}))

export const paths = sqliteTable("paths", {
	path: text().primaryKey(),
	host: text().notNull(),
	locked: integer({ mode: 'boolean' }).default(false),
	// 0: publish comments
	// 1: mark them as review by default
	postBehavior: int().notNull().$type<PostBehavior>().default(PostBehavior.AutoPublish)
})

export const pathsRelations = relations(paths, ({ one, many }) => ({
	host: one(hosts, {
		fields: [paths.host],
		references: [hosts.host]
	}),
	comments: many(comments)
}))

export const comments = sqliteTable("comments", {
	id: text().primaryKey().$defaultFn(() => genId(6)),
	author: text().notNull().default("Anonymous"),
	content: text().notNull(),
	website: text(),
	createdAt: integer({ mode: 'timestamp' }),
	address: text().notNull(),
	host: text().notNull(),
	parentId: text(),
	pagePath: text().notNull(),
	approved: integer({ mode: 'boolean' }).default(false),
	moderatedBy: text()
})

export const commentsRelations = relations(comments, ({ one, many }) => ({
	host: one(hosts, {
		fields: [comments.host],
		references: [hosts.host]
	}),
	path: one(paths, {
		fields: [comments.pagePath, comments.host],
		references: [paths.path, paths.host]
	}),
	replies: many(comments, {
		relationName: 'comment_replies',
	}),
	parent: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: 'comment_replies',
	})
}))

export const hostSettings = sqliteTable("host_settings", {
	id: int().primaryKey({ autoIncrement: true }),
	hostUri: text().notNull(),
	postBehavior: int().notNull().$type<PostBehavior>().default(PostBehavior.AutoPublish)
})

export const hostSettingsRelations = relations(hostSettings, ({ one, many }) => ({
	host: one(hosts, {
		fields: [hostSettings.hostUri],
		references: [hosts.host]
	}),
	blockedAddresses: many(blockedAddresses),
	autoModRules: many(autoModRules)
}))

export const blockedAddresses = sqliteTable("blocked_addresses", {
	id: int().primaryKey({ autoIncrement: true }),
	address: text().notNull(),
	reason: text().notNull(),
	settingsId: int().notNull()
})

export const blockedAddressesRelations = relations(blockedAddresses, ({ one }) => ({
	settings: one(hostSettings, {
		fields: [blockedAddresses.settingsId],
		references: [hostSettings.id]
	})
}))

export const autoModRules = sqliteTable("automod_rules", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	rule: text().notNull(),
	type: int().notNull().$type<AutoModType>().default(AutoModType.KeywordList),
	behavior: int().notNull().$type<AutoModBehavior>().default(AutoModBehavior.Block),
	settingsId: int().notNull(),
	enabled: integer({ mode: 'boolean' }).default(true)
})

export const autoModRulesRelations = relations(autoModRules, ({ one }) => ({
	settings: one(hostSettings, {
		fields: [autoModRules.settingsId],
		references: [hostSettings.id]
	})
}))

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type Page = InferSelectModel<typeof pages>;
export type NewPage = InferInsertModel<typeof pages>;
export type Host = InferSelectModel<typeof hosts>;
export type NewHost = InferInsertModel<typeof hosts>;
export type Path = InferSelectModel<typeof paths>;
export type NewPath = InferInsertModel<typeof paths>;
export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;
export type HostSettings = InferSelectModel<typeof hostSettings>;
export type NewHostSettings = InferInsertModel<typeof hostSettings>;
export type BlockedAddress = InferSelectModel<typeof blockedAddresses>;
export type NewBlockedAddress = InferInsertModel<typeof blockedAddresses>;
export type AutoModRule = InferSelectModel<typeof autoModRules>;
export type NewAutoModRule = InferInsertModel<typeof autoModRules>;