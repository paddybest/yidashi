import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 中间件：路由保护
 *
 * 保护以下路由：
 * - /admin/dashboard: 需要管理员身份验证
 * - /chat: 需要登录
 * - /purchase: 需要登录
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是管理后台（排除登录页面）
  if (pathname.startsWith('/admin/dashboard')) {
    // 从 cookie 中获取管理员 token
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      // 没有管理员 token，跳转到管理登录页面
      const loginUrl = new URL('/admin', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: 验证 admin token 是否有效
    // 可以添加数据库验证或 JWT 验证
    // 当前简化处理，仅检查是否存在
  }

  // 检查是否是受保护的路由（需要登录）
  if (pathname.startsWith('/chat') || pathname.startsWith('/purchase')) {
    // 从 cookie 中获取用户 ID
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      // 没有用户 ID，跳转到登录页面
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * 配置中间件匹配的路径
 */
export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/chat/:path*',
    '/purchase/:path*',
  ],
};
