#!/bin/bash

# 天机阁项目部署脚本（支持云部署和本地部署）

set -e

echo "========================================"
echo "  天机阁 - 项目部署脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示菜单
show_menu() {
    echo -e "${BLUE}请选择部署方式：${NC}"
    echo "1) Vercel 云部署（推荐）"
    echo "2) Docker 本地部署"
    echo "3) 传统 VPS 部署"
    echo "4) 仅安装依赖"
    echo "5) 仅构建项目"
    echo "6) 查看部署状态"
    echo "0) 退出"
    echo ""
}

# 检查 pnpm 是否安装
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}pnpm 未安装，正在安装...${NC}"
        npm install -g pnpm
        echo -e "${GREEN}pnpm 安装完成${NC}"
    else
        echo -e "${GREEN}pnpm 已安装${NC}"
    fi
}

# 检查环境变量
check_env() {
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}.env.local 文件不存在${NC}"
        echo "是否从 .env.example 创建环境变量文件？(y/n)"
        read -r create_env
        if [ "$create_env" = "y" ] || [ "$create_env" = "Y" ]; then
            cp .env.example .env.local
            echo -e "${GREEN}已创建 .env.local 文件${NC}"
            echo -e "${YELLOW}请编辑 .env.local 文件并填写配置${NC}"
            echo "按任意键继续..."
            read -n 1
            nano .env.local
        else
            echo -e "${RED}无法继续部署，请先配置环境变量${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}环境变量文件已存在${NC}"
    fi
}

# 安装依赖
install_deps() {
    echo ""
    echo -e "${YELLOW}正在安装依赖...${NC}"
    pnpm install
    echo -e "${GREEN}依赖安装完成${NC}"
}

# 构建项目
build_project() {
    echo ""
    echo -e "${YELLOW}正在构建项目...${NC}"
    pnpm build
    echo -e "${GREEN}项目构建完成${NC}"
}

# Vercel 云部署
deploy_vercel() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Vercel 云部署${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # 检查是否安装了 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Vercel CLI 未安装，正在安装...${NC}"
        pnpm add -g vercel
        echo -e "${GREEN}Vercel CLI 安装完成${NC}"
    fi

    # 检查是否已登录
    if ! vercel whoami &> /dev/null; then
        echo -e "${YELLOW}请先登录 Vercel${NC}"
        vercel login
    fi

    echo -e "${YELLOW}准备部署到 Vercel...${NC}"
    echo ""
    echo "部署选项："
    echo "1) 预览部署（Preview）"
    echo "2) 生产部署（Production）"
    echo ""
    read -p "请选择 (1/2): " deploy_type

    if [ "$deploy_type" = "1" ]; then
        echo -e "${YELLOW}开始预览部署...${NC}"
        vercel
    elif [ "$deploy_type" = "2" ]; then
        echo -e "${YELLOW}开始生产部署...${NC}"
        vercel --prod
    else
        echo -e "${RED}无效的选择${NC}"
        exit 1
    fi

    echo -e "${GREEN}部署完成！${NC}"
    echo ""
    echo "后续操作："
    echo "1. 在 Vercel Dashboard 中配置环境变量"
    echo "2. 创建 Vercel Postgres 数据库"
    echo "3. 配置自定义域名（可选）"
    echo ""
    echo "详细文档请查看: CLOUD_DEPLOYMENT_GUIDE.md"
}

# Docker 部署
deploy_docker() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Docker 部署${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker 未安装，请先安装 Docker${NC}"
        echo "安装命令：curl -fsSL https://get.docker.com | sh"
        exit 1
    fi

    # 检查 docker-compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Docker Compose 未安装，正在安装...${NC}"
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}Docker Compose 安装完成${NC}"
    fi

    echo -e "${YELLOW}检查环境变量...${NC}"
    check_env

    echo -e "${YELLOW}构建 Docker 镜像...${NC}"
    docker-compose build

    echo -e "${YELLOW}启动服务...${NC}"
    docker-compose up -d

    echo -e "${GREEN}服务已启动${NC}"
    echo ""
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
    echo "重启服务: docker-compose restart"
}

# 传统 VPS 部署
deploy_vps() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  传统 VPS 部署${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    echo -e "${YELLOW}此部署方式适用于传统 VPS 服务器${NC}"
    echo "详细步骤请查看: PRODUCTION_DEPLOYMENT_GUIDE.md"
    echo ""
    echo "快速开始："
    echo "1. 安装 Node.js 24"
    echo "2. 安装 PostgreSQL"
    echo "3. 安装 PM2"
    echo "4. 配置环境变量"
    echo "5. 运行: pnpm build && pm2 start npm --name 'tianjige' -- start"
    echo ""

    read -p "是否查看详细文档？(y/n): " view_docs
    if [ "$view_docs" = "y" ] || [ "$view_docs" = "Y" ]; then
        cat PRODUCTION_DEPLOYMENT_GUIDE.md
    fi
}

# 查看部署状态
check_status() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  部署状态检查${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # 检查是否有 Vercel 项目
    if command -v vercel &> /dev/null && vercel whoami &> /dev/null; then
        echo -e "${GREEN}✓ Vercel 已登录${NC}"
        echo ""
        echo "Vercel 项目信息："
        vercel list
    else
        echo -e "${YELLOW}○ Vercel 未登录或未安装${NC}"
    fi

    # 检查 Docker 容器
    if command -v docker &> /dev/null; then
        echo ""
        echo "Docker 容器状态："
        docker-compose ps 2>/dev/null || echo "未发现 Docker Compose 项目"
    fi

    # 检查 PM2 进程
    if command -v pm2 &> /dev/null; then
        echo ""
        echo "PM2 进程状态："
        pm2 list 2>/dev/null || echo "未发现 PM2 进程"
    fi
}

# 主循环
main() {
    check_pnpm

    while true; do
        show_menu
        read -p "请输入选项 (0-6): " choice

        case $choice in
            1)
                deploy_vercel
                ;;
            2)
                deploy_docker
                ;;
            3)
                deploy_vps
                ;;
            4)
                install_deps
                ;;
            5)
                build_project
                ;;
            6)
                check_status
                ;;
            0)
                echo -e "${GREEN}再见！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效的选项，请重新选择${NC}"
                ;;
        esac

        echo ""
        read -p "按任意键继续..."
        read -n 1
        clear
    done
}

# 启动主程序
main
