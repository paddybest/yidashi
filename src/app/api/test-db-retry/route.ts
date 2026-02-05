import { NextResponse } from 'next/server';
import { db, getPool } from '@/storage/database/index';

export async function GET() {
  try {
    console.log('🧪 开始测试数据库连接...');

    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await db.healthCheck();
    console.log('健康检查结果:', health);

    if (health.status !== 'healthy') {
      return NextResponse.json({
        success: false,
        error: '数据库连接不健康',
        details: health,
      }, { status: 500 });
    }

    // 2. 测试基本查询
    console.log('2. 测试基本查询...');
    const basicResult = await db.query('SELECT $1 as test', ['Basic Query Test']);
    console.log('基本查询结果:', basicResult.rows[0]);

    // 3. 测试多次查询
    console.log('3. 测试多次查询...');
    for (let i = 1; i <= 3; i++) {
      const result = await db.query('SELECT $1 as count, $2 as timestamp', [i, new Date().toISOString()]);
      console.log(`第 ${i} 次查询:`, result.rows[0]);
    }

    // 4. 测试连接池状态
    console.log('4. 检查连接池状态...');
    const pool = getPool();
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingClients = pool.waitingCount;

    console.log(`连接池状态 - 总连接: ${totalConnections}, 空闲: ${idleConnections}, 等待: ${waitingClients}`);

    return NextResponse.json({
      success: true,
      message: '数据库连接测试成功',
      health,
      poolStats: {
        totalConnections,
        idleConnections,
        waitingClients,
      },
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