import { NextRequest, NextResponse } from 'next/server';
import { alipayPayment } from '@/lib/payment/alipay';
import { db } from '@/storage/database/db';

/**
 * 支付回调通知接口
 */
export async function POST(request: NextRequest) {
  try {
    // 获取支付方式（alipay 或 wechat）
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const paymentMethod = pathParts[pathParts.length - 1];

    console.log(`[Payment Callback] Payment method: ${paymentMethod}`);

    if (paymentMethod === 'alipay') {
      return await handleAlipayCallback(request);
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

/**
 * 处理支付宝回调
 */
async function handleAlipayCallback(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.formData();

    // 将 FormData 转换为普通对象
    const params: any = {};
    for (const [key, value] of body.entries()) {
      params[key] = value.toString();
    }

    console.log('[Alipay Callback] 收到回调:', JSON.stringify(params, null, 2));

    // 验证签名
    const signVerified = alipayPayment.verifyNotify(params);

    if (!signVerified) {
      console.error('[Alipay Callback] 签名验证失败');
      return NextResponse.json({ success: false, message: '签名验证失败' });
    }

    // 检查交易状态
    const tradeStatus = params.trade_status;
    const outTradeNo = params.out_trade_no;
    const totalAmount = params.total_amount;
    const gmtPayment = params.gmt_payment;

    console.log(`[Alipay Callback] 订单状态: ${tradeStatus}, 订单号: ${outTradeNo}`);

    // 只有交易成功才处理
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      // 查找用户信息（订单号格式为 TJG{timestamp}{random}）
      const orderId = outTradeNo;

      // 这里需要根据你的实际数据存储方式来查找订单
      // 假设订单号存储在某个地方，或者有订单记录表
      // 暂时简化处理，从订单号提取用户信息

      // 获取订单数据（这里需要根据你的实际业务逻辑）
      // 由于没有订单表，我们假设订单信息存储在某个地方
      // 暂时使用模拟方式，实际应该查询订单表

      // 更新用户状态（激活账户）
      const userId = await getUserIdFromOrderId(orderId);
      if (!userId) {
        console.error(`[Alipay Callback] 找不到用户: ${orderId}`);
        return NextResponse.json({ success: false, message: '订单不存在' });
      }

      // 激活用户并设置服务期限
      const planId = getPlanIdFromOrderId(orderId);
      const plan = {
        'weekly': { validity: 7, conversations: 100 },
        'yearly': { validity: 365, conversations: 1000 }
      }[planId];

      if (plan) {
        // 计算到期时间
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.validity);

        // 更新用户状态（直接使用 SQL 避免类型限制）
        await db.query(
          `UPDATE users
           SET is_active = true,
               max_conversations = $1,
               expires_at = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [plan.conversations, expiresAt, userId]
        );

        console.log(`[Alipay Callback] 用户 ${userId} 激活成功，有效期至 ${expiresAt.toISOString()}`);
      }

      // 返回成功响应给支付宝
      return NextResponse.json({ success: true });
    } else {
      console.log(`[Alipay Callback] 交易未完成，状态: ${tradeStatus}`);
      return NextResponse.json({ success: false, message: '交易未完成' });
    }
  } catch (error) {
    console.error('[Alipay Callback] 处理失败:', error);
    return NextResponse.json({ success: false, message: '处理失败' });
  }
}

/**
 * 从订单号提取用户ID（通过查询用户表的 current_order_id 字段）
 */
async function getUserIdFromOrderId(orderId: string): Promise<string | null> {
  try {
    const result = await db.query(
      'SELECT id FROM users WHERE current_order_id = $1',
      [orderId]
    );
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('[Alipay Callback] 查询用户ID失败:', error);
    return null;
  }
}

/**
 * 从订单号提取套餐ID（简化版）
 */
function getPlanIdFromOrderId(orderId: string): string {
  // 这里应该根据你的实际业务逻辑来处理
  // 例如，订单号可能包含套餐信息，或者需要查询订单表
  // 暂时返回默认值
  return 'weekly';
}
