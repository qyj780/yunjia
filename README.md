# 云笺 · 问心有方

Next.js、TypeScript、Tailwind CSS 国风网站。SVG与CSS装饰为原创，无外部图片或字体请求。

## 本地运行

需要 Node.js 20.9 或更新版本，在项目目录执行：

```sh
npm ci
npm run dev
```

打开 http://localhost:3000 。生产模式执行 `npm run build` 和 `npm start`。`npm run typecheck` 检查类型；`node tests/reading.cjs` 检查384种卦象/动爻组合及模拟API错误，不调用付费模型。

## 配置大模型

复制 `.env.example` 为 `.env.local`，填写 LLM_BASE_URL、LLM_MODEL、LLM_API_KEY。基础地址不包含 `/chat/completions`，必须为HTTPS。配置后重启本地服务。密钥仅在服务端读取，不要加NEXT_PUBLIC_前缀或提交真实密钥。

例如 DeepSeek（模型名以实时文档及账户权限为准）：

```dotenv
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
LLM_API_KEY=在本地填写你的真实密钥
```

官方参考：https://api-docs.deepseek.com/ 。其他兼容Chat Completions API的服务可修改基础地址和模型名。当前发送model、messages、max_tokens、stream:false，读取choices[0].message.content；不同服务仍需实际联调。

首页起卦后点击“生成 AI 解读”，问题和卦象才发送至配置的服务。未配置模型时仍能计算卦象，并显示清晰的配置提示。AI失败可重试，成功后存入本地历史，刷新和打开历史不会重复调用。

## 起卦方法

新记录固定使用 `three-number-v1`：第一数除8取上卦，第二数除8取下卦（余0为8），第三数除6取动爻（余0为6）。输入为三个1–100整数，不混入时辰。八卦顺序为乾兑离震巽坎艮坤。爻位自下而上，变卦翻转动爻；互卦下卦取第2/3/4爻，上卦取第3/4/5爻。动爻所在经卦为用，另一经卦为体。

这是本产品选择的三数法，不声称是唯一流派或能证实未来事件。程序负责计算，模型负责象征性文化解读。5/7/1对应风山渐、初爻动、互卦火水未济、变卦风火家人。旧版无method标记的记录保留原“演示数据”，不会改写旧记录。

## 页面与存储

- `/`：响应式首页、热门问题填入、50字问题及三个整数校验。
- `/result?id=...`：本卦、互卦、变卦、规则说明、AI解读及重新提问。
- `/history`：最多100条浏览器本地记录，支持查看及逐条删除。
- 未完成入口显示“即将上线”。今日指引是固定生活灵感，不是农历或每日运势计算。

历史使用localStorage，不可用时尝试sessionStorage保存当前记录；两者均禁用时提示错误。清理浏览器数据或更换设备后无法恢复，结果网址不可跨设备分享。解读按React文本渲染，不执行HTML。没有登录、云数据库、支付或后台。

## 服务端接口

POST `/api/interpret` 校验问题、数字和method，重新计算卦象，不信任客户端排盘。包含45秒超时、2KB请求体限制、浏览器同源校验、单实例每IP每分钟5次短时节流。错误信息不返回密钥或上游内部响应。

此限流不是账户认证或跨实例配额。公开运营前应接入平台WAF/共享限流、账户配额，并在模型平台设置消费上限。当前没有用户账户体系。

## Vercel 上线

1. 将项目提交到GitHub，不提交.env.local、node_modules、.next。
2. Vercel → Add New → Project，导入仓库，框架选择Next.js。
3. 仓库根目录就是本项目时使用默认Root Directory；提交整个外层工作区时选择`outputs/yunjian`。
4. 构建命令`npm run build`，输出目录默认，Node.js至少20.9。
5. 在项目环境变量填入模型配置，选好Production/Preview环境后部署。修改变量后重新部署。
6. 检查生产部署访问保护，用无痕窗口、手机测试起卦、真实模型解读、刷新和历史删除。
7. Settings → Domains可绑定域名。推送生产分支后自动重新部署。

参考：https://vercel.com/docs/git/vercel-for-github 。目前为本地可部署项目，尚未发布公网；真实模型调用需配置凭据后验证。

## 代码

`app/studio.tsx`为页面和历史；`app/reading-result.tsx`为真实起卦和AI交互；`lib/divination.ts`为计算；`app/api/interpret/route.ts`为模型接口；`app/globals.css`为主题及响应式样式。
