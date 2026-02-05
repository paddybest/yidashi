import { Pool } from 'pg';

// 创建数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // 兼容阿里云代理的加密连接
  },
  // Serverless 环境优化配置
  max: 2, // 增加连接数以支持重试
  min: 0,
  idleTimeoutMillis: 30000, // 增加闲置时间到30秒
  connectionTimeoutMillis: 10000, // 增加连接超时时间到10秒
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

// 获取连接池（用于特殊场景）
export function getPool() {
  return pool;
}

// 健康检查函数
export async function healthCheck() {
  try {
    await query('SELECT 1');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error('数据库健康检查失败:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// 导出数据库配置
export const db = {
  query,
  getPool,
  healthCheck,
};

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