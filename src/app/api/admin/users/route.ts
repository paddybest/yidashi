import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

/**
 * 管理后台 - 获取用户列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const isActive = searchParams.get('isActive');

    const filters: any = {};
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    const users = await userManager.getUsers({
      skip,
      limit,
      filters,
    });

    // 返回用户列表，包含状态信息
    const userList = users.map(user => {
      const isExpired = user.expiresAt ? userManager.isUserExpired(user) : false;
      const isLimitExceeded = userManager.isConversationLimitExceeded(user);
      const isActivated = !!(user.activatedAt && user.expiresAt);

      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        gender: user.gender,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        isActive: user.isActive,
        isActivated,
        isExpired,
        isLimitExceeded,
        activatedAt: user.activatedAt,
        expiresAt: user.expiresAt,
        maxConversations: user.maxConversations,
        usedConversations: user.usedConversations,
        remainingConversations: (user.maxConversations || 0) - (user.usedConversations || 0),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      users: userList,
      total: userList.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 管理后台 - 手动激活用户
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, validDays = 7, maxConversations = 50 } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 激活用户
    const activatedUser = await userManager.activateUser(userId, validDays, maxConversations);

    if (!activatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User activated successfully',
      user: {
        id: activatedUser.id,
        phoneNumber: activatedUser.phoneNumber,
        name: activatedUser.name,
        activatedAt: activatedUser.activatedAt,
        expiresAt: activatedUser.expiresAt,
        maxConversations: activatedUser.maxConversations,
        usedConversations: activatedUser.usedConversations,
      },
    });
  } catch (error) {
    console.error('Error activating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 管理后台 - 更新用户信息
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, gender, birthDate, birthTime, birthPlace, phoneNumber, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (birthTime !== undefined) updateData.birthTime = birthTime;
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await userManager.updateUser(userId, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
