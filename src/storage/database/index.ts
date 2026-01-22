import { eq, desc, and, SQL } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import {
  users,
  conversations,
  activationList,
  insertUserSchema,
  updateUserSchema,
  insertConversationSchema,
  insertActivationListSchema,
} from "./shared/schema";
import type {
  User,
  InsertUser,
  UpdateUser,
  Conversation,
  InsertConversation,
  ActivationList,
  InsertActivationList,
} from "./shared/schema";

export class UserManager {
  /**
   * 创建用户
   */
  async createUser(data: InsertUser): Promise<User> {
    const db = await getDb();
    const validated = insertUserSchema.parse(data);
    const [user] = await db.insert(users).values(validated).returning();
    return user;
  }

  /**
   * 获取用户列表
   */
  async getUsers(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<User, "id" | "name" | "gender" | "isActive">>;
  } = {}): Promise<User[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (filters.id !== undefined) {
      conditions.push(eq(users.id, filters.id));
    }
    if (filters.name !== undefined) {
      conditions.push(eq(users.name, filters.name));
    }
    if (filters.gender !== undefined) {
      conditions.push(eq(users.gender, filters.gender));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(users)
        .where(and(...conditions))
        .limit(limit)
        .offset(skip)
        .orderBy(desc(users.createdAt));
    }

    return db
      .select()
      .from(users)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(users.createdAt));
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: UpdateUser): Promise<User | null> {
    const db = await getDb();
    const validated = updateUserSchema.parse(data);
    const [user] = await db
      .update(users)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  /**
   * 根据手机号获取用户
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || null;
  }

  /**
   * 保存验证码
   */
  async saveVerificationCode(phoneNumber: string, code: string, expiresIn: number = 300): Promise<boolean> {
    const db = await getDb();
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const result = await db
      .update(users)
      .set({
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.phoneNumber, phoneNumber));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 验证验证码
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber));

    if (!user || !user.verificationCode || !user.verificationCodeExpiresAt) {
      return false;
    }

    // 检查验证码是否过期
    if (new Date() > user.verificationCodeExpiresAt) {
      return false;
    }

    // 检查验证码是否正确
    return user.verificationCode === code;
  }

  /**
   * 清除验证码（登录成功后调用）
   */
  async clearVerificationCode(userId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .update(users)
      .set({
        verificationCode: null,
        verificationCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 激活用户
   */
  async activateUser(userId: string, validDays: number = 7, maxConversations: number = 50): Promise<User | null> {
    const db = await getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

    const [user] = await db
      .update(users)
      .set({
        activatedAt: now,
        expiresAt: expiresAt,
        maxConversations: maxConversations,
        usedConversations: 0,
        isActive: true,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    return user || null;
  }

  /**
   * 检查用户是否过期
   */
  isUserExpired(user: User): boolean {
    if (!user.expiresAt) return false;
    return new Date() > user.expiresAt;
  }

  /**
   * 检查对话次数是否超限
   */
  isConversationLimitExceeded(user: User): boolean {
    if (!user.maxConversations) return false;
    return (user.usedConversations || 0) >= user.maxConversations;
  }

  /**
   * 增加对话次数
   */
  async incrementConversationCount(userId: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return null;

    const newCount = (user.usedConversations || 0) + 1;
    const [updatedUser] = await db
      .update(users)
      .set({
        usedConversations: newCount,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || null;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export class ConversationManager {
  /**
   * 创建对话记录
   */
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const db = await getDb();
    const validated = insertConversationSchema.parse(data);
    const [conversation] = await db.insert(conversations).values(validated).returning();
    return conversation;
  }

  /**
   * 获取用户的对话历史
   */
  async getConversationsByUserId(
    userId: string,
    options: {
      skip?: number;
      limit?: number;
      role?: "user" | "assistant";
    } = {}
  ): Promise<Conversation[]> {
    const { skip = 0, limit = 50, role } = options;
    const db = await getDb();

    const conditions: SQL[] = [eq(conversations.userId, userId)];
    if (role !== undefined) {
      conditions.push(eq(conversations.role, role));
    }

    return db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .limit(limit)
      .offset(skip)
      .orderBy(conversations.createdAt);
  }

  /**
   * 获取最近的对话历史（用于上下文）
   */
  async getRecentConversations(
    userId: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    const db = await getDb();
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .limit(limit)
      .orderBy(desc(conversations.createdAt));
  }

  /**
   * 获取用户的所有对话（按角色分组，用于构建上下文）
   */
  async getConversationHistoryForContext(
    userId: string,
    limit: number = 10
  ): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
    const conversations = await this.getRecentConversations(userId, limit);
    return conversations.map((conv) => ({
      role: conv.role as "user" | "assistant",
      content: conv.content,
    }));
  }

  /**
   * 根据ID获取对话
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    const db = await getDb();
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || null;
  }

  /**
   * 删除对话
   */
  async deleteConversation(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 删除用户的所有对话
   */
  async deleteConversationsByUserId(userId: string): Promise<number> {
    const db = await getDb();
    const result = await db
      .delete(conversations)
      .where(eq(conversations.userId, userId));
    return result.rowCount ?? 0;
  }
}

export class ActivationListManager {
  /**
   * 添加手机号到激活名单
   */
  async addActivation(data: InsertActivationList): Promise<ActivationList> {
    const db = await getDb();
    const validated = insertActivationListSchema.parse(data);
    const [activation] = await db.insert(activationList).values(validated).returning();
    return activation;
  }

  /**
   * 检查手机号是否在激活名单中
   */
  async isPhoneNumberActivated(phoneNumber: string): Promise<boolean> {
    const db = await getDb();
    const [activation] = await db
      .select()
      .from(activationList)
      .where(and(eq(activationList.phoneNumber, phoneNumber), eq(activationList.isActive, true)));
    return !!activation;
  }

  /**
   * 获取激活名单
   */
  async getActivationList(options: {
    skip?: number;
    limit?: number;
    filters?: Partial<Pick<ActivationList, "id" | "phoneNumber" | "activatedBy" | "isActive">>;
  } = {}): Promise<ActivationList[]> {
    const { skip = 0, limit = 100, filters = {} } = options;
    const db = await getDb();

    const conditions: SQL[] = [];
    if (filters.id !== undefined) {
      conditions.push(eq(activationList.id, filters.id));
    }
    if (filters.phoneNumber !== undefined) {
      conditions.push(eq(activationList.phoneNumber, filters.phoneNumber));
    }
    if (filters.activatedBy !== undefined && filters.activatedBy !== null) {
      conditions.push(eq(activationList.activatedBy, filters.activatedBy));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(activationList.isActive, filters.isActive));
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(activationList)
        .where(and(...conditions))
        .limit(limit)
        .offset(skip)
        .orderBy(desc(activationList.createdAt));
    }

    return db
      .select()
      .from(activationList)
      .limit(limit)
      .offset(skip)
      .orderBy(desc(activationList.createdAt));
  }

  /**
   * 根据手机号删除激活名单
   */
  async removeActivation(phoneNumber: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(activationList).where(eq(activationList.phoneNumber, phoneNumber));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 更新激活状态
   */
  async updateActivationStatus(phoneNumber: string, isActive: boolean): Promise<ActivationList | null> {
    const db = await getDb();
    const [activation] = await db
      .update(activationList)
      .set({ isActive })
      .where(eq(activationList.phoneNumber, phoneNumber))
      .returning();
    return activation || null;
  }
}

// 导出单例实例
export const userManager = new UserManager();
export const conversationManager = new ConversationManager();
export const activationListManager = new ActivationListManager();
