# 天机阁 - 生产环境部署指南

本文档提供了完整的生产环境部署方案，包括阿里云短信、微信支付、支付宝的接入步骤。

## 📋 目录

1. [前置准备](#前置准备)
2. [阿里云短信申请](#阿里云短信申请)
3. [微信支付申请](#微信支付申请)
4. [支付宝申请](#支付宝申请)
5. [环境配置](#环境配置)
6. [服务器部署](#服务器部署)
7. [安全加固](#安全加固)

---

## 前置准备

### 必需账号
- [x] 阿里云账号（用于短信服务）
- [x] 微信支付商户号
- [x] 支付宝开放平台账号

### 必需服务
- [ ] 域名（已购买并解析）
- [ ] SSL 证书（可使用 Let's Encrypt 免费）
- [ ] VPS 服务器（推荐 2核4G，系统 Ubuntu 22.04）

---

## 阿里云短信申请

### 步骤 1：开通短信服务
1. 访问 [阿里云短信服务](https://www.aliyun.com/product/sms)
2. 点击"立即开通"
3. 完成实名认证（个人或企业）
4. 充值金额（至少 100 元）

### 步骤 2：获取 AccessKey
1. 访问 [阿里云 AccessKey 管理](https://ram.console.aliyun.com/manage/ak)
2. 创建 AccessKey
3. 记录以下信息：
   - **AccessKey ID**：类似 `LTAI5txxxxxxx`
   - **AccessKey Secret**：类似 `xxxxxxxxxxxxxxxxxxxxxxx`

### 步骤 3：创建短信签名
1. 访问 [短信签名管理](https://dysms.console.aliyun.com/dysms.htm#/sign)
2. 点击"添加签名"
3. 填写信息：
   - **签名名称**：天机阁
   - **签名来源**：已备案网站 / 已上线 App / 试用签名
   - **适用场景**：验证码 / 通知短信
4. 提交审核（通常 2 小时内通过）

### 步骤 4：创建短信模板
1. 访问 [短信模板管理](https://dysms.console.aliyun.com/dysms.htm#/template)
2. 点击"添加模板"
3. 填写信息：
   - **模板类型**：验证码
   - **模板名称**：天机阁验证码
   - **模板内容**：`您的验证码是${code}，5分钟内有效。`
   - **应用场景**：登录验证
4. 提交审核（通常 2 小时内通过）
5. 记录 **模板 CODE**：类似 `SMS_123456789`

### 步骤 5：测试短信
审核通过后，在阿里云控制台可以发送测试短信验证配置是否正确。

---

## 微信支付申请

### 步骤 1：注册商户号
1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/index.php/public/home)
2. 点击"成为商户"
3. 选择商户类型：
   - **个人**：小微商户（限额较低）
   - **企业**：普通商户（推荐，需要营业执照）
4. 填写资料并提交审核

### 步骤 2：获取商户信息
审核通过后，记录以下信息：
- **商户号（MCH_ID）**：类似 `1234567890`
- **商户 API 密钥（API_KEY）**：32位字符串，需要自行设置

#### 设置 API 密钥
1. 登录商户平台
2. 进入「账户中心」→「API 安全」
3. 点击"设置 API 密钥"
4. 自定义 32 位密钥（建议使用密码生成器）
5. 保存密钥（仅显示一次，务必妥善保管）

### 步骤 3：下载证书
1. 进入「账户中心」→「API 安全」
2. 点击"下载证书"
3. 解压证书包，包含以下文件：
   - `apiclient_cert.pem`（证书）
   - `apiclient_key.pem`（私钥）
   - `apiclient_cert.p12`（证书包）

### 步骤 4：配置支付目录
1. 进入「产品中心」→「开发配置」
2. 配置支付目录：`https://你的域名.com/api/payment/*`
3. 配置回调地址：`https://你的域名.com/api/payment/callback`

### 步骤 5：申请沙箱（用于测试）
1. 进入「产品中心」→「沙箱环境」
2. 获取沙箱商户号和 API 密钥
3. 使用沙箱环境进行开发测试

---

## 支付宝申请

### 步骤 1：创建应用
1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 注册/登录账号
3. 进入「控制台」→「网页&移动应用」
4. 点击"创建应用"
5. 选择应用类型：
   - **网页应用**：适合 H5 支付
   - **生活号**：适合小程序

### 步骤 2：获取应用信息
创建应用后，记录以下信息：
- **应用 ID（APPID）**：类似 `2021001234567890`

### 步骤 3：配置密钥

#### 方法 1：使用支付宝公钥（推荐）
1. 进入「应用详情」→「开发信息」
2. 点击"设置应用公钥"
3. 生成应用密钥对：
   - **应用私钥**：使用支付宝提供的工具生成
   - **应用公钥**：上传到支付宝
4. 获取 **支付宝公钥**

#### 生成密钥对的方法
```bash
# 使用支付宝提供的密钥生成工具
# 下载地址：https://opendocs.alipay.com/common/02kipl
```

### 步骤 4：签约产品
1. 进入「产品中心」
2. 搜索并签约：
   - **手机网站支付**
   - **电脑网站支付**
3. 提交审核

### 步骤 5：配置授权回调地址
1. 进入「应用详情」→「开发信息」
2. 配置授权回调地址：`https://你的域名.com/api/payment/callback`
3. 配置数据加密方式（推荐 AES）

### 步骤 6：申请沙箱
1. 进入「研发服务」→「沙箱环境」
2. 获取沙箱 APPID 和密钥
3. 使用沙箱环境进行测试

---

## 环境配置

### 1. 安装 Node.js 依赖

```bash
# 安装阿里云短信 SDK
pnpm add @alicloud/dysmsapi20170525 @alicloud/openapi-client

# 安装支付宝 SDK
pnpm add alipay-sdk

# 安装微信支付 SDK
pnpm add wechatpay-node-v3

# 安装其他依赖
pnpm add crypto qs
```

### 2. 创建 .env.production 文件

```env
# ========== AI 模型配置 ==========
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# ========== 管理员配置 ==========
ADMIN_PASSWORD=your_secure_admin_password_here

# ========== 阿里云短信配置 ==========
SMS_ACCESS_KEY_ID=your_aliyun_access_key_id
SMS_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
SMS_SIGN_NAME=天机阁
SMS_TEMPLATE_CODE=SMS_123456789

# ========== 微信支付配置 ==========
WECHAT_PAY_MCH_ID=your_wechat_mch_id
WECHAT_PAY_API_KEY=your_wechat_api_key
WECHAT_PAY_CERT_PATH=/path/to/apiclient_cert.pem
WECHAT_PAY_KEY_PATH=/path/to/apiclient_key.pem
WECHAT_PAY_CERT_P12_PATH=/path/to/apiclient_cert.p12
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/payment/callback/wechat

# ========== 支付宝配置 ==========
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment/callback/alipay

# ========== 安全配置 ==========
SHOW_VERIFICATION_CODE=false
NODE_ENV=production

# ========== 数据库配置 ==========
DATABASE_URL=postgresql://user:password@localhost:5432/tianjige

# ========== 域名配置 ==========
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---

## 服务器部署

### 步骤 1：服务器环境配置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2（进程管理）
sudo npm install -g pm2

# 安装 Git
sudo apt install -y git

# 安装 Certbot（SSL 证书）
sudo apt install -y certbot python3-certbot-nginx
```

### 步骤 2：配置 PostgreSQL

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE tianjige;
CREATE USER tianjige_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tianjige TO tianjige_user;
\q
```

### 步骤 3：部署应用代码

```bash
# 克隆代码
cd /var/www
git clone your-repo-url tianjige
cd tianjige

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 创建 .env.production
cp .env.example .env.production
nano .env.production  # 填入你的配置
```

### 步骤 4：配置 PM2

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tianjige',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/tianjige',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/tianjige/error.log',
    out_file: '/var/log/tianjige/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# 创建日志目录
sudo mkdir -p /var/log/tianjige

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 步骤 5：配置 Nginx

```bash
# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/tianjige
```

填入以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 日志
    access_log /var/log/nginx/tianjige_access.log;
    error_log /var/log/nginx/tianjige_error.log;

    # 反向代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:5000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/tianjige /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 6：配置 SSL 证书

```bash
# 使用 Certbot 申请 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 按照提示输入邮箱并同意条款
# 选择是否自动重定向 HTTP 到 HTTPS（建议选择 2）
```

证书会自动配置到 Nginx，并设置自动续期。

### 步骤 7：配置防火墙

```bash
# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### 步骤 8：设置定时任务

```bash
# 备份数据库
crontab -e

# 添加以下行（每天凌晨 2 点备份数据库）
0 2 * * * pg_dump -U tianjige_user tianjige > /backup/tianjige_$(date +\%Y\%m\%d).sql
```

---

## 安全加固

### 1. 修改默认端口

```bash
# 修改 SSH 端口（建议改为 2222）
sudo nano /etc/ssh/sshd_config
# 修改 Port 22 为 Port 2222
sudo systemctl restart ssh
```

### 2. 禁止 root 登录

```bash
sudo nano /etc/ssh/sshd_config
# 设置 PermitRootLogin no
sudo systemctl restart ssh
```

### 3. 安装 fail2ban（防止暴力破解）

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. 配置自动更新

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 监控和维护

### 查看应用日志

```bash
# PM2 日志
pm2 logs tianjige

# Nginx 日志
sudo tail -f /var/log/nginx/tianjige_error.log

# 应用错误日志
sudo tail -f /var/log/tianjige/error.log
```

### 重启应用

```bash
# 重启应用
pm2 restart tianjige

# 重载 Nginx
sudo systemctl reload nginx
```

### 数据库备份

```bash
# 手动备份
pg_dump -U tianjige_user tianjige > backup.sql

# 恢复数据库
psql -U tianjige_user tianjige < backup.sql
```

---

## 成本估算

| 项目 | 费用 | 备注 |
|-----|------|------|
| 阿里云短信 | 0.045元/条 | 需充值 100 元起 |
| 微信支付 | 免费 | 个人商户免手续费 |
| 支付宝 | 免费 | 个人商户免手续费 |
| VPS 服务器 | 200-500元/月 | 2核4G 配置 |
| 域名 | 50-100元/年 | .com 域名 |
| SSL 证书 | 免费 | Let's Encrypt |

---

## 下一步

完成上述配置后，请联系我进行以下代码改造：

1. [ ] 集成阿里云短信服务
2. [ ] 集成微信支付
3. [ ] 集成支付宝
4. [ ] 测试支付流程
5. [ ] 部署上线

---

## 常见问题

### Q1: 短信签名审核不通过？
A: 检查签名名称是否符合规范，需要与网站/App 名称一致。

### Q2: 支付回调失败？
A: 检查回调地址是否正确配置，服务器是否可以访问外网。

### Q3: HTTPS 证书申请失败？
A: 确保域名已正确解析到服务器 IP，等待 DNS 生效（通常 10-30 分钟）。

### Q4: 如何测试支付？
A: 使用微信支付沙箱环境或支付宝沙箱环境进行测试。

---

## 联系支持

如遇到问题，请提供以下信息：
- 服务器环境：`uname -a`
- Node.js 版本：`node -v`
- 错误日志：`pm2 logs tianjige --lines 50`
- Nginx 日志：`sudo tail -f /var/log/nginx/tianjige_error.log`
