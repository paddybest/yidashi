# 天机阁项目代码包

## 📦 下载信息

- **文件名**: `tianjige-project.tar.gz`
- **文件大小**: 327 KB
- **包含内容**: 完整的项目源代码、配置文件、部署脚本
- **排除内容**: `node_modules`、`.next`、`.git`、日志文件

## 📋 包含的主要文件

### 核心代码
- `src/app/` - Next.js 应用页面和 API 路由
- `src/components/` - UI 组件（基于 shadcn/ui）
- `src/lib/` - 工具函数和支付服务
- `src/storage/` - 数据库操作和模型

### 配置文件
- `.env.example` - 环境变量配置模板
- `.env.local` - 本地环境变量（包含示例配置）
- `package.json` - 项目依赖
- `tsconfig.json` - TypeScript 配置
- `Dockerfile` - Docker 镜像配置
- `docker-compose.yml` - Docker 编排配置
- `nginx.conf` - Nginx 配置

### 部署文件
- `deploy.sh` - 自动化部署脚本
- `scripts/` - 构建和启动脚本

### 文档
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - 生产环境部署指南
- `FIXES_README.md` - 问题修复说明

## 🚀 快速开始

### 1. 解压文件

```bash
# 解压到当前目录
tar -xzf tianjige-project.tar.gz

# 或解压到指定目录
tar -xzf tianjige-project.tar.gz -C /path/to/your/project
```

### 2. 安装依赖

```bash
cd tianjige
pnpm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件（填入你的 API Key）
nano .env.local
```

必需的环境变量：

```env
# AI 模型配置
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 管理员密码
ADMIN_PASSWORD=your_secure_password

# 短信服务（可选）
SMS_ACCESS_KEY_ID=your_aliyun_key_id
SMS_ACCESS_KEY_SECRET=your_aliyun_secret
SMS_SIGN_NAME=天机阁
SMS_TEMPLATE_CODE=SMS_xxx

# 支付服务（可选）
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key

# 开发环境配置
SHOW_VERIFICATION_CODE=true
NODE_ENV=development
```

### 4. 启动开发服务器

```bash
# 方式 1：使用 pnpm
pnpm dev

# 方式 2：使用项目脚本
./scripts/dev.sh
```

应用将在 `http://localhost:5000` 启动

### 5. 生产环境部署

#### Docker 部署（推荐）

```bash
# 配置环境变量
cp .env.example .env.production
nano .env.production

# 使用 Docker Compose 启动
docker-compose up -d
```

#### 传统部署

```bash
# 构建项目
pnpm build

# 启动生产服务
pnpm start

# 或使用 PM2
pm2 start npm --name "tianjige" -- start
```

## 📝 项目功能

### 已实现功能
- ✅ 用户登录（手机号验证码）
- ✅ 命理分析（四柱八字、梅花易数、奇门遁甲、紫微斗数）
- ✅ 持续对话（流式输出）
- ✅ 管理后台（用户管理、激活）
- ✅ 支付服务（支付宝、微信支付）
- ✅ 短信服务（阿里云短信）
- ✅ 移动端适配
- ✅ 语音输入
- ✅ 路由保护

### 技术栈
- **前端**: Next.js 16 + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS 4
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL + Drizzle ORM
- **AI**: DeepSeek (流式输出)
- **支付**: 支付宝、微信支付
- **短信**: 阿里云短信

## 🔧 常见问题

### Q1: pnpm 安装失败？
A: 确保已安装 Node.js 24+，然后全局安装 pnpm：
```bash
npm install -g pnpm
```

### Q2: 如何获取 DeepSeek API Key？
A: 访问 https://platform.deepseek.com/ 注册并创建 API Key

### Q3: 如何测试支付功能？
A: 设置 `SHOW_VERIFICATION_CODE=true` 可以在开发环境测试模拟支付

### Q4: 如何配置短信服务？
A: 参考 `PRODUCTION_DEPLOYMENT_GUIDE.md` 中的阿里云短信申请步骤

## 📚 相关文档

- [生产环境部署指南](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [问题修复说明](./FIXES_README.md)

## 🆘 技术支持

如遇到问题，请提供：
- 操作系统版本
- Node.js 版本 (`node -v`)
- 错误日志
- 环境变量配置（隐藏敏感信息）

## 📄 许可证

本项目仅供学习和参考使用。

---

**下载日期**: 2026-01-22
**版本**: v1.0.0
