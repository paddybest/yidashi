import { NextRequest, NextResponse } from 'next/server';
import { activationListManager, userManager } from '@/storage/database';

/**
 * 临时测试接口：检查手机号是否在激活名单中
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      );
    }

    // 检查激活名单
    const isInActivationList = await activationListManager.isUserActivated(phoneNumber);
    
    // 获取激活名单中的所有手机号
    const activationList = await activationListManager.getActivationList({ limit: 100 });

    // 检查用户是否存在
    const user = await userManager.getUserByPhoneNumber(phoneNumber);

    return NextResponse.json({
      success: true,
      phoneNumber,
      isInActivationList,
      userExists: !!user,
      user: user ? {
        id: user.id,
        expiresAt: user.expiresAt,
        activatedAt: user.activatedAt,
        hasCompleteFortuneInfo: !!(
          user.gender && user.birthDate && user.birthTime && user.birthPlace && user.initialQuestion
        ),
      } : null,
      activationListCount: activationList.length,
      activationListPhoneNumbers: activationList.map(item => item.phoneNumber),
    });
  } catch (error) {
    console.error('Test activation check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
