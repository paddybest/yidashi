import { NextRequest, NextResponse } from 'next/server';
import { userManager, activationListManager } from '@/storage/database';

/**
 * GET 获取用户个人信息
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const user = await userManager.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 检查手机号是否在激活名单中
    const isInActivationList = user.phoneNumber ? 
      await activationListManager.isPhoneNumberActivated(user.phoneNumber) : false;

    // 检查用户是否已经输入了完整的命理信息
    const hasCompleteFortuneInfo = !!(
      user.gender &&
      user.birthDate &&
      user.birthTime &&
      user.birthPlace &&
      user.initialQuestion
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        gender: user.gender,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        initialQuestion: user.initialQuestion,
        metadata: user.metadata,
        phoneNumber: user.phoneNumber,
        activatedAt: user.activatedAt,
        expiresAt: user.expiresAt,
        maxConversations: user.maxConversations,
        usedConversations: user.usedConversations,
        remainingConversations: (user.maxConversations || 100) - (user.usedConversations || 0),
        hasCompleteFortuneInfo,
      },
      isInActivationList,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT 更新用户个人信息
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, gender, birthDate, birthTime, birthPlace, initialQuestion } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // 验证必填字段（至少要提供一个）
    if (!name && !gender && !birthDate && !birthTime && !birthPlace && !initialQuestion) {
      return NextResponse.json(
        { error: 'At least one field is required to update' },
        { status: 400 }
      );
    }

    // 构建更新数据
    const updateData: any = {};

    if (name) updateData.name = name;
    if (gender) updateData.gender = gender;
    if (birthDate) {
      // 验证日期格式
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid birthDate format' },
          { status: 400 }
        );
      }
      updateData.birthDate = date;
    }
    if (birthTime) updateData.birthTime = birthTime;
    if (birthPlace) updateData.birthPlace = birthPlace;
    if (initialQuestion) updateData.initialQuestion = initialQuestion;

    // 获取当前用户信息
    const currentUser = await userManager.getUserById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 更新用户信息
    const updatedUser = await userManager.updateUser(userId, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // 检查手机号是否在激活名单中
    const isActivated = currentUser.phoneNumber ?
      await activationListManager.isPhoneNumberActivated(currentUser.phoneNumber) : false;

    // 检查用户是否已经输入了完整的命理信息
    const hasCompleteFortuneInfo = !!(
      (name || updatedUser.name) &&
      (gender || updatedUser.gender) &&
      (birthDate || updatedUser.birthDate) &&
      (birthTime || updatedUser.birthTime) &&
      (birthPlace || updatedUser.birthPlace) &&
      (initialQuestion || updatedUser.initialQuestion)
    );

    if (isActivated) {
      // 在激活名单中，自动激活用户（7天，100次对话）
      const activatedUser = await userManager.activateUser(userId, 7, 100);

      return NextResponse.json({
        success: true,
        needPayment: false,
        user: {
          id: activatedUser?.id || updatedUser.id,
          name: activatedUser?.name || updatedUser.name,
          gender: activatedUser?.gender || updatedUser.gender,
          birthDate: activatedUser?.birthDate || updatedUser.birthDate,
          birthTime: activatedUser?.birthTime || updatedUser.birthTime,
          birthPlace: activatedUser?.birthPlace || updatedUser.birthPlace,
          initialQuestion: activatedUser?.initialQuestion || updatedUser.initialQuestion,
          metadata: activatedUser?.metadata || updatedUser.metadata,
          phoneNumber: activatedUser?.phoneNumber || updatedUser.phoneNumber,
          activatedAt: activatedUser?.activatedAt || updatedUser.activatedAt,
          expiresAt: activatedUser?.expiresAt || updatedUser.expiresAt,
          maxConversations: activatedUser?.maxConversations || 100,
          usedConversations: activatedUser?.usedConversations || 0,
          remainingConversations: 100 - (activatedUser?.usedConversations || 0),
          hasCompleteFortuneInfo,
        },
        message: '信息保存成功，已自动激活',
      });
    } else {
      // 不在激活名单中，需要支付
      return NextResponse.json({
        success: true,
        needPayment: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          gender: updatedUser.gender,
          birthDate: updatedUser.birthDate,
          birthTime: updatedUser.birthTime,
          birthPlace: updatedUser.birthPlace,
          initialQuestion: updatedUser.initialQuestion,
          metadata: updatedUser.metadata,
          phoneNumber: updatedUser.phoneNumber,
          activatedAt: updatedUser.activatedAt,
          expiresAt: updatedUser.expiresAt,
          maxConversations: updatedUser.maxConversations,
          usedConversations: updatedUser.usedConversations,
          remainingConversations: (updatedUser.maxConversations || 0) - (updatedUser.usedConversations || 0),
          hasCompleteFortuneInfo,
        },
        message: '信息保存成功，请完成支付后开始咨询',
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
