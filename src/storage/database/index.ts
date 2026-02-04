import { eq, desc, and, SQL, gt, sql } from "drizzle-orm";
import { db } from "@/storage/database/db";
import {
  users,
  conversations,
  activationList,
  insertUserSchema,
  updateUserSchema,
  insertConversationSchema,
} from "./shared/schema";
import type {
  User,
  InsertUser,
  UpdateUser,
  Conversation,
  InsertConversation,
  ActivationList,
} from "./shared/schema";

export class UserManager {
  /**
   * 创建用户
   */
  async createUser(data: InsertUser): Promise<User> {
    const validated = insertUserSchema.parse(data);
    const result = await db.query(
      `INSERT INTO users (phone_number, name, gender, birth_date, birth_time, birth_place, initial_question, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        validated.phoneNumber,
        validated.name,
        validated.gender,
        validated.birthDate,
        validated.birthTime,
        validated.birthPlace,
        validated.initialQuestion,
        validated.metadata,
      ]
    );
    return result.rows[0];
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

    let query = 'SELECT * FROM users';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.id) {
      conditions.push(`id = $${paramIndex++}`);
      params.push(filters.id);
    }
    if (filters.name) {
      conditions.push(`name = $${paramIndex++}`);
      params.push(filters.name);
    }
    if (filters.gender) {
      conditions.push(`gender = $${paramIndex++}`);
      params.push(filters.gender);
    }
    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(filters.isActive);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, skip);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: UpdateUser): Promise<User | null> {
    const validated = updateUserSchema.parse(data);
    const result = await db.query(
      `UPDATE users
       SET name = $1, gender = $2, birth_date = $3, birth_time = $4, birth_place = $5,
           initial_question = $6, metadata = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        validated.name,
        validated.gender,
        validated.birthDate,
        validated.birthTime,
        validated.birthPlace,
        validated.initialQuestion,
        validated.metadata,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据手机号获取用户
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
    return result.rows[0] || null;
  }

  /**
   * 保存验证码
   */
  async saveVerificationCode(phoneNumber: string, code: string, expiresIn: number = 300): Promise<boolean> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const result = await db.query(
      `UPDATE users
       SET verification_code = $1, verification_code_expires_at = $2, updated_at = NOW()
       WHERE phone_number = $3`,
      [code, expiresAt, phoneNumber]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 验证验证码
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const result = await db.query(
      'SELECT * FROM users WHERE phone_number = $1 AND verification_code = $2 AND verification_code_expires_at > NOW()',
      [phoneNumber, code]
    );
    return result.rows.length > 0;
  }

  /**
   * 减少用户对话次数
   */
  async decrementUserConversations(userId: string): Promise<number> {
    const result = await db.query(
      'UPDATE users SET used_conversations = used_conversations + 1, updated_at = NOW() WHERE id = $1 RETURNING used_conversations',
      [userId]
    );
    return result.rows[0].used_conversations;
  }

  /**
   * 检查用户是否还有剩余对话次数
   */
  async hasRemainingConversations(userId: string): Promise<boolean> {
    const result = await db.query(
      'SELECT used_conversations, max_conversations FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    return user && user.max_conversations > user.used_conversations;
  }

  /**
   * 获取用户的对话记录
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const result = await db.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }
}

/**
 * 对话管理器
 */
export class ConversationManager {
  /**
   * 创建对话记录
   */
  async createConversation(data: InsertConversation): Promise<Conversation> {
    const validated = insertConversationSchema.parse(data);
    const result = await db.query(
      `INSERT INTO conversations (user_id, role, content, is_related_to_fortune, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [
        validated.userId,
        validated.role,
        validated.content,
        validated.isRelatedToFortune,
      ]
    );
    return result.rows[0];
  }

  /**
   * 获取用户的对话历史
   */
  async getUserConversations(userId: string, limit = 50): Promise<Conversation[]> {
    const result = await db.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await db.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
  }
}

/**
 * 激活名单管理器
 */
export class ActivationListManager {
  /**
   * 激活用户
   */
  async activateUser(phoneNumber: string, activatedBy: string, notes?: string): Promise<ActivationList> {
    const result = await db.query(
      `INSERT INTO activation_list (phone_number, activated_by, notes, is_active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING *`,
      [phoneNumber, activatedBy, notes]
    );
    return result.rows[0];
  }

  /**
   * 检查用户是否已激活
   */
  async isUserActivated(phoneNumber: string): Promise<boolean> {
    const result = await db.query(
      'SELECT * FROM activation_list WHERE phone_number = $1 AND is_active = true',
      [phoneNumber]
    );
    return result.rows.length > 0;
  }

  /**
   * 获取激活列表
   */
  async getActivationList(filters?: {
    skip?: number;
    limit?: number;
  }): Promise<ActivationList[]> {
    const { skip = 0, limit = 100 } = filters || {};
    const result = await db.query(
      'SELECT * FROM activation_list WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, skip]
    );
    return result.rows;
  }
}

// 导出单例实例
export const userManager = new UserManager();
export const conversationManager = new ConversationManager();
export const activationListManager = new ActivationListManager();