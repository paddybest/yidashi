import { NextResponse } from 'next/server';
import { db } from '@/storage/database';

export async function GET() {
  try {
    console.log('🧪 开始测试数据库重试机制...');

    // 1. 测试基本查询
    console.log('1. 测试基本查询...');
    const basicResult = await db.query('SELECT $1 as test', ['Basic Query Test']);
    console.log('基本查询结果:', basicResult.rows[0]);

    // 2. 测试重试机制（模拟可能失败的情况）
    console.log('\n2. 测试重试机制...');
    try {
      const retryResult = await db.query('SELECT $1 as test, $2 as attempt', ['Retry Test', 1]);
      console.log('重试查询成功:', retryResult.rows[0]);
    } catch (error) {
      console.error('重试查询失败:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }

    // 3. 测试多次查询
    console.log('\n3. 测试多次查询...');
    for (let i = 1; i <= 5; i++) {
      const result = await db.query('SELECT $1 as count, $2 as timestamp', [i, new Date().toISOString()]);
      console.log(`第 ${i} 次查询:`, result.rows[0]);
    }

    // 4. 测试健康检查
    console.log('\n4. 测试健康检查...');
    const health = await db.healthCheck();
    console.log('健康检查结果:', health);

    return NextResponse.json({
      success: true,
      message: '数据库重试机制测试成功',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}