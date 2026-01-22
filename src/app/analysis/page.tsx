'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Send, User, ArrowLeft, Star, Moon, Sun, Book, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AnalysisPage() {
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userGender, setUserGender] = useState<string>('');
  const [userBirthDate, setUserBirthDate] = useState<string>('');
  const [userBirthTime, setUserBirthTime] = useState<string>('');
  const [userBirthPlace, setUserBirthPlace] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 页面加载时获取用户信息并开始初始分析
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');
    const storedUserName = sessionStorage.getItem('userName');
    const storedUserGender = sessionStorage.getItem('userGender');
    const storedUserBirthDate = sessionStorage.getItem('userBirthDate');
    const storedUserBirthTime = sessionStorage.getItem('userBirthTime');
    const storedUserBirthPlace = sessionStorage.getItem('userBirthPlace');
    
    if (!storedUserId) {
      window.location.href = '/';
      return;
    }

    setUserId(storedUserId);
    setUserName(storedUserName || '有缘人');
    setUserGender(storedUserGender || '');
    setUserBirthDate(storedUserBirthDate || '');
    setUserBirthTime(storedUserBirthTime || '');
    setUserBirthPlace(storedUserBirthPlace || '');

    // 开始初始命格分析
    performInitialAnalysis(storedUserName, storedUserGender, storedUserBirthDate, storedUserBirthTime, storedUserBirthPlace);
  }, []);

  // 执行初始命格分析
  const performInitialAnalysis = async (
    name: string | null,
    gender: string | null,
    birthDate: string | null,
    birthTime: string | null,
    birthPlace: string | null
  ) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/fortune/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          gender,
          birthDate,
          birthTime,
          birthPlace,
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };

          setMessages([welcomeMessage]);

          const decoder = new TextDecoder();
          let accumulatedContent = '';

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
                  accumulatedContent += parsed.content || '';
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === welcomeMessage.id
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error performing initial analysis:', error);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `${name}您好，我是天机阁的天道子大师。

我已准备好为您进行命格分析。请稍等片刻，我将根据您的生辰八字为您推算整体命格。`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 调用后端API获取AI回复
    try {
      const response = await fetch('/api/fortune/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          userId,
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);

          const decoder = new TextDecoder();
          let accumulatedContent = '';

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
                  accumulatedContent += parsed.content || '';
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，我遇到了一些技术问题。请稍后再试，或重新开始咨询。

作为备选方案，我可以根据传统命理知识为您做一些基础分析：
- 请提供更多细节，我可以深入解读您的命盘
- 询问特定领域（事业、财运、婚姻、健康等）
- 询问特定时间段的运势

您还有什么想了解的吗？`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 开始录音
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器。');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // 停止录音
  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl dark:bg-orange-900/10" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200/20 rounded-full blur-3xl dark:bg-red-900/10" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 h-screen flex flex-col">
        {/* 头部 */}
        <header className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧙</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">天道子大师</h1>
              <p className="text-sm text-muted-foreground">在线为您服务</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-orange-500" />
            <Moon className="w-5 h-5 text-blue-500" />
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
        </header>

        {/* 聊天区域 */}
        <Card className="flex-1 flex flex-col overflow-hidden border-2 border-orange-200/50 shadow-xl dark:border-orange-900/30">
          <ScrollArea className="flex-1 [&_[data-radix-scroll-area-viewport]]:h-[calc(100vh-420px)]">
            <div className="p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🧙</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                        : 'bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-orange-100'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {(isLoading || isAnalyzing) && (
                <div className="flex gap-3 justify-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🧙</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* 输入区域 */}
          <div className="p-4 bg-white dark:bg-gray-800/50">
            <form onSubmit={handleSend} className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isAnalyzing ? "正在为您推算命格，请稍候..." : "请输入您想咨询的命理问题..."}
                  disabled={isLoading || isAnalyzing}
                  className="h-12 pr-12"
                />
                {!isAnalyzing && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 ${
                      isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isLoading || isAnalyzing || !input.trim()}
                className="h-12 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Book className="w-3 h-3" />
                专业命理分析
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                持续问答
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                仅限命理相关问题
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
