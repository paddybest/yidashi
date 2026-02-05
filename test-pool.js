const { db } = require('./src/storage/database/db.js');

async function testConnectionPool() {
  try {
    console.log('🧪 开始测试连接池...\n');

    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await db.healthCheck();
    console.log('健康状态:', health);

    // 2. 测试查询功能
    console.log('\n2. 测试查询功能...');
    const result = await db.query('SELECT $1 as test', ['Hello Connection Pool!']);
    console.log('查询结果:', result.rows[0]);

    // 3. 测试并发查询
    console.log('\n3. 测试并发查询...');
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        db.query('SELECT $1 as message, $2 as id', [`Test Message ${i + 1}`, i])
      );
    }

    const concurrentResults = await Promise.all(promises);
    console.log('并发查询结果数量:', concurrentResults.length);
    concurrentResults.forEach((result, index) => {
      console.log(`  查询 ${index + 1}:`, result.rows[0]);
    });

    // 4. 测试多次查询
    console.log('\n4. 测试多次查询...');
    for (let i = 1; i <= 5; i++) {
      const result = await db.query('SELECT $1 as count', [i]);
      console.log(`  第 ${i} 次查询:`, result.rows[0]);
    }

    console.log('\n🎉 连接池测试完成！');
    console.log('✅ 所有功能正常工作');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testConnectionPool();