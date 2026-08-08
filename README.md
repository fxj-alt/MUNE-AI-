# AI 穿搭 Demo

这是一个用于作品集演示的 Web 端 AI 穿搭产品 Demo。

第一阶段目标是完整体验交互和 UI：登录、首页、新用户引导、添加衣服、AI 推荐 Look、Look 详情、穿法教程、AI 试穿、保存 Look、衣橱和我的形象。

当前版本保留作品集 Demo 的本地登录与保存状态。“添加衣服 → AI 推荐”默认使用本地 Demo 数据和固定高质量 Look 图片，确保作品集演示不依赖 OpenAI API Key、模型权限或账户余额。

## 本地配置

复制环境变量示例：

```bash
cp .env.example .env.local
```

在 `.env.local` 中填写服务端密钥：

```bash
OPENAI_API_KEY=
OPENAI_VISION_MODEL=gpt-5.6-terra
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_QUALITY=low
OPENAI_IMAGE_SIZE=1024x1536
ENABLE_LIVE_IMAGE_GENERATION=false
MUNE_AI_MOCK=true
```

稳定 Demo 不需要填写 `OPENAI_API_KEY`。如果未来恢复真实 AI 接入，`OPENAI_API_KEY` 只应在 Next.js 服务端路由中读取，不要使用 `NEXT_PUBLIC_` 前缀。

如果只想演示当前作品集原型，请保持：

```bash
MUNE_AI_MOCK=true
ENABLE_LIVE_IMAGE_GENERATION=false
```

## 启动

```bash
pnpm install
pnpm run dev
```

demo 浏览地址：

```bash
本地地址：http://127.0.0.1:3000
demo浏览地址：https://mune-ai-demo.vercel.app/
```

## 演示路径

1. 登录进入产品。
2. 在首页点击「添加衣服」。
3. 选择官方白衬衫案例或上传 JPG、PNG、WebP 图片。
4. 输入城市或允许浏览器定位，再选择通勤、日常或约会场景。
5. 系统获取天气；如果天气服务暂时失败，会使用 Demo 兜底天气，不阻断流程。
6. 系统展示生成过渡，并基于本地 Demo 数据生成 3 套结构化 Look。
7. 进入 Look 详情，在「本次搭配」和「穿法教程」之间切换。
8. 开始 AI 试穿。
9. 保存穿搭。
10. 在「我的衣橱」里查看已保存 Look 和单品库。

## 当前边界

- 登录表单仅用于演示进入流程。
- 天气来自 Open-Meteo；普通使用不需要天气 API Key。
- AI 推荐默认通过 `/api/generate-looks` 返回稳定本地 Demo 数据。
- 上传图片会用于上传预览和详情页第一件单品缩略图，不要求人物主图实时匹配上传衣服。
- 推荐页使用固定高质量 Look 图片，适合作品集交互演示。
- 真实结构化模型和图片生成接口保留为未来功能，当前主流程默认停用。
- 保存 Look 会在当前浏览器会话中体现。
- 后续可继续接入真实账户、持久化图片与数据库。
