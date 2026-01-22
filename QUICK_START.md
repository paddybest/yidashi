# 🚀 5分钟快速部署到 Vercel

## 前置准备

1. ✅ GitHub 账号
2. ✅ Vercel 账号（使用 GitHub 登录）
3. ✅ DeepSeek API Key

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/tianjige.git
git push -u origin main
```

### 2. 导入到 Vercel

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 选择你的 GitHub 仓库
3. 点击 "Import"

### 3. 配置项目

**项目设置**：
- Project Name: `tianjige`
- Framework: `Next.js` (自动检测)
- Region: `Hong Kong` (推荐)

**环境变量**：
在 Environment Variables 中添加：

```
DEEPSEEK_API_KEY = your_api_key_here
DEEPSEEK_BASE_URL = https://api.deepseek.com
ADMIN_PASSWORD = your_secure_password
SHOW_VERIFICATION_CODE = false
NODE_ENV = production
```

### 4. 创建数据库

1. 在项目页面点击 "Storage"
2. 选择 "Create Database" → "Postgres"
3. 填写数据库名称: `tianjige`
4. 点击 "Create"

### 5. 点击 Deploy

等待 3-5 分钟，部署完成后你会得到一个 URL：
```
https://tianjige.vercel.app
```

### 6. 配置域名（可选）

1. 进入项目 "Settings" → "Domains"
2. 添加你的域名
3. 按照提示配置 DNS

## 完成！

🎉 恭喜！你的天机阁项目已经成功部署到 Vercel。

## 访问你的应用

- 首页: `https://your-domain.vercel.app`
- 管理后台: `https://your-domain.vercel.app/admin`
- API: `https://your-domain.vercel.app/api/...`

## 常见问题

### Q: 部署失败怎么办？
A: 查看部署日志，检查环境变量是否正确配置。

### Q: 如何更新代码？
A: 只需要 `git push` 到 GitHub，Vercel 会自动重新部署。

### Q: 如何查看日志？
A: 在 Vercel 项目页面点击 "Logs" 标签。

## 需要帮助？

查看详细文档：[云部署指南](./CLOUD_DEPLOYMENT_GUIDE.md)
