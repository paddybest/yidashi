import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决 ES 模块中 __dirname 的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig: NextConfig = {
  // 本地开发时不使用 standalone 模式
  // 部署到 Vercel 时会自动启用 standalone
  output: undefined,

  // 取消注释并配置依赖追踪
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),

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
