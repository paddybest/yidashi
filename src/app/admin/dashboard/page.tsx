'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, UserCheck, Users, Clock, MessageSquare, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  phoneNumber?: string;
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  isActive: boolean;
  isActivated: boolean;
  isExpired: boolean;
  isLimitExceeded: boolean;
  activatedAt?: string;
  expiresAt?: string;
  maxConversations?: number;
  usedConversations?: number;
  remainingConversations: number;
  createdAt: string;
  updatedAt?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);

  // 检查管理员登录状态
  useEffect(() => {
    const adminToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_token='));

    if (!adminToken) {
      // 没有管理员 token，跳转到登录页面
      router.push('/admin');
    } else {
      fetchUsers();
    }
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const activateUser = async (userId: string) => {
    setActivatingUserId(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          validDays: 7,
          maxConversations: 50,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('用户激活成功！');
        fetchUsers();
      } else {
        alert('激活失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('Error activating user:', error);
      alert('激活失败，请重试');
    } finally {
      setActivatingUserId(null);
    }
  };

  const handleLogout = () => {
    // 清除管理员 cookie
    document.cookie = 'admin_token=; path=/; max-age=0';
    // 跳转到管理员登录页面
    router.push('/admin');
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="destructive">已禁用</Badge>;
    }
    if (!user.isActivated) {
      return <Badge variant="secondary">未激活</Badge>;
    }
    if (user.isExpired) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    if (user.isLimitExceeded) {
      return <Badge variant="outline">次数用尽</Badge>;
    }
    return <Badge variant="default">正常</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-gray-900 dark:via-slate-900 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">管理后台</h1>
              <p className="text-sm text-muted-foreground">用户管理与激活</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fetchUsers} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </header>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-sm text-muted-foreground">总用户数</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.isActivated && !u.isExpired).length}
                </div>
                <div className="text-sm text-muted-foreground">活跃用户</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.isActivated && u.isExpired).length}
                </div>
                <div className="text-sm text-muted-foreground">已过期</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {users.reduce((sum, u) => sum + (u.usedConversations || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">总对话次数</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 用户列表 */}
        <Card className="overflow-hidden">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="p-4">
              {loading && users.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  加载中...
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  暂无用户
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <Card key={user.id} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                            {getStatusBadge(user)}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <div className="text-muted-foreground">手机号</div>
                              <div className="font-medium">{user.phoneNumber || '-'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">性别</div>
                              <div className="font-medium">{user.gender || '-'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">出生日期</div>
                              <div className="font-medium">
                                {user.birthDate ? new Date(user.birthDate).toLocaleDateString('zh-CN') : '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">出生时间</div>
                              <div className="font-medium">{user.birthTime || '-'}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">出生地</div>
                              <div className="font-medium">{user.birthPlace || '-'}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">对话次数</div>
                              <div className="font-medium">
                                {user.usedConversations || 0} / {user.maxConversations || 0}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">激活时间</div>
                              <div className="font-medium">
                                {user.activatedAt ? new Date(user.activatedAt).toLocaleString('zh-CN') : '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">过期时间</div>
                              <div className="font-medium">
                                {user.expiresAt ? new Date(user.expiresAt).toLocaleString('zh-CN') : '-'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!user.isActivated && (
                            <Button
                              size="sm"
                              onClick={() => activateUser(user.id)}
                              disabled={activatingUserId === user.id}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              {activatingUserId === user.id ? '激活中...' : '激活'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
