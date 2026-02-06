import { db } from './src/storage/database/index';

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库表结构...');

    // 检查 users 表是否存在
    const checkUsers = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `);

    console.log('users 表存在:', checkUsers.rows[0].exists);

    // 检查表结构
    if (checkUsers.rows[0].exists) {
      const columns = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        ORDER BY ordinal_position
      `);

      console.log('\n📋 users 表结构:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkDatabase().catch(console.error);