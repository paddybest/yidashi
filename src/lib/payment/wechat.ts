import * as crypto from 'crypto';

/**
 * 简化的微信支付工具类（避免使用第三方库）
 */
export class WechatPayment {
  private appId: string;
  private mchId: string;
  private apiKey: string;

  constructor() {
    this.appId = process.env.WECHAT_PAY_APP_ID || '';
    this.mchId = process.env.WECHAT_PAY_MCH_ID || '';
    this.apiKey = process.env.WECHAT_PAY_API_KEY || '';

    if (!this.appId || !this.mchId || !this.apiKey) {
      throw new Error('微信支付配置不完整：缺少 WECHAT_PAY_APP_ID、WECHAT_PAY_MCH_ID 或 WECHAT_PAY_API_KEY');
    }
  }

  /**
   * 创建 H5 支付订单（模拟实现）
   */
  async createH5PayOrder(params: {
    outTradeNo: string;
    totalFee: number;
    description: string;
    notifyUrl?: string;
    sceneInfo?: any;
  }) {
    try {
      // 模拟创建订单成功
      const mockOrder = {
        appId: this.appId,
        mchId: this.mchId,
        prepayId: `wx${Date.now()}${Math.floor(Math.random() * 10000)}`,
        package: 'prepay_id=' + `wx${Date.now()}${Math.floor(Math.random() * 10000)}`,
        nonceStr: this.generateNonceStr(),
        timeStamp: Math.floor(Date.now() / 1000).toString(),
        sign: this.generateSign({
          appid: this.appId,
          mch_id: this.mchId,
          prepay_id: `wx${Date.now()}${Math.floor(Math.random() * 10000)}`,
        }),
      };

      console.log('[Wechatpay] 创建 H5 支付订单成功:', mockOrder);
      return {
        code_url: `weixin://wxpay/bizpayurl?pr=${mockOrder.prepayId}`,
        ...mockOrder,
      };
    } catch (error) {
      console.error('[Wechatpay] 创建 H5 支付订单失败:', error);
      throw error;
    }
  }

  /**
   * 查询订单
   */
  async queryOrder(outTradeNo: string) {
    try {
      // 模拟查询订单
      const mockOrder = {
        out_trade_no: outTradeNo,
        appid: this.appId,
        mch_id: this.mchId,
        transaction_id: `420000${Math.floor(Math.random() * 100000000)}`,
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        total_fee: 100,
        settlement_total_fee: 100,
        fee_type: 'CNY',
        cash_fee: 100,
        cash_fee_type: 'CNY',
        nonce_str: this.generateNonceStr(),
        sign: this.generateSign({
          appid: this.appId,
          mch_id: this.mchId,
          out_trade_no: outTradeNo,
        }),
      };

      console.log('[Wechatpay] 查询订单:', mockOrder);
      return mockOrder;
    } catch (error) {
      console.error('[Wechatpay] 查询订单失败:', error);
      throw error;
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(outTradeNo: string) {
    try {
      // 模拟关闭订单
      const result = {
        success_time: new Date().toISOString(),
        out_trade_no: outTradeNo,
        nonce_str: this.generateNonceStr(),
        sign: this.generateSign({
          appid: this.appId,
          mch_id: this.mchId,
          out_trade_no: outTradeNo,
        }),
      };

      console.log('[Wechatpay] 关闭订单成功:', result);
      return result;
    } catch (error) {
      console.error('[Wechatpay] 关闭订单失败:', error);
      throw error;
    }
  }

  /**
   * 验证回调通知签名（简化版）
   */
  verifyNotify(headers: Record<string, string>, body: string): boolean {
    try {
      const signature = headers['wechatpay-signature'];
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];

      if (!signature || !timestamp || !nonce) {
        console.error('[Wechatpay] 回调参数不完整');
        return false;
      }

      // 在实际生产环境中，这里需要：
      // 1. 使用微信支付平台证书验证签名
      // 2. 解密回调数据
      // 3. 验证订单状态

      // 当前简化实现，总是返回 true
      console.log('[Wechatpay] 回调签名验证（简化版）');
      return true;
    } catch (error) {
      console.error('[Wechatpay] 验证回调签名失败:', error);
      return false;
    }
  }

  /**
   * 解密回调通知数据（简化版）
   */
  decryptNotifyData(associatedData: string, nonce: string, ciphertext: string) {
    try {
      // 在实际生产环境中，这里需要：
      // 1. 使用 AES-GCM 解密数据
      // 2. 返回解密后的 JSON 数据

      // 当前简化实现，返回模拟数据
      const mockData = {
        mch_id: this.mchId,
        appid: this.appId,
        out_trade_no: `ORDER${Date.now()}`,
        transaction_id: `420000${Math.floor(Math.random() * 100000000)}`,
        trade_state: 'SUCCESS',
        trade_state_desc: '支付成功',
        bank_type: 'CMC',
        total_fee: 100,
        settlement_total_fee: 100,
        fee_type: 'CNY',
        cash_fee: 100,
        cash_fee_type: 'CNY',
        time_end: new Date().toISOString(),
      };

      console.log('[Wechatpay] 解密回调数据成功');
      return mockData;
    } catch (error) {
      console.error('[Wechatpay] 解密回调数据失败:', error);
      throw error;
    }
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 生成签名（简化版）
   */
  private generateSign(params: Record<string, any>): string {
    // 按照微信支付规范生成签名
    const sortedParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const stringSignTemp = `${sortedParams}&key=${this.apiKey}`;

    // 使用 MD5 加密
    const md5 = crypto.createHash('md5');
    md5.update(stringSignTemp, 'utf8');
    return md5.digest('hex').toUpperCase();
  }
}

// 导出单例
export const wechatPayment = new WechatPayment();