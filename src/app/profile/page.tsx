'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles, ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  phoneNumber: string;
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  initialQuestion: string;
  isActivated: boolean;
  hasCompleteFortuneInfo: boolean;
  remainingConversations: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 用户信息表单状态
  const [userInfo, setUserInfo] = useState({
    name: '',
    gender: '',
    birthDate: undefined as Date | undefined,
    birthTime: '',
    birthPlace: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`/api/user/profile?userId=${userId}`);
        const result = await response.json();

        if (result.success) {
          setUser(result.user);
          
          // 预填充用户信息
          setUserInfo({
            name: result.user.name || '',
            gender: result.user.gender || '',
            birthDate: result.user.birthDate ? new Date(result.user.birthDate) : undefined,
            birthTime: result.user.birthTime || '',
            birthPlace: result.user.birthPlace || '',
          });
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        router.push('/login');
      }

      setIsLoading(false);
    };

    loadUserInfo();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          name: userInfo.name,
          gender: userInfo.gender,
          birthDate: userInfo.birthDate?.toISOString(),
          birthTime: userInfo.birthTime,
          birthPlace: userInfo.birthPlace,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '更新个人信息失败');
      }

      // 重新获取用户信息
      const profileResponse = await fetch(`/api/user/profile?userId=${user?.id}`);
      const profileResult = await profileResponse.json();
      if (profileResult.success) {
        setUser(profileResult.user);
      }

      setSuccess(true);
      
      // 3秒后清除成功提示
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl dark:bg-orange-900/10" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200/20 rounded-full blur-3xl dark:bg-red-900/10" />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="mb-8">
          <Link href="/chat" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回对话
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              个人信息
            </h1>
          </div>
        </header>

        {/* 用户信息卡片 */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 账户信息 */}
          <Card className="p-6 border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30">
            <h2 className="text-xl font-bold mb-4">账户信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">手机号</Label>
                <p className="font-medium">{user?.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">剩余对话次数</Label>
                <p className="font-medium text-orange-600">{user?.remainingConversations}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">账户状态</Label>
                <p className={`font-medium ${user?.isActivated ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.isActivated ? '已激活' : '未激活'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">个人信息完整度</Label>
                <p className={`font-medium ${user?.hasCompleteFortuneInfo ? 'text-green-600' : 'text-orange-600'}`}>
                  {user?.hasCompleteFortuneInfo ? '已完善' : '待完善'}
                </p>
              </div>
            </div>
          </Card>

          {/* 命理信息表单 */}
          <Card className="p-6 border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30">
            <h2 className="text-xl font-bold mb-6">命理信息</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 姓名 */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    姓名
                  </Label>
                  <Input
                    id="name"
                    placeholder="请输入您的姓名"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                {/* 性别 */}
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    性别
                  </Label>
                  <Select 
                    value={userInfo.gender} 
                    onValueChange={(value) => setUserInfo({ ...userInfo, gender: value })}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="请选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男</SelectItem>
                      <SelectItem value="female">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 出生日期 */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate">
                    出生日期
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-11 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {userInfo.birthDate ? (
                          format(userInfo.birthDate, 'yyyy年MM月dd日', { locale: zhCN })
                        ) : (
                          <span>请选择出生日期</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={userInfo.birthDate}
                        onSelect={(date) => setUserInfo({ ...userInfo, birthDate: date })}
                        initialFocus
                        fromYear={1930}
                        toYear={new Date().getFullYear()}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 出生时间 */}
                <div className="space-y-2">
                  <Label htmlFor="birthTime">
                    出生时间
                  </Label>
                  <Select 
                    value={userInfo.birthTime} 
                    onValueChange={(value) => setUserInfo({ ...userInfo, birthTime: value })}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="请选择出生时辰" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zi">子时 (23:00-01:00)</SelectItem>
                      <SelectItem value="chou">丑时 (01:00-03:00)</SelectItem>
                      <SelectItem value="yin">寅时 (03:00-05:00)</SelectItem>
                      <SelectItem value="mao">卯时 (05:00-07:00)</SelectItem>
                      <SelectItem value="chen">辰时 (07:00-09:00)</SelectItem>
                      <SelectItem value="si">巳时 (09:00-11:00)</SelectItem>
                      <SelectItem value="wu">午时 (11:00-13:00)</SelectItem>
                      <SelectItem value="wei">未时 (13:00-15:00)</SelectItem>
                      <SelectItem value="shen">申时 (15:00-17:00)</SelectItem>
                      <SelectItem value="you">酉时 (17:00-19:00)</SelectItem>
                      <SelectItem value="xu">戌时 (19:00-21:00)</SelectItem>
                      <SelectItem value="hai">亥时 (21:00-23:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 出生地 */}
              <div className="space-y-2">
                <Label htmlFor="birthPlace">
                  出生地
                </Label>
                <Input
                  id="birthPlace"
                  placeholder="请输入出生地（如：北京市朝阳区）"
                  value={userInfo.birthPlace}
                  onChange={(e) => setUserInfo({ ...userInfo, birthPlace: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              {/* 提交按钮 */}
              <div className="space-y-2">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                    个人信息保存成功！
                  </div>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSaving}
                  className="h-11 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存修改
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* 提示信息 */}
          <div className="text-center text-sm text-muted-foreground">
            <p>修改生辰信息可能会影响命理分析的准确性，请谨慎修改</p>
          </div>
        </div>
      </div>
    </div>
  );
}
