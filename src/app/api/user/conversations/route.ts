import { NextRequest, NextResponse } from 'next/server';
import { conversationManager } from '@/storage/database';

/**
 * GET 获取用户的对话历史
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as 'user' | 'assistant' | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const conversations = await conversationManager.getConversationsByUserId(userId, {
      limit,
      skip,
      role: role || undefined,
    });

    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE 删除用户的所有对话历史
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const deletedCount = await conversationManager.deleteConversationsByUserId(userId);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} conversations`,
    });
  } catch (error) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
