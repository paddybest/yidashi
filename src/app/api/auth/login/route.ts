import { NextRequest, NextResponse } from 'next/server';
import { userManager, activationListManager } from '@/storage/database';

/**
 * 短信验证码登录接口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = body;

    // 验证参数
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    // 验证验证码
    const isValid = await userManager.verifyCode(phoneNumber, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      );
    }

    // 查找用户
    let user = await userManager.getUserByPhoneNumber(phoneNumber);

    // 如果用户不存在，检查是否在激活名单中
    if (!user) {
      const isInActivationList = await activationListManager.isPhoneNumberActivated(phoneNumber);
      console.log(`[Login] User not found, checking activation list: ${phoneNumber}, isInActivationList: ${isInActivationList}`);
      
      if (isInActivationList) {
        // 在激活名单中，创建新用户
        const newUser = await userManager.createUser({
          phoneNumber,
          name: '',
          gender: '',
          birthDate: new Date(),
          birthTime: '',
          birthPlace: '',
          initialQuestion: '',
          metadata: null,
        });
        console.log(`[Login] Auto-created user for activation list: ${phoneNumber}, userId: ${newUser.id}`);
        
        // 立即激活用户（激活名单用户默认7天有效期，100次对话）
        const activatedUser = await userManager.activateUser(newUser.id, 7, 100);
        user = activatedUser || newUser;
        console.log(`[Login] Auto-activated user: ${user.id}, expiresAt: ${user.expiresAt}`);
      } else {
        console.log(`[Login] User not found and not in activation list: ${phoneNumber}`);
        return NextResponse.json(
          { error: 'User not found. Please contact administrator to create account.' },
          { status: 404 }
        );
      }
    }

    // 确保用户存在（TypeScript 类型保护）
    if (!user) {
      return NextResponse.json(
        { error: 'Unexpected error: User not found' },
        { status: 500 }
      );
    }

    console.log(`[Login] Found user: ${user.id}, expiresAt: ${user.expiresAt}, activatedAt: ${user.activatedAt}`);

    // 清除验证码
    await userManager.clearVerificationCode(user.id);

    // 检查用户状态
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // 检查是否已激活（是否有过期时间）
    if (!user.activatedAt || !user.expiresAt) {
      // 用户未激活，检查是否在激活名单中
      const isInActivationList = await activationListManager.isPhoneNumberActivated(phoneNumber);
      console.log(`[Login] User not activated, checking activation list: ${phoneNumber}, isInActivationList: ${isInActivationList}`);
      
      if (isInActivationList) {
        // 在激活名单中，自动激活用户
        const activatedUser = await userManager.activateUser(user.id, 7, 100);
        if (activatedUser) {
          user = activatedUser;
          console.log(`[Login] Auto-activated user: ${user.id}, expiresAt: ${user.expiresAt}`);
        }
      } else {
        // 不在激活名单中，返回未激活状态
        const response = NextResponse.json({
          success: true,
          user: {
            id: user.id,
            phoneNumber: user.phoneNumber,
            name: user.name,
            gender: user.gender,
            birthDate: user.birthDate,
            birthTime: user.birthTime,
            birthPlace: user.birthPlace,
            initialQuestion: user.initialQuestion,
            metadata: user.metadata,
            isActivated: false,
            activatedAt: user.activatedAt,
            expiresAt: user.expiresAt,
            maxConversations: user.maxConversations,
            usedConversations: user.usedConversations,
            remainingConversations: (user.maxConversations || 0) - (user.usedConversations || 0),
          },
          message: 'Account exists but not activated. Please complete payment to activate.',
        });

        // 设置 cookie
        response.cookies.set('user_id', user.id, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7天
        });

        return response;
      }
    }

    // 检查是否过期
    const isExpired = userManager.isUserExpired(user);

    if (isExpired) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          gender: user.gender,
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          birthPlace: user.birthPlace,
          initialQuestion: user.initialQuestion,
          metadata: user.metadata,
          isActivated: false,
          expired: true,
          activatedAt: user.activatedAt,
          expiresAt: user.expiresAt,
          maxConversations: user.maxConversations,
          usedConversations: user.usedConversations,
          remainingConversations: (user.maxConversations || 0) - (user.usedConversations || 0),
        },
        message: 'Account has expired. Please renew to continue.',
      });

      // 设置 cookie
      response.cookies.set('user_id', user.id, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7天
      });

      return response;
    }

    // 检查对话次数是否超限
    const isLimitExceeded = userManager.isConversationLimitExceeded(user);

    // 检查用户是否已经输入了完整的命理信息
    const hasCompleteFortuneInfo = !!(
      user.gender &&
      user.birthDate &&
      user.birthTime &&
      user.birthPlace &&
      user.initialQuestion
    );

    // 返回登录成功信息
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        gender: user.gender,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        initialQuestion: user.initialQuestion,
        metadata: user.metadata,
        isActivated: true,
        expired: false,
        hasCompleteFortuneInfo,
        activatedAt: user.activatedAt,
        expiresAt: user.expiresAt,
        maxConversations: user.maxConversations,
        usedConversations: user.usedConversations,
        remainingConversations: (user.maxConversations || 0) - (user.usedConversations || 0),
        limitExceeded: isLimitExceeded,
      },
      message: 'Login successful',
    });

    // 设置 cookie，供 middleware 使用
    response.cookies.set('user_id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });

    return response;
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
