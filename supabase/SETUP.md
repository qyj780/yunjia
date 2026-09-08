# 登录注册与数据库配置

当前代码已实现邮箱注册、登录、验证回调、忘记密码、修改密码、退出登录以及按账户隔离的云端资料保存/恢复。需要你创建自己的 Supabase 项目才能真正启用，不会创建本地假账户。

## 1. 创建数据库项目

打开 https://supabase.com/dashboard ，登录后 New project。填写项目名，例如 yunjian，按用户访问地区选择区域，生成并妥善保存数据库密码。应用不需要这个数据库密码，也不需要 service_role 密钥。

## 2. 建表

在项目 SQL Editor 创建查询，将 `supabase/migrations/001_accounts.sql` 全部粘贴并运行。脚本可重复执行，创建 `public.user_vaults` 和受限写入函数 `save_user_vault`，启用行级安全。

`auth.users` 由 Supabase Auth 自行管理；业务表不存密码。每个用户拥有一份JSON云端资料，包含提问、档案、聊天和称呼，带原子版本号，避免设备间静默覆盖。这一版是用户主动保存/恢复，不是自动同步。

## 3. 配置三个环境变量

从 Supabase 的 Connect / API Keys 页面取得 Project URL 和 Publishable Key（旧项目可使用 anon key）。在 Vercel 项目 Settings → Environment Variables 中添加：

```dotenv
SUPABASE_URL=https://你的项目编号.supabase.co
SUPABASE_PUBLISHABLE_KEY=你的publishable_key
SITE_URL=https://你的正式网站域名
```

选择 Production，保存后重新部署。不要填写 service_role / Secret Key。本地测试把相同配置写进 `.env.local`，SITE_URL填 `http://localhost:3000`，重启服务。密钥文件已被.gitignore排除。

## 4. 配置邮箱和回调

在 Supabase Authentication 中启用 Email / Password，保留 Confirm email。设置密码至少8位。URL Configuration的Site URL填正式域名，在Redirect URLs允许列表添加：

```text
https://你的正式域名/auth/callback
https://你的正式域名/auth/callback?next=recovery
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=recovery
```

使用Supabase默认ConfirmationURL邮件模板，本实现通过PKCE code交换会话。注册和重置邮件要在发起操作的同一浏览器打开；换浏览器或清除Cookie后需重新申请。生产站点需要配置Custom SMTP：Supabase默认邮件服务有收件人和发送频率限制，不能假定它支持任意用户注册。请遵循 https://supabase.com/docs/guides/auth/auth-smtp 。

## 5. 验收

注册测试邮箱 → 收到验证邮件 → 点击验证 → 登录 → 读取云端状态 → 保存本机资料。再在另一浏览器登录同一账户，读取云端并恢复。另注册第二个账户，确认看不到第一个账户的资料。测试忘记密码邮件及修改密码。

## 数据与权限边界

所有云端接口调用getUser验证身份；不接受客户端user_id，不使用绕过RLS的管理员密钥。会话使用HttpOnly Cookie，认证响应禁止缓存。云端写入需要明确确认，版本冲突返回409；本机数据不会随登录、登出或换号自动清空，也不会自动上传，请在公共电脑退出后清空本机资料。

建表脚本在本地PostgreSQL兼容测试引擎上验证了两个账户隔离、匿名拒绝、写入权限、版本冲突和用户删除级联：`node tests/database.cjs`。账户HTTP接口模拟测试：`node tests/auth.cjs`。真实邮件、Supabase项目和线上RLS仍需上述实际验收。

未实现：自动同步、合并冲突、手机号/社交登录、在线删除账户、支付。现有AI接口限流策略保持原样，注册本身不会将其变成付费额度系统。
