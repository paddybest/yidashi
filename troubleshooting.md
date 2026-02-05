# 天机阁系统故障排除指南

## 问题1：手机号验证码发送失败

### 现象描述
- 输入手机号后点击"发送验证码"
- 显示"发送中..."并长时间卡住
- 最后提示"发送失败，请重试"

### 原因分析
1. **阿里云短信服务配置不完整**
   - 缺少 `SMS_ACCESS_KEY_ID`
   - 缺少 `SMS_ACCESS_KEY_SECRET`
   - 缺少 `SMS_SIGN_NAME`
   - 缺少 `SMS_TEMPLATE_CODE`

2. **数据库连接问题**
   - PostgreSQL数据库未启动
   - 数据库连接字符串配置错误

### 解决方案

#### 方案1：配置阿里云短信服务（推荐生产环境）

1. 登录阿里云控制台，开通短信服务
2. 创建AccessKey（主账户或RAM用户）
3. 申请短信签名和模板
4. 在 `.env.local` 文件中添加：

```env
# 阿里云短信配置
SMS_ACCESS_KEY_ID=your_access_key_id
SMS_ACCESS_KEY_SECRET=your_access_key_secret
SMS_SIGN_NAME=天机阁
SMS_TEMPLATE_CODE=SMS_123456789
```

#### 方案2：使用模拟模式（开发环境）

在 `.env.local` 文件中确保：

```env
# 本地开发环境使用模拟短信
SHOW_VERIFICATION_CODE=true
NODE_ENV=development
```

#### 方案3：检查数据库连接

1. 确保PostgreSQL数据库正在运行
2. 验证数据库连接字符串：

```env
DATABASE_URL=postgresql://postgres:tianjige_password@localhost:5432/tianjige
```

3. 运行数据库迁移：

```bash
pnpm db:push
```

## 问题2：购买服务界面闪退

### 现象描述
- 点击"立即购买服务"后
- 购买界面短暂显示
- 立刻跳转回首页

### 原因分析
1. **用户未登录状态**
   - sessionStorage中没有userId
   - Cookie中也没有userId
   - 中间件检测到未登录并重定向

2. **中间件拦截**
   - `middleware.ts.bak` 文件中的中间件会保护 `/purchase` 路由

### 解决方案

#### 方案1：确保正确登录

1. **正常登录流程**：
   - 输入手机号
   - 发送并输入验证码
   - 登录成功后跳转到 `/chat`
   - 然后访问 `/purchase` 页面

2. **检查登录状态**：
   - 打开开发者工具
   - 在Application → Storage → Session Storage中查看是否有userId
   - 在Application → Cookies中查看是否有user_id cookie

#### 方案2：启用中间件（长期解决方案）

1. 将 `middleware.ts.bak` 重命名为 `middleware.ts`
2. 中间件会自动保护需要登录的页面

```bash
mv src/middleware.ts.bak src/middleware.ts
```

#### 方案3：临时禁用中间件（开发调试）

如果需要临时禁用中间件：
1. 删除或重命名 `middleware.ts` 文件
2. 或者修改中间件配置，移除 `/purchase` 路由

## 调试步骤

### 1. 检查环境变量
```bash
# 查看当前环境变量
cat .env.local

# 检查是否包含所有必要的配置
grep -E "(SMS_|DATABASE_URL|SHOW_VERIFICATION_CODE)" .env.local
```

### 2. 检查数据库连接
```bash
# 启动开发服务器
pnpm dev

# 在浏览器中访问 /api/auth/send-code
# 观察控制台输出
```

### 3. 检查用户登录状态
```javascript
// 在浏览器控制台中执行
console.log('sessionStorage userId:', sessionStorage.getItem('userId'));
console.log('cookie user_id:', document.cookie.match(/(^| )user_id=([^;]+)/)?.[2]);
```

### 4. 查看服务端日志
```bash
# 查看Next.js日志
pnpm dev

# 查看PostgreSQL日志（如果需要）
psql -U postgres -d tianjige -c "SELECT * FROM users ORDER BY created_at DESC LIMIT 5;"
```

## 预防措施

1. **开发环境配置**：
   - 使用 `.env.local` 存放开发配置
   - 设置 `SHOW_VERIFICATION_CODE=true` 便于调试

2. **生产环境配置**：
   - 使用正式的阿里云短信服务
   - 配置完整的数据库连接
   - 启用中间件保护

3. **错误监控**：
   - 检查浏览器控制台的错误信息
   - 查看服务端日志
   - 添加适当的错误处理和用户提示

## 常见问题Q&A

**Q: 为什么开发环境短信发送会失败？**
A: 因为开发环境应该使用模拟模式，确保 `SHOW_VERIFICATION_CODE=true`。

**Q: 登录后为什么页面还是跳转回首页？**
A: 可能是cookie设置问题，检查浏览器是否启用了cookie。

**Q: 数据库连接失败怎么办？**
A: 确保PostgreSQL服务正在运行，并且数据库名称和密码正确。