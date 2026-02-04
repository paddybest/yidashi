const { Client } = require('pg');

async function createTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'tianjige_password',
    database: 'tianjige',
  });

  try {
    await client.connect();
    console.log('✅ 连接到数据库 tianjige 成功');

    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        verification_code VARCHAR(6),
        verification_code_expires_at TIMESTAMP WITH TIME ZONE,
        name VARCHAR(128) NOT NULL,
        gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', '')),
        birth_date TIMESTAMP WITH TIME ZONE NOT NULL,
        birth_time VARCHAR(10) NOT NULL,
        birth_place VARCHAR(255) NOT NULL,
        initial_question TEXT NOT NULL,
        metadata JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        activated_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        max_conversations INTEGER DEFAULT 50 NOT NULL,
        used_conversations INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ users 表创建成功');

    // 创建对话表
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        is_related_to_fortune BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ conversations 表创建成功');

    // 创建激活名单表
    await client.query(`
      CREATE TABLE IF NOT EXISTS activation_list (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        activated_by VARCHAR(128),
        notes TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ activation_list 表创建成功');

    // 创建索引
    await client.query('CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users(phone_number);');
    await client.query('CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS activation_list_phone_number_idx ON activation_list(phone_number);');
    await client.query('CREATE INDEX IF NOT EXISTS activation_list_created_at_idx ON activation_list(created_at);');

    console.log('✅ 索引创建成功');
    console.log('🎉 所有表创建完成！');

  } catch (error) {
    console.error('❌ 创建表失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createTables().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 创建表失败:', error);
  process.exit(1);
});