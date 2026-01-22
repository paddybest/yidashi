# 使用官方 Node.js 镜像作为基础镜像
FROM node:24-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装项目依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建项目
RUN pnpm build

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 启动应用
CMD ["pnpm", "start"]
