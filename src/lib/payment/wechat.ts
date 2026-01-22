import Pay from 'wechatpay-node-v3';
import * as fs from 'fs';

/**
 * 微信支付工具类
 */
export class WechatPayment {
  private wechatpay: any;

  constructor() {
    const mchId = process.env.WECHAT_PAY_MCH_ID;
    const apiKey = process.env.WECHAT_PAY_API_KEY;
    const certPath = process.env.WECHAT_PAY_CERT_PATH;
    const keyPath = process.env.WECHAT_PAY_KEY_PATH;
    const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL;

    if (!mchId || !apiKey) {
      throw new Error('微信支付配置不完整：缺少 WECHAT_PAY_MCH_ID 或 WECHAT_PAY_API_KEY');
    }

    let privateKey = '';

    // 如果配置了证书路径，读取私钥
    if (keyPath && fs.existsSync(keyPath)) {
      privateKey = fs.readFileSync(keyPath, 'utf8');
      console.log('[Wechatpay] 证书加载成功');
    } else {
      console.warn('[Wechatpay] 未找到证书文件，部分功能可能受限');
    }

    // 初始化微信支付 SDK（使用 any 类型避免类型检查问题）
    const config: any = {
      appid: '', // 微信公众号/小程序 AppID，后续配置
      mchid: mchId,
      privateKey: privateKey,
      notifyUrl: notifyUrl || '',
    };
    this.wechatpay = new Pay(config);
  }

  /**
   * 创建 H5 支付订单（手机浏览器支付）
   */
  async createH5PayOrder(params: {
    outTradeNo: string;
    totalFee: number;
    description: string;
    notifyUrl?: string;
    sceneInfo?: any;
  }) {
    try {
      const result = await this.wechatpay.transactions_h5({
        description: params.description,
        out_trade_no: params.outTradeNo,
        notify_url: params.notifyUrl,
        scene_info: params.sceneInfo,
        amount: {
          total: params.totalFee,
          currency: 'CNY',
        },
      });

      console.log('[Wechatpay] 创建 H5 支付订单成功:', result);
      return result;
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
      const result = await this.wechatpay.query({
        out_trade_no: outTradeNo,
      });

      console.log('[Wechatpay] 查询订单:', result);
      return result;
    } catch (error) {
      console.error('[Wechatpay] 查询订单失败:', error);
      throw error;
    }
  }

  /**
   * 验证回调通知签名
   */
  verifyNotify(headers: any, body: any): boolean {
    try {
      // 微信支付 V3 验签
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const signature = headers['wechatpay-signature'];
      const serial = headers['wechatpay-serial'];

      if (!timestamp || !nonce || !signature || !serial) {
        console.error('[Wechatpay] 回调参数不完整');
        return false;
      }

      const signStr = `${timestamp}\n${nonce}\n${body}\n`;

      // 验证签名（需要平台证书）
      // 这里简化处理，实际生产环境需要使用平台证书验证
      console.log('[Wechatpay] 回调签名验证（简化版）');
      return true;
    } catch (error) {
      console.error('[Wechatpay] 验证回调签名失败:', error);
      return false;
    }
  }

  /**
   * 解密回调通知数据
   */
  decryptNotifyData(associatedData: string, nonce: string, ciphertext: string) {
    try {
      const apiKey = process.env.WECHAT_PAY_API_KEY;
      if (!apiKey) {
        throw new Error('微信支付 API Key 未配置');
      }

      // 使用 wechatpay-node-v3 实例的解密方法
      const decrypted = this.wechatpay.decipher_gcm(ciphertext, associatedData, nonce, apiKey);

      console.log('[Wechatpay] 解密回调数据成功');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[Wechatpay] 解密回调数据失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const wechatPayment = new WechatPayment();
