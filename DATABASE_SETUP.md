# 数据库安装指南（本地开发）

## 📋 步骤 1: 安装 PostgreSQL

### Windows 用户（推荐）

1. **下载 PostgreSQL**
   - 访问: https://www.postgresql.org/download/windows/
   - 下载 Windows x86-64 版本

2. **安装 PostgreSQL**
   - 运行安装程序
   - 选择数据目录（留默认即可）
   - 设置密码：**tianjige_password**
   - 端口：5432（留默认）
   - 数据目录：留默认
   - 安装 Stack Builder：取消勾选
   - 点击下一步完成安装

3. **验证安装**
   - 开始菜单 → PostgreSQL 16 → pgAdmin 4
   - 或使用命令行：`psql -U postgres`

### Linux 用户 (Ubuntu/Debian)

```bash
# 1. 更新包列表
sudo apt update

# 2. 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 3. 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. 设置密码
sudo -u postgres psql
\password postgres
输入密码: tianjige_password
\q

# 5. 创建数据库
sudo -u postgres createdb tianjige
```

### macOS 用户

```bash
# 使用 Homebrew
brew install postgresql

# 启动服务
brew services start postgresql

# 设置密码
psql -U postgres
\password postgres
输入密码: tianjige_password
\q

# 创建数据库
createdb tianjige
```

## 🚀 步骤 2: 配置项目

### 检查数据库连接

项目已经配置好了本地数据库连接，在 `.env.local` 中：

```env
PGDATABASE_URL=postgresql://postgres:tianjige_password@localhost:5432/tianjige
```

### 初始化数据库

安装 PostgreSQL 后，运行以下命令：

```bash
# 在项目根目录运行
pnpm db:push
```

这会创建所有必要的表结构。

## 🐛 步骤 3: 测试安装

### 1. 检查 PostgreSQL 服务

```bash
# Windows
net start | findstr postgres

# Linux/macOS
sudo systemctl status postgresql
```

### 2. 连接到数据库

```bash
# 使用 psql 命令行工具
psql -U postgres -d tianjige
```

如果能进入 PostgreSQL 命令行，说明连接成功。

### 3. 运行项目

```bash
pnpm dev
```

然后访问 http://localhost:3001

## 📊 如果遇到问题

### 问题 1: 连接被拒绝 (ECONNREFUSED)

```bash
# 检查 PostgreSQL 是否运行
# Windows
net start

# Linux/macOS
sudo systemctl status postgresql

# 如果没有运行，启动它
# Windows
net start postgresql

# Linux/macOS
sudo systemctl start postgresql
```

### 问题 2: 密码错误

1. 重置密码：
   ```bash
   # Windows
   "C:\Program\PostgreSQL\16\bin\psql.exe" -U postgres

   # Linux/macOS
   sudo -u postgres psql
   ```

2. 在 PostgreSQL 命令行中：
   ```sql
   \password postgres
   输入新密码: tianjige_password
   \q
   ```

### 问题 3: 端口被占用

```bash
# 检查端口
netstat -ano | findstr :5432

# 如果被占用，修改 drizzle.config.ts 中的端口号
```

### 问题 4: 使用 Docker

如果你使用 Docker，可以运行：

```bash
# 拉取镜像
docker run --name postgres-dev -e POSTGRES_PASSWORD=tianjige_password -p 5432:5432 -d postgres

# 连接到容器
docker exec -it postgres-dev psql -U postgres
```

## 🔧 高级配置

### 使用 pgAdmin 管理数据库

1. 安装 pgAdmin（随 PostgreSQL 安装）
2. 使用 postgres/tianjige_password 登录
3. 查看和管理数据库

### 使用 DBeaver 或其他 GUI 工具

1. 连接到: localhost:5432
2. 数据库: tianjige
3. 用户名: postgres
4. 密码: tianjige_password

## 📝 数据库脚本参考

如果你需要手动创建数据库：

```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE tianjige;

-- 连接到新数据库
\c tianjige;

-- 查看表（运行迁移后）
\dt

-- 退出
\q
```