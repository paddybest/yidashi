import { Client } from 'pg';

// 创建数据库客户端
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // 禁用SSL连接
});

// 连接数据库
export async function connect() {
  await client.connect();
  console.log('✅ 数据库连接成功');
}

// 查询函数
export async function query(text: string, params?: any[]) {
  const result = await client.query(text, params);
  return result;
}

// 获取客户端
export function getClient() {
  return client;
}

// 导出数据库配置
export const db = {
  connect,
  query,
  getClient,
};

// 自动连接
connect().catch(console.error);