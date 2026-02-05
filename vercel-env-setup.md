# Vercel 环境变量配置指南

## 🔧 需要在 Vercel Dashboard 中配置的环境变量

### 1. 数据库连接
```env
DATABASE_URL=postgresql://Yidashi:Zxcvb135@yidashi-proxy.rwlb.rds.aliyuncs.com:5432/yidashi_sql
```

### 2. 阿里云短信服务
```env
SMS_ACCESS_KEY_ID=your_access_key_id
SMS_ACCESS_KEY_SECRET=your_access_key_secret
SMS_SIGN_NAME=天机阁
SMS_TEMPLATE_CODE=your_template_code
```

### 3. 环境配置
```env
NODE_ENV=production
SHOW_VERIFICATION_CODE=false
```

### 4. 支付宝配置（如果需要真实支付）
```env
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_alipay_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payment/callback/alipay
```

## 📋 配置步骤

### 1. 打开 Vercel Dashboard
- 进入你的项目页面
- 点击 "Settings" → "Environment Variables"

### 2. 添加变量
1. 点击 "Add Environment Variable"
2. 输入变量名和值
3. 点击 "Save"

### 3. 重新部署
配置完成后，需要重新部署项目：
```bash
vercel --prod
```

## 🎯 重要提醒

1. **不要在代码中硬编码敏感信息**
2. **生产环境必须使用真实短信服务**
3. **测试时可以先使用生产数据库**
4. **配置修改后必须重新部署**

## 🔍 测试方法

配置完成后，可以通过以下方式测试：

```bash
# 测试短信发送（替换你的域名）
curl -X POST https://your-domain.vercel.app/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000"}'
```

## 🚀 部署建议

1. **先在测试环境验证**
2. **确认所有配置正确**
3. **生产环境部署**
4. **监控日志和性能**