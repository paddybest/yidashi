'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles, ArrowLeft, CheckCircle2, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  price: number;
  validity: number; // 天数
  conversations: number;
  description: string;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: 'weekly',
    name: '体验套餐',
    price: 19.9,
    validity: 7,
    conversations: 100,
    description: '适合初次体验',
  },
  {
    id: 'yearly',
    name: '年度尊享',
    price: 69,
    validity: 365,
    conversations: 1000,
    description: '超值优惠',
    badge: '推荐',
  },
];

export default function PurchasePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    name: '',
    gender: '',
    birthDate: undefined as Date | undefined,
    birthTime: '',
    birthPlace: '',
  });

  const [selectedPlan, setSelectedPlan] = useState<string>('weekly');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // 检查登录状态
  useEffect(() => {
    // 优先从 sessionStorage 获取，如果没有则从 cookie 获取
    let userId = sessionStorage.getItem('userId');
    if (!userId) {
      const cookieMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (cookieMatch) {
        userId = cookieMatch[2];
        // 同步到 sessionStorage
        sessionStorage.setItem('userId', userId);
      }
    }

    if (!userId) {
      console.log('[Purchase] No userId found in sessionStorage or cookie, redirecting to home');
      router.push('/');
    }
  }, [router]);

  // 提交订单
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 优先从 sessionStorage 获取，如果没有则从 cookie 获取
    let userId = sessionStorage.getItem('userId');
    if (!userId) {
      const cookieMatch = document.cookie.match(/(^| )user_id=([^;]+)/);
      if (cookieMatch) {
        userId = cookieMatch[2];
        sessionStorage.setItem('userId', userId);
      }
    }

    if (!userId) {
      setError('用户未登录，请先登录');
      setIsLoading(false);
      return;
    }

    try {
      const plan = plans.find(p => p.id === selectedPlan);

      const response = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: userInfo.name,
          gender: userInfo.gender,
          birthDate: userInfo.birthDate?.toISOString(),
          birthTime: userInfo.birthTime,
          birthPlace: userInfo.birthPlace,
          amount: plan?.price,
          planId: selectedPlan,
          validity: plan?.validity,
          maxConversations: plan?.conversations,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '创建订单失败');
      }

      // 模拟支付过程
      setIsLoading(false);
      setIsPaying(true);

      // 模拟支付延迟
      setTimeout(async () => {
        try {
          // 调用支付回调接口
          const payResponse = await fetch('/api/payment/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: result.order.orderId,
              transactionId: 'TX' + Date.now(),
              status: 'success',
            }),
          });

          const payResult = await payResponse.json();

          if (payResult.success) {
            setShowSuccess(true);

            // 保存用户ID到 sessionStorage，避免再次登录
            if (payResult.userId) {
              sessionStorage.setItem('userId', payResult.userId);
            }

            // 3秒后跳转到对话页面
            setTimeout(() => {
              router.push('/chat');
            }, 3000);
          } else {
            throw new Error(payResult.error || '支付失败');
          }
        } catch (err: any) {
          setError(err.message || '支付失败，请重试');
          setIsPaying(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || '提交失败，请重试');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl dark:bg-orange-900/10" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200/20 rounded-full blur-3xl dark:bg-red-900/10" />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 头部 */}
        <header className="mb-4 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              购买服务
            </h1>
          </div>
        </header>

        {/* 购买表单 */}
        <div className="max-w-4xl mx-auto">
          {showSuccess ? (
            <Card className="p-6 sm:p-12 border-2 border-green-200/50 shadow-xl dark:border-green-900/30 text-center">
              <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-green-500 mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">购买成功！</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-2">您的账户已激活</p>
              {selectedPlan === 'yearly' ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                    有效期：365天 | 对话次数：1000次
                  </p>
                  <p className="text-xs sm:text-sm text-orange-600 font-semibold">
                    年度尊享套餐，超值享受！
                  </p>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  有效期：7天 | 对话次数：100次
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                3秒后自动跳转到对话页面...
              </p>
            </Card>
          ) : (
            <>
              {/* 服务套餐 */}
              <Card className="p-4 sm:p-6 border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">服务套餐</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative p-4 sm:p-6 rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 border-2 border-orange-400'
                          : 'bg-muted/30 border-2 border-transparent hover:border-orange-200'
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          {plan.badge}
                        </div>
                      )}
                      {plan.id === 'yearly' && (
                        <Crown className="absolute top-4 left-4 w-6 h-6 text-amber-500" />
                      )}
                      <div className={plan.id === 'yearly' ? 'pl-10' : ''}>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                          四柱八字 + 紫微斗数 + 梅花易数 + 奇门遁甲
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                          有效期{plan.validity}天，支持{plan.conversations}次对话
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-bold text-orange-600">¥{plan.price}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">{plan.description}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 用户信息表单 */}
              <Card className="p-4 sm:p-8 border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30">
                <div className="mb-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-2xl sm:text-3xl">🧙</span>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">天道子大师</h2>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        研习四柱八字、紫微斗数、梅花易数、奇门遁甲三十余载，愿以毕生所学为您指点迷津。
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        请填写您的生辰信息，支付成功后即可开始命理咨询。
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* 姓名 */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm sm:text-base">
                        姓名
                      </Label>
                      <Input
                        id="name"
                        placeholder="请输入您的姓名"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                        required
                        className="h-10 sm:h-12"
                      />
                    </div>

                    {/* 性别 */}
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm sm:text-base">
                        性别
                      </Label>
                      <Select
                        value={userInfo.gender}
                        onValueChange={(value) => setUserInfo({ ...userInfo, gender: value })}
                        required
                      >
                        <SelectTrigger className="h-10 sm:h-12">
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
                      <Label htmlFor="birthDate" className="text-sm sm:text-base">
                        出生日期
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-10 sm:h-12 justify-start text-left font-normal text-sm sm:text-base"
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
                      <Label htmlFor="birthTime" className="text-sm sm:text-base">
                        出生时间
                      </Label>
                      <Select
                        value={userInfo.birthTime}
                        onValueChange={(value) => setUserInfo({ ...userInfo, birthTime: value })}
                        required
                      >
                        <SelectTrigger className="h-10 sm:h-12">
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

                    {/* 出生地 */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="birthPlace" className="text-sm sm:text-base">
                        出生地
                      </Label>
                      <Input
                        id="birthPlace"
                        placeholder="请输入出生地（省市区/县）"
                        value={userInfo.birthPlace}
                        onChange={(e) => setUserInfo({ ...userInfo, birthPlace: e.target.value })}
                        required
                        className="h-10 sm:h-12"
                      />
                    </div>
                  </div>

                  {/* 错误提示 */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                      {error}
                    </div>
                  )}

                  {/* 提交按钮 */}
                  <div className="flex gap-3 sm:gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
                      onClick={() => router.back()}
                      disabled={isLoading || isPaying}
                    >
                      返回
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || isPaying}
                      className="flex-[2] h-10 sm:h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-sm sm:text-base"
                    >
                      {isLoading ? '提交中...' : isPaying ? '支付中...' : `支付 ¥${plans.find(p => p.id === selectedPlan)?.price}`}
                    </Button>
                  </div>
                </form>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
