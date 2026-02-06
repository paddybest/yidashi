import { relations } from "drizzle-orm/relations";
import { users, conversations } from "./schema";

export const conversationsRelations = relations(conversations, ({one}) => ({
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	conversations: many(conversations),
}));