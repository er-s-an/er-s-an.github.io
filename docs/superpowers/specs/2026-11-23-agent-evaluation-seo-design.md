# LLM Agent 评测与研究工程多页面 SEO 设计

日期：2026-11-23  
状态：已获用户确认  
适用仓库：`er-s-an/er-s-an.github.io`、`er-s-an/er-s-an`，以及用户拥有的主力项目仓库公开元数据

## Context

现有个人网站具有完整的视觉设计和双语首页，但搜索定位主要集中于 MAKEBOOK CTO 与 Kimi 实习。GitHub Profile 的技术定位也较分散，Location 为空，Section9、AgentMED、AIX_blackbox、kanshanOPENdoor 没有 repository topics。GitHub 搜索基线已确认：

- `evaluation user:er-s-an fork:false` 返回 0 个结果。
- `evaluation in:readme user:er-s-an fork:false` 能找到 Section9。
- `Jiachen Xie in:name location:"Hong Kong"` 返回 0 个结果。

目标是在不降低个人网站视觉质量的前提下，让顶级 AI Lab、大公司和初创企业的招聘人员及招聘 agent 更容易发现、理解并核验 Jiachen Xie / 谢佳辰 / Caesar 的经历。

核心定位为 **LLM Agent Evaluation & Research Engineering**：在真实软件、浏览器和游戏环境中评测 coding agents，分析任务完成、工具调用、失败模式、延迟与 token 成本。目标岗位为 Research Engineer Intern、AI Agent Engineering Intern 和 Agent Evaluation Intern，工程为主、研究为辅。Kimi / Moonshot AI 是明确偏好之一，不再是排他性定位。

不另开域名，不制作公司名或城市排列组合页面，不添加隐藏关键词、关键词云、第三方追踪器或低价值批量页面。

## Information architecture

### 现有双语首页

保留 `/en/`、`/zh/` 和根路径的现有功能与信息架构，只做轻量调整：

- 将 Kimi 定向入口升级为 `Agent evaluation & research engineering`，链接至对应语言的研究作品页。
- 少量调整现有介绍和项目标签，使 Agent Evaluation、Coding Agents、MCP、Tool Use 等术语出现在有真实经历支撑的位置。
- 为 Section9、Kanshan 增加内部案例页入口，保留原有 GitHub、Demo 和外部证据链接。
- 在开源贡献区域增加 RAG-Anything 案例页入口。

首页继续承担个人品牌与完整作品集展示，不变成密集的文字简历。

### 现有研究工程作品页

保留并强化以下现有页面，不新增功能重复的 `/ai-agent-engineer/`：

- `/en/research-engineering/`
- `/zh/research-engineering/`

首屏直接表达 LLM Agent Evaluation & Research Engineering 定位，并保留腾讯、CityUHK、CV、GitHub、邮箱和地点灵活性信息。主体突出三组证据：

1. **Agent evaluation — Section9**：4 类固定故障场景、单／多 Agent 对照、8 次 arm run，以及任务结果、延迟和 token 记录。不得宣称多 Agent 优于单 Agent。
2. **Coding agents & computer use — Kimi / 混元**：真实软件与游戏任务、失败分析、视觉反馈和 token 成本。
3. **Open-source engineering — RAG-Anything**：已合并 PR #453；合成图像与双表格样例中 embedding 调用 65→21、文本模型调用 6→4。该结果只代表此功能样例，不代表通用检索质量基准。

研究作品页链接至三个案例页，并保留原始文章、仓库、运行记录和上游 PR 链接。

### 第一批案例页

首批只制作三个具有独立内容和公开证据的案例，中英文各一版：

- `/en/work/section9/`、`/zh/work/section9/`
- `/en/work/kanshan/`、`/zh/work/kanshan/`
- `/en/work/rag-anything-ingestion/`、`/zh/work/rag-anything-ingestion/`

AgentMED、BLACK BOX、RecallLayer 继续保留在首页和 GitHub；本轮不强行增加案例页。

每个案例页包含：

1. 项目解决的问题与一句话成果。
2. Jiachen 的具体职责和技术决策。
3. 系统架构与关键技术。
4. 实验或工程结果及可核验证据。
5. GitHub、Demo、实验记录或上游 PR。

文案采用“成果先行、证据紧随”的风格，不在每段开头重复免责声明。实验设置、样本范围和取舍集中放在简短的方法或实验设置区域。不得编造生产部署、用户规模、论文、模型训练经历、稳定性结论或行业领先表述。

三个案例的核心表达分别为：

- **Section9**：`An evaluation harness for agents that fix agents.` 强调 paired evaluation、单 Agent 基线、业务验收、权限控制、遥测与原始证据链。
- **Kanshan**：`Turning stories into playable, rule-consistent game worlds.` 强调 analyze→design→compile→validate 故事编译管线、共享 StoryPackage 契约、确定性状态 reducer、浏览器运行时，以及 LLM 只承担表达层的分工。
- **RAG-Anything**：`Cutting multimodal ingestion calls without silently changing graph semantics.` 强调 packed extraction、opt-in 模式、真实 LightRAG store 回归、source ID 可解析、删除与失败回退，以及维护者从 changes requested 到 approved 的工程闭环。

## Visual design

### 首页边界

不修改液态金属、配色、字体、项目卡片体系、滚动逻辑和动效节奏，不新增招聘关键词区块。文案若造成异常换行、卡片高度变化或布局拥挤，优先精简文案，不通过压缩字体或隐藏内容解决。

### 研究作品页

沿用主站字体与品牌色，采用编辑式研究档案排版：

- 定位与联系入口清晰的首屏。
- Section9、模型实测、RAG-Anything 三张证据卡。
- 克制的数据带，展示 4 paired scenarios、8 arm runs、65→21 embedding calls 等结果。
- 真实项目截图、架构图和原始证据链接。

减少装饰动效，保证技术负责人可以快速扫读。

### 案例页模板

三个案例共用阅读骨架和视觉组件，但正文、数据与证据不得套话替换。模板包含返回链接、语言切换、成果首屏、职责与技术栈、架构与实现、结果与证据、相关链接。

先完成 Section9 的完整模板并通过视觉检查，再生成 Kanshan 与 RAG-Anything 页面。图片使用已有真实项目素材或根据真实架构制作的本地 SVG，经压缩后存放于 `assets/case-studies/<slug>/`；不调用第三方图片服务，不使用来源不明的素材。

桌面端检查 1440×1000 和 1280×800，移动端检查 390×844。所有页面不得出现横向溢出，正文在 reduced-motion 和无 JavaScript 情况下保持可读。

## Static generation and metadata

继续采用静态 HTML、CSS、JavaScript 和 Python 标准库，不引入框架、运行时依赖或 CMS。

新增：

- `case-studies.json`：三个案例的双语标题、摘要、职责、技术栈、架构、结果、图片和证据链接。
- `case-study-template.html`：共用静态案例页模板。
- `assets/case-studies/`：本地案例图片与架构图。

扩展 `build-locales.py`：

- 从案例数据源生成六个静态案例页。
- 将首页、研究作品页和案例页全部纳入公开页面检查与 sitemap。
- 检查中英文内容完整性、HTML 平衡、站内链接和本地资源。
- 保持现有首页双语言切换逻辑不变。

每个公开页面具有独立 title、description、canonical、Open Graph 和 reciprocal `hreflang`。首页完善 `Person` 的姓名别名、任职、教育、专业领域与 `sameAs`。研究作品页使用 `ProfilePage` 并引用同一 Person。案例页使用 `BreadcrumbList`，以及适合页面主体的 `SoftwareSourceCode` 或 `CreativeWork`，链接至作者、代码仓库和证据。

不使用 `JobPosting`，因为页面不是招聘发布；不为了富摘要添加无实际内容的 FAQ 或 Review 数据。

扩展 `node --test check.mjs` 覆盖公开页面、唯一 H1、元数据、JSON-LD 解析、站内链接、本地图片和 sitemap 一致性。

## GitHub changes

### Profile

Bio 使用以下 147 字符版本，低于 GitHub 160 字符限制：

> LLM agent evaluation & coding agents | Former Tencent Games AI Agent Intern | CityUHK ’28 | MAKEBOOK CTO | Open to research engineering internships

Location 设置为 `Hong Kong`，用户已明确同意公开。

Profile README：

- 首个网站入口改为 `Agent evaluation portfolio`，链接至 `/en/research-engineering/`。
- 招聘标题改为 `Open to research engineering internships`，保留一句 Kimi / Moonshot AI 偏好。
- 首屏展示 Section9、Kimi／混元实测、RAG-Anything 三条证据。
- 保留 CV、邮箱、中文主页和其他作品入口。
- 折叠区域改为人才摘要、技能矩阵和项目索引，关键词按真实经历分类，不堆叠无证据术语。

### Repository metadata

Section9 描述改为：

> Agent evaluation harness for single-agent and multi-agent incident response. Compares task outcomes, latency, and token usage across four controlled failure scenarios.

Section9 topics：`agent-evaluation`、`llm-agents`、`multi-agent`、`evaluation-harness`、`incident-response`、`agent-infrastructure`。

其他仓库按各自 README 和实际代码设置：

- Kanshan：`ai-game-engine`、`generative-games`、`game-development`、`llm`、`react`、`typescript`。
- AgentMED：`llm-agents`、`agent-evaluation`、`human-in-the-loop`、`release-gates`。
- AIX_blackbox：`agent-payments`、`transaction-verification`、`llm-agents`；只有仓库内容明确证实 x402 时才加入 `x402`。
- RecallLayer：`agent-memory`、`hermes-agent`、`sqlite`、`fts5`、`python`。

保留现有五个置顶仓库，将第六个置顶位设为 `er-s-an/recalllayer`。RAG-Anything 是上游仓库，不修改其元数据。

执行修改前记录现有 Bio、Location、描述、topics 和置顶状态，便于回滚。GitHub 设置修改与网站代码提交分开，便于独立核验。

## Verification

### Local and generated output

运行：

```sh
python3 build-locales.py
node --test check.mjs
python3 -m http.server 53905 --bind 127.0.0.1
```

检查：

- 首页、研究作品页和六个案例页均可直接访问。
- 首页原交互、语言切换、动效与 reduced-motion 检查通过。
- 新页面初始 HTML 包含完整正文，无 JavaScript 时可读。
- canonical、hreflang、Open Graph、JSON-LD、内部链接、sitemap 和本地资源一致。
- 1440px、1280px、390px 视口无横向溢出或明显视觉退化。
- Section9 模板通过检查后，再检查 Kanshan 与 RAG-Anything。
- 浏览器实际点击案例、仓库、Demo、CV、邮箱和语言切换链接。

### Public deployment and discovery

上线后重新请求公开 URL，确认 GitHub Pages 实际发布内容与生成结果一致。重跑：

- `evaluation user:er-s-an fork:false`
- `evaluation in:readme user:er-s-an fork:false`
- `Jiachen Xie in:name location:"Hong Kong"`
- 与实际新增 topics 对应的仓库搜索

默认 evaluation 搜索应能发现 Section9，Location 查询应能发现 `er-s-an`。若 GitHub 搜索索引尚未刷新，记录为待索引，不伪报通过。

Google 收录、排名和实习邀约不是本轮可直接保证的结果。后续通过已验证的 Search Console 观察收录、展示和实际查询词；不得将“SEO 文件已上线”表述为“排名已经提升”。

## Acceptance criteria

- 首页视觉系统和动效保持完整，未新增 SEO 噪音。
- 研究作品页形成明确的 Agent evaluation 与 research engineering 招聘入口。
- 三个双语案例页均有独立、具体、可核验的内容。
- 所有项目数字均能回溯到公开仓库、实验记录或上游 PR。
- GitHub Bio、Location、README、Section9 描述与 topics、主力仓库 topics 和第六置顶位按范围完成。
- 构建、现有测试和新增覆盖检查通过，桌面与移动端浏览器验收通过。
- 公开部署与 GitHub 搜索发现能力经过真实查询验证；未立即完成的第三方索引更新被明确记录。
