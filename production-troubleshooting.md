# 生产环境故障排除指南

## 🔍 问题诊断

### 当前问题：数据库连接超时

错误信息：`connect ETIMEDOUT 39.96.239.210:5432`

## 🛠️ 解决方案

### 1. 检查阿里云RDS代理配置

#### 在阿里云控制台中检查：
1. **RDS实例** → **数据库代理**
2. 确保代理状态为 **"运行中"**
3. 检查代理地址是否正确：`yidashi-proxy.rwlb.rds.aliyuncs.com`
4. 确保代理端口 `5432` 正常监听

#### 检查代理白名单：
1. RDS实例 → **设置** → **白名单**
2. 添加 Vercel 的 IP 地址段
3. 或者暂时设置为 `0.0.0.0/0`（不推荐生产环境）

### 2. 验证数据库连接

#### 使用阿里云CLI测试：
```bash
# 安装阿里云CLI
# aliyun rds DescribeDBProxy --DBInstanceId=your-instance-id

# 或者使用telnet测试
telnet yidashi-proxy.rwlb.rds.aliyuncs.com 5432
```

#### 使用其他工具测试：
```bash
# 使用psql（如果安装了）
psql "host=yidashi-proxy.rwlb.rds.aliyuncs.com port=5432 user=Yidashi password=Zxcvb135 dbname=yidashi_sql sslmode=require"
```

### 3. 临时解决方案

#### 如果代理暂时不可用：
1. 直接使用RDS实例地址（如果有公网访问）
2. 或者使用阿里云的VPC内网地址

#### 配置直接连接：
```env
# 临时使用直接连接（如果支持）
DATABASE_URL=postgresql://Yidashi:Zxcvb135@your-rds-public-endpoint:5432/yidashi_sql
```

### 4. 网络问题排查

#### 检查网络连通性：
```bash
# 测试域名解析
nslookup yidashi-proxy.rwlb.rds.aliyuncs.com

# 测试端口连通性
nc -zv yidashi-proxy.rwlb.rds.aliyuncs.com 5432
```

#### 检查防火墙：
- 确认阿里云安全组允许 5432 端口
- 确认Vercel的IP不在黑名单

## 📋 Vercel 配置确认

### 确保Vercel环境变量正确：
1. 数据库URL
2. 短信服务配置
3. 其他必要配置

### 重新部署：
```bash
# 使用Vercel CLI
vercel --prod

# 或者通过Web界面重新部署
```

## 🔄 测试流程

### 1. 数据库连接测试
```javascript
// 在代码中添加测试
try {
  await db.query('SELECT 1');
  console.log('✅ 数据库连接正常');
} catch (error) {
  console.error('❌ 数据库连接失败:', error);
}
```

### 2. 短信服务测试
```javascript
// 测试短信发送
const result = await sendSMS('13800138000', '123456');
console.log('短信发送结果:', result);
```

### 3. 完整API测试
```bash
# 测试整个流程
curl -X POST https://your-domain.vercel.app/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"13800138000"}'
```

## 🚀 下一步行动

1. **检查阿里云RDS代理状态**
2. **确认网络连接**
3. **如果问题持续，考虑使用直接连接**
4. **测试完成后再部署到Vercel**

## 💡 注意事项

1. 生产环境不要使用测试数据
2. 确保所有敏感信息都通过环境变量配置
3. 定期备份数据库
4. 监控API性能和错误率