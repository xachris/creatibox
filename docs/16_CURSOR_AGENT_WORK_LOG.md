# CreatiBox — Cursor 代理工作记录

## 1. 文档目的

本文件是 Cursor Cloud Agent 接手本仓库后的**持续工作记录**。

它不是产品规格，也不替代 `CHANGELOG.md`。职责是：

- 记录接手基线（从哪里开始）
- 记录每次开发会话改了什么、为什么改、怎么验证
- 留下未完成项与已知边界，方便下一次无缝续上

产品决策与功能变更的正式摘要仍写入 `docs/CHANGELOG.md`。
本文件侧重**过程与交接**。

---

## 2. 记录规则

每次实质性开发会话结束前，代理必须追加一条「会话记录」，至少包含：

| 字段 | 要求 |
| --- | --- |
| 日期 | `YYYY-MM-DD` |
| 会话目标 | 本轮要完成什么 |
| 分支 / PR | 分支名；有 PR 则写链接 |
| 改动摘要 | 文件级或模块级说明，勿只写「修了 bug」 |
| 验证 | 跑过哪些命令、浏览器测了什么、结果如何 |
| 未完成 / 后续 | 明确留给下一轮的事项 |
| 风险 / 边界 | 已知限制、刻意不做的事 |

格式约定：

- 新会话写在「会话记录」区**最上方**（倒序，最新在前）
- 只记录事实，不写空话
- 无代码改动的纯答疑会话可跳过；一旦改仓库，必须记

---

## 3. 接手基线（2026-09-23）

### 3.1 来源

- 仓库：`https://github.com/xachris/creatibox`
- 前序开发：由 ChatGPT 在 GitHub 侧推进；因额度不足移交 Cursor
- 接手时分支：`main` @ `912a198`（`fix: complete direct-start racing runtime and replay loop`）
- 工作区：干净，与 `origin/main` 同步
- 线上体验：https://creatibox-web-production.up.railway.app
  （部署由 Railway ↔ GitHub 侧配置；本代理环境**未**接入 Railway 控制台）

### 3.2 产品定位（接手时已冻结）

CreatiBox：面向中小学生的单机网页创作平台。
底层是可扩展的 **2D Interactive World Builder**；第一版以 **Racing Creator** 验证入口。

世界语言：

```text
Entity → State → Action → Interaction → Transition
```

V0.1 **不做**：账号、班级、教师后台、云同步、AI、网络多人等。

### 3.3 技术栈（接手时）

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3 + TypeScript + Vite |
| 画布 | PixiJS 8 |
| 存储 | IndexedDB（`idb`）+ `.creatibox` 导出/导入 |
| 测试 | Vitest（接手时 31 项） |
| CI | GitHub Actions：install → typecheck → test → build |
| 生产静态服 | `serve -s dist`（`package.json` `start`，适配 Railway `$PORT`） |

### 3.4 已实现能力（接手时）

- 活动目录首页 + 赛车六步启动（play-first）
- 赛道生成、玩家/电脑车、倒计时、摄像机跟随、终点结果、重赛/编辑/回首页
- Edit / Run / Stop；WASD / 方向键；碰撞与损伤规则
- Undo / Redo；IndexedDB 自动保存；项目导入导出
- 开发验收页：`tests/drive.html`（持续按键注入）

### 3.5 已知边界（接手时，勿当作已完成）

- 刹车仅 Down；单圈路径点 AI / 简化物理
- 音效族为保存占位，未真正播放落地
- 拖拽手感、多屏幕尺寸、真实课堂体验尚未充分验收
- `npm audit` 有 2 个 moderate、仅限开发依赖（Vitest/mocker）；生产依赖无报告；大版本升级不在当前范围

### 3.6 建议优先级（接手时）

按 `docs/05_DEVELOPMENT_ROADMAP.md` 与 README：

1. 继续打磨 Racing Creator 课堂闭环（手感、多屏、音频、课堂可用性）
2. 再进入规则编辑 / 第二 Creator 等后续阶段

具体下一任务以用户当轮指令为准。

---

## 4. 会话记录

### 2026-09-25 — First-Person 共享资源与道路实例化

- **会话目标**：继续 Phase 7 性能门禁，降低重复 Three geometry / material 分配和道路 draw calls，并补首次加载指标。
- **分支 / PR**：`main`；无 PR。
- **改动摘要**：First-Person 程序化模型共享单位 box / cylinder / sphere geometry；材质按颜色与状态缓存；道路面和两侧边线分别使用 InstancedMesh；运行宿主记录首次加载与初始化耗时。
- **验证**：typecheck、260 tests、production build 通过。内置浏览器 Horse 环形混合比赛切入 First-Person，记录 standard、12.6 ms、20 draw calls / 502 triangles、13 visible entities；切至 Oblique 后 First-Person canvas 清零，控制台无 warning/error。
- **未完成 / 后续**：tree / wall / obstacle 静态实体实例化；Chrome / Edge / Safari 与真实低端课堂设备矩阵。
- **风险 / 边界**：未改变 Runtime、Entity、物理、规则或 tick；Three lazy chunk 仍超过 Vite 500 kB warning；本轮不部署。

### 2026-09-24 — 碰撞体与参赛身份修正

- 修正 Horse / Human / Sheep 视觉轮廓大于 SAT 碰撞体造成的视觉重叠；增加全部 16 个有向物种配对的实时分离回归。
- Driver 只属于 Car。Human 自身参赛，Horse / Sheep 第一阶段独立参赛；非 Car 创建流程跳过车手步骤并清理旧的误写 `driverPreset`。
- Review 明示实体碰撞开启；Horse + Rider 仍留在后续组合模型，不允许 Human 骑 Human 或 Sheep。
- 验证：typecheck、233 tests、production build，并在浏览器检查动物流程跳过车手、碰撞提示和实体分离。

### 2026-09-24 — Unified Race 第一阶段

- 会话目标：按 `docs/18` 将现有赛车运行时泛化为 Car / Horse / Human / Sheep 混合竞速，并部署原 Railway 服务。
- 分支：`main`；先独立提交 `docs/19_UNIFIED_RACE_IMPLEMENTATION_SPEC.md`，再实施代码。
- 改动摘要：新增 RaceCapability / MovementStyle、旧车幂等迁移、能力规则、通用 participants / 排名、共享 CPU 避让、混合创建 UI、按尺寸起跑网格、三类动物矢量和 engine / hoofbeat / footstep 声音路由。
- 自动验证：`npm install`、`npm run typecheck`、`npm test`（214 tests）、`npm run build` 全通过。矩阵包含 72 CPU 组合、72 mixed 玩家输入仿真、4 同类与 16 个有向物种配对覆盖，以及迁移、碰撞、排名、保存和声音生命周期。
- 浏览器验证：真实页面从 Home 完成 Horse + Car/Human/Sheep、Human + Horse/Sheep/Car 两场直道比赛，均到达结果页；观察到倒计时、混合 HUD、四类矢量、类型选择、Car 专属选项隐藏、CPU 完赛、玩家完赛与名次。
- 边界：沿用单圈、玩家结束即冻结和抽象耐久；持续运动声只播放玩家；没有 Horse + Rider、生态行为、联网、3D 或新服务。

### 2026-09-23 — 赛车碰撞物理（不可重叠 + 推开）

- **会话目标**：车与车不可重叠；碰撞要把对方推开；补齐同类物理规律。
- **分支 / PR**：`cursor/racing-audio-sfx-impl-4525` / #3
- **改动摘要**：
  - `rules.ts`：`overlapManifold` / `isSolidBody` / `isMovableBody` / `isShovableBody` / `closingSpeed`
  - `worldRuntime.ts`：全局 `resolvePhysics`（多轮分离、进入冲量、刮擦阻尼、撞击冷却）；终点为触发器；完赛车虚体；残骸可被推开
  - `raceGenerator` / `factory`：车-车/墙规则；发车间距拉开
  - 测试：重叠推开、撞墙、残骸/完赛、硬碰伤害
- **验证**：`npm test` 42 通过；`npm run typecheck` 通过
- **未完成 / 后续**：预览隧道复测手感；尚未做质量/动量守恒级刚体
- **风险 / 边界**：仍是街机分离，不是 Box2D；轻擦不掉耐久

### 2026-09-23 — V0.1.1 赛车音色打磨

- **会话目标**：引擎声偏糙，重做合成音色并发新版本。
- **分支 / PR**：`cursor/racing-audio-sfx-impl-4525` / #3
- **改动摘要**：
  - `wavEncode`：softSaw/triangle/softSquare、低通噪声、无缝循环、软限幅
  - `synthBank`：三族引擎更顺；仪式/刹车/碰撞/UI 减毛刺
  - 版本号 `0.1.0` → `0.1.1`
- **验证**：37 tests / typecheck / build 通过
- **未完成 / 后续**：用户强制刷新预览试听；正式采样仍属 Phase D
- **风险 / 边界**：仍为合成音，非录音采样

### 2026-09-23 — 启动流程选择反馈音

- **会话目标**：选车/颜色/赛道等每次选择都有 UI 反馈声。
- **分支 / PR**：`cursor/racing-audio-sfx-impl-4525` / #3
- **改动摘要**：
  - 新增 `uiSelect` / `uiStep` / `uiConfirm` 合成音与 `raceAudio.playUi()`
  - 挂到 `RacingLaunchFlow`、`HomeCatalog`、`RaceComposer` 的选项与步骤按钮
- **验证**：37 项测试 + typecheck 通过
- **未完成 / 后续**：用户强制刷新预览再听选择反馈
- **风险 / 边界**：反馈音仍为合成短音

### 2026-09-23 — 修复预览无声（主音量为 0）

- **会话目标**：用户打开隧道预览听不到声音，定位并修复。
- **分支 / PR**：`cursor/racing-audio-sfx-impl-4525` / #3
- **改动摘要**：
  - `readVolume()`：`sessionStorage` 缺失时 `Number(null)===0`，误把主音量设为 0；改为缺省 0.7
  - Howl 增加 `format: ['wav']`，去掉无效静音 kick；开赛立即播倒计时 tick
  - 提高引擎/刹车音量；`AudioContext.resume` 加固
- **验证**：自动化复测 `howlerVolume` 从 0→0.7，loadErrors 清空；36 项测试通过
- **未完成 / 后续**：用户硬刷新隧道地址再听
- **风险 / 边界**：仍为合成音色

### 2026-09-23 — 赛车音效 Phase A–C 落地

- **会话目标**：按设计文档实现比赛仪式音、玩家引擎、刹车与碰撞，并接上静音。
- **分支 / PR**：`cursor/racing-audio-sfx-impl-4525`
- **改动摘要**：
  - 新增 `src/media/sound/`：`wavEncode`、`synthBank`、`audioDirector`（Howler）
  - `WorldCanvas` 在倒计时/发车/行驶/完赛/碰撞时驱动音效；HUD 增加静音
  - `App` 在「直接开赛 / 运行」手势下 `unlock`，回首页 `stopAll`
  - 单元测试 4 项；全量 35 项通过；typecheck / build 通过
- **验证**：`npm test`、`npm run typecheck`、`npm run build`
- **未完成 / 后续**：Phase D 三族听感精修与可选 CC0 采样替换；课堂真机外放验收
- **风险 / 边界**：当前为合成占位音色；电脑车仍不单独播引擎

### 2026-09-23 — 赛车音效系统设计

- **会话目标**：为已有赛车闭环设计完整音效方案（开动/行驶/刹车/减速、启动仪式、胜利），先设计后实现。
- **分支 / PR**：`cursor/racing-audio-sfx-design-4525`（基于工作记录分支）。
- **改动摘要**：
  - 新增 `docs/17_RACING_AUDIO_SFX_DESIGN.md`：分层模型、事件表、三族听感、资产清单、`AudioDirector` 挂点、Phase A–D。
  - README / CHANGELOG 增加对应条目。
- **验证**：对照 `WorldRuntime` 阶段（countdown/racing/finished）与玩家加速/刹车逻辑核对事件可映射；无运行时代码变更，未跑测试套件。
- **未完成 / 后续**：待用户确认设计后从 Phase A（仪式音 + Howler 骨架）开工；资产来源（合成 vs CC0）可按文档默认用合成打通。
- **风险 / 边界**：本轮无实际出声；`soundPreset` 仍为保存占位直至实现落地。

### 2026-09-23 — 接手与建立工作记录

- **会话目标**：正式接管仓库；建立代理侧可持续维护的工作记录文档。
- **分支 / PR**：`cursor/agent-work-log-4525`（本文件首次落地的分支）。
- **改动摘要**：
  - 新增 `docs/16_CURSOR_AGENT_WORK_LOG.md`（本文件）：接手基线、记录规则、会话模板。
  - 更新 `README.md` 文档索引，挂上本工作记录。
  - 在 `docs/CHANGELOG.md` 增加对应条目，标明代理接手与文档建立。
- **验证**：文档链接与编号核对；无代码逻辑变更，未跑应用构建。
- **未完成 / 后续**：等待用户指定下一轮功能或修复任务。
- **风险 / 边界**：未连接 Railway；部署仍依赖既有 GitHub ↔ Railway 配置。本会话不含产品功能变更。

---

## 5. 会话条目模板（复制用）

```markdown
### YYYY-MM-DD — 简短标题

- **会话目标**：
- **分支 / PR**：
- **改动摘要**：
  - …
- **验证**：
  - …
- **未完成 / 后续**：
  - …
- **风险 / 边界**：
  - …
```
