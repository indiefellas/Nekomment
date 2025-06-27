import { relations, sql } from "drizzle-orm";
import { blob, int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const comments = sqliteTable("comments", {
	id: int().primaryKey({ autoIncrement: true }),
	author: text().notNull().default("Anonymous"),
	content: text().notNull(),
	website: text(),
	createdAt: int(),
	address: text().notNull(),
	host: text().notNull(),
	parentId: int(),
	pagePath: text().notNull()
})

export const commentsRelations = relations(comments, ({ one, many }) => ({
	host: one(hosts, {
		fields: [comments.host],
		references: [hosts.host]
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