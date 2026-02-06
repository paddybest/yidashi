import { NextResponse } from 'next/server';
import { db } from '@/storage/database/index';

export async function GET() {
  try {
    // 1. 获取当前数据库和 schema
    const currentContext = await db.query(`
      SELECT
        current_database() as database,
        current_schema() as schema,
        current_user as user,
        version() as version
    `);

    // 2. 获取 search_path
    const searchPathResult = await db.query('SHOW search_path');

    // 3. 查询所有 schema 中的 users 表
    const usersTables = await db.query(`
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_name = 'users'
      ORDER BY table_schema
    `);

    // 4. 查询当前可见的所有表（在 search_path 中的表）
    const visibleTables = await db.query(`
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // 5. 尝试直接查询 users 表（这会触发错误如果表不存在）
    let usersTableTest: any = null;
    let usersTableError: string | null = null;
    try {
      usersTableTest = await db.query(`
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
    } catch (error: any) {
      usersTableError = error.message;
    }

    // 6. 检查 DATABASE_URL 环境变量（不暴露完整密码）
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const sanitizedDbUrl = dbUrl.replace(/:[^:@]*@/, ':****@');

    return NextResponse.json({
      success: true,
      data: {
        connection: {
          database: currentContext.rows[0].database,
          schema: currentContext.rows[0].schema,
          user: currentContext.rows[0].user,
          version: currentContext.rows[0].version,
          searchPath: searchPathResult.rows[0].search_path,
          databaseUrl: sanitizedDbUrl,
        },
        usersTable: {
          found: usersTables.rows.length > 0,
          locations: usersTables.rows,
        },
        visibleTables: {
          count: visibleTables.rows.length,
          tables: visibleTables.rows.map(t => `${t.table_schema}.${t.table_name}`),
        },
        usersTableTest: usersTableError
          ? { error: usersTableError }
          : { columns: usersTableTest?.rows || [] },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('调试接口错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}