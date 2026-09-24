# CreatiBox 创盒

CreatiBox 是一个面向中小学生的单机网页创作平台。

当前目标不是建设学校级管理系统，而是让学生在一节约 40 分钟的计算机课中，能够快速进入一个受控的创作环境，自主组合对象、规则和场景，完成属于自己的作品。

## 当前产品方向

CreatiBox 的底层不是“赛车游戏”，而是一个可扩展的 **2D Interactive World Builder**。

核心世界语言：

```text
Entity → State → Action → Interaction → Transition
实体 → 状态 → 动作 → 关系 → 状态变化
```

第一版以 **Racing Creator** 作为验证入口，但底层不得写死为赛车逻辑。

## 当前优先级

1. 单机网页直接使用
2. 无登录、无账号、无教师后台
3. 学生可创建对象并配置行为
4. 场景支持对象之间的交互与状态变化
5. 项目可本地保存和重新打开
6. 后续逐步扩展音乐、建筑、故事、动物、植物、机关等 Creator

## 文档

- [产品愿景](docs/01_PRODUCT_VISION.md)
- [世界模型规范](docs/02_WORLD_MODEL_SPEC.md)
- [MVP V0.1 规范](docs/03_MVP_V0.1_SPEC.md)
- [数据结构建议](docs/04_DATA_SCHEMA.md)
- [开发路线图](docs/05_DEVELOPMENT_ROADMAP.md)
- [开放世界自由度与边界](docs/06_OPEN_WORLD_BOUNDARIES.md)
- [技术选型与架构](docs/07_TECH_STACK_AND_ARCHITECTURE.md)
- [对话、剧本与 TTS](docs/08_DIALOGUE_SCRIPT_AND_TTS.md)
- [学生创作界面与 UX](docs/09_UI_UX_SPEC.md)
- [开发执行模式与 CI 决策](docs/10_DEVELOPMENT_EXECUTION_MODES.md)
- [对象创建三模式](docs/11_CREATION_MODES.md)
- [赛车 MVP 规范](docs/12_RACING_MVP_SPEC.md)
- [预设拼接系统](docs/13_PRESET_COMPOSITION_SYSTEM.md)
- [赛车 MVP 实施计划](docs/14_RACING_MVP_IMPLEMENTATION_PLAN.md)
- [赛车启动与首页流程](docs/15_RACING_ONBOARDING_FLOW.md)
- [Cursor 代理工作记录](docs/16_CURSOR_AGENT_WORK_LOG.md)
- [赛车音效系统设计](docs/17_RACING_AUDIO_SFX_DESIGN.md)
- [Animal World × Unified Race 开发规划](docs/18_ANIMAL_WORLD_UNIFIED_RACE_PLAN.md)
- [Unified Race 工程实施规范](docs/19_UNIFIED_RACE_IMPLEMENTATION_SPEC.md)
- [多视角 / 多渲染器架构设计](docs/20_MULTI_VIEW_RENDERER_ARCHITECTURE.md)（Phase 4 双视图连续切换已完成）
- [多视角开发进度与验收计划](docs/21_MULTI_VIEW_DEVELOPMENT_ROADMAP.md)（Phase 0–6）
- [变更记录](docs/CHANGELOG.md)

## 在线体验

Railway Production:

https://creatibox-web-production.up.railway.app

当前为 V0.1 MVP 测试环境。项目数据默认保存在当前浏览器 IndexedDB，也可导出为 `.creatibox` 文件。

## 当前阶段

**V0.1.1 MVP 开发中**（音效打磨版）

第一轮可运行骨架已经进入仓库，并通过 GitHub Actions 自动验证。

### 已实现

- Vue 3 + TypeScript + Vite 工程
- PixiJS 8 世界画布
- 赛车 / 道路 / 墙 / 障碍 / 起点 / 终点
- 对象选择与拖动
- 属性面板：位置、大小、颜色、赛车速度与耐久
- Edit / Run / Stop 分离
- WASD / 方向键驾驶
- 碰撞检测
- 数据驱动的碰撞损伤规则
- 抵达终点
- Undo / Redo 基础能力
- IndexedDB 自动保存
- `.creatibox` 项目导出 / 导入
- Vitest 基础规则测试
- 比赛音效：倒计时 / GO / 引擎 / 刹车 / 碰撞 / 胜负（Howler + 本地合成）
- GitHub Actions：install → typecheck → test → build

### 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

自动测试：

```bash
npm test
```

### 当前验证状态

GitHub Actions 已验证：

- TypeScript 类型检查通过
- 自动测试通过
- 生产构建通过

2026-09-23 已完成本地浏览器比赛闭环验收：目录 → 六步选择 → 直接开赛 → 倒计时 → 玩家/电脑行驶与摄像机跟随 → 终点结果 → 重赛/编辑/首页。持续按键通过开发验收页 `tests/drive.html` 向真实应用发送键盘事件验证。31 项自动测试覆盖首次挂载与所有赛道/电脑难度组合。拖拽手感、不同屏幕尺寸、音频与真实课堂体验仍属于后续验证范围。

### 当前开发原则

先完成 Racing Creator 的完整课堂闭环，再扩展 Story、Architecture、Music 等 Creator。
