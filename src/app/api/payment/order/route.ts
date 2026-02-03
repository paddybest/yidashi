import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database';
import { alipayPayment } from '@/lib/payment/alipay';
import { wechatPayment } from '@/lib/payment/wechat';
import type { UpdateUser } from '@/storage/database/shared/schema';

interface Plan {
  id: string;
  name: string;
  price: number;
  validity: number;
  conversations: number;
}

const plans: Plan[] = [
  {
    id: 'weekly',
    name: '体验套餐',
    price: 19.9,
    validity: 7,
    conversations: 100,
  },
  {
    id: 'yearly',
    name: '年度尊享',
    price: 69,
    validity: 365,
    conversations: 1000,
  },
];

/**
 * 创建支付订单接口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      gender,
      birthDate,
      birthTime,
      birthPlace,
      amount,
      planId,
      validity,
      maxConversations,
      paymentMethod, // 'alipay' | 'wechat'
    } = body;

    // 验证参数
    if (!userId || !amount || !planId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 验证支付方式
    if (paymentMethod !== 'alipay' && paymentMethod !== 'wechat') {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // 查找用户
    let user = await userManager.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查用户状态
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // 检查是否需要更新用户信息
    const isExpired = user.expiresAt ? userManager.isUserExpired(user) : false;

    if (!user.expiresAt || isExpired) {
      // 用户未激活或已过期，保存用户信息
      const updateData: UpdateUser = {
        name,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        birthTime,
        birthPlace,
      };

      await userManager.updateUser(user.id, updateData);
    }

    // 生成订单号
    const orderId = `TJG${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // 获取套餐信息
    const plan = plans.find((p) => p.id === planId);
    const planName = plan?.name || '天机阁服务';

    // 获取基础 URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
    const returnUrl = `${baseUrl}/purchase/success?orderId=${orderId}`;

    console.log(`[Payment] Creating order: ${orderId}, amount: ${amount}, method: ${paymentMethod}`);

    let paymentUrl = '';
    let orderData: any = {
      orderId,
      userId,
      amount,
      planId,
      validity,
      maxConversations,
      status: 'pending',
      paymentMethod,
      createdAt: new Date(),
    };

    // 根据支付方式创建订单
    if (paymentMethod === 'alipay') {
      try {
        // 支付宝支付
        const result = await alipayPayment.createMobilePayOrder({
          outTradeNo: orderId,
          totalAmount: amount.toString(),
          subject: planName,
          body: `${planName} - ${validity}天有效期`,
          returnUrl: returnUrl,
          notifyUrl: `${baseUrl}/api/payment/callback/alipay`,
        });

        paymentUrl = result.body || String(result);

        console.log('[Payment] 支付宝订单创建成功:', orderId);
      } catch (error) {
        console.error('[Payment] 支付宝订单创建失败:', error);

        // 如果支付宝配置不完整，使用模拟支付
        if (!process.env.ALIPAY_APP_ID || !process.env.ALIPAY_PRIVATE_KEY) {
          console.warn('[Payment] 支付宝配置不完整，使用模拟支付');

          // 模拟支付 URL（开发环境）
          paymentUrl = `${baseUrl}/api/payment/mock?orderId=${orderId}&method=alipay`;
        } else {
          throw error;
        }
      }
    } else if (paymentMethod === 'wechat') {
      try {
        // 微信支付 - H5 支付
        const result = await wechatPayment.createH5PayOrder({
          outTradeNo: orderId,
          totalFee: Math.round(amount * 100), // 转换为分
          description: planName,
          notifyUrl: `${baseUrl}/api/payment/callback/wechat`,
          sceneInfo: {
            payer_client_ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
            h5_info: {
              type: 'Wap',
              app_name: '天机阁',
              app_url: baseUrl,
            },
          },
        });

        paymentUrl = result.h5_url;

        console.log('[Payment] 微信支付订单创建成功:', orderId);
      } catch (error) {
        console.error('[Payment] 微信支付订单创建失败:', error);

        // 如果微信支付配置不完整，使用模拟支付
        if (!process.env.WECHAT_PAY_MCH_ID || !process.env.WECHAT_PAY_API_KEY) {
          console.warn('[Payment] 微信支付配置不完整，使用模拟支付');

          // 模拟支付 URL（开发环境）
          paymentUrl = `${baseUrl}/api/payment/mock?orderId=${orderId}&method=wechat`;
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: orderData,
      paymentUrl,
      message: '订单创建成功',
    });
  } catch (error) {
    console.error('[Payment] Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
