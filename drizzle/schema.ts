import { pgTable, index, unique, check, varchar, timestamp, text, jsonb, boolean, integer, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	verificationCode: varchar("verification_code", { length: 6 }),
	verificationCodeExpiresAt: timestamp("verification_code_expires_at", { withTimezone: true, mode: 'string' }),
	name: varchar({ length: 128 }).notNull(),
	gender: varchar({ length: 10 }).notNull(),
	birthDate: timestamp("birth_date", { withTimezone: true, mode: 'string' }).notNull(),
	birthTime: varchar("birth_time", { length: 10 }).notNull(),
	birthPlace: varchar("birth_place", { length: 255 }).notNull(),
	initialQuestion: text("initial_question").notNull(),
	metadata: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	activatedAt: timestamp("activated_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	maxConversations: integer("max_conversations").default(50).notNull(),
	usedConversations: integer("used_conversations").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("users_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("users_phone_number_idx").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
	unique("users_phone_number_key").on(table.phoneNumber),
	check("users_gender_check", sql`(gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, ''::character varying])::text[])`),
]);

export const conversations = pgTable("conversations", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	role: varchar({ length: 10 }).notNull(),
	content: text().notNull(),
	isRelatedToFortune: boolean("is_related_to_fortune").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("conversations_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("conversations_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_user_id_fkey"
		}).onDelete("cascade"),
	check("conversations_role_check", sql`(role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])`),
]);

export const activationList = pgTable("activation_list", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	activatedBy: varchar("activated_by", { length: 128 }),
	notes: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activation_list_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("activation_list_phone_number_idx").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
	unique("activation_list_phone_number_key").on(table.phoneNumber),
]);
