import { Pool } from 'pg';

// 创建数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // 禁用SSL连接，因为阿里云代理不支持
  // Serverless 环境优化配置 - 针对Vercel优化
  max: 5, // 增加连接数
  min: 1, // 保持一个最小连接
  idleTimeoutMillis: 60000, // 闲置时间60秒
  connectionTimeoutMillis: 30000, // 连接超时30秒
});

// 查询函数 - 通过连接池执行查询，带重试机制
export async function query(text: string, params?: any[], maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(text, params);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`数据库查询错误 (尝试 ${attempt}/${maxRetries}):`, error.message);

      // 如果是连接问题，等待一段时间再重试
      if (attempt < maxRetries && (
        error.message.includes('Connection terminated') ||
        error.message.includes('connection timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')
      )) {
        console.log(`等待 ${attempt * 2} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }

      // 其他错误直接抛出
      throw error;
    } finally {
      if (client) {
        client.release(); // 释放连接回连接池
      }
    }
  }

  // 所有重试都失败了，抛出最后的错误
  throw lastError;
}

// 低级查询函数 - 直接使用连接池，不经过重试机制
async function directQuery(text: string, params?: any[]) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error: any) {
    console.error('低级查询错误:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// 获取连接池（用于特殊场景）
export function getPool() {
  return pool;
}

// 健康检查函数 - 直接使用连接池而不是query函数
export async function healthCheck() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error('数据库健康检查失败:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// 导出数据库配置
export const db = {
  query,
  getPool,
  healthCheck,
};

// 连接池预热函数
async function warmUpPool() {
  try {
    console.log('🔄 正在预热数据库连接池...');
    await directQuery('SELECT 1');
    console.log('✅ 数据库连接池预热完成');
  } catch (error) {
    console.error('❌ 数据库连接池预热失败:', error);
  }
}

// 监控连接池状态
pool.on('connect', () => {
  console.log('✅ 新的数据库连接已建立');
});

pool.on('acquire', () => {
  // 静默模式，避免日志过多
});

pool.on('release', () => {
  // 静默模式，避免日志过多
});

pool.on('error', (err) => {
  console.error('连接池发生错误:', err);
});

// 启动时预热连接池
warmUpPool().catch(console.error);

// 应用关闭时清理连接池
process.on('SIGINT', () => {
  console.log('🔄 正在关闭数据库连接池...');
  pool.end().then(() => {
    console.log('✅ 数据库连接池已关闭');
    process.exit(0);
  }).catch((err) => {
    console.error('关闭连接池时发生错误:', err);
    process.exit(1);
  });
});