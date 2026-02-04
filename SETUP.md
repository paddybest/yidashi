# 本地数据库设置指南

## 🚀 快速开始

### 1. 安装 PostgreSQL

如果你还没有安装 PostgreSQL，请先安装：

**Windows:**
- 下载 PostgreSQL: https://www.postgresql.org/download/windows/
- 安装时记住设置的密码（默认: postgres）

**MacOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. 初始化数据库

项目已配置好本地 PostgreSQL，运行以下命令初始化：

```bash
# 运行初始化脚本
./scripts/init-database.sh

# 或手动执行
pnpm db:push
```

这将创建数据库表结构。

### 3. 环境变量配置

项目已经配置好本地数据库连接（在 `.env.local` 中）：

```env
DATABASE_URL=postgresql://postgres:tianjige_password@localhost:5432/tianjige
```

### 4. 启动项目

```bash
pnpm dev
```

## 📝 数据库脚本说明

### 创建数据库脚本 (`scripts/init-database.sh`)

- 自动检查并创建数据库
- 运行 Drizzle 迁移
- 创建必要的表结构

### 数据库迁移

```bash
# 推送 schema 变更到数据库
pnpm db:push

# 打开数据库管理界面
pnpm db:studio
```

## 🏗️ 数据库结构

项目包含 3 个主要表：

### users（用户表）
- 用户基本信息（手机号、姓名、生辰八字等）
- 验证码和过期时间
- 对话次数限制
- 激活状态

### conversations（对话表）
- 用户与 AI 的对话记录
- 包含角色、内容、时间戳
- 支持与命理相关的对话分类

### activation_list（激活表）
- 已激活用户白名单
- 激活人、备注等信息

## 🔧 故障排除

### 常见问题

1. **连接失败**
   - 检查 PostgreSQL 服务是否运行
   - 确认数据库连接字符串正确
   - 验证用户名和密码

2. **权限问题**
   - 确保数据库用户有创建数据库的权限
   - 检查 PostgreSQL 配置

3. **端口冲突**
   - 默认端口 5432 被占用
   - 修改 .env.local 中的端口

### 手动设置数据库

如果自动脚本失败，可以手动设置：

```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE tianjige;

-- 连接到新数据库
\c tianjige;

-- 运行迁移（项目会自动创建表）
-- 回到项目目录运行 pnpm db:push
```

## 🌐 生产环境部署

对于生产环境，建议：

1. 使用云数据库服务（如 RDS、Supabase）
2. 配置连接池
3. 设置适当的备份策略
4. 启用 SSL 连接

示例生产环境配置：
```env
DATABASE_URL=postgresql://user:password@prod-db:5432/tianjige?sslmode=require
```

## 📊 Drizzle ORM 项目优势

- 类型安全：完整的 TypeScript 支持
- 自动迁移：schema 变更自动同步到数据库
- 开发友好：提供 Studio 管理界面
- 标准化 SQL：使用标准 PostgreSQL 功能