const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'tianjige_password',
    database: 'postgres', // 连接到默认数据库
  });

  try {
    await client.connect();
    console.log('✅ 连接到 PostgreSQL 成功');

    // 创建数据库
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = \'tianjige\'');

    if (result.rowCount === 0) {
      await client.query('CREATE DATABASE "tianjige";');
      console.log('✅ 数据库 tianjige 创建成功');
    } else {
      console.log('✅ 数据库 tianjige 已存在');
    }
  } catch (error) {
    console.error('❌ 创建数据库失败:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createDatabase().then(() => {
  console.log('🎉 数据库创建完成');
  process.exit(0);
}).catch((error) => {
  console.error('💥 创建数据库失败:', error);
  process.exit(1);
});