# 开发环境数据库启动指南

## 🎯 方案 1：本地 PostgreSQL - 按需启动（推荐）

### 1. 启动 PostgreSQL 服务

#### Windows 用户：
```bash
# 手动启动（推荐）
net start postgresql

# 查看服务状态
net start | findstr postgresql
```

#### 开机自动启动（可选）：
```bash
# 设置为自动启动
sc config postgresql start=auto
```

### 2. 使用项目脚本
```bash
# 在项目目录运行
pnpm dev
```

### 3. 使用后关闭
```bash
# 开发完成后关闭 PostgreSQL 服务
net stop postgresql
```

### 4. 什么时候需要启动？
- **开发时**：运行 `pnpm dev` 之前启动
- **测试时**：需要访问 http://localhost:3001
- **不使用时**：关闭服务节省资源

## 🌐 方案 2：阿里云 RDS 数据库

### 1. 创建阿里云数据库
1. 登录 [阿里云控制台](https://console.aliyun.com/)
2. 进入 "云数据库 RDS"
3. 点击 "创建实例"
4. 选择 MySQL/PostgreSQL（推荐 PostgreSQL）
5. 配置：
   - 实例类型：共享型
   - 地区：选择你所在地区
   - 规格：1核2GB（入门级）
   - 存储：20GB SSD
   - 账号：自定义用户名和密码

### 2. 获取连接信息
创建完成后记录：
- 主机地址（Host）
- 端口（Port）
- 用户名（Username）
- 密码（Password）
- 数据库名

### 3. 配置项目
```env
# .env.local
DATABASE_URL=postgresql://用户名:密码@主机地址:端口/数据库名
```

### 4. 初始化数据库
```bash
# 连接数据库并创建表
psql -h 主机地址 -p 端口 -U 用户名 -d 数据库名 -f scripts/create-tables.sql
```

## 🚀 方案 3：Docker 按需启动

### 1. 使用 Docker 运行 PostgreSQL
```bash
# 启动 PostgreSQL 容器
docker run --name my-postgres \
  -e POSTGRES_PASSWORD=tianjige_password \
  -e POSTGRES_DB=tianjige \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:16

# 查看容器状态
docker ps

# 停止容器
docker stop my-postgres

# 启动容器
docker start my-postgres
```

## 📊 各方案对比

| 方案 | 成本 | 便利性 | 数据安全 | 启动速度 | 推荐度 |
|------|------|--------|----------|----------|--------|
| 本地按需启动 | 免费 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 阿里云 RDS | ¥50+/月 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Docker 按需 | 免费 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 💡 推荐选择

### 如果你：
- **不想24小时开机** → **方案1：本地按需启动**
- **需要团队协作** → **方案2：阿里云RDS**
- **喜欢容器化** → **方案3：Docker**

## 🎯 最佳实践

1. **开发时**：使用本地按需启动
2. **测试时**：可以考虑云数据库
3. **生产时**：必须使用云数据库

记住：开发环境完全不需要24小时运行！按需启动既省电又安全。