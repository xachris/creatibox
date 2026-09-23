# CreatiBox Development Roadmap V0.1

## 1. 文档目的

本文件定义 CreatiBox 从产品概念到可运行程序的推荐开发流程。

适用对象：

- 产品负责人
- 前端开发
- 游戏/交互开发
- AI 编程助手
- 后续协作开发团队

核心原则：

> 不按“功能越多越好”推进，而按“每一步都形成可验证闭环”推进。

CreatiBox 属于非常规产品，不能一开始同时开发赛车、音乐、建筑、故事、AI、账号、后台等全部能力。

正确顺序是先证明最底层世界模型可以工作，再逐步扩展 Creator。

---

# 2. 总体开发阶段

推荐开发顺序：

```text
Phase 0  产品边界冻结
↓
Phase 1  世界模型最小实现
↓
Phase 2  2D 世界编辑器
↓
Phase 3  Racing Creator
↓
Phase 4  规则编辑系统
↓
Phase 5  本地保存与项目格式
↓
Phase 6  40分钟课堂测试
↓
Phase 7  第二 Creator 验证
↓
Phase 8  多世界 / 关卡系统
↓
Phase 9  Creator 统一平台
↓
Phase 10 后续高级能力
```

任何阶段未通过验收，不建议提前进入后续阶段。

---

# 3. Phase 0：产品边界冻结

## 目标

确认第一版到底是什么，防止开发过程中不断扩大范围。

## 当前已经冻结的边界

V0.1 是：

- 单机网页应用
- 浏览器直接打开
- 无登录
- 无账号
- 无教师后台
- 无数据库
- 无云端同步
- 无 AI 依赖
- 无多人协作
- 无自由代码编辑
- 第一版以 Racing Creator 验证世界模型

## 暂不开发

- 音乐 Creator
- 建筑 Creator
- 故事 Creator
- 机器人 Creator
- 公共作品社区
- 家长端
- 学校管理后台
- AI 对话
- 3D 世界

## Gate 0

只有当团队所有成员都能用一句话说清当前 MVP 时，才进入下一阶段：

> 学生可以在浏览器中创建一个可交互的赛车世界，并在 40 分钟课堂内完成自己的作品。

---

# 4. Phase 1：世界模型最小实现

## 目标

先证明 CreatiBox 的世界不是“图片拼贴”，而是由有状态的实体构成。

## 第一批 Entity

- Car
- Wall
- Road
- Obstacle
- Start
- Finish

## 第一批 State

- Idle
- Moving
- Damaged
- Broken
- Finished

## 第一批 Action

- Move
- Turn
- Accelerate
- Brake
- Stop
- Damage
- Reset

## 第一批 Interaction

- Collide
- Touch
- Reach

## 最小状态变化

必须能实现：

```text
Car Moving
+ Collide Wall
→ Damage
→ Damaged
```

以及：

```text
Damaged
+ durability <= 0
→ Broken
```

## 技术建议

这一阶段可以先不做 Blockly。

先直接用 JSON 写世界规则，让 Runtime 能解释规则并运行。

原因：

如果 Runtime 本身都无法稳定解释世界规则，先做 Blockly 只是给错误架构套一个漂亮编辑器。

## Gate 1

必须完成一个纯数据驱动 Demo：

- JSON 创建赛车
- JSON 设置位置
- JSON 设置状态
- JSON 设置碰撞规则
- Runtime 正确执行

并且业务逻辑不能全部硬编码在赛车组件内部。

---

# 5. Phase 2：2D 世界编辑器

## 目标

让学生不写 JSON，也可以创造场景。

## 第一版编辑能力

学生可以：

- 从对象栏拖入 Car
- 放入 Wall
- 放入 Road
- 放入 Obstacle
- 放入 Start
- 放入 Finish

可以修改：

- 位置
- 大小
- 旋转
- 基础颜色
- 部分简单属性

## 页面建议

```text
┌────────────────────────────────────────┐
│ 新建   运行   停止   保存   打开       │
├──────────┬────────────────┬────────────┤
│ 对象库   │                │ 属性面板   │
│          │    世界画布    │            │
│ Car      │                │ X / Y      │
│ Wall     │                │ Rotation   │
│ Road     │                │ Speed      │
│ Finish   │                │ Color      │
└──────────┴────────────────┴────────────┘
```

## 关键 UX 原则

- 第一次进入不出现复杂设置页
- 直接看到画布
- 5 分钟内必须能摆出一个可运行场景
- 不要求学生理解程序术语

## Gate 2

没有任何规则编辑能力的情况下，学生也能：

- 创建场景
- 拖动对象
- 删除对象
- 修改对象
- 运行场景

---

# 6. Phase 3：Racing Creator

## 目标

把通用世界编辑器包装成第一个真正有趣的 Creator。

## Racing Creator 提供预制内容

例如：

- 赛车
- 普通道路
- 草地
- 墙
- 障碍
- 起点
- 终点
- 加速区
- 减速区

## 设计原则

Racing Creator 是“模板”，不是独立底层。

例如：

```text
RaceCar
= Entity
+ Vehicle capabilities
+ Racing capabilities
```

不能创建一套完全独立的 racing-only runtime。

## Gate 3

学生只使用场景编辑器，就能制作不同布局的赛车地图。

不同学生的作品应明显不同。

如果所有作品看起来几乎一样，说明平台仍然只是案例复刻工具。

---

# 7. Phase 4：规则编辑系统

## 目标

让学生创造“对象之间的关系”。

这是 CreatiBox 最核心的一步。

## 第一版不要追求完整编程语言

学生只需要表达：

```text
WHEN X happens
THEN Y happens
```

例如：

```text
WHEN Car touches Wall
THEN Damage Car
```

```text
WHEN Car reaches Finish
THEN Finish Game
```

```text
WHEN Car touches SpeedZone
THEN Increase Speed
```

## UI 方案

可以使用 Blockly，但 Blockly 只是规则编辑器。

推荐的积木语法：

```text
当 [赛车] 碰到 [墙]
    让 [赛车] [受损 20]
```

而不是直接暴露：

- if
- function
- variable
- JavaScript

## 内部流程

```text
Visual Rule Editor
↓
CreatiBox Rule JSON
↓
Validation
↓
Runtime
```

## Gate 4

学生能够创建至少三种完全不同的游戏规则，而不修改源代码。

---

# 8. Phase 5：本地保存与项目格式

## 目标

让作品成为真正的“项目”，而不是刷新网页就消失的 Demo。

## 第一阶段保存

同时支持：

- localStorage 自动保存
- JSON 项目导出
- JSON 项目导入

后续扩展名可以改为：

```text
.creatibox
```

## Project 必须包含

- Worlds
- Entities
- Rules
- Assets
- Metadata

## Gate 5

必须测试：

1. 新建作品
2. 编辑
3. 保存
4. 完全关闭页面
5. 再次打开
6. 载入项目
7. 世界状态与规则保持一致

---

# 9. Phase 6：40 分钟课堂测试

## 目标

这一步比继续写代码更重要。

拿真实学生测试。

## 观察指标

不做考试，不做评分。

只观察：

### 5 分钟
学生是否已经开始操作？

### 10 分钟
是否已经有一个可以运行的东西？

### 20 分钟
不同学生作品是否开始出现明显差异？

### 40 分钟
学生是否仍然有继续修改作品的意愿？

## 重点记录

- 哪些按钮找不到
- 哪些概念听不懂
- 哪些操作反复失败
- 学生最喜欢玩什么
- 学生主动提出想增加什么
- 哪些功能完全没人用

## Gate 6

第一版达到：

- 不需要教师逐步指导
- 大多数学生能完成作品
- 学生作品有明显差异
- 学生愿意继续修改

否则优先修 UX，不增加 Creator。

---

# 10. Phase 7：第二 Creator 验证

## 目标

证明当前底层不是赛车专用系统。

第二 Creator 应故意选择与赛车差异较大的领域。

推荐候选：

### A. Architecture Creator
验证：
- 静态对象
- 组合
- 层级
- 空间关系

### B. Story Creator
验证：
- 人物
- 对话
- 事件
- 顺序
- 状态切换

### C. Music Creator
验证：
- 时间轴
- 声音
- 节奏
- 序列

技术上建议优先 Architecture 或 Story。

原因是它们更容易继续复用 Entity / State / Interaction 世界模型。

## Gate 7

第二 Creator 不允许重写整套 Runtime。

如果必须重写，说明 World Model 抽象不足，需要回头调整架构。

---

# 11. Phase 8：多世界 / 关卡系统

## 目标

允许多个 World 串联。

例如：

```text
World 1
赛车取得钥匙
↓
Unlock
↓
World 2
进入城市
↓
完成任务
↓
World 3
```

## World 本身也是组合单位

每个 World：

- 有自己的 Entities
- 有自己的 Rules
- 有自己的场景
- 有进入条件
- 有完成条件
- 可以指向下一个 World

## Gate 8

学生可以自主设置：

> 完成什么条件之后进入哪个世界。

---

# 12. Phase 9：Creator Hub

到这里才真正建立 CreatiBox 首页。

例如：

```text
CreatiBox

Create:
[ Racing ]
[ Architecture ]
[ Story ]
[ Music ]
[ Character ]
[ Nature ]

My Worlds:
[ World A ]
[ World B ]
```

Creator 不再是独立小程序，而是进入同一个 Project / World 系统的不同入口。

---

# 13. Phase 10：高级能力

只有前面稳定以后才考虑。

可能包括：

- 自制几何素材
- 角色动画
- 植物生命周期
- 动物行为
- 天气
- 火与水
- 建筑损伤
- 音乐系统
- 任务系统
- 背包
- NPC
- AI 辅助
- 3D Runtime

这些能力必须继续遵守：

```text
Entity
State
Action
Interaction
Transition
```

---

# 14. 团队开发职责建议

小团队即可。

## Product / World Design

负责：

- 定义实体
- 定义动作
- 定义状态
- 决定 Creator
- 控制产品边界

## Frontend / Editor

负责：

- Vue UI
- 拖拽
- 属性面板
- Creator 页面

## Runtime / Engine

负责：

- PixiJS
- Entity Runtime
- Rule Engine
- Collision
- State Machine

早期 1 名强前端工程师也可以同时承担 Editor + Runtime。

不建议第一版先组大团队。

---

# 15. 每新增一个功能前的五个问题

任何功能进入开发前必须回答：

1. 它属于哪个 Entity？
2. 它是 Property、State、Action、Interaction 还是 Transition？
3. 它是通用能力还是某个类别的专属能力？
4. 它能否用数据定义，而不是硬编码在页面里？
5. 学生能否通过它创造出明显不同的作品？

如果这五个问题答不清楚，先不要写代码。

---

# 16. 开发纪律

## 不允许

- 未完成当前阶段就同时开发多个 Creator
- 为了一个案例把 Runtime 写死
- 在 UI 中直接执行任意 JavaScript
- 用大量功能掩盖基础体验问题
- 为未来需求提前建设复杂后端
- 未经过真实学生测试就判断课堂体验成功

## 推荐

- 小步提交
- 每阶段都有可运行 Demo
- 先写数据模型，再写 UI
- 每个 Creator 都用同一底层模型验证
- 真实课堂反馈优先于团队猜测

---

# 17. 当前立即执行的开发顺序

截至 V0.1 当前状态，下一步不要继续扩产品概念。

推荐直接执行：

### Step 1
初始化 Vue 3 + Vite + PixiJS 项目。

### Step 2
实现 Entity 基础类 / 数据结构。

### Step 3
实现 World 加载。

### Step 4
实现 Car、Wall、Road、Finish。

### Step 5
实现 Move 与 Collision。

### Step 6
实现 State / Rule Engine。

### Step 7
用 JSON 完成第一个赛车 Demo。

### Step 8
建立基础场景编辑器。

### Step 9
加入规则编辑 UI。

### Step 10
加入本地保存。

### Step 11
进行第一轮真实课堂测试。

完成 Step 11 之前，不建议开发 Music、Architecture、Story 等正式 Creator。

---

# 18. 当前项目的核心验收标准

CreatiBox V0.1 不是以代码量验收。

它只有一个真正重要的验收场景：

> 一个第一次使用 CreatiBox 的学生，在一节 40 分钟课堂中，可以自己创建一个与其他同学明显不同的赛车世界，定义至少一种对象交互规则，运行、修改并保存作品。

如果这一点成立，V0.1 成立。

如果这一点不成立，无论写了多少代码、做了多少页面，都不算完成。
