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
