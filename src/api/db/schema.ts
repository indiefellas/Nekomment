import { relations, sql } from "drizzle-orm";
import { blob, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	email: text().notNull().unique(),
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
	address: text().notNull(),
	data: text().notNull(),
	createdAt: int().notNull(),
	expiresAt: int().notNull()
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}))

export const hosts = sqliteTable("hosts", {
	host: text().primaryKey(),
	ownerId: int().notNull(),
	settingsId: int().notNull()
});

export const hostsRelations = relations(hosts, ({ one, many }) => ({
	owner: one(users, {
		fields: [hosts.ownerId],
		references: [users.id]
	}),
	hostPages: many(hostPages),
	settings: one(hostSettings, {
		fields: [hosts.settingsId],
		references: [hostSettings.id]
	})
}))

export const hostPages = sqliteTable("host_pages", {
	path: text().primaryKey(),
	title: text().notNull(),
	hostUri: text().notNull()
})

export const hostPagesRelations = relations(hostPages, ({ one, many }) => ({
	host: one(hosts, {
		fields: [hostPages.hostUri],
		references: [hosts.host]
	}),
	comments: many(comments)
}))

export const comments = sqliteTable("comments", {
	id: int().primaryKey({ autoIncrement: true }),
	author: text().notNull().default("Anonymous"),
	content: text().notNull(),
	website: text(),
	createdAt: blob({ mode: 'bigint' }),
	address: text().notNull(),
	pagePath: text().notNull(),
	parentId: int()
})

export const commentsRelations = relations(comments, ({ one, many }) => ({
	page: one(hostPages, {
		fields: [comments.pagePath],
		references: [hostPages.path]
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
	moderationMode: int().notNull().default(0)
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
	type: int().notNull().default(0),
	settingsId: int().notNull()
})

export const autoModRulesRelations = relations(autoModRules, ({ one }) => ({
	settings: one(hostSettings, {
		fields: [autoModRules.settingsId],
		references: [hostSettings.id]
	})
}))