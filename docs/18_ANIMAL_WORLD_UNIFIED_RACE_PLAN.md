# CreatiBox Animal World × Unified Race 开发规划 V0.1

## 1. 文档目的与状态

将现有 Racing Creator 泛化为 **Unified Race / Race World**，让 Car、Horse、Human、Sheep 在同一个世界、同一条赛道上比赛。Animal World 的第一步是融入已有世界，而不是另建一个独立动物游戏。

本文是正式开发规划。**第一阶段已于 2026-09-24 实现并完成自动测试、浏览器验收与原 Railway 服务部署。** 工程细则和验收记录见 `19_UNIFIED_RACE_IMPLEMENTATION_SPEC.md` 与 `16_CURSOR_AGENT_WORK_LOG.md`。Horse + Rider、生态行为等仍属于后续阶段。

当前代码基线：`main` @ `70ef38276564cec0c07baac87817eabd153e281e`。

---

## 2. 产品目标

核心体验：

```text
选择比赛
→ 选择自己的参赛者：Car / Horse / Human / Sheep
→ 选择 0–3 个电脑对手及其种类
→ 选择现有赛道、长度与难度
→ 生成同一个 World
→ 倒计时 → 混合竞速 → 结果
→ 重赛 / 编辑 / 首页
```

支持 Car vs Horse、Horse vs Human、Horse vs Sheep，以及 Car vs Horse vs Human vs Sheep。同类之间仍可比赛；四类实体都可作为玩家或 CPU。单机、单玩家、多实体，不引入联网多人。

底层关系：

```text
Entity + RaceCapability → RaceParticipant
                             ├── Car
                             ├── Horse
                             ├── Human
                             └── Sheep

一个 WorldRuntime
+ 同一赛道 / 起点 / waypoint / 终点
+ 同一控制、比赛状态、排名与重赛流程
```

学生应能在约 40 分钟课堂内完成选择、运行、修改参数与再次比赛。物种差异要能从外形、运动表现和声音识别，不只给赛车换图片。

---

## 3. 当前基础与第一阶段范围

现有基础包括 WorldRuntime、玩家键盘控制、CPU waypoint AI、三种赛道与两种长度、camera follow、倒计时、finishOrder、结果与 restart、碰撞分离、Edit / Run 隔离、本地保存及 Howler `raceAudio` director。

现有约束也必须承认：参赛者集合与玩家查找仍使用 `car`；规则以 `sourceKind` / `targetKind` 匹配；玩家完赛或 Broken 后全场冻结；CPU 先完赛不会提前终止玩家比赛。第一阶段沿用这个结束时机，不扩展成等待所有选手结束的赛事系统。

### 第一阶段必须交付

- 新增 `horse`、`human`、`sheep` EntityKind，保留 `car`。
- 引入通用 RaceCapability、RaceParticipant 与 MovementStyle。
- 四类实体使用同一赛道生成、出发网格、规则与 WorldRuntime；任一类可被玩家控制，其余可由 CPU 控制。
- 统一玩家输入、CPU waypoint AI、camera、finish、ranking、restart。
- 可选择玩家类型与对手类型；默认、随机、引导创建最终写入相同实体模型。
- 第一版 PixiJS 矢量外观与简单步态；复用音效 director 并加入蹄声、脚步声。
- 保存、重新打开、导入 / 导出保留种类、能力、控制角色与预设；旧赛车作品继续可用。

### 本阶段不做

- Horse + Rider 组合、上下马与骑乘控制。
- Wander / Follow / Flee / Eat / Rest、饥饿、捕食、群体或生态模拟。
- 更多物种、复杂寻路、真实生物力学、真实车辆物理、3D、联网或云保存。
- 多圈赛事、晋级赛、复杂超车策略和对所有参与者持续播放独立声音。

---

## 4. 通用实体与能力设计

能力决定是否参赛，kind 决定实体身份。不要删除 `Entity.kind = 'car'`，也不要为每个物种复制一份比赛运行时。

以下接口已在第一阶段落地：

```ts
type MovementStyle = 'vehicle' | 'runner' | 'hoofed'

interface RaceCapability {
  enabled: boolean
  maxSpeed: number
  acceleration: number
  brakePower: number
  turnRate: number
}

// Entity 的新增字段示意
interface RaceEntityFields {
  race?: RaceCapability
  movementStyle?: MovementStyle
}

// RaceParticipant 是通过能力校验的 Entity 视图，而非新的 EntityKind。
// isRaceParticipant(entity): entity.race?.enabled === true
```

`controlRole`、`controls` 与 `opponentProfile` 继续作为通用控制配置；位置、朝向、速度、状态、耐久与 waypoint 进度复用现有实体/运行时机制。树、道路、墙和终点默认不具有 race 能力；仅有 `movable` 不等于可以参赛。

比赛运行时使用统一 `participants` 集合与玩家 participant。kind 分支可以保留在外观、声音和默认参数映射中，不得成为控制、CPU、终点或排名资格的判断依据。

### 参数默认值

| Entity | MovementStyle | 默认 maxSpeed | 运动声音 |
| --- | --- | ---: | --- |
| Car | vehicle | 260 | engine |
| Horse | hoofed | 205 | hoofbeat |
| Human | runner | 125 | footstep |
| Sheep | hoofed | 95 | hoofbeat |

以上仅为游戏逻辑速度，不是 km/h、实测速度或动物能力结论。默认值只用于新建与缺省补全，不覆盖学生已保存的自定义速度。后续允许学生在安全范围内修改；CPU 难度与运动参数组合后仍须满足合法数值范围。

`acceleration`、`brakePower`、`turnRate` 在实现阶段通过各赛道调试确定：必须有限且为正，生成后四类 CPU 均可完成赛道。不以默认速度大小强制决定每一场比赛的最终名次。

### MovementStyle 的实际差异

- `vehicle`：保留现有加速、惯性、刹车与转向表现，以及车轮 / 车身运动反馈。
- `runner`：更直接的转向与停步响应，双腿交替、身体轻微起伏；停止时停止步态。
- `hoofed`：连续奔跑与较平滑转向，四肢交替和轻微身体起伏；Horse 与 Sheep 可使用不同节奏与外形比例。

运动风格选择参数和表现策略，不能绕开共享碰撞、waypoint 或 finish 规则。步态按速度或移动距离驱动，避免站立时持续跑动；不要求骨骼动画或真实步态模拟。

---

## 5. 统一比赛闭环

| 系统 | 第一阶段要求 |
| --- | --- |
| 玩家控制 | 任一种类可使用现有方向键 / WASD 配置与 Space；下键保持当前 brake-only 语义，动物表现为减速 / 停步，不新增倒车要求 |
| CPU waypoint AI | 共用路径跟随与弯道减速，读取各自能力参数；Easy / Normal / Fast 对四类都有效 |
| Camera | 按玩家实体 ID 跟随，与 kind 无关；沿用 world bounds |
| Countdown | 3 → 2 → 1 → GO，所有种类在 GO 前不能移动 |
| Finish | 必须依次经过 waypoint 才可触发终点规则；环形赛道不得出生即完赛；每个实体仅登记一次 |
| Ranking | 完赛者按 finishOrder 排列；未完赛者按已完成 waypoint 与当前路段投影进度排序，不能按物种或直线距终点排序 |
| 结果 | 玩家完赛或耗尽耐久时冻结，未完赛者明确标记未完赛，不能伪造最终完赛名次；动物可显示“退出比赛”，内部可暂沿用 Broken |
| Restart | 从创作快照建立全新运行态，清空输入、计时、碰撞、waypoint、排名、结果与音频，恢复出发位置和初始耐久 |

同一步内同时冲线可按稳定实体 ID 作为确定性次序，明确只是游戏内排序，不宣称精密计时。同进度未完赛者也需稳定排序，避免显示跳动。

继续保留已有碰撞分离、撞击冷却与完赛实体的终点避让语义。不同体型按逻辑碰撞尺寸生成不重叠出发网格；运动外观不能改变碰撞体。第一版动物碰撞采用抽象耐久反馈，不增加真实伤害表现。

---

## 6. 底层重构点与旧作品兼容

| 现有位置 | 后续改造方向 |
| --- | --- |
| `src/model/types.ts` | 扩展 EntityKind、RaceCapability、MovementStyle 与规则选择器类型 |
| `src/model/factory.ts`、`src/model/raceGenerator.ts` | 通用参赛者预设与工厂、四类默认值、混合名单与按体型排布的出发网格 |
| `src/runtime/worldRuntime.ts` | 将 cars / updatePlayerCar / updateComputerCar 的比赛职责泛化，统一玩家校验、参与者进度与结束状态 |
| `src/runtime/rules.ts` | 比赛规则按能力匹配；固体、可移动体与可推动体的判断覆盖新增种类，保留碰撞求解器 |
| `src/components/WorldCanvas.vue` | 通用实体渲染、玩家跟随、结果与 audio 状态适配，继续由 runtime 持有模拟逻辑 |
| `src/components/RacingLaunchFlow.vue`、`RaceComposer.vue`、`CarWizard.vue`、`src/App.vue` | 后续扩展玩家 / 对手选择与通用参数编辑；保留车专属外观配置，入口表达为 Race World |
| `src/media/sound/audioDirector.ts`、`synthBank.ts` | 复用现有 director、播放生命周期和本地合成机制，扩展运动声音类型 |
| `src/storage/projectStorage.ts` 与模型导入边界 | 统一迁移与校验，覆盖本地恢复和文件导入，不污染创作原稿 |

### 规则不能只改变量名

现有 `sourceKind === 'car'` 终点检查与 kind-only 规则不能靠重命名自动支持动物。建议增加能力选择器：

```text
sourceCapability = race
+ reach
+ targetKind = finish
→ finish

sourceCapability = race
+ collide
+ targetCapability = race
→ shared collision / damage response
```

墙、障碍仍可使用 targetKind。保留旧 kind 选择器；一个选择器只采用一种匹配方式，避免冲突和重复触发。新生成比赛使用能力规则，关闭 race 的实体不进入计时、AI 或排名。

### 迁移与单一参数来源

1. 旧 `car` 缺少 race 时，载入规范化为有效参赛者；保留用户已有 `maxSpeed`、控制、外观、声音与其他配置。显式 `race.enabled = false` 不得被缺省补全重新启用。
2. 新运行态只从 `race.maxSpeed` 读取比赛上限；旧顶层 `maxSpeed` 在兼容层映射，不能长期维护两个互相竞争的值。其他新能力参数使用经过验证的车辆默认值补全。
3. 旧规则默认保留原有 car-only 含义，纯车旧作品行为不变。将旧作品转换为混合比赛时显式替换标准比赛规则为能力规则并去重；用户自定义 car-only 规则不得静默扩大到动物。
4. 不改写原始导入文件；保留原项目快照。后续实现要明确文件格式版本与迁移策略，不假定旧版本应用能够读取新种类。
5. 拒绝非法数值、缺少有效玩家 / 路径 / 终点规则等配置，并显示可操作错误。第一版比赛恰有一个玩家；非参赛装饰实体不得误识别为玩家。

---

## 7. 视觉与声音

### 视觉

第一版继续使用 PixiJS 矢量：Car 保留现有造型；Horse 具有马头、躯干和四肢轮廓；Human 有可辨识的人形与两腿；Sheep 有羊毛轮廓与四肢。种类、颜色、朝向与运动状态需在比赛视角下可辨识。

逻辑模型与 renderer 分离，将来换成本地 sprite 不改变比赛能力。Clean / Dynamic 是表现强度，MovementStyle 是运动类型，两者不能混为同一个字段。

### 声音

复用当前 `raceAudio` / `AudioDirector`，不新增独立 Animal Audio Engine。保留倒计时、GO、碰撞、win / place / broken、UI 声音、静音偏好及点击解锁。

| 运动声音 | 行为 |
| --- | --- |
| engine | Car 沿用 Light / Sport / Electric；保留怠速、行驶与刹车层 |
| hoofbeat | Horse / Sheep 按移动速度改变蹄声节奏与强度，停止时停止；不播放车辆怠速或轮胎刹车 |
| footstep | Human 按移动速度播放脚步声，停止时停止；不播放引擎 |

在现有声音族之上增加运动声音类型映射，不把 hoofbeat / footstep 强塞进车的三种引擎音色。只为玩家持续播放运动声，CPU 第一版不增加独立连续声轨；全局比赛事件保持共用。

通过共享运动状态（speed、maxSpeed、加速 / 减速、phase、style）驱动声音，而不是读取按键或写死车类型。重赛、停止、回首页、实体切换与卸载必须停止旧轨并清理节奏定时器；静音、无音频或解锁失败不得影响比赛。保持本地音频 / 合成、无云端依赖。

---

## 8. 开发顺序与交付边界

1. **能力与迁移**：统一数据类型、预设、校验和旧车项目转换；先证明纯车行为无回归。
2. **通用运行时**：能力规则、玩家 / CPU、碰撞、camera、finish、ranking、restart；用混合实体测试验证，不依赖最终美术。
3. **创建与表现**：接入玩家 / 对手类型选择、三种 MovementStyle、四种矢量形象、参数编辑与持久化。
4. **音效扩展**：复用 director 接入 engine / hoofbeat / footstep，验证静音、停止与重赛清理。
5. **完整验收**：完成下表的自动与浏览器检查，记录证据和已知边界，再更新实现状态。

第一阶段已保持 typecheck → test → build 通过，并完成两场浏览器混合竞速；今后扩展继续沿用这些门禁。

---

## 9. 测试矩阵（第一阶段已实现）

| 维度 | 覆盖组合 / 场景 | 通过条件 |
| --- | --- | --- |
| 角色与种类 | 四类各做一次玩家；每类均作为 CPU；0 / 1 / 2 / 3 个 CPU | 输入只控制玩家，CPU 自主推进，camera 始终跟随正确实体 |
| 赛道与难度 | 3 赛道 × 2 长度 × 3 难度 × 4 CPU 种类，共 72 个基础组合 | 无输入 CPU 在按路径长度与能力制定的有限超时内完赛，不卡弯、不跳 waypoint |
| 混合比赛 | 四类轮换玩家，其余三类为 CPU；覆盖上述 18 个赛道 / 长度 / 难度组合，共 72 场 | 同场启动、独立进度、共用终点与结果；无物种专用赛道 |
| 同类与双类 | 四种同类赛；六种无序种类配对，玩家方向互换 | 不依赖恰好四种齐全，无缺失玩家或排名遗漏 |
| 输入与生命周期 | 倒计时、加速、减速、转向、失焦、隐藏页、Edit / Run、Restart / Home | GO 前静止，输入不粘连，运行态不回写创作态，重复重赛无残留 |
| 终点与排名 | 环形出生点、跳过 waypoint、重复触线、CPU 先到、玩家先到、同一步到达 | 完赛仅一次、排序稳定；玩家结束时未完赛者不被标记已完赛 |
| 碰撞 | 四类之间全部配对，墙 / 障碍、不同体型、连续摩擦、退出与完赛实体 | 出发不重叠，碰撞可分离，伤害 / 音效不重复刷，保留现有保护机制 |
| 风格与声音 | vehicle / runner / hoofed；引擎三族；静止、移动、减速、静音、重赛、切换种类 | 外观与步态可辨，脚步 / 蹄声随运动停止，无旧引擎串音或声轨累积 |
| 持久化与兼容 | 旧 car 项目、旧自定义速度与规则、新混合项目、保存重开、导入 / 导出 | 配置保留、迁移可重复而不叠加、纯车行为兼容，运行态不污染存档 |
| 无效配置 | race disabled、非参赛实体、多个 / 缺少玩家、非法速度、无路径 / finish 规则 | 有明确错误或排除行为，不静默崩溃、不误将树墙加入比赛 |

自动测试重点覆盖模型迁移、能力规则、模拟进度、碰撞、稳定排序和可 mock 的声音调用；浏览器检查真实键盘、首次进入 Run、camera、结果、重赛和可听声音。混合场景的玩家使用可复现输入或人工操作验证，不把它伪装成 CPU 测试。测试报告需区分自动通过与人工观察，保存复现步骤。

---

## 10. 第一阶段成功标准

全部满足后才可标记第一阶段完成：

1. 从同一入口选择 Car、Horse、Human 或 Sheep 作为玩家，生成并运行一场四类混合比赛。
2. 四类共享同一 WorldRuntime、waypoint、碰撞、finish 与 ranking；没有复制的动物专用赛事逻辑。
3. 玩家控制、CPU、camera、结果及 restart 对四类一致可用；完整实现上述测试矩阵并留下验收证据。
4. 三种 MovementStyle 有可观察的运动区别；矢量外观能区分四类，声音与运动类型一致。
5. 默认速度采用 260 / 205 / 125 / 95，清楚标注游戏逻辑参数；可保存的自定义值不会被默认值覆盖。
6. 旧赛车作品仍能打开运行，新混合项目保存重开后配置完整；现有纯车测试继续通过。
7. 学生无需填写原始 JSON 即可完成选择 → 比赛 → 修改 → 再赛；课堂可用性另行实测，不用自动测试替代。

---

## 11. 第二阶段与后续 Animal World

**第二阶段：Horse + Rider。** 将骑手与马表达为组合 / 关系，明确控制权、相对位置、渲染与保存方式；组合对比赛系统只暴露一个 RaceParticipant，不能把马与骑手重复计入名次。第一阶段不实现上下马，也不把现有 car 的 driverPreset 当作骑乘关系。

**后续：真正的 Animal World 行为。** 再增加 Wander / Follow / Flee / Eat / Rest、动物与食物 / 人 / 环境的交互，以及行为切换。它们仍使用共享 Entity 与 World；届时明确竞赛控制和自主行为的优先级，避免同时争夺移动权。Horse、Human、Sheep 的资产与运动能力继续复用，不再另起一个孤立产品。

---

## 12. 与既有文档的关系

| 文档 | 关系 |
| --- | --- |
| [世界模型](02_WORLD_MODEL_SPEC.md) / [数据结构](04_DATA_SCHEMA.md) | 复用 Entity 与能力组合；本文是后续扩展规划，不声称 schema 已迁移 |
| [赛车 MVP](12_RACING_MVP_SPEC.md) / [预设拼接](13_PRESET_COMPOSITION_SYSTEM.md) | 保留赛道与预设组合，参赛对象由车扩展至四类 |
| [实施计划](14_RACING_MVP_IMPLEMENTATION_PLAN.md) / [启动流程](15_RACING_ONBOARDING_FLOW.md) | 继承运行闭环与创建入口，本文定义下一阶段的泛化范围 |
| [音效设计](17_RACING_AUDIO_SFX_DESIGN.md) | 基于已落地 director 扩展运动声音，不重建音频系统 |
| [变更记录](CHANGELOG.md) | 区分本次规划推进与未来实现交付 |
