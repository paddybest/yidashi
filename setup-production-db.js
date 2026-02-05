const { Pool } = require('pg');

// 生产环境数据库连接
const pool = new Pool({
  connectionString: 'postgresql://Yidashi:Zxcvb135@yidashi-proxy.rwlb.rds.aliyuncs.com:5432/yidashi_sql',
  ssl: false,
});

async function setupProductionDatabase() {
  try {
    console.log('🗃️  开始设置生产数据库...');

    // 检查连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 创建表结构
    const createTablesSQL = `
      -- 创建 users 表
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number VARCHAR(20) UNIQUE,
          verification_code VARCHAR(6),
          verification_code_expires_at TIMESTAMPTZ,
          name VARCHAR(128) NOT NULL DEFAULT '',
          gender VARCHAR(10) NOT NULL DEFAULT '',
          birth_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          birth_time VARCHAR(10) NOT NULL DEFAULT '',
          birth_place VARCHAR(255) NOT NULL DEFAULT '',
          initial_question TEXT NOT NULL DEFAULT '',
          metadata JSONB,
          is_active BOOLEAN DEFAULT true NOT NULL,
          activated_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ,
          max_conversations INTEGER DEFAULT 50 NOT NULL,
          used_conversations INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ
      );

      -- 创建 conversations 表
      CREATE TABLE IF NOT EXISTS conversations (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(10) NOT NULL,
          content TEXT NOT NULL,
          is_related_to_fortune BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      -- 创建 activation_list 表
      CREATE TABLE IF NOT EXISTS activation_list (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number VARCHAR(20) UNIQUE NOT NULL,
          activated_by VARCHAR(128),
          notes TEXT,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users(phone_number);
      CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
      CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);
      CREATE INDEX IF NOT EXISTS activation_list_phone_number_idx ON activation_list(phone_number);
      CREATE INDEX IF NOT EXISTS activation_list_created_at_idx ON activation_list(created_at);
    `;

    await client.query(createTablesSQL);
    console.log('✅ 表结构创建成功');

    // 检查是否已有数据
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 当前用户数量: ${userCount.rows[0].count}`);

    client.release();
    await pool.end();

    console.log('🎉 生产数据库设置完成！');

  } catch (error) {
    console.error('❌ 设置失败:', error.message);
    if (error.code === '23505') {
      console.log('ℹ️  表已存在，跳过创建');
    } else {
      console.error('错误详情:', error);
    }
    await pool.end();
  }
}

setupProductionDatabase();