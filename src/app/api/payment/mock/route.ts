import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

/**
 * 模拟支付接口（仅用于开发环境）
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const method = url.searchParams.get('method');

    if (!orderId || !method) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`[Mock Payment] 模拟支付: ${orderId}, method: ${method}`);

    // 模拟支付处理
    // 临时方案：假设 validity 和 maxConversations
    const validity = 7;
    const maxConversations = 100;

    // 这里需要从订单中提取 userId
    // 临时方案：我们需要创建订单表来存储订单信息
    // 当前我们直接使用一个临时的 userId 激活（需要优化）

    // 尝试通过订单号查找用户（临时方案）
    // 实际应该创建订单表
    console.warn('[Mock Payment] 临时方案：需要创建订单表来存储订单信息');

    // 返回模拟支付成功页面
    const html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>模拟支付成功</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 400px;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin: 0 0 10px 0;
          }
          p {
            color: #666;
            margin: 0 0 30px 0;
          }
          .order-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: left;
          }
          .order-info div {
            margin: 8px 0;
            color: #555;
          }
          .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>支付成功</h1>
          <p>模拟支付已成功</p>
          <div class="order-info">
            <div><strong>订单号：</strong>${orderId}</div>
            <div><strong>支付方式：</strong>${method === 'alipay' ? '支付宝' : '微信支付'}</div>
            <div><strong>支付时间：</strong>${new Date().toLocaleString('zh-CN')}</div>
          </div>
          <a href="/" class="btn">返回首页</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('[Mock Payment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
