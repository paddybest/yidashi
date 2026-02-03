import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 ES 模块中 __dirname 的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  // 启用 standalone 模式（Vercel 推荐）
  output: 'standalone',

  // 取消注释并配置依赖追踪
  outputFileTracingRoot: path.resolve(__dirname, '../../'),

  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
