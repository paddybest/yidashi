import { Pool } from 'pg';

// 创建数据库连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // 兼容阿里云代理的加密连接
  },
  // Serverless 环境优化配置
  max: 1, // 限制最大连接数，防止连接数爆炸
  idleTimeoutMillis: 10000, // 连接在池中最大闲置时间（10秒）
  connectionTimeoutMillis: 5000, // 连接超时时间（5秒）
});

// 查询函数 - 通过连接池执行查询
export async function query(text: string, params?: any[]) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  } finally {
    if (client) {
      client.release(); // 释放连接回连接池
    }
  }
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