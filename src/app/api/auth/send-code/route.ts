import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database';
import Dysmsapi20170525, * as $Dysmsapi from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';

/**
 * 发送短信验证码接口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // 验证手机号格式
    if (!phoneNumber || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // 生成6位随机验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 查找或创建用户
    let user = await userManager.getUserByPhoneNumber(phoneNumber);

    if (!user) {
      // 如果用户不存在，创建一个临时用户记录（未激活状态）
      user = await userManager.createUser({
        phoneNumber,
        name: '',
        gender: '',
        birthDate: new Date(),
        birthTime: '',
        birthPlace: '',
        initialQuestion: '',
        metadata: null,
      });
      console.log(`[SendCode] Created temporary user: ${user.id}, phoneNumber: ${phoneNumber}`);
    }

    // 保存验证码（5分钟有效期）
    await userManager.saveVerificationCode(phoneNumber, verificationCode, 300);
    console.log(`[SendCode] Verification code saved for ${phoneNumber}, expires in 5 minutes`);

    // 发送短信
    const smsResult = await sendSMS(phoneNumber, verificationCode);

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

    // 决定是否在响应中返回验证码（仅用于演示）
    const showVerificationCode = process.env.SHOW_VERIFICATION_CODE === 'true';

    return NextResponse.json({
      success: true,
      message: '验证码已发送',
      code: showVerificationCode ? verificationCode : undefined,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 发送短信（使用阿里云短信服务）
 */
async function sendSMS(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
  // 检查是否配置了阿里云短信
  const accessKeyId = process.env.SMS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET;
  const signName = process.env.SMS_SIGN_NAME;
  const templateCode = process.env.SMS_TEMPLATE_CODE;

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    console.error('[SMS] 阿里云短信配置不完整，请检查环境变量');
    console.error('[SMS] 需要: SMS_ACCESS_KEY_ID, SMS_ACCESS_KEY_SECRET, SMS_SIGN_NAME, SMS_TEMPLATE_CODE');

    // 如果是开发环境，使用模拟方式
    if (process.env.NODE_ENV !== 'production' || process.env.SHOW_VERIFICATION_CODE === 'true') {
      console.warn('[SMS] 使用模拟短信服务');
      console.log(`[SMS Mock] 验证码: ${code}, 手机号: ${phoneNumber}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }

    return { success: false, error: '短信服务配置不完整' };
  }

  try {
    // 创建阿里云客户端配置
    const config = new $OpenApi.Config({
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
    });
    config.endpoint = 'dysmsapi.aliyuncs.com';

    // 创建短信客户端
    const client = new Dysmsapi20170525(config);

    // 创建发送短信请求
    const sendSmsRequest = new $Dysmsapi.SendSmsRequest({
      phoneNumbers: phoneNumber,
      signName: signName,
      templateCode: templateCode,
      templateParam: JSON.stringify({ code }),
    });

    console.log(`[SMS] 发送短信到 ${phoneNumber}, 验证码: ${code}`);

    // 发送短信
    const response = await client.sendSms(sendSmsRequest);

    console.log(`[SMS] 阿里云响应: ${JSON.stringify(response.body)}`);

    // 检查发送结果
    if (response.body?.code === 'OK') {
      console.log(`[SMS] 短信发送成功: ${phoneNumber}`);
      return { success: true };
    } else {
      console.error(`[SMS] 短信发送失败: ${response.body?.message}`);
      return {
        success: false,
        error: response.body?.message || '短信发送失败',
      };
    }
  } catch (error) {
    console.error('[SMS] 阿里云短信发送异常:', error);
    return {
      success: false,
      error: '短信发送异常',
    };
  }
}
