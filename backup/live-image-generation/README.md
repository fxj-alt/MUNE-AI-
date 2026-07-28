# AI 穿搭 Demo

这是一个用于作品集演示的 Web 端 AI 穿搭产品 Demo。

第一阶段目标是完整体验交互和 UI：登录、首页、新用户引导、添加衣服、AI 推荐 Look、Look 详情、穿法教程、AI 试穿、保存 Look、衣橱和我的形象。

当前版本保留作品集 Demo 的本地登录与保存状态，并已为“添加衣服 → AI 推荐”接入真实天气与视觉模型。模型只返回结构化搭配数据，推荐卡片继续复用项目现有图片。

## 本地配置

复制环境变量示例：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写服务端密钥：

```bash
OPENAI_API_KEY=your_server_side_key
OPENAI_VISION_MODEL=gpt-5.6-terra
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_QUALITY=low
OPENAI_IMAGE_SIZE=1024x1536
MUNE_AI_MOCK=false
```

`OPENAI_API_KEY` 只在 Next.js 服务端路由中读取，不要使用
`NEXT_PUBLIC_` 前缀。

如果只想测试天气、文件上传和完整交互状态，而不调用模型，可临时设置：

```bash
MUNE_AI_MOCK=true
```

## 启动

```bash
pnpm install
pnpm run dev
```

本地预览地址：

```bash
http://127.0.0.1:3000
```

## 演示路径

1. 登录进入产品。
2. 在首页点击「添加衣服」。
3. 选择官方白衬衫案例或上传 JPG、PNG、WebP 图片。
4. 输入城市或允许浏览器定位，再选择通勤、日常或约会场景。
5. 系统获取实时天气，识别衣服并生成 3 套结构化 Look。
6. 第一套 Look 会继续调用 `/api/generate-look-image`，使用系统模特参考图和用户上衣生成真实推荐图。
7. 进入 Look 详情，在「本次搭配」和「穿法教程」之间切换。
8. 开始 AI 试穿。
9. 保存穿搭。
10. 在「我的衣橱」里查看已保存 Look 和单品库。

## 当前边界

- 登录表单仅用于演示进入流程。
- 天气来自 Open-Meteo；普通使用不需要天气 API Key。
- AI 推荐通过 `/api/generate-looks` 调用支持图像理解的模型。
- 模型输出使用严格 JSON Schema，并在服务端再次校验。
- 阶段 1 只为第一套 Look 生成真实图片；第二、第三套 Look 暂时继续使用现有视觉素材作为占位。
- 保存 Look 会在当前浏览器会话中体现。
- 后续可继续接入真实账户、持久化图片与数据库。
