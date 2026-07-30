---
title: 设计资源库
updated: 2026-07-16
status: active
purpose: 为 AI 辅助产品设计、前端实现和视觉审查提供长期维护的资源入口
---

# 设计资源库

这份文档收录能实际提高产品设计质量的规范、Skill、组件库、图标库、动效工具和审查方法。它服务于多个项目，不属于某一个仓库。

资源只有在用途清楚时才会进入这里。每条记录需要说明它解决什么问题、适合什么时候使用、与哪些资源重复，以及使用时要注意什么。只提供链接、没有明确用途的内容暂不收录。

## 快速使用

开始一个新项目时，按下面的顺序选资源：

1. 明确交付形态：概念图、可点击原型、前端 Demo 或生产产品。
2. 选一份主要视觉依据：设计稿、截图、品牌规范或项目 `DESIGN.md`。
3. 选一套组件基础：默认使用 shadcn/ui，并在 Base UI 和 Radix 中选一个底层方案。
4. 选一个主要图标家族：默认 Lucide；Reicon 只补充缺少的业务图标。
5. 先完成信息结构和交互，再统一视觉，最后补动效。
6. 用真实页面截图检查文字溢出、间距、对齐、边框、阴影、状态和动效手感。

安装依赖时沿用项目已有的包管理器和锁文件。本文以 pnpm 为默认示例；`npx` 和 `pnpm dlx` 只用于运行工具自身的官方命令。

## 资源状态

| 状态 | 含义 |
| --- | --- |
| 核心 | 默认优先使用，已经确认价值和使用边界 |
| 可选 | 在特定任务中使用，不默认叠加 |
| 观察 | 有潜力，但成熟度、维护状态或一致性仍需观察 |
| 待验证 | 已发现，尚未确认准确来源或实际效果 |
| 停用 | 已经不推荐，新项目不再采用 |

## 默认组合

这套组合适合高保真 B 端界面、可点击设计原型和需要快速迭代的 React 项目。

| 层级 | 默认资源 | 作用 |
| --- | --- | --- |
| 项目视觉规则 | Google `DESIGN.md` 格式＋项目自身设计语言 | 统一颜色、字体、间距、圆角、组件和动效变量；Vercel `design.md` 提供内容组织和数值参考 |
| 产品与交互判断 | Vercel Product Design 方法模板 | 先处理任务、信息结构、交互和状态，再进入视觉实现 |
| 组件实现 | shadcn/ui＋Base UI | 使用成熟组件结构，同时保留源代码和改版自由度 |
| 静态图标 | Lucide | 保持图标线宽、网格和视觉重量一致 |
| 动态图标 | Lucide Animated | 为少数状态变化和高价值操作增加反馈 |
| 页面动效 | Motion | 处理布局变化、浮层、状态切换和可中断交互 |
| 整体视觉润色 | Impeccable | 统一排版、布局、颜色、组件取舍和常见 AI 默认样式 |
| 细节审查 | Emil Kowalski Skills | 检查按压反馈、缓动、持续时间、变换原点和动画频率 |
| 最终检查 | Vercel Web Interface Guidelines＋同尺寸截图对照 | 找出溢出、错位、层级、交互反馈和表现不一致 |

不要同时启用多套覆盖面相同的“审美 Skill”。默认使用 Vercel 方法模板处理产品与交互，使用 Impeccable 处理已有界面的整体视觉润色，使用 Emil Skills 处理动效和交互手感。Taste Skill 可以替代 Impeccable；Anthropic Frontend Design 用于缺少视觉来源时探索方向。

### 综合 Skill 兼容关系

| 任务 | 默认 | 可以叠加 | 二选一或替代关系 |
| --- | --- | --- | --- |
| 产品流程与信息结构 | Vercel Product Design 方法模板 | 项目 PRD、用户研究和既有设计系统 | 不被通用审美 Skill 替代 |
| 已有界面的整体润色 | Impeccable | Jakub Krehel Skills 的字体、颜色专项；Emil 动效审查 | Taste Skill 与 Impeccable 二选一 |
| 缺少设计稿时探索视觉方向 | Anthropic Frontend Design | ImageGen、项目 `DESIGN.md` | Taste Skill 可以替代；已有明确设计源时通常都不使用 |
| 动效取舍与手感 | Emil Kowalski Skills | Motion、Lucide Animated | 可以和一套整体润色 Skill 组合，但不让 `emil-design-eng` 再重写已经确定的视觉方向 |
| 基础 UI 快检 | UI Skills 的专项能力 | Vercel Web Interface Guidelines | 只调用需要的分类，不再增加一套长期审美规则 |

当前默认流程使用 Vercel 方法处理产品与交互，使用 Impeccable 处理整体视觉润色，使用 Emil Skills 处理动效和交互手感。项目已经有明确视觉来源时，视觉来源优先于这些通用 Skill。

## 视觉规范与 AI 上下文

### Vercel Visual Design Markdown

- 状态：核心。
- 地址：[Light theme](https://vercel.com/design.md)；[Dark theme](https://vercel.com/design.dark.md)。
- 类型：Vercel 官方 Geist 设计系统 Markdown，目前标记为 alpha。
- 包含：颜色阶梯、P3 色值、字体层级、4 px 间距体系、圆角、按钮、输入框、阴影、动效、文案和使用禁区。
- 适用：建立项目级视觉规则；让 AI 在不同页面和不同轮次中保持一致。
- 使用方式：把它作为结构和数值参考，按项目品牌、中文字体和界面密度改写项目自己的 `DESIGN.md`。不要直接覆盖项目已有的品牌色和业务状态色。
- 注意：Geist Sans 不包含完整中文字体。中文项目需要明确 `PingFang SC`、`Noto Sans SC` 或对应平台字体，并重新检查字号、行高和基线。

### Google Labs DESIGN.md

- 状态：核心。
- 地址：[Format specification](https://github.com/google-labs-code/design.md)。
- 类型：面向人和 AI 的开放设计系统文档格式。
- 包含：YAML 设计变量、视觉说明、颜色、字体、布局、层级、形状、组件和使用禁区。
- 适用：新建跨 Agent、跨工具、跨项目的视觉说明文件。
- 与 Vercel 的关系：Google Labs 负责文件结构和字段格式；项目自身的设计变量是最终数值；Vercel `/design.md` 只提供 Geist 的结构和数值参考。三者冲突时，以项目设计来源和项目 `DESIGN.md` 为准。

### Vercel Product Design 方法模板

- 状态：核心。
- 地址：[Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel)。
- 类型：Vercel 内部使用的 Markdown 设计知识与 Agent 工作方式。官方文章公开了结构和简化模板，没有提供可以直接安装的完整 Skill 包。
- 包含：`SKILL.md`、产品判断、界面质量、页面类型、文案、交互模式、规则、案例和覆盖缺口。
- 适用：复杂产品流程、设计审查、组件选择和信息结构判断。
- 使用方式：从文章提取 Shape、Implement、Review、Copy 等任务路由和判断方法，改写成项目自己的 Skill 或 `AGENTS.md`；原型项目删去与交付无关的生产加固要求。

### Vercel Web Interface Guidelines

- 状态：核心。
- 地址：[Web Interface Guidelines](https://vercel.com/design/guidelines)。
- 类型：Web 界面实现和审查清单。
- 适用：完成主要设计后，检查交互反馈、表单行为、文案、状态、动画与表现质量。
- 安装：

```bash
curl -fsSL https://vercel.com/design/guidelines/install | bash
```

- 注意：它擅长检查界面质量，不负责创造项目自身的视觉方向。

### Google Stitch Skills

- 状态：可选。
- 地址：[google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills)。
- 类型：配合 Stitch MCP 使用的 Agent Skills。
- 适用：从 Stitch 项目生成 `DESIGN.md`、提取静态 HTML、把视觉探索交给 AI 设计工具。
- 安装全部 Skills：

```bash
npx skills add google-labs-code/stitch-skills
```

- 注意：已有明确截图或 Figma 设计时，优先忠实实现现有设计，不必额外经过 Stitch。

## 组件与交互基础

### shadcn/ui Skills

- 状态：核心。
- 地址：[官方 Skills 文档](https://ui.shadcn.com/docs/skills)。
- 类型：让 Agent 理解项目的 shadcn 配置、主题、组件、注册表和底层组件方案。
- 适用：快速搭建按钮、表单、标签页、弹窗、抽屉、菜单、表格和筛选组件，同时保留本地源代码。
- 安装：

```bash
pnpm dlx skills add shadcn/ui
```

- 推荐：原型和频繁改版项目优先使用。组件代码进入项目后可以直接修改，适合后续大量视觉和交互调整。
- 注意：shadcn 提供成熟结构和默认样式，项目仍然需要自己的字体、间距、颜色、密度和组件取舍。

### Base UI

- 状态：核心。
- 地址：[Base UI](https://base-ui.com/)；[Quick Start](https://base-ui.com/react/overview/quick-start)。
- 类型：无默认视觉样式的 React 交互组件基础。
- 适用：Popover、Dialog、Drawer、Select、Tabs、Tooltip、Menu、Checkbox 等行为复杂的组件。
- 安装：

```bash
pnpm add @base-ui/react
```

- 推荐：通过 shadcn/ui 的 Base UI 方案使用，减少重复封装。
- 注意：Base UI 负责行为和结构。官网的视觉质量不会自动进入项目，最终效果仍由项目设计变量和组件样式决定。

### Radix Primitives

- 状态：可选，主要用于已有项目。
- 地址：[Radix Primitives](https://www.radix-ui.com/primitives)。
- 类型：无默认视觉样式的 React 交互组件基础。
- 适用：项目已经基于 Radix 构建，或者当前 shadcn 配置使用 Radix 时继续沿用。
- 选择条件：新项目默认 Base UI；已有 Radix 项目不为追新而迁移。只有新交互明确需要 Base UI 能力，并且迁移成本可控时再切换。
- 注意：同一个项目不要同时为同类组件维护 Base UI 和 Radix 两套封装。

## 动效与设计工程

### Emil Kowalski Skills

- 状态：核心。
- 地址：[emilkowalski/skills](https://github.com/emilkowalski/skills)。
- 背景：内容来自作者在 Vercel、Linear 等公司的设计工程经验。
- 许可：MIT。
- 安装：

```bash
npx skills@latest add emilkowalski/skills
```

包含 6 个 Skill：

| Skill | 用途 |
| --- | --- |
| `emil-design-eng` | UI 打磨、组件设计、动画取舍和容易被忽略的细节 |
| `review-animations` | 严格检查已经实现的动画 |
| `improve-animations` | 扫描整个项目，生成分优先级的动画改进计划 |
| `find-animation-opportunities` | 找出真正需要动效的位置，同时指出哪些地方不该动 |
| `animation-vocabulary` | 用准确词汇描述动效，减少 AI 猜测 |
| `apple-design` | 把 Apple WWDC 中的流畅交互、弹簧、手势和字体原则转成 Web 实现建议 |

默认规则：

- 高频操作保持即时，减少或取消动画。
- 按钮在按下时提供轻微反馈，常用范围为 `scale(0.97)` 左右。
- UI 进入动画使用快速响应的 ease-out，页面内移动使用 ease-in-out。
- 浮层从触发控件方向出现；模态框保持居中。
- 多数 UI 动画控制在 300 ms 内。
- 拖动、抽屉和可反转交互优先使用可中断的 spring。

### Motion

- 状态：核心。
- 地址：[Motion](https://motion.dev/)；[React 文档](https://motion.dev/docs/react)；[AI Kit](https://motion.dev/ai-kit)。
- 类型：React、JavaScript 和 Vue 动画库。
- 适用：布局变化、共享元素、浮层、拖动、手势、退出动画和弹簧动画。
- 安装：

```bash
pnpm add motion
```

- 使用边界：简单的颜色、透明度和按压变化优先用 CSS；需要布局连续性、手势或可中断动画时使用 Motion。
- AI Kit：提供最新文档、示例、性能检查和动画调节工具。AI Kit 属于付费的 Motion+；免费的 `motion` 动画库不受影响。

## 图标资源

### Lucide Animated

- 状态：核心，精选使用。
- 地址：[lucide-animated.com](https://lucide-animated.com/)；[Agent Skill](https://lucide-animated.com/skill.md)；[GitHub](https://github.com/pqoqubbw/icons)。
- 类型：基于 Lucide 和 Motion 的开源 React 动态图标。
- 许可：MIT。
- 特点：400 多个图标；默认 hover 播放；通过 shadcn 注册表逐个复制进项目。
- 安装单个图标：

```bash
npx shadcn@latest add "https://lucide-animated.com/r/<icon-name>.json"
```

- 适用：展开收起、上传、成功、刷新、加载、状态切换等能帮助理解变化的操作。
- 使用边界：导航和高频工具栏图标默认静止；动态图标只在交互发生时播放；不要让所有图标持续运动。

### Reicon

- 状态：观察，作为补充。
- 地址：[reicon.dev](https://reicon.dev/)；[GitHub](https://github.com/dqev/reicon)；[LLM reference](https://reicon.dev/llms.txt)。
- 类型：24×24 网格的静态 SVG 图标库，提供 Outline 和 Filled 两种风格。
- 许可：项目标记为 MIT；部分基础图形来自 Solar Icons 和 Zappicon，正式商用前需要再次核对上游许可。
- React 安装：

```bash
pnpm add reicon-react
```

- AI 搜索：

```bash
npx reicon-mcp search "search term"
```

- 适用：Lucide 缺少业务图标，或者同一功能需要 Outline／Filled 两种状态时。
- 注意：项目仍处于 1.1.x 阶段。使用前检查图标线宽、圆角和光学重量，避免和 Lucide 混用后出现风格跳变。

## 视觉润色与专项 Skill

### Impeccable

- 状态：可选。
- 地址：[pbakaus/impeccable](https://github.com/pbakaus/impeccable)；[impeccable.style](https://impeccable.style/)。
- 类型：面向 AI 编码工具的设计语言、命令和自动检查器。
- 适用：已有界面的排版、布局、颜色、动效、交互和文案润色；也适合扫描明显的 AI 默认样式。
- 安装：

```bash
npx impeccable install
```

- 推荐：作为独立的最终润色或检查阶段使用。
- 注意：它负责已有界面的整体润色，与 Taste Skill 二选一。Anthropic Frontend Design 更适合缺少设计稿时探索方向；Emil Skills 默认只承担动效和交互手感专项。

### Jakub Krehel Skills

- 状态：可选，推荐作为字体、颜色和界面细节专项工具。
- 地址：[GitHub](https://github.com/jakubkrehel/skills)；[interfaces.dev](https://interfaces.dev/)。
- 类型：3 个相互独立的 Agent Skills，覆盖界面细节、Web 字体和 OKLCH 颜色系统。
- 维护情况：MIT 许可；2026-07-16 检查时 GitHub 为 442 Stars，3 个 Skill 在 skills.sh 各约 1.1K 次安装；仓库最近一次提交为 2026-07-13。
- 全部安装：

```bash
npx skills add jakubkrehel/skills
```

- 按需安装：

```bash
npx skills add jakubkrehel/skills --skill better-ui
npx skills add jakubkrehel/skills --skill better-typography
npx skills add jakubkrehel/skills --skill better-colors
```

| Skill | 解决的问题 | 推荐使用阶段 |
| --- | --- | --- |
| `better-ui` | 同心圆角、图标光学校准、边框与阴影、点击反馈、进入退出动画和动画性能 | 基础组件稳定后的细节检查 |
| `better-typography` | 字体格式、字重、字体层级、行高、字距、换行、截断、数字、表单文字和字体可访问性 | 字体系统建立或页面排版专项检查 |
| `better-colors` | Hex／RGB／HSL 转 OKLCH、色阶生成、暗色模式、色域、APCA／WCAG 对比度和 Tailwind v4 主题 | 新建设计变量、重做颜色系统或检查对比度 |

`better-ui` 中值得直接采用的检查包括：嵌套圆角按内圆角加间距计算；图标按视觉重量校准；动画只声明实际变化的属性；`will-change` 只在首帧卡顿时使用；桌面交互区域至少保持 40×40 px；默认页面状态不重复播放进入动画。

它也包含几条需要结合项目判断的强规则：

- “阴影优先于边框”不适合所有 B 端界面。Vercel 和许多高密度产品会优先使用细边框与色阶，浮层才使用阴影。项目 `DESIGN.md` 决定最终取舍。
- “所有内容拆分后依次进入”容易让后台界面显得拖沓。只有低频、首次出现且有解释价值的页面使用 stagger。
- Skill 固定建议按钮按下缩放为 `0.96`，Emil Skills 常用 `0.97`。项目应只保留一个全局 Press Token，不能让不同组件各用一套数值。
- 上下文图标从 `0.25` 缩放并叠加 4 px 模糊，视觉存在感较强。高频 B 端操作优先使用更克制的淡入或保持静止。

`better-typography` 对当前中文项目的价值主要在字体层级、数字对齐、换行、截断和按钮文字基线。使用时需要补充这些中文规则：

- 16 px 适合正文阅读；高密度 B 端控件可以使用 14 px，但必须检查真实中文字体、行高和对比度。
- `PingFang SC`、`Noto Sans SC` 等中文字体的字面高度与 Geist、Inter 不同，CSS 数值相同也需要截图检查。
- `text-wrap: balance`、`text-wrap: pretty`、负字距和英文行长标准不能直接套到中文，先用真实文案验证。
- 开启 `font-synthesis: none` 前，确认中文字体需要的字重已经存在，避免所有中文回退成同一字重。

`better-colors` 适合新建颜色变量或重做色阶，不默认把成熟项目的所有 Hex 机械转换为 OKLCH。当前项目已有 Vercel 色阶参考时，先确定语义色和状态层级，再决定是否迁移格式。APCA 可以帮助设计阶段判断感知对比度；需要正式声明 WCAG 2.x 合规时仍使用 WCAG 对比度标准。

当前仓库源码只包含 `better-ui`、`better-typography` 和 `better-colors`。Skills CLI 仍可能显示安装量极低的 `great-typography` 历史条目，它不在当前仓库中，不纳入资源库。

### UI Skills

- 状态：可选。
- 地址：[ibelick/ui-skills](https://github.com/ibelick/ui-skills)。
- 类型：按任务路由的 UI Skill 集合。
- 适用：基础 UI、可访问性、动效性能、元数据和现有界面改进。
- 常用命令：

```bash
npx ui-skills start
npx ui-skills list --category motion
npx ui-skills get baseline-ui
```

- 注意：它和其他综合型设计 Skill 有重复。需要某个专项能力时再调用。

### Anthropic Frontend Design

- 状态：可选。
- 地址：[Anthropic Frontend Design Skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design)。
- 类型：引导 AI 先确定视觉方向，再处理字体、色彩、构图和动效的设计 Skill。
- 适用：缺少现成设计稿、需要探索一种明确视觉方向的新页面。
- 注意：已有截图、Figma 或品牌系统时，优先忠实实现视觉来源，避免让通用 Skill 重写既有设计。

### Taste Skill

- 状态：可选，和 Impeccable 二选一。
- 地址：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)。
- 类型：针对常见 AI 默认界面的设计与重设计 Skill 集合。
- 适用：现有项目改版、高端视觉探索、极简界面和截图到代码任务。
- 安装：

```bash
npx skills add https://github.com/Leonxlnx/taste-skill
```

- 注意：它的规则覆盖面较大。不要与多套同类审美 Skill 同时驱动一次实现。

### skills.sh

- 状态：核心工具入口。
- 地址：[skills.sh](https://skills.sh/)。
- 类型：Agent Skills 搜索、安装和热度查询入口。
- 适用：发现新的设计、排版、动效和组件 Skill。
- 评估方式：先查作者与官方来源，再看实际文件、更新记录、安装方式和使用边界。安装量只能作为参考。

## 本机已有的相关能力

以下能力已经可以在 Codex 中直接调用，使用前仍需要按任务读取对应 `SKILL.md`：

| 能力 | 适用任务 |
| --- | --- |
| `product-design:audit` | 审查现有页面、流程和截图 |
| `product-design:ideate` | 生成三个视觉方向供选择 |
| `product-design:image-to-code` | 按选定截图或设计稿实现界面 |
| `figma-implement-design` | 按 Figma 节点进行高还原实现 |
| `implement-design` | 把明确设计源转成代码 |
| `perfecting-ui-details` | 功能完成后的视觉细节处理 |
| `visual-animation` | 动效实现、视觉还原和逐帧检查 |
| `web-design-guidelines` | Web 界面规范检查 |
| `tailwind-v4-shadcn` | Tailwind v4 与 shadcn/ui 配置 |
| `tailwind-patterns` | 常用 Tailwind 组件模式 |

## 组件取舍规则

### 按钮

| 类型 | 什么时候使用 | 常见错误 |
| --- | --- | --- |
| 纯文字按钮 | 查看详情、取消、返回、列表行尾等低强调操作 | 用作页面唯一主操作，导致入口不明显 |
| 图标按钮 | 关闭、更多、折叠、刷新等通用语义 | 图标不常见却没有文字或 Tooltip |
| 轻背景按钮 | 工具栏、筛选、紧凑次要操作 | 所有操作都做成浅灰胶囊 |
| 线框按钮 | 与主操作并列的明确次要动作 | 边框过深，和主按钮争夺注意力 |
| 实心按钮 | 当前页面唯一或最重要的动作 | 同一视图出现多个同等级实心按钮 |
| 胶囊控件 | 状态、筛选、分段选择和紧凑标签 | 普通按钮全部使用 9999 px 圆角 |

文字已经充分表达动作时，不强行加入图标。图标能提高扫描效率、表达方向或补充通用语义时再使用。

### 边框、背景与阴影

- 背景色负责分区、选中、悬停和状态层级。
- 边框负责稳定容器、输入框和列表分隔。
- 阴影负责浮层、菜单、弹窗和真正高于页面的表面。
- 普通卡片优先使用背景差或细边框。明显边框和明显阴影不要同时出现。
- 同一层级保持一致圆角。日常控件优先 6 px，菜单和面板优先 12 px，大面积全屏表面才使用 16 px。

### 字体与间距

- 基础间距使用 4 px 倍数：4、8、12、16、24、32、40、64。
- 组内通常使用 8 px，组间使用 16 px，区块之间使用 32～40 px。
- B 端界面正文优先从 14 px／20 px 行高开始，页面标题和卡片标题按层级逐级增加。
- 中文与拉丁字母混排时，检查字体回退、数字基线、字重和行高。不要只看 CSS 数值。
- 标签和按钮必须在真实中文文案下检查，禁止依靠英文短词判断宽度。

### 动效

- 先写清动效目的：反馈、状态解释、空间连续性或减少突变。
- 高频操作保持即时；低频浮层和状态变化可以使用短动效。
- 按压反馈常用 100～160 ms；Tooltip 和小浮层常用 125～200 ms；Drawer 和 Modal 常用 200～300 ms。
- 进入使用 ease-out；页面内移动使用 ease-in-out；持续运动使用 linear。
- 优先动画 `transform` 和 `opacity`。
- 动态图标静止时保持安静，只在相关交互触发后播放。

## 设计质量验收

高保真原型至少通过下面这些检查：

- 所有页面都使用真实 mock 文案，中文不溢出、不裁切、不意外换行。
- 同类组件的高度、圆角、边框、字体和间距一致。
- 页面只保留一个明确主操作。
- 标签、按钮、分段选择器、卡片和输入框的组件类型清楚。
- 信息层级主要依靠字号、字重、间距和排列，容器数量保持克制。
- 图标来自同一主要家族，尺寸和线宽统一。
- Hover、Active、Selected、Disabled、Loading 和 Success 状态有明确反馈。
- 动效能解释状态变化，没有无目的循环和大面积装饰动画。
- 用目标尺寸截图逐页检查；有参考图时，把参考图与实现图放在同一张对照图中判断。
- 项目开始前明确是否验证键盘焦点、响应式和极端数据，不让执行者自行猜测交付范围。

对设计 Demo，可以减少生产验证范围，但不能省略真实页面视觉检查。响应式、键盘和极端数据是否验证，由项目交付目标决定。

## 可复用提示词

### 建立视觉基础

```text
读取项目目标、现有设计来源和 DESIGN.md。按 Google DESIGN.md 格式组织项目规则，使用项目设计来源确定最终数值，参考 Vercel design.md 的内容分类和数值体系。建立适合当前产品的颜色、中文字体、间距、圆角、边框、阴影、组件和动效变量。不要复制 Vercel 品牌，也不要在没有视觉依据时自行混合多种风格。
```

### 重构现有组件

```text
先检查现有页面中按钮、标签、分段选择器、卡片、输入框、弹窗和图标的重复实现。保留产品流程，统一为一套可组合组件。使用真实中文文案检查溢出、基线、间距和状态。完成基础组件后再替换页面，不在页面内继续添加一次性样式。
```

### 动效审查

```text
使用 Emil Kowalski 的动画规则检查现有页面。先判断哪些变化需要动效，哪些高频操作应保持即时；再检查按压反馈、缓动、持续时间、变换原点、可中断性和性能。只修改能帮助用户理解状态或提高反馈质量的动效。
```

### 视觉对照检查

```text
在相同视口和相同页面状态下截取参考图与实现图，把两张图放在同一张对照图中检查。逐项核对字体、行高、对齐、间距、边框、圆角、阴影、图标、文字溢出和动效状态。修复后重新截图，直到没有明显视觉错误。
```

## 当前 TikTok LIVE 项目使用方案

- 状态：项目档案，最近核对于 2026-07-16。
- 项目真相来源：[AGENTS.md](</Users/chong/Documents/TikTok Live 重设计-向灵睿/AGENTS.md>) 和项目内相关 PRD；项目要求变化时以仓库文件与用户最新指令为准。
- 交付：Chrome 中可完整点击的高保真设计原型。
- 数据：本地 mock，不实现真实文件解析、AI 接口和后台流转。
- 语言：保留中文与英文结构，默认展示简体中文；当前阶段不验证切换。
- 视口：默认 1920×1080；当前阶段不做响应式验收。
- 顺序：交互流程完整 → 统一 UI → 微动效 → 全页面视觉检查。
- 组件：shadcn/ui＋Base UI。
- 图标：Lucide 为主；Lucide Animated 精选使用；Reicon 补充。
- 动效：Motion＋Emil Skills。
- 视觉规则：按 Google `DESIGN.md` 格式维护项目文件，以项目设计来源为最终依据，参考 Vercel `design.md` 的内容分类和数值体系，适配中文字体和 B 端密度。
- 检查：所有页面禁止出现文字裁切、标签换行错位、重复边框、无意义大留白和操作位置漂移。

## 资源检查记录

资源条目不重复写日期，由这张表统一记录最近一次核对。安装命令、许可或维护状态发生变化时，先更新对应条目，再更新日期和检查范围。

| 资源 | 最近检查 | 已检查内容 |
| --- | --- | --- |
| Vercel `design.md` | 2026-07-16 | 官方文件、浅色／暗色入口、内容结构 |
| Google Labs `DESIGN.md` | 2026-07-16 | 官方规范、文件格式和字段职责 |
| Vercel Product Design 方法模板 | 2026-07-16 | 官方文章、公开范围和不可直接安装的边界 |
| Vercel Web Interface Guidelines | 2026-07-16 | 官方页面和安装命令 |
| Google Stitch Skills | 2026-07-16 | 官方仓库和安装命令 |
| shadcn/ui Skills | 2026-07-16 | 官方文档、安装命令和 Base UI 支持 |
| Base UI | 2026-07-16 | 官方 Quick Start、包名和组件定位 |
| Radix Primitives | 2026-07-16 | 官方入口和与 Base UI 的选择关系 |
| Emil Kowalski Skills | 2026-07-16 | 官方仓库、6 个 Skill、安装命令和许可 |
| Motion／Motion AI Kit | 2026-07-16 | 官方文档、安装命令和 Motion+ 付费边界 |
| Lucide Animated | 2026-07-16 | 官方 Skill、安装方式、数量和许可 |
| Reicon | 2026-07-16 | 官方仓库、包名、版本阶段、上游许可提示 |
| Impeccable | 2026-07-16 | 官方仓库、安装命令和适用范围 |
| Jakub Krehel Skills | 2026-07-16 | 官方仓库、3 个 Skill 及其引用文件、安装量、安装命令、许可、维护时间和冲突规则 |
| UI Skills | 2026-07-16 | 官方仓库、常用命令和分类能力 |
| Anthropic Frontend Design | 2026-07-16 | 官方仓库和适用范围 |
| Taste Skill | 2026-07-16 | 官方仓库、安装命令和替代关系 |
| skills.sh | 2026-07-16 | 搜索入口和使用方式 |

## 维护方式

以后新增资源时，按下面的格式补充：

```md
### 资源名称

- 状态：核心／可选／观察／待验证／停用。
- 地址：官方页面、官方仓库或原始发布地址。
- 类型：Skill、组件库、设计规范、图标、动效、字体或工具。
- 解决的问题：它具体帮助完成什么。
- 适用：什么任务和阶段使用。
- 使用方式：安装命令、调用方式或最短操作路径。
- 限制：成熟度、许可、重叠能力、框架限制和不适用场景。
- 最近检查：在上方“资源检查记录”中更新日期与检查范围。
```

维护时遵循这些规则：

1. 优先记录官方来源和原始仓库。
2. 新资源先归类，再判断是否与现有资源重复。
3. 综合型设计 Skill 一次只选择一套作为主要规则。
4. 组件库、图标库和动效库先在一个小组件上试用，再进入项目默认组合。
5. 资源停止维护、许可变化或出现更好的替代方案时，更新状态和原因。
6. 只维护这一份长期文档，不为每次调研重复创建新文档。

## 待继续确认

- “Better Motion”的准确项目地址尚未确认。Emil Skills 和 Motion AI Kit 已覆盖大部分相关能力。
- 之前提到的“前 Apple 设计师开源 UX/UI 资源”身份线索尚未确认。Emil 的 `apple-design` Skill 是对 Apple WWDC 设计内容的整理，不能据此推断作者曾在 Apple 工作。
