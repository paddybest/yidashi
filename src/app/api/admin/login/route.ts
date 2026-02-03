import { NextRequest, NextResponse } from 'next/server';

/**
 * 管理员登录接口
 * 
 * 注意：当前使用简单的密码验证，生产环境应该使用更安全的方式，如：
 * 1. 管理员账号表（存储在数据库中）
 * 2. JWT Token
 * 3. OAuth 集成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // 从环境变量中获取管理员密码
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('[Admin Login] ADMIN_PASSWORD environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // 验证密码
    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // 登录成功，生成管理员 token（简单实现，使用时间戳）
    const adminToken = Buffer.from(`admin:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful',
    });

    // 设置管理员 cookie
    response.cookies.set('admin_token', adminToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24小时
    });

    return response;
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
