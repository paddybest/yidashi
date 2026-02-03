import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 ES 模块中 __dirname 的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  // Vercel 会自动处理 standalone 模式
  output: 'standalone',

  // 配置图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },

  // 允许的开发域名
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  }
};

export default nextConfig;
