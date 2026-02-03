import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 用户表 - 存储用户的命理信息
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    phoneNumber: varchar("phone_number", { length: 20 }).unique(), // 手机号，用于登录
    verificationCode: varchar("verification_code", { length: 6 }), // 验证码
    verificationCodeExpiresAt: timestamp("verification_code_expires_at", { withTimezone: true }), // 验证码过期时间
    name: varchar("name", { length: 128 }).notNull(),
    gender: varchar("gender", { length: 10 }).notNull(), // male, female
    birthDate: timestamp("birth_date", { withTimezone: true }).notNull(),
    birthTime: varchar("birth_time", { length: 10 }).notNull(), // zi, chou, yin, mao, chen, si, wu, wei, shen, you, xu, hai
    birthPlace: varchar("birth_place", { length: 255 }).notNull(),
    initialQuestion: text("initial_question").notNull(),
    metadata: jsonb("metadata"), // 存储八字、梅花易数等计算结果
    isActive: boolean("is_active").default(true).notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }), // 激活时间
    expiresAt: timestamp("expires_at", { withTimezone: true }), // 过期时间
    maxConversations: integer("max_conversations").default(50), // 最大对话次数
    usedConversations: integer("used_conversations").default(0), // 已使用对话次数
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    nameIdx: index("users_name_idx").on(table.name),
    phoneNumberIdx: index("users_phone_number_idx").on(table.phoneNumber),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  })
);

// 对话历史表 - 存储用户与大师的对话记录
export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 10 }).notNull(), // user, assistant
    content: text("content").notNull(),
    isRelatedToFortune: boolean("is_related_to_fortune").default(true).notNull(), // 是否与命理相关
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("conversations_user_id_idx").on(table.userId),
    createdAtIdx: index("conversations_created_at_idx").on(table.createdAt),
  })
);

// 激活名单表 - 存储已激活的手机号白名单
export const activationList = pgTable(
  "activation_list",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(), // 手机号
    activatedBy: varchar("activated_by", { length: 128 }), // 激活人
    notes: text("notes"), // 备注
    isActive: boolean("is_active").default(true).notNull(), // 是否激活
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    phoneNumberIdx: index("activation_list_phone_number_idx").on(table.phoneNumber),
    createdAtIdx: index("activation_list_created_at_idx").on(table.createdAt),
  })
);

// 使用 createSchemaFactory 配置 date coercion（处理前端 string → Date 转换）
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// User schemas
export const insertUserSchema = createCoercedInsertSchema(users).pick({
  phoneNumber: true,
  name: true,
  gender: true,
  birthDate: true,
  birthTime: true,
  birthPlace: true,
  initialQuestion: true,
  metadata: true,
});

export const updateUserSchema = createCoercedInsertSchema(users)
  .pick({
    name: true,
    gender: true,
    birthDate: true,
    birthTime: true,
    birthPlace: true,
    initialQuestion: true,
    metadata: true,
    isActive: true,
  })
  .partial();

// Conversation schemas
export const insertConversationSchema = createCoercedInsertSchema(conversations).pick({
  userId: true,
  role: true,
  content: true,
  isRelatedToFortune: true,
});

// ActivationList schemas
export const insertActivationListSchema = createCoercedInsertSchema(activationList).pick({
  phoneNumber: true,
  activatedBy: true,
  notes: true,
  isActive: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type ActivationList = typeof activationList.$inferSelect;
export type InsertActivationList = z.infer<typeof insertActivationListSchema>;
