#!/bin/bash

# 数据库初始化脚本
set -e

echo "🚀 正在初始化本地数据库..."

# 检查是否安装了 psql
if ! command -v psql &> /dev/null; then
    echo "❌ psql 未安装，请先安装 PostgreSQL 并添加到 PATH"
    exit 1
fi

# 从环境变量解析数据库配置
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 请先在 .env.local 中设置 DATABASE_URL"
    echo "格式: postgresql://用户名:密码@主机:端口/数据库名"
    exit 1
fi

# 解析数据库连接字符串
DB_URL=$(echo $DATABASE_URL | sed 's/postgresql:\/\///')
DB_USER=$(echo $DB_URL | sed 's/@.*//')
DB_HOST_PORT=$(echo $DB_URL | sed "s/$DB_USER@//" | sed 's/\/.*//')
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^/]*\)$/\1/')

echo "📊 数据库信息:"
echo "   数据库名: $DB_NAME"
echo "   主机:端口: $DB_HOST_PORT"
echo "   用户名: $DB_USER"

# 创建数据库（如果不存在）
echo "📝 创建数据库..."
psql -h ${DB_HOST_PORT%:*} -p ${DB_HOST_PORT#*:} -U ${DB_USER%:*} -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h ${DB_HOST_PORT%:*} -p ${DB_HOST_PORT#*:} -U ${DB_USER%:*} -c "CREATE DATABASE \"$DB_NAME\";"

echo "✅ 数据库初始化完成！"

# 运行 Drizzle 迁移
echo "🔄 运行数据库迁移..."
pnpm db:push

echo "🎉 所有设置完成！现在可以启动开发服务器了"