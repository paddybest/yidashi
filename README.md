# 天机阁 - 智能命理咨询平台

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

基于 Next.js + DeepSeek AI 的智能命理咨询平台，提供四柱八字、梅花易数、奇门遁甲、紫微斗数等传统命理分析服务。

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [云部署](#-云部署) • [文档](#-文档)

</div>

---

## ✨ 功能特性

### 核心功能
- 🎯 **智能命理分析** - 基于生辰八字的全面命理分析
- 💬 **持续对话** - 支持多轮对话，流式 AI 输出
- 🔐 **用户认证** - 手机号验证码登录
- 💳 **在线支付** - 支持支付宝和微信支付
- 📱 **移动端适配** - 完美支持手机和平板
- 🎙️ **语音输入** - Web Speech API 语音转文字
- 👨‍💼 **管理后台** - 用户管理和激活功能

### 技术特性
- ⚡ **高性能** - Next.js 16 + React 19
- 🎨 **现代 UI** - shadcn/ui + Tailwind CSS 4
- 🗄️ **数据库** - PostgreSQL + Drizzle ORM
- 🤖 **AI 集成** - DeepSeek 流式输出
- 🌐 **云部署** - 支持 Vercel 一键部署
- 🔒 **路由保护** - Middleware 路由守卫
- 📊 **响应式设计** - 完美适配各种设备

---

## 🚀 快速开始

### 环境要求

- Node.js 24+
- pnpm 9+
- PostgreSQL 16+

### 本地开发

```bash
# 1. 克隆项目
git clone your-repo-url tianjige
cd tianjige

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必需的配置

# 4. 启动开发服务器
pnpm dev
```

访问 `http://localhost:5000`

---

## ☁️ 云部署

### Vercel 部署（推荐）

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=your-repo-url)

</div>

**快速部署步骤：**

1. 点击上方按钮将项目导入 Vercel
2. 配置环境变量（见下方说明）
3. 创建 Vercel Postgres 数据库
4. 点击 Deploy

详细文档：[云部署指南](./CLOUD_DEPLOYMENT_GUIDE.md)

### 使用部署脚本

```bash
# 赋予执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

---

## 🔧 环境变量配置

### 必需配置

```env
# AI 模型
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 管理员
ADMIN_PASSWORD=your_secure_password

# 安全
SHOW_VERIFICATION_CODE=false
NODE_ENV=production
```

### 可选配置

```env
# 阿里云短信
SMS_ACCESS_KEY_ID=your_key_id
SMS_ACCESS_KEY_SECRET=your_secret
SMS_SIGN_NAME=天机阁
SMS_TEMPLATE_CODE=SMS_xxx

# 支付宝
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key

# 微信支付
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key

# 域名
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

详细配置说明：[环境变量配置](./.env.example)

---

## 📚 文档

- [云部署指南](./CLOUD_DEPLOYMENT_GUIDE.md) - Vercel 云部署详细教程
- [生产环境部署](./PRODUCTION_DEPLOYMENT_GUIDE.md) - 传统部署方式
- [问题修复说明](./FIXES_README.md) - 已知问题和修复记录

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19 + TypeScript 5
- **样式**: Tailwind CSS 4
- **组件**: shadcn/ui (Radix UI)

### 后端
- **API**: Next.js API Routes
- **数据库**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **缓存**: Server Components

### AI 集成
- **模型**: DeepSeek (deepseek-chat)
- **输出**: 流式响应 (SSE)

### 支付集成
- **支付宝**: alipay-sdk
- **微信支付**: wechatpay-node-v3

### 短信集成
- **服务**: 阿里云短信
- **SDK**: @alicloud/dysmsapi20170525

---

## 📁 项目结构

```
tianjige/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关
│   │   │   ├── payment/       # 支付相关
│   │   │   ├── fortune/       # 命理分析
│   │   │   ├── admin/         # 管理后台
│   │   │   └── user/          # 用户管理
│   │   ├── chat/              # 对话页面
│   │   ├── purchase/          # 购买页面
│   │   ├── login/             # 登录页面
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── lib/                  # 工具函数
│   │   ├── payment/          # 支付服务
│   │   │   ├── alipay.ts     # 支付宝
│   │   │   └── wechat.ts     # 微信支付
│   │   └── utils.ts          # 通用工具
│   ├── storage/              # 数据库操作
│   │   └── database/         # Drizzle ORM
│   ├── middleware.ts         # 路由中间件
│   └── hooks/                # React Hooks
├── public/                   # 静态资源
├── scripts/                  # 构建脚本
├── .env.example             # 环境变量模板
├── vercel.json              # Vercel 配置
├── docker-compose.yml       # Docker 编排
├── Dockerfile               # Docker 镜像
└── package.json             # 依赖配置
```

---

## 🎯 核心功能说明

### 1. 用户认证
- 手机号验证码登录
- 支持阿里云短信发送
- 会话管理（Cookie + SessionStorage）
- 路由保护（Middleware）

### 2. 命理分析
- 支持四柱八字、梅花易数、奇门遁甲、紫微斗数
- AI 流式输出分析结果
- 持续对话支持
- 上下文记忆

### 3. 支付系统
- 支持支付宝和微信支付
- 订单创建和管理
- 支付回调处理
- 用户激活机制

### 4. 管理后台
- 用户列表查看
- 用户激活功能
- 使用统计
- 过期管理

---

## 🔐 安全特性

- ✅ 路由保护中间件
- ✅ 管理员身份验证
- ✅ 验证码有效期控制
- ✅ 用户会话管理
- ✅ HTTPS 强制（生产环境）
- ✅ 环境变量隔离
- ✅ SQL 注入防护（Drizzle ORM）

---

## 📱 移动端支持

- 响应式布局（Tailwind CSS）
- 触摸优化
- 移动端适配的 UI 组件
- 语音输入支持
- 流式输出优化

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目仅供学习和参考使用。

---

## 🆘 技术支持

如有问题，请：

1. 查看 [文档](./CLOUD_DEPLOYMENT_GUIDE.md)
2. 提交 Issue
3. 联系技术支持

---

## 📊 开发计划

- [ ] 支持更多命理流派
- [ ] 添加用户评价系统
- [ ] 支持命理报告导出
- [ ] 添加用户社区功能
- [ ] 支持多语言

---

## 🌟 致谢

- [Next.js](https://nextjs.org/)
- [DeepSeek](https://platform.deepseek.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️**

Made with ❤️ by [天机阁团队]

</div>
