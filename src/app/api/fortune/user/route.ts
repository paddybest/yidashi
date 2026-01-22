import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/storage/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gender, birthDate, birthTime, birthPlace, question } = body;

    // 验证必需字段
    if (!name || !gender || !birthDate || !birthTime || !birthPlace) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 创建用户
    const user = await userManager.createUser({
      name,
      gender,
      birthDate: new Date(birthDate),
      birthTime,
      birthPlace,
      initialQuestion: question || '整体命格分析',
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
