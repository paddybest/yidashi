'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles, User, LogOut, Settings, Send, Mic, MicOff } from 'lucide-react';
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
  activatedAt?: string;
  expiresAt?: string;
  hasCompleteFortuneInfo: boolean;
  remainingConversations: number;
  maxConversations?: number;
  usedConversations?: number;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [responseStream, setResponseStream] = useState('');
  const [hasSentInitialAnalysis, setHasSentInitialAnalysis] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // 用户信息表单状态
  const [userInfo, setUserInfo] = useState({
    name: '',
    gender: '',
    birthDate: undefined as Date | undefined,
    birthTime: '',
    birthPlace: '',
  });

  const [error, setError] = useState('');
  const [isInActivationList, setIsInActivationList] = useState(false);

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'zh-CN';
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;

        recognitionInstance.onstart = () => {
          setIsListening(true);
        };

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setMessage(prev => prev + transcript);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('[Speech] Recognition error:', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      } else {
        console.warn('[Speech] SpeechRecognition not supported in this browser');
      }
    }
  }, []);

  // 检查登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
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

      console.log('[Chat] Checking auth status, userId:', userId);

      if (!userId) {
        // 未登录，跳转到首页
        console.log('[Chat] No userId found, redirecting to home');
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`/api/user/profile?userId=${userId}`);
        const result = await response.json();

        console.log('[Chat] User profile response:', JSON.stringify(result, null, 2));

        if (result.success) {
          console.log('[Chat] expiresAt:', result.user.expiresAt);
          console.log('[Chat] isInActivationList:', result.isInActivationList);

          // 设置用户信息和激活名单状态
          setUser(result.user);
          setIsInActivationList(result.isInActivationList || false);

          // 检查用户是否已激活（有过期时间）
          if (!result.user.expiresAt) {
            // 用户未激活
            if (result.isInActivationList) {
              // 在激活名单中，显示信息填写表单
              console.log('[Chat] User in activation list, showing info form');
            } else {
              // 不在激活名单，跳转到购买页面（保留userId，让购买页面能够正常工作）
              console.log('[Chat] User not in activation list, redirecting to purchase');
              router.push('/purchase');
              return;
            }
          } else {
            // 用户已激活
            // 检查用户是否过期
            if (new Date(result.user.expiresAt) < new Date()) {
              // 用户已过期，跳转到购买页面（保留userId，让购买页面能够正常工作）
              console.log('[Chat] User expired, redirecting to purchase');
              router.push('/purchase');
              return;
            }
          }

          console.log('[Chat] User authenticated:', result.user);

          // 如果已输入完整命理信息，加载对话历史
          if (result.user.hasCompleteFortuneInfo) {
            await loadConversations(userId);
          } else {
            // 预填充用户信息
            setUserInfo({
              name: result.user.name || '',
              gender: result.user.gender || '',
              birthDate: result.user.birthDate ? new Date(result.user.birthDate) : undefined,
              birthTime: result.user.birthTime || '',
              birthPlace: result.user.birthPlace || '',
            });
          }
        } else {
          console.log('[Chat] Failed to get user profile:', result.error);
          sessionStorage.removeItem('userId');
          // 登录失败，跳转到首页
          router.push('/');
        }
      } catch (err) {
        console.error('[Chat] Failed to fetch user profile:', err);
        sessionStorage.removeItem('userId');
        // 请求失败，跳转到首页
        router.push('/');
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, [router]);

  // 自动发送初始命理分析（仅在首次进入且用户已完善信息时）
  useEffect(() => {
    const sendInitialAnalysis = async () => {
      // 确保用户存在、已激活（有expiresAt）、有完整信息、没有对话历史、且未发送过初始分析
      if (!user || !user.expiresAt || !user.hasCompleteFortuneInfo) return;
      if (chatHistory.length > 0 || hasSentInitialAnalysis) return;
      if (isSending) return;

      console.log('[Chat] Sending initial fortune analysis');

      const initialQuestion = '请根据我的生辰信息进行全面的命理分析，包括八字、梅花易数、奇门遁甲等多个维度';
      
      setIsSending(true);
      setHasSentInitialAnalysis(true);

      // 添加用户消息到历史
      setChatHistory(prev => [...prev, { role: 'user', content: initialQuestion }]);

      try {
        const response = await fetch('/api/fortune/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: initialQuestion,
            userId: user.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '发送失败');
        }

        // 处理流式响应
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullResponse += parsed.content;
                    setResponseStream(fullResponse);
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }

        // 将完整的AI回复添加到历史
        setChatHistory(prev => [...prev, { role: 'assistant', content: fullResponse }]);
        setResponseStream('');

        // 更新用户对话次数
        const profileResponse = await fetch(`/api/user/profile?userId=${user.id}`);
        const profileResult = await profileResponse.json();
        if (profileResult.success) {
          setUser(profileResult.user);
        }
      } catch (err: any) {
        console.error('[Chat] Initial analysis failed:', err);
        // 移除刚才添加的用户消息
        setChatHistory(prev => prev.slice(0, -1));
        setHasSentInitialAnalysis(false); // 重置标志，允许重试
      } finally {
        setIsSending(false);
      }
    };

    sendInitialAnalysis();
  }, [user, chatHistory, hasSentInitialAnalysis, isSending]);

  // 加载对话历史
  const loadConversations = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/conversations?userId=${userId}&limit=20`);
      const result = await response.json();

      if (result.success && result.conversations) {
        // 按时间顺序排列（最新的在后面）
        const sorted = result.conversations.sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setChatHistory(sorted.map((conv: any) => ({
          role: conv.role,
          content: conv.content
        })));
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // 退出登录
  const handleLogout = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
    setUser(null);
    setChatHistory([]);
    setResponseStream('');
    router.push('/');
  };

  // 跳转到个人信息修改页面
  const goToProfile = () => {
    router.push('/profile');
  };

  // 提交个人信息
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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

      // 检查是否需要支付
      if (result.needPayment) {
        // 需要支付，跳转到支付页面，携带用户信息
        const queryParams = new URLSearchParams({
          name: userInfo.name,
          gender: userInfo.gender,
          birthDate: userInfo.birthDate?.toISOString() || '',
          birthTime: userInfo.birthTime,
          birthPlace: userInfo.birthPlace,
          phoneNumber: user?.phoneNumber || '',
        });
        router.push(`/purchase?${queryParams.toString()}`);
      } else {
        // 不需要支付，直接进入对话界面
        if (result.user) {
          setUser(result.user);
          // 加载对话历史
          await loadConversations(user!.id);
        }
      }
    } catch (err: any) {
      setError(err.message || '提交失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    setIsSending(true);
    const userMessage = message.trim();
    
    // 添加用户消息到历史
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');

    try {
      const response = await fetch('/api/fortune/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '发送失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setResponseStream(fullResponse);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 将完整的AI回复添加到历史
      setChatHistory(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      setResponseStream('');

      // 更新用户对话次数
      const profileResponse = await fetch(`/api/user/profile?userId=${user.id}`);
      const profileResult = await profileResponse.json();
      if (profileResult.success) {
        setUser(profileResult.user);
      }
    } catch (err: any) {
      setError(err.message || '发送失败，请重试');
      // 移除刚才添加的用户消息
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  // 开始语音输入
  const handleVoiceInput = () => {
    if (!recognition) {
      alert('您的浏览器不支持语音输入功能，请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
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

  // 已登录但未输入完整命理信息 - 显示信息输入表单
  if (user && !user.hasCompleteFortuneInfo) {
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
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-orange-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                天机阁
              </h1>
              <Sparkles className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-lg text-muted-foreground">
              融合四柱八字、梅花易数、奇门遁甲，为您洞察吉凶祸福
            </p>
          </header>

          {/* 用户信息输入表单 */}
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <Card className="p-4 sm:p-8 border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-2xl sm:text-3xl">🧙</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">天道子大师</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      欢迎回来！请完善您的生辰信息，我将为您进行命理分析。
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2 h-9 w-full sm:w-auto"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </Button>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
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
                </div>

                {/* 出生地 */}
                <div className="space-y-2">
                  <Label htmlFor="birthPlace" className="text-base">
                    出生地
                  </Label>
                  <Input
                    id="birthPlace"
                    placeholder="请输入出生地（如：北京市朝阳区）"
                    value={userInfo.birthPlace}
                    onChange={(e) => setUserInfo({ ...userInfo, birthPlace: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                {/* 提交按钮 */}
                <div className="space-y-2">
                  {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full h-12 text-base bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <span className="mr-2 animate-spin">⏳</span>
                        正在保存...
                      </>
                    ) : isInActivationList ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        保存并开始分析
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        立即支付 ¥19.9
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 用户信息未加载完成
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 已登录且已输入完整命理信息 - 显示对话界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl dark:bg-orange-900/10" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200/20 rounded-full blur-3xl dark:bg-red-900/10" />
      </div>

      {/* 头部 */}
      <header className="relative z-10 border-b border-orange-200/50 dark:border-orange-900/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                天机阁
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* 桌面端：显示详细用户信息 */}
              <div className="flex flex-col items-end text-sm hidden md:flex">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{user.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    user.expiresAt && new Date(user.expiresAt) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.expiresAt && new Date(user.expiresAt) > new Date() ? '已激活' : '未激活'}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  剩余对话次数: <span className="font-bold text-orange-600">{user.remainingConversations}</span>
                </div>
              </div>
              {/* 移动端：显示简化的用户信息 */}
              <div className="flex items-center gap-1 md:hidden">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.expiresAt && new Date(user.expiresAt) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.remainingConversations}次
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToProfile}
                className="hidden sm:flex items-center gap-2 h-8 sm:h-9"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">个人信息</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="h-8 sm:h-9 w-8 sm:w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 对话区域 */}
      <div className="relative z-10 flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-6 flex flex-col max-w-4xl">
        {/* 对话历史 */}
        <div className="flex-1 overflow-y-auto mb-3 sm:mb-4 space-y-3 sm:space-y-4 pb-3 sm:pb-4">
          {/* 大师欢迎语 */}
          {chatHistory.length === 0 && (
            <div className="flex gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🧙</span>
              </div>
              <div className="flex-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-orange-100 dark:border-orange-900/30">
                  <p className="text-sm sm:text-base text-foreground">
                    {user.name}，你好！我是天道子大师。根据你的生辰信息，我已经了解了你的命盘。请就任何命理问题向我提问，我会为你详细解答。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 历史消息 */}
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-br from-orange-400 to-red-500'
              }`}>
                <span className="text-lg sm:text-xl">{msg.role === 'user' ? '👤' : '🧙'}</span>
              </div>
              <div className="flex-1 max-w-[85%] sm:max-w-[80%]">
                <div className={`rounded-lg p-3 sm:p-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-white dark:bg-gray-800 border border-orange-100 dark:border-orange-900/30'
                }`}>
                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* AI回复流 */}
          {responseStream && (
            <div className="flex gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-lg sm:text-xl">🧙</span>
              </div>
              <div className="flex-1">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-orange-100 dark:border-orange-900/30">
                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {responseStream}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="sticky bottom-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-orange-200/50 dark:border-orange-900/30">
          {error && (
            <div className="mb-3 sm:mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-xs sm:text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="请输入您的问题..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              disabled={isSending || user.remainingConversations <= 0}
              className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleVoiceInput}
              disabled={isSending || user.remainingConversations <= 0}
              className={`h-10 sm:h-12 w-10 sm:w-auto sm:px-4 ${
                isListening
                  ? 'bg-red-100 border-red-300 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                  : ''
              }`}
            >
              <span className="hidden sm:inline">
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    停止
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    语音
                  </>
                )}
              </span>
              <span className="sm:hidden">
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </span>
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSending || user.remainingConversations <= 0}
              size="lg"
              className="h-10 sm:h-12 px-3 sm:px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              {isSending ? (
                <>
                  <span className="animate-spin text-sm sm:text-base">⏳</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    发送
                  </span>
                  <span className="sm:hidden">
                    <Send className="w-4 h-4" />
                  </span>
                </>
              )}
            </Button>
          </div>
          {user.remainingConversations <= 0 && (
            <p className="mt-2 text-xs sm:text-sm text-destructive text-center">
              您的对话次数已用完，请续费后继续使用
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
