import { NextRequest, NextResponse } from 'next/server';

/**
 * 支付回调通知接口
 * 暂时禁用微信支付回调，因为与 Turbopack 不兼容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');

    // 获取支付方式（alipay 或 wechat）
    const paymentMethod = pathParts[pathParts.length - 1];

    console.log(`[Payment Callback] Payment method: ${paymentMethod}`);
    console.log(`[Payment Callback] Request body:`, JSON.stringify(body, null, 2));

    if (paymentMethod === 'alipay') {
      // TODO: 实现支付宝回调
      return NextResponse.json({ success: false, message: '支付宝回调未实现' });
    } else if (paymentMethod === 'wechat') {
      // 暂时禁用微信支付回调
      console.warn('[Payment Callback] 微信支付回调暂时禁用');
      return NextResponse.json({ success: false, message: '微信支付回调暂时不可用' });
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Payment Callback] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
