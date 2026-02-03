import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database';
import { alipayPayment } from '@/lib/payment/alipay';
import { wechatPayment } from '@/lib/payment/wechat';

/**
 * 支付回调通知接口
 * 支持支付宝和微信支付的回调
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

    let outTradeNo = '';
    let transactionId = '';
    let status = '';

    if (paymentMethod === 'alipay') {
      // 支付宝回调
      const signVerified = alipayPayment.verifyNotify(body);

      if (!signVerified) {
        console.error('[Payment Callback] 支付宝签名验证失败');
        return NextResponse.json({ success: false, message: '签名验证失败' });
      }

      outTradeNo = body.out_trade_no;
      transactionId = body.trade_no;

      // 检查交易状态
      if (body.trade_status === 'TRADE_SUCCESS' || body.trade_status === 'TRADE_FINISHED') {
        status = 'success';
      } else {
        status = body.trade_status;
      }
    } else if (paymentMethod === 'wechat') {
      // 微信支付回调
      const headers = Object.fromEntries(request.headers.entries());
      const signVerified = wechatPayment.verifyNotify(headers, JSON.stringify(body));

      if (!signVerified) {
        console.error('[Payment Callback] 微信支付签名验证失败');
        return NextResponse.json({ success: false, message: '签名验证失败' });
      }

      // 解密数据
      const decrypted = wechatPayment.decryptNotifyData(
        body.resource.associated_data,
        body.resource.nonce,
        body.resource.ciphertext
      );

      console.log('[Payment Callback] 微信支付解密数据:', decrypted);

      outTradeNo = decrypted.out_trade_no;
      transactionId = decrypted.transaction_id;

      if (decrypted.trade_state === 'SUCCESS') {
        status = 'success';
      } else {
        status = decrypted.trade_state;
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    console.log(`[Payment Callback] Order: ${outTradeNo}, Status: ${status}`);

    if (status !== 'success') {
      console.warn('[Payment Callback] 交易未成功:', status);
      return NextResponse.json({ success: false, message: '交易未成功' });
    }

    // 激活用户
    // 注意：这里简化处理，实际应该从订单表中获取订单信息
    // 订单号格式：TJG{timestamp}{random}，需要从其他地方获取 userId、validity、maxConversations
    // 这里我们暂时使用模拟逻辑

    // 解析订单号获取用户信息（实际应该从数据库查询订单）
    // 临时方案：使用固定值（需要优化）
    const validity = 7; // 默认 7 天
    const maxConversations = 100; // 默认 100 次

    // 激活用户
    const user = await userManager.activateUser(outTradeNo, validity, maxConversations);

    if (user) {
      console.log('[Payment Callback] 用户激活成功:', user.id);
    } else {
      console.error('[Payment Callback] 用户激活失败，订单号:', outTradeNo);

      // 尝试从订单号中提取用户信息（临时方案）
      // 实际应该创建订单表来存储订单信息
    }

    // 返回成功响应
    if (paymentMethod === 'alipay') {
      return NextResponse.json({ success: true, message: 'success' });
    } else {
      // 微信支付需要返回特定格式
      return NextResponse.json({ code: 'SUCCESS', message: '成功' });
    }
  } catch (error) {
    console.error('[Payment Callback] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
