import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '天机阁 | 智能命理咨询',
    template: '%s | 天机阁',
  },
  description:
    '天机阁 - 智能命理咨询平台。融合四柱八字、梅花易数、奇门遁甲等传统命理知识，为您提供专业的命理分析和吉凶预测。',
  keywords: [
    '天机阁',
    '命理咨询',
    '四柱八字',
    '梅花易数',
    '奇门遁甲',
    '算命',
    '命理分析',
    '吉凶预测',
  ],
  authors: [{ name: '天机阁', url: 'https://example.com' }],
  generator: '天机阁',
  openGraph: {
    title: '扣子编程 | 你的 AI 工程师已就位',
    description:
      '我正在使用扣子编程 Vibe Coding，让创意瞬间上线。告别拖拽，拥抱心流。',
    url: 'https://code.coze.cn',
    siteName: '扣子编程',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}