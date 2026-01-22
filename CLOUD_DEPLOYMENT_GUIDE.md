# 天机阁 - 云部署指南（Vercel）

本文档介绍如何将天机阁项目部署到 Vercel 云平台。

## 📋 目录

1. [为什么选择 Vercel](#为什么选择-vercel)
2. [准备工作](#准备工作)
3. [部署步骤](#部署步骤)
4. [环境变量配置](#环境变量配置)
5. [数据库配置](#数据库配置)
6. [域名配置](#域名配置)
7. [监控和日志](#监控和日志)
8. [常见问题](#常见问题)

---

## 为什么选择 Vercel

✅ **Next.js 官方推荐** - Vercel 是 Next.js 的创造者，提供最佳支持
✅ **零配置部署** - 自动检测 Next.js 项目，无需额外配置
✅ **全球 CDN** - 自动分发到全球节点，访问速度快
✅ **免费 SSL** - 自动配置 HTTPS 证书
✅ **自动构建** - Git 推送自动触发构建和部署
✅ **数据库集成** - 提供 Vercel Postgres 服务
✅ **环境变量管理** - 安全的环境变量管理
✅ **实时日志** - 实时查看应用日志

---

## 准备工作

### 1. 账号准备

- [x] GitHub 账号（用于代码托管）
- [x] Vercel 账号（使用 GitHub 登录即可）
- [x] DeepSeek API Key
- [ ] 阿里云短信服务（可选）
- [ ] 支付宝/微信支付（可选）

### 2. 本地开发环境

确保本地环境可以正常运行：

```bash
# 克隆代码
git clone your-repo-url tianjige
cd tianjige

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必需的配置

# 本地测试
pnpm dev
```

---

## 部署步骤

### 方式 1：通过 Vercel 网站部署（推荐）

#### 步骤 1：推送代码到 GitHub

```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub 仓库后推送
git remote add origin your-github-repo-url
git push -u origin main
```

#### 步骤 2：导入项目到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库
4. 点击 "Import"

#### 步骤 3：配置项目

**项目设置**：
- **Project Name**: `tianjige`（或其他名称）
- **Framework Preset**: Next.js（自动检测）
- **Root Directory**: `./`（根目录）
- **Build Command**: `pnpm build`（自动检测）
- **Output Directory**: `.next`（自动检测）
- **Install Command**: `pnpm install`（自动检测）

**环境变量**：
在 "Environment Variables" 部分添加以下必需的环境变量：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
ADMIN_PASSWORD=your_secure_password
SHOW_VERIFICATION_CODE=false
NODE_ENV=production
```

#### 步骤 4：选择部署区域

- **Region**: `Hong Kong` (hkg1) - 推荐（访问速度快）
- 其他可选：Singapore (sin1)、Tokyo (hnd1)

#### 步骤 5：点击 Deploy

点击 "Deploy" 按钮开始部署，等待 3-5 分钟即可完成。

---

### 方式 2：使用 Vercel CLI 部署

#### 安装 Vercel CLI

```bash
# 全局安装 Vercel CLI
pnpm add -g vercel

# 登录 Vercel
vercel login
```

#### 部署项目

```bash
# 进入项目目录
cd tianjige

# 首次部署（会提示配置环境变量）
vercel

# 生产环境部署
vercel --prod
```

---

## 环境变量配置

### 必需的环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# ========== AI 模型配置 ==========
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com

# ========== 管理员配置 ==========
ADMIN_PASSWORD=your_secure_password_here

# ========== 安全配置 ==========
SHOW_VERIFICATION_CODE=false
NODE_ENV=production
```

### 可选的环境变量

#### 阿里云短信

```env
SMS_ACCESS_KEY_ID=LTAI5txxxxxxx
SMS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxx
SMS_SIGN_NAME=天机阁
SMS_TEMPLATE_CODE=SMS_123456789
```

#### 微信支付

```env
WECHAT_PAY_MCH_ID=1234567890
WECHAT_PAY_API_KEY=your_32_char_api_key
WECHAT_PAY_NOTIFY_URL=https://your-domain.vercel.app/api/payment/callback/wechat
```

#### 支付宝

```env
ALIPAY_APP_ID=2021001234567890
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_NOTIFY_URL=https://your-domain.vercel.app/api/payment/callback/alipay
```

#### 域名配置

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

---

## 数据库配置

### 推荐：使用 Vercel Postgres

#### 步骤 1：创建 Vercel Postgres 数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 "Storage" 标签
4. 点击 "Create Database"
5. 选择 "Postgres"
6. 填写数据库名称：`tianjige`
7. 点击 "Create"

#### 步骤 2：连接数据库

创建成功后，Vercel 会自动添加以下环境变量：

```env
POSTGRES_URL=postgresql://user:password@host:port/database
POSTGRES_PRISMA_URL=postgresql://user:password@host:port/database?pgbouncer=true
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:port/database
POSTGRES_USER=user
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database
```

#### 步骤 3：验证数据库连接

```bash
# 在 Vercel 项目中运行以下命令验证连接
vercel env pull .env.local
pnpm dev
```

### 备选方案：使用外部 PostgreSQL

如果你有外部 PostgreSQL 数据库，可以使用以下环境变量：

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## 域名配置

### 使用 Vercel 默认域名

部署完成后，Vercel 会自动提供一个免费域名：
```
https://your-project-name.vercel.app
```

### 自定义域名

#### 步骤 1：购买域名

在域名注册商处购买域名（如阿里云、腾讯云、Namecheap 等）。

#### 步骤 2：在 Vercel 中添加域名

1. 进入 Vercel 项目
2. 点击 "Settings" → "Domains"
3. 输入你的域名（如：`tianjige.com`）
4. 点击 "Add"

#### 步骤 3：配置 DNS

Vercel 会提供 DNS 配置信息，在你的域名注册商处添加：

```
类型    名称        值
A       @           76.76.21.21
CNAME   www         cname.vercel-dns.com
```

#### 步骤 4：验证 DNS

等待 DNS 生效（通常 10-30 分钟），Vercel 会自动配置 SSL 证书。

---

## 监控和日志

### 查看实时日志

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 "Logs" 标签
4. 可以查看实时日志和历史日志

### 查看 Analytics

Vercel 提供免费的 Analytics 功能：

- 访问量统计
- 页面性能
- 错误追踪
- Web Vitals

### 设置监控告警

1. 进入项目 "Settings"
2. 点击 "Alerts"
3. 配置告警规则：
   - 部署失败
   - 错误率过高
   - 响应时间过长

---

## 常见问题

### Q1: 部署失败，提示 "Build Error"

**解决方案**：
1. 检查 `package.json` 中的依赖是否正确
2. 确保所有依赖都已安装
3. 查看 Vercel 构建日志获取详细错误信息

### Q2: 环境变量不生效

**解决方案**：
1. 确保环境变量在 Vercel 项目设置中已添加
2. 环境变量名称必须与 `.env.example` 中的名称一致
3. 重新部署项目使环境变量生效

### Q3: 数据库连接失败

**解决方案**：
1. 检查 `POSTGRES_URL` 环境变量是否正确
2. 确保数据库已创建并可访问
3. 在 Vercel 中重新连接数据库

### Q4: 支付回调失败

**解决方案**：
1. 检查 `ALIPAY_NOTIFY_URL` 和 `WECHAT_PAY_NOTIFY_URL` 是否正确
2. 确保域名已正确配置 DNS
3. 支付宝和微信需要通过真实的域名验证（不能使用 .vercel.app）

### Q5: 如何回滚到之前版本

**解决方案**：
1. 进入 Vercel 项目
2. 点击 "Deployments"
3. 找到要回滚的部署
4. 点击右上角 "..." → "Promote to Production"

### Q6: 如何配置自定义 Node 版本

**解决方案**：
在 `package.json` 中添加：

```json
{
  "engines": {
    "node": ">=18.17.0"
  }
}
```

---

## 成本估算

### Vercel 免费版

| 功能 | 限制 |
|------|------|
| 部署次数 | 无限 |
| 带宽 | 100GB/月 |
| 构建时间 | 6,000 分钟/月 |
| 函数执行时间 | 10 秒/次 |
| 数据库 | Hobby Plan 免费（512MB 存储） |

### 付费版

- **Pro Plan**: $20/月
  - 1TB 带宽
  - 无限构建时间
  - 团队协作

### 数据库成本

- **Vercel Postgres Hobby Plan**: 免费（512MB 存储）
- **Vercel Postgres Pro Plan**: $20/月（8GB 存储）

### 总成本

- **免费版**: $0/月（适合测试和小规模使用）
- **Pro 版**: $40/月（生产环境推荐）

---

## 下一步

部署完成后，你可以：

1. [ ] 配置自定义域名
2. [ ] 设置监控告警
3. [ ] 集成真实支付服务
4. [ ] 配置短信服务
5. [ ] 设置数据库备份
6. [ ] 优化性能
7. [ ] 配置 CDN

---

## 相关链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

---

## 技术支持

如遇到问题，请提供：

- Vercel 项目链接
- 部署日志
- 错误截图
- 环境变量配置（隐藏敏感信息）

---

**文档版本**: v1.0.0
**更新日期**: 2026-01-22
