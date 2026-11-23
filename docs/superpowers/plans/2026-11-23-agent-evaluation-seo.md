# Agent Evaluation SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished bilingual agent-evaluation recruiting portfolio with three evidence-rich case-study pages, aligned homepage metadata, and discoverable GitHub profile/repository metadata.

**Architecture:** Keep the existing static site and Python standard-library generator. Store bilingual case content in one JSON file, render six case pages from one HTML template, validate every public page in the existing Node test suite, then update GitHub settings separately and verify public discovery with real queries. The user explicitly chose direct execution on the current `main` workspace rather than a worktree.

**Tech Stack:** Static HTML/CSS/JavaScript, Python 3 standard library, Node.js `node:test`, GitHub CLI/API, ego-browser for browser verification.

---

## File map

- `case-studies.json` — bilingual content and evidence for Section9, Kanshan, and RAG-Anything.
- `case-study-template.html` — shared semantic case-study document.
- `build-locales.py` — renders case pages, public metadata, sitemap, and link checks.
- `check.mjs` — public-page contracts plus existing interaction tests.
- `style.css` — shared research/case-study visual components.
- `index.html`, `i18n.js` — bilingual homepage copy, Person schema, and internal case links.
- `en/research-engineering/index.html`, `zh/research-engineering/index.html` — recruiting evidence hub.
- `assets/case-studies/*` — locally hosted real project images and architecture art.
- `README.md` — updated generation and public-page documentation.
- `/Users/xiejiachen/Developer/er-s-an/README.md` — GitHub Profile recruiting entry and evidence index, in its own repository.

### Task 1: Public-page contract and case-study generator

**Files:**
- Modify: `check.mjs:1-45`
- Modify: `build-locales.py:1-166`
- Create: `case-studies.json`
- Create: `case-study-template.html`
- Create: `assets/case-studies/section9-showcase.png`
- Create: `assets/case-studies/kanshan-hall.jpg`
- Create: `assets/case-studies/rag-ingestion.svg`

- [ ] **Step 1: Add the failing public-page contract**

Add `readdirSync` to the Node filesystem import and append this test to `check.mjs`:

```js
const publicPages = [
  'en', 'zh', 'en/research-engineering', 'zh/research-engineering',
  'en/work/section9', 'zh/work/section9',
  'en/work/kanshan', 'zh/work/kanshan',
  'en/work/rag-anything-ingestion', 'zh/work/rag-anything-ingestion',
];

test('every public page has unique metadata, structured data and local targets', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const path of publicPages) {
    const page = readFileSync(new URL(`${path}/index.html`, import.meta.url), 'utf8');
    const language = path.startsWith('zh/') || path === 'zh' ? 'zh-Hans' : 'en';
    const canonical = `https://er-s-an.github.io/${path}/`;
    const title = page.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = page.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title?.includes('Jiachen Xie') || title?.includes('谢佳辰'), `${path}: identity in title`);
    assert.ok(description && description.length >= 70, `${path}: substantive description`);
    assert.ok(!titles.has(title), `${path}: unique title`);
    assert.ok(!descriptions.has(description), `${path}: unique description`);
    titles.add(title);
    descriptions.add(description);
    assert.ok(page.includes(`<html lang="${language}">`), `${path}: language`);
    assert.ok(page.includes(`<link rel="canonical" href="${canonical}">`), `${path}: canonical`);
    assert.equal((page.match(/<h1\b/g) || []).length, 1, `${path}: one H1`);
    assert.ok(page.includes('hreflang="en"'), `${path}: English alternate`);
    assert.ok(page.includes('hreflang="zh-Hans"'), `${path}: Chinese alternate`);
    for (const match of page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(match[1]);
      assert.equal(data['@context'], 'https://schema.org', `${path}: schema context`);
    }
    for (const match of page.matchAll(/(?:href|src)="([^"?#]+)"/g)) {
      const target = match[1];
      if (!/^(https?:|data:|mailto:|#)/.test(target)) {
        assert.ok(target.startsWith('/'), `${path}: root-relative target ${target}`);
        assert.ok(existsSync(new URL(target.replace(/^\//, ''), import.meta.url)), `${path}: ${target}`);
      }
    }
  }
  const sitemap = readFileSync(new URL('sitemap.xml', import.meta.url), 'utf8');
  for (const path of publicPages) assert.ok(sitemap.includes(`<loc>https://er-s-an.github.io/${path}/</loc>`), `sitemap: ${path}`);
});
```

- [ ] **Step 2: Run the contract and confirm the expected failure**

Run:

```bash
node --test --test-name-pattern='every public page' check.mjs
```

Expected: FAIL with `ENOENT` for `en/work/section9/index.html`; the existing 15 tests remain untouched.

- [ ] **Step 3: Create the complete bilingual case dataset**

Create `case-studies.json` with this schema and content. Keep all claims tied to the cited public evidence:

```json
{
  "section9": {
    "slug": "section9",
    "repository": "https://github.com/er-s-an/section9",
    "image": "/assets/case-studies/section9-showcase.png",
    "en": {
      "title": "Section9 — Agent Evaluation Harness | Jiachen Xie",
      "description": "Section9 by Jiachen Xie: a paired evaluation harness for single-agent and multi-agent incident response, with task outcomes, latency, token usage, controlled execution, and independently checked evidence.",
      "kicker": "AGENT EVALUATION · INCIDENT RESPONSE",
      "headline": "An evaluation harness for agents that fix agents.",
      "summary": "Section9 connects runtime evidence, code, controlled execution, and business acceptance in one incident-response workflow. I built a paired showcase that compares single-agent and multi-agent runs without hiding failures or assuming that more agents win.",
      "role": "System design, evaluation harness, backend, controlled execution, evidence UI",
      "stack": ["Python", "TypeScript", "SQLite", "ReAct", "OpenTelemetry", "Langfuse"],
      "imageAlt": "Section9 multi-agent incident-response showcase with live evidence",
      "metrics": [{"value":"4","label":"controlled failure scenarios"},{"value":"8","label":"final-version arm runs"},{"value":"2","label":"independent arms per pair"}],
      "sections": [
        {"title":"Evaluation built around business outcomes","paragraphs":["The harness pairs a single-agent baseline with a multi-agent arm under the same task specification. It records task status, wall-clock latency, token usage, unknown outcomes, and source identity instead of reducing success to a persuasive transcript.","Prompt, cost, loop, and composite failure scenarios each completed one paired closed-loop run on the final source version. The resulting eight arm runs preserve both successes and earlier failures."]},
        {"title":"Controlled repair, not unbounded autonomy","paragraphs":["Section9 combines scoped grants, leases, fencing, cancellation, independent acceptance, and immutable run identities. A repair is evaluated against the affected business behavior after execution, while late responses and stale authority cannot quietly overwrite a newer run.","The read-only showcase projects real task events into an inspectable office and evidence drawers. The interface explains the system, but the underlying events and acceptance reports remain the source of truth."]},
        {"title":"Evidence that survives scrutiny","paragraphs":["The final composite pair passed business acceptance on both arms: the single-agent baseline took 25.007 seconds and 5,338 tokens; the multi-agent arm took 31.905 seconds and 7,183 tokens. This is a recorded result, not a claim of multi-agent superiority.","OpenTelemetry and Langfuse traces, browser acceptance, source hashes, and raw run artifacts make the experiment inspectable end to end."]}
      ],
      "methodTitle": "Evaluation setup",
      "method": "Four controlled scenarios have one normal pair each on the final source version. These are small, fixed-fixture experiments with remote model inference; they do not establish statistical stability or a general advantage for either arm.",
      "links": [{"label":"GitHub repository","href":"https://github.com/er-s-an/section9"},{"label":"Experiment delivery record","href":"https://github.com/er-s-an/section9/blob/main/docs/SHOWCASE_DELIVERY.md"}]
    },
    "zh": {
      "title": "Section9 — Agent 评测与故障响应系统｜谢佳辰",
      "description": "谢佳辰的 Section9：面向单 Agent 与多 Agent 故障响应的配对评测系统，记录任务结果、延迟、Token、受控执行和独立验收证据。",
      "kicker": "AGENT 评测 · 故障响应",
      "headline": "让修复 Agent 的 Agent，也接受可核验的评测。",
      "summary": "Section9 把运行证据、代码、受控执行和业务验收接成一条故障响应工作流。我实现了同案配对展示，对比单 Agent 与多 Agent 的任务结果，同时保留失败，不预设 Agent 越多越好。",
      "role": "系统设计、评测 Harness、后端、受控执行、证据界面",
      "stack": ["Python", "TypeScript", "SQLite", "ReAct", "OpenTelemetry", "Langfuse"],
      "imageAlt": "Section9 多 Agent 故障响应展示与实时证据",
      "metrics": [{"value":"4","label":"固定故障场景"},{"value":"8","label":"最终版本 arm run"},{"value":"2","label":"每组独立对照 arm"}],
      "sections": [
        {"title":"以业务结果为中心的评测","paragraphs":["Harness 在同一任务规格下配对单 Agent 基线与多 Agent arm，记录任务状态、实际耗时、Token、未知结果和源码身份，而不是凭一段看似合理的对话判断成功。","Prompt、成本、循环与复合故障四类场景都在最终源码版本上完成了一组配对闭环，共 8 次 arm run；早期失败也保留在证据中。"]},
        {"title":"受控修复，而不是无限自治","paragraphs":["Section9 实现了权限授予、租约、fencing、取消、独立验收和不可变运行身份。修复执行后要重新检查受影响的业务行为，迟到响应和过期权限不能覆盖更新的运行。","只读展屏把真实任务事件投影为可检查的办公室与证据抽屉。界面负责解释系统，原始事件和验收报告才是事实来源。"]},
        {"title":"经得起追问的证据链","paragraphs":["最终复合故障组中，两侧都通过业务验收：单 Agent 用时 25.007 秒、消耗 5,338 Token；多 Agent 用时 31.905 秒、消耗 7,183 Token。这是实测记录，不是多 Agent 更优的结论。","OpenTelemetry、Langfuse、浏览器验收、源码哈希和原始运行文件，让实验从界面到执行证据都能被复查。"]}
      ],
      "methodTitle": "实验设置",
      "method": "最终版本的四类固定场景各有一组正常配对，使用远程模型推理。样本量不足以证明统计稳定性或任何一种架构的普遍优势。",
      "links": [{"label":"GitHub 仓库","href":"https://github.com/er-s-an/section9"},{"label":"实验交付记录","href":"https://github.com/er-s-an/section9/blob/main/docs/SHOWCASE_DELIVERY.md"}]
    }
  },
  "kanshan": {
    "slug": "kanshan",
    "repository": "https://github.com/er-s-an/kanshanOPENdoor",
    "image": "/assets/case-studies/kanshan-hall.jpg",
    "en": {
      "title": "Kanshan — Story-to-Game Engine | Jiachen Xie",
      "description": "Kanshan Anywhere Door by Jiachen Xie and team: a story-to-game compiler, validated StoryPackage contract, deterministic game-state rules, and playable browser runtime with LLMs confined to expression.",
      "kicker": "GAME ENVIRONMENTS · CREATIVE TOOLS",
      "headline": "Turning stories into playable, rule-consistent game worlds.",
      "summary": "Kanshan Anywhere Door compiles narrative source material into a structured mystery game. Our team separated generative expression from deterministic rules so players can investigate, present evidence, and reach outcomes without the model rewriting the truth of the world.",
      "role": "Story-to-game architecture, compiler pipeline, game rules, browser runtime",
      "stack": ["TypeScript", "React", "Node.js", "LLM APIs", "StoryPackage", "Deterministic reducer"],
      "imageAlt": "Kanshan Anywhere Door portal hall artwork",
      "metrics": [{"value":"4","label":"compiler stages"},{"value":"31","label":"flagship story scenes"},{"value":"S2","label":"Zhihu Hackathon national finalist"}],
      "sections": [
        {"title":"A compiler before a runtime","paragraphs":["The pipeline moves through analyze, design, compile, and validate. Instead of streaming an improvised game directly from a model, it produces a structured StoryPackage that can be checked before the browser runtime consumes it.","The flagship Blue Blood slice contains 31 scenes, alongside Journey to the West and Myopic playable material. Shared contracts connect the compiler, local studio, and game runtime."]},
        {"title":"Deterministic truth, generative expression","paragraphs":["Clue variables, structured evidence presentation, game state, and endings are governed by deterministic rules. LLM output is used for expression and dialogue, with rewriting prompts and out-of-character detection rather than authority over facts.","This separation creates a useful environment for studying long-horizon agent behavior: the system can preserve inspectable state while still allowing flexible natural-language interaction."]},
        {"title":"A game built around its medium","paragraphs":["The showcase is a single-player mystery adapted from Zhihu Yanxuan stories. Investigation, dialogue, evidence, and the final accusation take place inside a Zhihu-style interface, including a comment-thread boss encounter.","The project reached the national finals of Zhihu Hackathon S2. The playable system also includes a portal hall, mobile controls, regression tests, and a sandboxed browser experience."]}
      ],
      "methodTitle": "Project context",
      "method": "Kanshan is a team project and hackathon finalist, not a claim of a production game platform. The architecture and playable evidence are public in the repository; story and platform assets retain their documented rights boundaries.",
      "links": [{"label":"GitHub repository","href":"https://github.com/er-s-an/kanshanOPENdoor"},{"label":"Game design document","href":"https://github.com/er-s-an/kanshanOPENdoor/blob/codex/initial-upload/GDD.md"},{"label":"Current project status","href":"https://github.com/er-s-an/kanshanOPENdoor/blob/codex/initial-upload/STATUS.md"}]
    },
    "zh": {
      "title": "看山任意门 — 故事编译游戏引擎｜谢佳辰",
      "description": "谢佳辰团队的看山任意门：故事编译管线、StoryPackage 结构校验、确定性游戏状态规则与可玩浏览器运行时，让 LLM 专注表达而不篡改世界事实。",
      "kicker": "游戏环境 · 创作工具",
      "headline": "把故事编译成规则一致、真正可玩的游戏世界。",
      "summary": "《看山任意门》把叙事原文编译成结构化剧本杀。团队把生成式表达与确定性规则分开，让玩家搜证、呈证、对峙和走向结局时，模型不能随手改写世界真相。",
      "role": "故事编译架构、编译管线、游戏规则、浏览器运行时",
      "stack": ["TypeScript", "React", "Node.js", "LLM APIs", "StoryPackage", "确定性 reducer"],
      "imageAlt": "看山任意门的门厅美术图",
      "metrics": [{"value":"4","label":"编译阶段"},{"value":"31","label":"旗舰故事幕数"},{"value":"S2","label":"知乎黑客松全国决赛"}],
      "sections": [
        {"title":"先有编译器，再有运行时","paragraphs":["管线依次经过 analyze、design、compile、validate。系统不是让模型一边编故事一边生成游戏规则，而是先产出可校验的 StoryPackage，再交给浏览器运行时。","旗舰《蓝血》切片包含 31 幕，另有《西游》和《近视眼》材料。共享契约连接编译器、本地 Studio 与游戏运行时。"]},
        {"title":"事实确定，表达自由","paragraphs":["线索变量、结构化呈证、游戏状态和结局由确定性规则控制。LLM 负责表达与对话，通过改写式提示词和出戏检测参与体验，而没有修改事实的权限。","这种分工也适合研究长程 Agent：系统既能保留可检查状态，又能提供灵活的自然语言交互。"]},
        {"title":"让玩法长在自己的媒介里","paragraphs":["展示作品改编自知乎盐选故事，调查、对话、证据与最终指认都发生在知乎风格界面里，高潮 Boss 战就在评论区。","项目入围知乎黑客松 S2 全国总决赛。可玩系统还包括门厅、移动端控制、回归测试和沙箱化浏览器体验。"]}
      ],
      "methodTitle": "项目背景",
      "method": "看山是团队项目和黑客松决赛作品，不宣称已经是生产级游戏平台。架构与可玩证据公开在仓库中，故事和平台素材遵循文档记录的权利边界。",
      "links": [{"label":"GitHub 仓库","href":"https://github.com/er-s-an/kanshanOPENdoor"},{"label":"游戏设计文档","href":"https://github.com/er-s-an/kanshanOPENdoor/blob/codex/initial-upload/GDD.md"},{"label":"当前项目状态","href":"https://github.com/er-s-an/kanshanOPENdoor/blob/codex/initial-upload/STATUS.md"}]
    }
  },
  "rag-anything-ingestion": {
    "slug": "rag-anything-ingestion",
    "repository": "https://github.com/HKUDS/RAG-Anything",
    "image": "/assets/case-studies/rag-ingestion.svg",
    "en": {
      "title": "RAG-Anything — Multimodal Ingestion | Jiachen Xie",
      "description": "Jiachen Xie's merged RAG-Anything PR: reduce multimodal ingestion calls with opt-in packed extraction while preserving resolvable source IDs, deletion, fallback behavior, and legacy graph semantics.",
      "kicker": "OPEN SOURCE · MULTIMODAL RAG",
      "headline": "Cutting multimodal ingestion calls without silently changing graph semantics.",
      "summary": "In HKUDS/RAG-Anything PR #453, I reduced model-call amplification during multimodal document ingestion and worked through maintainer review to protect source resolution, deletion, and failure recovery. The result is an opt-in efficiency path, not a hidden change to default behavior.",
      "role": "Design, implementation, regression coverage, benchmark, maintainer iteration",
      "stack": ["Python", "LightRAG", "Multimodal RAG", "pytest", "Ruff"],
      "imageAlt": "Diagram comparing legacy and packed multimodal ingestion calls",
      "metrics": [{"value":"65→21","label":"embedding calls on the fixture"},{"value":"6→4","label":"text-model calls on the fixture"},{"value":"1,283","label":"tests passed on the PR head"}],
      "sections": [
        {"title":"The problem was amplification, not just latency","paragraphs":["Legacy multimodal ingestion could repeatedly send related content through extraction and embedding calls. Packed extraction groups eligible modal items to reduce that amplification while leaving legacy, per-item, and skip behaviors explicit.","On the public synthetic image-and-two-table fixture, legacy used 65 embedding calls and six text-model calls; packed used 21 and four respectively. Vision-model use remained one call."]},
        {"title":"Review exposed a deeper graph-lifecycle issue","paragraphs":["An initial reviewer reproduction found that pack IDs used for graph extraction were not consistently resolvable to registered source chunks. That affected graph retrieval and document cleanup, beyond what a call-count benchmark could reveal.","The revision registered packs before extraction, preserved resolvable source IDs through public insertion and deletion, covered failed-batch fallback with real LightRAG stores, and kept legacy extraction as the default."]},
        {"title":"An upstream change with receipts","paragraphs":["The final PR passed 1,283 tests, Ruff 0.6.4 checks, and Python 3.10–3.12 CI. Live Qwen3-VL and Qwen embedding smoke checks covered insertion, query, public deletion, and all four modes.","The maintainer moved from requesting changes to approving the revised PR, which merged on 12 November 2026. The documentation explicitly records packed-mode retrieval and belongs_to trade-offs."]}
      ],
      "methodTitle": "Benchmark scope",
      "method": "The call-count figures come from one synthetic functional fixture, not a retrieval-quality benchmark. Packed mode is opt-in; representative data should be evaluated before enabling it because it omits belongs_to relations and adds retrieval candidates.",
      "links": [{"label":"Merged PR #453","href":"https://github.com/HKUDS/RAG-Anything/pull/453"},{"label":"Maintainer approval","href":"https://github.com/HKUDS/RAG-Anything/pull/453#pullrequestreview-3543138100"},{"label":"RAG-Anything repository","href":"https://github.com/HKUDS/RAG-Anything"}]
    },
    "zh": {
      "title": "RAG-Anything — 多模态文档摄入优化｜谢佳辰",
      "description": "谢佳辰已合并的 RAG-Anything PR：通过可选 packed extraction 减少多模态摄入调用，同时保持 source ID 可解析、删除与失败回退行为，并保留默认图语义。",
      "kicker": "开源工程 · 多模态 RAG",
      "headline": "减少多模态摄入调用，也不悄悄改变图语义。",
      "summary": "在 HKUDS/RAG-Anything PR #453 中，我减少了多模态文档摄入时的模型调用放大，并在维护者评审中补齐 source 解析、删除和失败恢复。最终得到的是明确 opt-in 的效率路径，而不是对默认行为的暗改。",
      "role": "方案设计、实现、回归覆盖、基准样例、维护者迭代",
      "stack": ["Python", "LightRAG", "多模态 RAG", "pytest", "Ruff"],
      "imageAlt": "legacy 与 packed 多模态摄入调用对比图",
      "metrics": [{"value":"65→21","label":"样例 embedding 调用"},{"value":"6→4","label":"样例文本模型调用"},{"value":"1,283","label":"PR 版本通过测试"}],
      "sections": [
        {"title":"问题是调用放大，不只是延迟","paragraphs":["Legacy 多模态摄入会对相关内容重复执行抽取与 embedding 调用。Packed extraction 将符合条件的 modal items 分组，减少调用放大，同时保留 legacy、per-item 和 skip 的明确行为。","公开的合成图像加双表格样例中，legacy 使用 65 次 embedding 和 6 次文本模型调用；packed 分别为 21 次和 4 次，视觉模型均为 1 次。"]},
        {"title":"评审暴露了更深的图生命周期问题","paragraphs":["维护者最初复现发现，用于图抽取的 pack ID 无法稳定解析到已注册 source chunks，影响图检索和文档清理；这不是调用次数基准能覆盖的问题。","修订版在抽取前注册 packs，保证公开插入与删除路径中的 source ID 可解析，使用真实 LightRAG stores 覆盖失败批次回退，并保留 legacy 为默认行为。"]},
        {"title":"有完整收据的上游改动","paragraphs":["最终 PR 通过 1,283 项测试、Ruff 0.6.4 和 Python 3.10–3.12 CI。Qwen3-VL 与 Qwen embedding 实测覆盖四种模式的插入、查询和公开删除。","维护者从要求修改转为批准，PR 于 2026 年 11 月 12 日合并。文档明确记录 packed 模式的检索候选与 belongs_to 取舍。"]}
      ],
      "methodTitle": "基准范围",
      "method": "调用数字来自一个合成功能样例，不是检索质量基准。Packed 为 opt-in；它会省略 belongs_to 关系并增加检索候选，在真实数据上启用前仍需评估。",
      "links": [{"label":"已合并 PR #453","href":"https://github.com/HKUDS/RAG-Anything/pull/453"},{"label":"RAG-Anything 仓库","href":"https://github.com/HKUDS/RAG-Anything"}]
    }
  }
}
```

- [ ] **Step 4: Create the case-study HTML template**

Create `case-study-template.html`:

```html
<!doctype html>
<html lang="{{lang}}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}}</title>
  <meta name="description" content="{{description}}">
  <link rel="canonical" href="{{canonical}}">
  <link rel="alternate" hreflang="en" href="{{englishUrl}}">
  <link rel="alternate" hreflang="zh-Hans" href="{{chineseUrl}}">
  <meta property="og:title" content="{{title}}">
  <meta property="og:description" content="{{description}}">
  <meta property="og:url" content="{{canonical}}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="{{socialImage}}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css?v=agent-evaluation-cases-1">
  <script type="application/ld+json">{{jsonLd}}</script>
</head>
<body>
  <header class="research-nav wrap">
    <a class="text-link" href="{{backHref}}">{{backLabel}}</a>
    <a class="text-link" href="{{languageHref}}" lang="{{languageLang}}">{{languageLabel}}</a>
  </header>
  <main class="case-profile wrap">
    <p class="eyebrow">{{kicker}}</p>
    <h1>{{headline}}</h1>
    <p class="case-summary">{{summary}}</p>
    <div class="research-links">{{links}}</div>
    <figure class="case-hero"><img src="{{image}}" width="1440" height="900" alt="{{imageAlt}}"></figure>
    <dl class="case-facts">
      <div><dt>{{roleLabel}}</dt><dd>{{role}}</dd></div>
      <div><dt>{{stackLabel}}</dt><dd class="case-stack">{{stack}}</dd></div>
    </dl>
    <section class="case-metrics" aria-label="{{metricsLabel}}">{{metrics}}</section>
    {{sections}}
    <section class="case-method"><h2>{{methodTitle}}</h2><p>{{method}}</p></section>
  </main>
</body>
</html>
```

- [ ] **Step 5: Add deterministic rendering to the existing generator**

After `render(language)` in `build-locales.py`, add:

```python
def render_case_studies():
    template = (ROOT / "case-study-template.html").read_text()
    studies = json.loads((ROOT / "case-studies.json").read_text())
    generated = []
    for study in studies.values():
        for language in ("en", "zh"):
            copy = study[language]
            path = f"{language}/work/{study['slug']}"
            canonical = f"{BASE}/{path}/"
            other = "zh" if language == "en" else "en"
            other_path = f"{other}/work/{study['slug']}"
            links = "".join(
                f'<a class="text-link" href="{html.escape(link["href"], quote=True)}">{html.escape(link["label"])} ↗</a>'
                for link in copy["links"]
            )
            stack = "".join(f'<span class="skill-tag">{html.escape(item)}</span>' for item in copy["stack"])
            metrics = "".join(
                f'<div><strong>{html.escape(item["value"])}</strong><span>{html.escape(item["label"])}</span></div>'
                for item in copy["metrics"]
            )
            sections = "".join(
                '<section class="case-section">'
                f'<h2>{html.escape(section["title"])}</h2>'
                + "".join(f'<p>{html.escape(paragraph)}</p>' for paragraph in section["paragraphs"])
                + '</section>'
                for section in copy["sections"]
            )
            entity = {
                "@type": "SoftwareSourceCode",
                "name": copy["title"].split("—")[0].strip(),
                "description": copy["description"],
                "url": canonical,
                "codeRepository": study["repository"],
                "author": {"@id": f"{BASE}/#person"},
            }
            schema = {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "url": canonical,
                "name": copy["title"],
                "description": copy["description"],
                "inLanguage": "zh-Hans" if language == "zh" else "en",
                "breadcrumb": {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "Jiachen Xie", "item": f"{BASE}/{language}/"},
                        {"@type": "ListItem", "position": 2, "name": "Work", "item": f"{BASE}/{language}/#work"},
                        {"@type": "ListItem", "position": 3, "name": entity["name"], "item": canonical},
                    ],
                },
                "mainEntity": entity,
            }
            tokens = {
                "lang": "zh-Hans" if language == "zh" else "en",
                "title": copy["title"], "description": copy["description"],
                "canonical": canonical,
                "englishUrl": f"{BASE}/en/work/{study['slug']}/",
                "chineseUrl": f"{BASE}/zh/work/{study['slug']}/",
                "socialImage": f"{BASE}/assets/social-card.png",
                "jsonLd": json.dumps(schema, ensure_ascii=False).replace("<", "\\u003c"),
                "backHref": f"/{language}/research-engineering/",
                "backLabel": "← Research engineering" if language == "en" else "← 研究工程作品",
                "languageHref": f"/{other_path}/",
                "languageLang": "zh-Hans" if language == "en" else "en",
                "languageLabel": "简体中文" if language == "en" else "English",
                "kicker": copy["kicker"], "headline": copy["headline"], "summary": copy["summary"],
                "links": links,
                "image": study["image"], "imageAlt": copy["imageAlt"],
                "roleLabel": "ROLE" if language == "en" else "职责", "role": copy["role"],
                "stackLabel": "TECHNOLOGIES" if language == "en" else "技术", "stack": stack,
                "metricsLabel": "Key results" if language == "en" else "关键结果", "metrics": metrics,
                "sections": sections, "methodTitle": copy["methodTitle"], "method": copy["method"],
            }
            output = template
            for key, value in tokens.items():
                replacement = value if key in {"links", "stack", "metrics", "sections", "jsonLd"} else html.escape(str(value), quote=True)
                output = output.replace("{{" + key + "}}", replacement)
            assert "{{" not in output, f"Unresolved case template token: {path}"
            directory = ROOT / path
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "index.html").write_text(output)
            generated.append(path)
    return generated
```

Before the sitemap is written, extend the public-page tuple with `PUBLIC_PAGES += tuple(render_case_studies())`. Keep the existing homepage rendering and final validation loop unchanged.

- [ ] **Step 6: Add the three local visual assets**

Run:

```bash
mkdir -p assets/case-studies
curl -fL https://raw.githubusercontent.com/er-s-an/section9/main/artifacts/showcase-browser/2026-09-22T06-45-38.956Z/06-swarm-1280.png -o assets/case-studies/section9-showcase.png
curl -fL https://raw.githubusercontent.com/er-s-an/kanshanOPENdoor/codex/initial-upload/game/public/art/portal-hall.jpg -o assets/case-studies/kanshan-hall.jpg
```

Create `assets/case-studies/rag-ingestion.svg` as a 1440×900 local vector diagram with two labeled columns: `LEGACY / 65 embedding / 6 text model` and `PACKED / 21 embedding / 4 text model`, connected to `1 vision model call`, `resolvable source IDs`, and `opt-in graph semantics`. Use the existing `#2143ed`, `#171724`, `#d8ff52`, and off-white palette. Include a text note: `Synthetic image + two-table functional fixture`.

Inspect all three files with `ReadMediaFile`; verify that screenshots are legible and the SVG contains no fabricated product UI.

- [ ] **Step 7: Generate and run the public-page contract**

Run:

```bash
python3 build-locales.py
node --test check.mjs
```

Expected: all six case pages are generated, the sitemap contains ten public URLs, and all tests pass. If a content assertion fails, fix the source rather than weakening the contract.

- [ ] **Step 8: Commit the working generator**

```bash
git add case-studies.json case-study-template.html build-locales.py check.mjs assets/case-studies en/work zh/work sitemap.xml
git commit -m "Add bilingual agent engineering case studies"
```

### Task 2: Case-study visual system and Section9-first browser review

**Files:**
- Modify: `style.css:73-101`
- Modify: `case-study-template.html`
- Test: `check.mjs`

- [ ] **Step 1: Add responsive research/case components**

Append CSS implementing these exact requirements:

```css
.case-profile{max-width:1040px;padding-block:clamp(38px,6vw,76px)}
.case-profile h1{max-width:960px;font-size:clamp(2.8rem,7.2vw,6.4rem);line-height:1.02;letter-spacing:-.055em;margin:18px 0 24px;text-wrap:balance}
.case-summary{max-width:780px;font-size:clamp(1.05rem,2vw,1.35rem);line-height:1.65;color:#454551}
.case-hero{margin:36px 0 0;border-radius:24px;overflow:hidden;background:#e9edf5;border:1px solid var(--line)}
.case-hero img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover}
.case-facts{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:32px 0;padding:26px 0;border-block:1px solid var(--line)}
.case-facts dt{font-size:.65rem;letter-spacing:.1em;margin-bottom:10px}.case-facts dd{margin:0;line-height:1.55}
.case-stack{display:flex;flex-wrap:wrap;gap:8px}.skill-tag{border:1px solid var(--line);border-radius:999px;padding:5px 10px;font-size:.72rem}
.case-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:34px 0}
.case-metrics>div{background:var(--blue);color:#fff;border-radius:18px;padding:24px;min-width:0}
.case-metrics strong{display:block;font-family:var(--display);font-size:clamp(2rem,5vw,4rem);letter-spacing:-.06em;overflow-wrap:anywhere}
.case-metrics span{display:block;margin-top:8px;font-size:.78rem;line-height:1.45;color:#e3e8ff}
.case-section{display:grid;grid-template-columns:minmax(220px,.75fr) 1.25fr;gap:50px;border-top:1px solid var(--line);padding:40px 0}
.case-section h2{font-size:clamp(1.65rem,3.4vw,2.65rem);line-height:1.15;text-wrap:balance}
.case-section p,.case-method p{font-size:1rem;line-height:1.8;color:#454551}.case-section p+p{margin-top:18px}
.case-method{margin:16px 0 50px;padding:26px;border:1px solid var(--line);border-radius:18px;background:#f0f5ff}
.case-method h2{font-size:1.1rem;margin-bottom:10px}
@media(max-width:700px){.case-facts,.case-section{grid-template-columns:1fr;gap:18px}.case-metrics{grid-template-columns:1fr}.case-hero{border-radius:16px}.case-profile h1{font-size:clamp(2.35rem,12vw,4.2rem)}}
```

- [ ] **Step 2: Serve the generated site and inspect Section9 first**

Run `python3 -m http.server 53905 --bind 127.0.0.1` as a background task. In ego-browser, open `http://127.0.0.1:53905/en/work/section9/`, then capture 1440×1000, 1280×800, and 390×844 screenshots. Inspect the full page, not only the hero.

Expected: no horizontal overflow, balanced H1 wrapping, readable evidence paragraphs, legible metrics, working language switch, and no overlap at any viewport. Make only case-component CSS adjustments if needed.

- [ ] **Step 3: Inspect Kanshan and RAG-Anything using the approved template**

Open both English pages and their Chinese counterparts at 1440×1000 and 390×844. Verify that long metric values and Chinese headlines wrap without overflow and that all images preserve their intended aspect ratio.

- [ ] **Step 4: Add a static no-JavaScript content assertion**

Append to `check.mjs`:

```js
test('case studies are complete in initial HTML without scripts', () => {
  for (const slug of ['section9', 'kanshan', 'rag-anything-ingestion']) {
    for (const language of ['en', 'zh']) {
      const page = readFileSync(new URL(`${language}/work/${slug}/index.html`, import.meta.url), 'utf8');
      assert.ok(!page.includes('<script src='), `${language}/${slug}: no script dependency`);
      assert.equal((page.match(/class="case-section"/g) || []).length, 3, `${language}/${slug}: three sections`);
      assert.ok(page.includes('class="case-method"'), `${language}/${slug}: method context`);
    }
  }
});
```

Run `node --test check.mjs`; expected PASS.

- [ ] **Step 5: Commit the verified visual system**

```bash
git add style.css case-study-template.html check.mjs
git commit -m "Style responsive agent case studies"
```

### Task 3: Turn research-engineering into the recruiting evidence hub

**Files:**
- Modify: `en/research-engineering/index.html:6-75`
- Modify: `zh/research-engineering/index.html:6-75`
- Modify: `style.css`
- Test: `check.mjs`

- [ ] **Step 1: Add a failing evidence-hub contract**

Append to `check.mjs`:

```js
test('research portfolio links the three evidence-backed case studies', () => {
  for (const language of ['en', 'zh']) {
    const page = readFileSync(new URL(`${language}/research-engineering/index.html`, import.meta.url), 'utf8');
    for (const slug of ['section9', 'kanshan', 'rag-anything-ingestion']) {
      assert.ok(page.includes(`/${language}/work/${slug}/`), `${language}: ${slug}`);
    }
    assert.ok(page.includes('application/ld+json'), `${language}: ProfilePage schema`);
    assert.ok(page.includes('Kimi'), `${language}: Kimi preference remains`);
    assert.ok(page.includes('65'), `${language}: RAG fixture evidence`);
  }
});
```

Run `node --test --test-name-pattern='research portfolio' check.mjs`; expected FAIL for the missing Section9 case link.

- [ ] **Step 2: Replace the research hero and evidence cards in English**

Use this hero copy:

```html
<h1>Jiachen Xie <span>/ 谢佳辰</span></h1>
<p class="research-role">LLM Agent Evaluation &amp; Research Engineering</p>
<p>I evaluate coding agents on real software, browser, and game tasks—and build the harnesses that make their behavior measurable. I’m a Computer and Data Engineering undergraduate at CityUHK (2028) and a former AI Agent Engineering Intern at Tencent Games LIGHTSPEED STUDIOS.</p>
```

Use three evidence cards linking `/en/work/section9/`, the existing Kimi/Hunyuan articles plus `/en/work/kanshan/`, and `/en/work/rag-anything-ingestion/`. The visible card copy must include:

```text
Agent evaluation · Section9
Paired single-agent and multi-agent incident response across four controlled scenarios, with eight final-version arm runs and inspectable outcome, latency, and token evidence.

Coding agents & computer use · Kimi / Hunyuan
Game prototypes, video editing, long-horizon computer use, and reference-image-to-game tasks—examining deliverable quality, failure modes, visual feedback, and token cost.

Open-source engineering · RAG-Anything
A merged ingestion optimization that reduced embedding calls from 65 to 21 and text-model calls from 6 to 4 on a synthetic multimodal fixture, with real-store regressions and maintainer approval.
```

Retain the existing Agent harnesses/MCP, education, research interests, CV, email, GitHub, location-flexibility, and original article links. Change the research-interest heading to `Research engineering internships` and keep Kimi as one preference among leading labs.

- [ ] **Step 3: Apply the equivalent Chinese content**

Use the Chinese positioning `大模型 Agent 评测与研究工程` and the same three evidence relationships. Keep the numeric claims identical, translate the surrounding copy naturally, and link `/zh/work/<slug>/`。保留腾讯、CityUHK、Kimi 偏好、地点灵活性、CV、邮箱与原始文章链接。

- [ ] **Step 4: Add ProfilePage metadata and evidence-card styling**

For each language, add JSON-LD with `@type: ProfilePage`, the canonical URL, the correct `inLanguage`, and `mainEntity: {"@id":"https://er-s-an.github.io/#person"}`. Add unique titles/descriptions centered on `LLM Agent Evaluation & Research Engineering`; add `og:image` using `/assets/social-card.png`.

Style the three cards with the existing `experience-card contribution` components and the case metrics style. Do not add carousels, hidden text, or script-dependent content.

- [ ] **Step 5: Run tests and inspect both research pages**

Run:

```bash
python3 build-locales.py
node --test check.mjs
```

Expected PASS. Inspect English and Chinese research pages at 1440×1000 and 390×844, then click every case-study link once to confirm the destination and back link.

- [ ] **Step 6: Commit the evidence hub**

```bash
git add en/research-engineering zh/research-engineering style.css check.mjs
git commit -m "Focus research portfolio on agent evaluation"
```

### Task 4: Align the bilingual homepage and Person schema

**Files:**
- Modify: `index.html:8-58,89-93,127-149,284-313`
- Modify: `i18n.js:1-190`
- Modify: `style.css`
- Modify: `README.md:28-36`
- Test: `check.mjs`

- [ ] **Step 1: Add failing homepage discovery assertions**

Append to `check.mjs`:

```js
test('homepage exposes agent evaluation positioning and case-study links', () => {
  for (const target of ['/en/work/section9/', '/en/work/kanshan/', '/en/work/rag-anything-ingestion/', '/en/research-engineering/']) {
    assert.ok(html.includes(target), target);
  }
  for (const term of ['Agent evaluation', 'Coding agents', 'knowsAbout']) assert.ok(html.includes(term), term);
  const copy = JSON.parse(localization.slice(localization.indexOf('{'), localization.indexOf('\n};') + 2));
  assert.ok(copy['career.hero'].includes('/zh/research-engineering/'));
  assert.ok(copy['oss.ragCase'].includes('/zh/work/rag-anything-ingestion/'));
});
```

Run `node --test --test-name-pattern='homepage exposes' check.mjs`; expected FAIL for missing internal targets.

- [ ] **Step 2: Update identity metadata without changing the visual hero**

Use the English title `Jiachen Xie (Caesar) | LLM Agent Evaluation & Research Engineering` and a description naming CityUHK, Tencent Games, coding-agent evaluation, MCP, and research engineering internships. Add equivalent Chinese fields.

Add this to the existing Person object, preserving all current identity fields:

```json
"knowsAbout": [
  "LLM agent evaluation",
  "Coding agents",
  "Agent harnesses",
  "Model Context Protocol",
  "ReAct",
  "Tool use",
  "Multi-agent systems",
  "Computer-use evaluation",
  "Multimodal RAG",
  "Game environments"
]
```

- [ ] **Step 3: Add internal links while preserving external evidence links**

Keep AgentMED and BLACK BOX rows unchanged. Keep the existing GitHub destinations on project rows; add sibling `text-link` elements immediately after the Section9 and Kanshan rows:

```html
<a class="text-link case-study-link" href="/en/work/section9/" data-i18n="section9.case">Read Section9 case study <span aria-hidden="true">→</span></a>
<a class="text-link case-study-link" href="/en/work/kanshan/" data-i18n="kanshan.case">Read Kanshan case study <span aria-hidden="true">→</span></a>
```

Add a Section9 row as project 01 and renumber AgentMED, BLACK BOX, and Kanshan to 02, 03, and 04. The current homepage source has no Section9 row. Its GitHub destination is `https://github.com/er-s-an/section9`; its visible tag is `AGENT EVALUATION / INCIDENT RESPONSE`, and its summary is `Paired single-agent and multi-agent incident response with business acceptance, latency, token usage, and independently checked evidence.` Add the Chinese translation.

Add `oss.ragCase` below the existing RAG contribution paragraph, preserving both upstream PR links:

```html
<p data-i18n="oss.ragCase"><a class="text-link" href="/en/work/rag-anything-ingestion/">Read the ingestion engineering case study <span aria-hidden="true">→</span></a></p>
```

Replace the hero internship anchor with a translated wrapper so each language links to its own research page:

```html
<span data-i18n="career.hero"><a class="hero-cv" href="/en/research-engineering/">Agent evaluation &amp; research engineering <span aria-hidden="true">↗</span></a></span>
```

Update the Chinese value to contain the complete `/zh/research-engineering/` anchor. Add concise CSS for `.case-study-link` and `.hero-actions>span` that preserves the current flex rhythm.

- [ ] **Step 4: Regenerate and run the full suite**

Run:

```bash
python3 build-locales.py
node --test check.mjs
```

Expected PASS, including the original 15 interaction tests. Compare English and Chinese homepages at 1440×1000 and 390×844 against the baseline; shorten copy if project rows or hero actions visibly overflow.

- [ ] **Step 5: Update project documentation**

Update `README.md` to list `case-studies.json`, `case-study-template.html`, all ten public URLs, the six generated case pages, the same build/test commands, and the requirement to commit generated output with source changes. Remove any statement that the sitemap contains only homepages and research pages.

- [ ] **Step 6: Commit homepage and documentation alignment**

```bash
git add index.html i18n.js style.css check.mjs README.md en/index.html zh/index.html sitemap.xml
git commit -m "Align homepage with agent evaluation portfolio"
```

### Task 5: Rebuild the GitHub Profile recruiting entry

**Files:**
- Create locally if absent: `/Users/xiejiachen/Developer/er-s-an/README.md`
- Preserve: `/Users/xiejiachen/Developer/er-s-an/assets/cover.png`
- Preserve: `/Users/xiejiachen/Developer/er-s-an/cv/Jiachen-Xie-CV.pdf`

- [ ] **Step 1: Clone and verify the Profile repository baseline**

Run:

```bash
gh repo clone er-s-an/er-s-an /Users/xiejiachen/Developer/er-s-an
git -C /Users/xiejiachen/Developer/er-s-an status --short --branch
```

Expected: clean `main`. Read any repository `AGENTS.md` before editing. Do not alter the cover or CV binary files.

- [ ] **Step 2: Rewrite the first screen around three evidence links**

Keep the cover and identity heading. Use this link row and recruiting block:

```markdown
[AGENT EVALUATION PORTFOLIO ↗](https://er-s-an.github.io/en/research-engineering/) &nbsp; · &nbsp; [中文主页 ↗](https://er-s-an.github.io/zh/) &nbsp; · &nbsp; [CV / PDF ↗](cv/Jiachen-Xie-CV.pdf) &nbsp; · &nbsp; [GITHUB ↗](https://github.com/er-s-an) &nbsp; · &nbsp; [EMAIL ↗](mailto:3137612974@qq.com)

### Open to research engineering internships

I evaluate coding agents on real software, browser, and game tasks, and build the harnesses that make agent behavior measurable. I’m especially interested in the Kimi team at Moonshot AI, and open to research engineering and AI agent engineering internships at leading labs and product teams. Any location; able to adjust my studies for the right opportunity.
```

Immediately below, add these three evidence entries:

```markdown
### Evidence for agent evaluation and research engineering

**[Agent evaluation · Section9 ↗](https://er-s-an.github.io/en/work/section9/)** — paired single-agent and multi-agent incident response across four controlled scenarios, with eight final-version arm runs and inspectable outcome, latency, and token evidence. [Raw experiment record ↗](https://github.com/er-s-an/section9/blob/main/docs/SHOWCASE_DELIVERY.md)

**[Coding agents & computer use · Kimi / Hunyuan ↗](https://er-s-an.github.io/en/research-engineering/)** — game prototypes, video editing, long-horizon computer use, and reference-image-to-game tasks, examining deliverable quality, failure modes, visual feedback, and token cost.

**[Open-source engineering · RAG-Anything ↗](https://er-s-an.github.io/en/work/rag-anything-ingestion/)** — merged PR reducing embedding calls from 65 to 21 and text-model calls from 6 to 4 on a synthetic multimodal fixture, with real-store regressions and maintainer approval. [Upstream PR #453 ↗](https://github.com/HKUDS/RAG-Anything/pull/453)
```

- [ ] **Step 3: Convert the folded area into a structured talent index**

Keep the existing projects and Chinese summary, but make `<details>` contain these exact groups:

```markdown
<details>
<summary>Technical index for recruiters and research teams</summary>

**Agent evaluation:** controlled task design, single-agent baselines, outcome and failure analysis, latency and token tracking, business acceptance.

**Agent engineering:** ReAct, MCP-compatible tools, coding agents, computer use, browser and game environments, multi-agent coordination.

**Engineering:** Python, TypeScript, React, Node.js, SQLite, Godot prototypes, multimodal RAG, document ingestion.

**Selected systems:** Section9, AgentMED, BLACK BOX, Kanshan Anywhere Door, RecallLayer.

**Research and writing:** hands-on Kimi K3 and Tencent Hunyuan HY4 evaluations, task completion, visual feedback, harness limitations, and token cost.

**Evidence:** merged contributions to RAG-Anything, LightRAG, nanobot, and Hermes Agent; AdventureX 2026 Web3 winner; Zhihu Hackathon S2 national finalist.

</details>
```

Do not add unverified claims about pretraining, publications, production traffic, or model superiority.

- [ ] **Step 4: Validate links and commit the Profile repository separately**

Run a Markdown link extraction check and request every local CV/link target; use `node --test check.mjs` only for the website repository, not for the Profile repository.

```bash
git -C /Users/xiejiachen/Developer/er-s-an diff --check
git -C /Users/xiejiachen/Developer/er-s-an add README.md
git -C /Users/xiejiachen/Developer/er-s-an commit -m "Focus profile on agent evaluation and research engineering"
```

### Task 6: Update GitHub Bio, Location, topics, and pinned repository

**Files:**
- No source files; public settings only. Record textual before/after command output for final verification.

- [ ] **Step 1: Capture current public settings**

Run `gh api user --jq '{bio,location}'`, the pinned-items GraphQL query, and `gh repo view` for Section9, AgentMED, AIX_blackbox, kanshanOPENdoor, and recalllayer. Confirm the baseline still matches the approved design before changing it.

- [ ] **Step 2: Apply the approved Bio and Location**

```bash
gh api -X PATCH user \
  -f bio='LLM agent evaluation & coding agents | Former Tencent Games AI Agent Intern | CityUHK ’28 | MAKEBOOK CTO | Open to research engineering internships' \
  -f location='Hong Kong' \
  --jq '{bio,location}'
```

Expected: the exact 147-character Bio and `Hong Kong`.

- [ ] **Step 3: Apply Section9 description and topics**

```bash
gh repo edit er-s-an/section9 --description 'Agent evaluation harness for single-agent and multi-agent incident response. Compares task outcomes, latency, and token usage across four controlled failure scenarios.'
gh api -X PUT repos/er-s-an/section9/topics \
  -f 'names[]=agent-evaluation' -f 'names[]=llm-agents' -f 'names[]=multi-agent' \
  -f 'names[]=evaluation-harness' -f 'names[]=incident-response' -f 'names[]=agent-infrastructure'
```

- [ ] **Step 4: Apply evidence-specific topics to the other owned repositories**

Use the approved topic sets from the design document. Before applying AIX_blackbox topics, search its README for `x402`; include that topic only on a literal match. Do not replace OH-MY-MIMO-CODE’s existing topics.

Verify each write immediately with `gh repo view <repo> --json description,repositoryTopics` and compare the exact names.

- [ ] **Step 5: Pin RecallLayer as the sixth repository**

Retrieve `er-s-an/recalllayer`’s GraphQL repository ID, call GitHub’s `pinRepository` mutation with that ID, then query `user(login:"er-s-an") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name } } } }`.

Expected: the existing five repositories plus `recalllayer`, with no duplicates and no seventh item. If the authenticated API does not support the mutation, stop before changing pin order and report the exact API error rather than using browser automation against account settings.

### Task 7: Full verification, publication, and discovery checks

**Files:**
- Verify all modified files in both repositories.
- Create no persistent test reports or screenshot artifacts in either repository.

- [ ] **Step 1: Run clean generation and all automated checks**

In the website repository:

```bash
python3 build-locales.py
node --test check.mjs
git diff --check
git status --short --branch
```

Expected: all tests pass, no whitespace errors, and only intended source/generated files are committed. Run `git diff --check` and inspect `git diff` in the Profile repository as well.

- [ ] **Step 2: Exercise the complete local user journey**

With the local server running, use ego-browser to visit:

```text
/en/ → Agent evaluation & research engineering → Section9 case → raw experiment record
/en/ → Kanshan case → GitHub repository
/en/ → RAG-Anything case → merged upstream PR
/zh/research-engineering/ → each Chinese case → language switch → back link
/cv/Jiachen-Xie-CV.pdf
```

Check the 1440×1000, 1280×800, and 390×844 viewports, reduced motion, keyboard focus, and initial HTML without script dependencies. Delete temporary screenshots on completion; do not commit them.

- [ ] **Step 3: Push the two approved repositories**

```bash
git -C /Users/xiejiachen/Developer/er-s-an.github.io push origin main
git -C /Users/xiejiachen/Developer/er-s-an push origin main
```

Expected: website design, implementation, and Profile README commits are public. Do not push any project repository source changes because Task 6 changes metadata only.

- [ ] **Step 4: Verify the public deployment**

Request every public URL with HTTP status checks and inspect the live canonical, title, description, hreflang, JSON-LD, sitemap, images, and internal links. Open the GitHub Profile and confirm the first-screen evidence links and folded technical index render correctly.

Expected: all ten website URLs return 200, CV returns 200, and GitHub Pages serves the generated content rather than a stale previous version.

- [ ] **Step 5: Rerun real GitHub discovery queries**

```bash
gh api 'search/repositories?q=evaluation+user:er-s-an+fork:false' --jq '{total_count,items:[.items[].full_name]}'
gh api 'search/repositories?q=evaluation+in:readme+user:er-s-an+fork:false' --jq '{total_count,items:[.items[].full_name]}'
gh api 'search/users?q=Jiachen+Xie+in:name+location:Hong+Kong' --jq '{total_count,items:[.items[].login]}'
gh api 'search/repositories?q=topic:agent-evaluation+user:er-s-an+fork:false' --jq '{total_count,items:[.items[].full_name]}'
```

Expected after GitHub indexing: Section9 appears in default evaluation and agent-evaluation searches; `er-s-an` appears in the Location query. If an index has not refreshed, record that exact pending condition and rerun once later rather than claiming a pass.

- [ ] **Step 6: Final review and handoff**

Run `git status --short --branch` in both repositories and confirm no temporary artifacts remain. Report changed public URLs, GitHub settings, test results, screenshots checked, search-query outcomes, and the distinction between verified discoverability and longer-term Google Search Console performance.
