import { NextResponse } from 'next/server';
import { db } from '@/storage/database';

export async function GET() {
  try {
    console.log('🧪 开始测试连接池...');

    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await db.healthCheck();

    // 2. 测试查询功能
    console.log('2. 测试查询功能...');
    const result = await db.query('SELECT $1 as test', ['Hello Connection Pool!']);

    // 3. 测试多次查询
    console.log('3. 测试多次查询...');
    const testResults = [];
    for (let i = 1; i <= 3; i++) {
      const queryResult = await db.query('SELECT $1 as message, $2 as id', [`Test Message ${i}`, i]);
      testResults.push(queryResult.rows[0]);
    }

    // 返回测试结果
    return NextResponse.json({
      success: true,
      message: '连接池测试成功',
      health,
      queryResult: result.rows[0],
      testResults,
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