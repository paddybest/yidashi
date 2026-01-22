'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // 设置客户端 cookie（供 middleware 使用）
        const adminToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('admin_token='))
          ?.split('=')[1];

        // 登录成功，跳转到管理后台
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 flex items-center justify-center p-4">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 返回首页按钮 */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* 登录卡片 */}
        <Card className="p-8 border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">管理后台</h1>
            <p className="text-sm text-slate-400">请输入管理员密码</p>
          </div>

          {/* 警告提示 */}
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">安全提示</p>
                <p className="text-slate-400">请确保环境变量 ADMIN_PASSWORD 已正确配置</p>
              </div>
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 密码输入 */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                管理员密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入管理员密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? '登录中...' : '登录'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
