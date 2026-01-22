'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mockCode, setMockCode] = useState('');

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      alert('请输入正确的手机号');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setMockCode(data.code || ''); // 仅用于演示
        alert('验证码已发送');

        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(data.error || '发送失败');
      }
    } catch (error) {
      console.error('Error sending code:', error);
      alert('发送失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !verificationCode) {
      alert('请填写完整的登录信息');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
        }),
      });

      console.log('[Login] Response status:', response.status);

      const data = await response.json();

      console.log('[Login] Response data:', JSON.stringify(data, null, 2));

      if (data.success) {
        const { user } = data;

        console.log('[Login] User object:', user);
        console.log('[Login] User expiresAt:', user.expiresAt);
        console.log('[Login] User isActivated:', user.isActivated);

        // 保存用户信息到 sessionStorage
        sessionStorage.setItem('userId', user.id);
        sessionStorage.setItem('userName', user.name);
        sessionStorage.setItem('userGender', user.gender);
        sessionStorage.setItem('userBirthDate', user.birthDate);
        sessionStorage.setItem('userBirthTime', user.birthTime);
        sessionStorage.setItem('userBirthPlace', user.birthPlace);
        sessionStorage.setItem('remainingConversations', user.remainingConversations?.toString() || '0');

        // 设置客户端 cookie（供 middleware 使用）
        document.cookie = `user_id=${user.id}; path=/; max-age=604800; SameSite=lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

        console.log('[Login] Saved to sessionStorage and cookie, redirecting to /chat');

        // 跳转到对话页面
        window.location.href = '/chat';
      } else {
        console.error('[Login] Login failed:', data.error);
        alert(data.error || '登录失败');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      alert('登录失败，请重试');
      alert('登录失败，请重试');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl dark:bg-orange-900/10" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200/20 rounded-full blur-3xl dark:bg-red-900/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 登录卡片 */}
        <Card className="p-8 border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-4xl">🧙</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">天机阁</h1>
            <p className="text-sm text-muted-foreground">手机号验证码登录</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 手机号输入 */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  maxLength={11}
                />
              </div>
            </div>

            {/* 验证码输入 */}
            <div className="space-y-2">
              <label htmlFor="verificationCode" className="text-sm font-medium">
                验证码
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="请输入验证码"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendCode}
                  disabled={countdown > 0 || isSending}
                  className="whitespace-nowrap"
                >
                  {isSending ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              </div>
              {mockCode && (
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="inline w-3 h-3 mr-1" />
                  演示模式验证码：<span className="font-mono font-bold">{mockCode}</span>
                </p>
              )}
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* 说明 */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>首次登录需要先完成支付激活账户</p>
            <p className="mt-2">
              还未购买？{' '}
              <Link href="/purchase" className="text-orange-600 hover:underline font-medium">
                立即购买服务
              </Link>
            </p>
            <p className="mt-1">
              <Link href="/admin" className="text-orange-600 hover:underline">
                管理员入口
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
