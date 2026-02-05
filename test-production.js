const { Pool } = require('pg');

// 生产环境测试连接
const pool = new Pool({
  connectionString: 'postgresql://Yidashi:Zxcvb135@yidashi-proxy.rwlb.rds.aliyuncs.com:5432/yidashi_sql',
  ssl: false,
});

async function testProduction() {
  try {
    console.log('🧪 开始测试生产环境...\n');

    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ 数据库连接成功');
    console.log('   服务器时间:', result.rows[0].time);

    // 2. 检查表结构
    console.log('\n2. 检查表结构...');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 已存在的表:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ❌ 没有找到任何表');
    }

    // 3. 测试用户表
    console.log('\n3. 测试用户表...');
    const userTable = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('👥 users 表结构:');
    userTable.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // 4. 测试插入用户
    console.log('\n4. 测试插入用户...');
    const testUser = await client.query(`
      INSERT INTO users (phone_number, name, gender, birth_date, birth_time, birth_place, initial_question, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (phone_number) DO NOTHING
      RETURNING phone_number, created_at
    `, ['13800138000', '测试用户', 'male', new Date(), 'zi', '北京', '测试问题']);

    if (testUser.rows.length > 0) {
      console.log('✅ 用户插入成功:', testUser.rows[0]);
    } else {
      console.log('ℹ️  用户已存在');
    }

    // 5. 检查用户数量
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 当前用户总数: ${userCount.rows[0].count}`);

    client.release();
    await pool.end();

    console.log('\n🎉 生产环境测试完成！');
    console.log('\n📝 下一步：');
    console.log('1. 在 Vercel 中配置环境变量');
    console.log('2. 重新部署项目');
    console.log('3. 测试短信发送功能');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔍 连接失败可能的原因：');
      console.error('- 数据库代理服务未启动');
      console.error('- 代理地址不正确');
      console.error('- 防火墙阻止连接');
    } else if (error.code === '3D000') {
      console.error('\n🔍 数据库不存在：');
      console.error('- 请先创建数据库 yidashi_sql');
      console.error('- 或检查数据库名称是否正确');
    }

    await pool.end();
  }
}

testProduction();