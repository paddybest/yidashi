import AlipaySdk from 'alipay-sdk';

/**
 * 支付宝支付工具类
 */
export class AlipayPayment {
  private alipaySdk: AlipaySdk;

  constructor() {
    const appId = process.env.ALIPAY_APP_ID;
    const privateKey = process.env.ALIPAY_PRIVATE_KEY;
    const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;
    const gateway = process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do';

    if (!appId || !privateKey) {
      throw new Error('支付宝配置不完整：缺少 ALIPAY_APP_ID 或 ALIPAY_PRIVATE_KEY');
    }

    this.alipaySdk = new AlipaySdk({
      appId,
      privateKey,
      alipayPublicKey: alipayPublicKey || '',
      gateway,
      charset: 'utf-8',
      version: '1.0',
      signType: 'RSA2',
    });
  }

  /**
   * 创建手机网站支付订单
   */
  async createMobilePayOrder(params: {
    outTradeNo: string;
    totalAmount: string;
    subject: string;
    body?: string;
    returnUrl?: string;
    notifyUrl?: string;
  }) {
    const defaultNotifyUrl = process.env.ALIPAY_NOTIFY_URL || '';

    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'QUICK_WAP_WAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body || params.subject,
      return_url: params.returnUrl,
      notify_url: params.notifyUrl || defaultNotifyUrl,
    };

    try {
      const result = await this.alipaySdk.exec(
        'alipay.trade.wap.pay',
        {
          bizContent,
        },
        {
          validateSign: false, // 生产环境需要设置为 true
        }
      );

      console.log('[Alipay] 创建订单成功:', result);
      return result;
    } catch (error) {
      console.error('[Alipay] 创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 创建电脑网站支付订单
   */
  async createPcPayOrder(params: {
    outTradeNo: string;
    totalAmount: string;
    subject: string;
    body?: string;
    returnUrl?: string;
    notifyUrl?: string;
  }) {
    const defaultNotifyUrl = process.env.ALIPAY_NOTIFY_URL || '';

    const bizContent = {
      out_trade_no: params.outTradeNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: params.totalAmount,
      subject: params.subject,
      body: params.body || params.subject,
      return_url: params.returnUrl,
      notify_url: params.notifyUrl || defaultNotifyUrl,
    };

    try {
      const result = await this.alipaySdk.exec(
        'alipay.trade.page.pay',
        {
          bizContent,
        },
        {
          validateSign: false,
        }
      );

      console.log('[Alipay] 创建 PC 支付订单成功:', result);
      return result;
    } catch (error) {
      console.error('[Alipay] 创建 PC 支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo: string) {
    try {
      const result = await this.alipaySdk.exec(
        'alipay.trade.query',
        {
          bizContent: {
            out_trade_no: outTradeNo,
          },
        },
        {
          validateSign: true,
        }
      );

      console.log('[Alipay] 查询订单:', result);
      return result;
    } catch (error) {
      console.error('[Alipay] 查询订单失败:', error);
      throw error;
    }
  }

  /**
   * 验证支付宝回调通知签名
   */
  verifyNotify(params: any): boolean {
    try {
      const signVerified = this.alipaySdk.checkNotifySign(params);
      console.log('[Alipay] 验证回调签名:', signVerified);
      return signVerified;
    } catch (error) {
      console.error('[Alipay] 验证回调签名失败:', error);
      return false;
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(outTradeNo: string) {
    try {
      const result = await this.alipaySdk.exec(
        'alipay.trade.close',
        {
          bizContent: {
            out_trade_no: outTradeNo,
          },
        },
        {
          validateSign: true,
        }
      );

      console.log('[Alipay] 关闭订单:', result);
      return result;
    } catch (error) {
      console.error('[Alipay] 关闭订单失败:', error);
      throw error;
    }
  }

  /**
   * 退款
   */
  async refund(params: {
    outTradeNo: string;
    refundAmount: string;
    refundReason?: string;
    outRequestNo?: string;
  }) {
    try {
      const result = await this.alipaySdk.exec(
        'alipay.trade.refund',
        {
          bizContent: {
            out_trade_no: params.outTradeNo,
            refund_amount: params.refundAmount,
            refund_reason: params.refundReason || '退款',
            out_request_no: params.outRequestNo || params.outTradeNo + '_refund',
          },
        },
        {
          validateSign: true,
        }
      );

      console.log('[Alipay] 退款:', result);
      return result;
    } catch (error) {
      console.error('[Alipay] 退款失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const alipayPayment = new AlipayPayment();
