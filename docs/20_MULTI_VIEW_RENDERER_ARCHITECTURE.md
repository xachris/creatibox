# CreatiBox Multi-View / Multi-Renderer 架构设计 V0.1

## 1. 文档目的与状态

为同一个世界增加 Top-Down、Oblique / Isometric 2.5D 与 First-Person 三类视图。Phase 0–6 已完成：Top-Down adapter、Oblique MVP / polish、不中断 Runtime 的运行中三视图切换、First-Person spike 与运行模式 MVP。编辑仍固定 Top-Down。

设计基线：`main` @ `7c58ad3c18cba4a44cd434ba78ddeee172c72f21`（2026-09-24）。当前四类竞速实体已经共用 WorldRuntime；本文不是再次实施 Unified Race，也不把视图能力标为已完成。[开发计划](21_MULTI_VIEW_DEVELOPMENT_ROADMAP.md)定义 Phase 0–6 的顺序与验收门禁。

---

## 2. 产品视图与边界

| 视图 | 定位 | 编辑 / 运行 | 渲染路线 |
| --- | --- | --- | --- |
| Top-Down | 默认编辑、调试、精确布局；持续保留 | 编辑默认；运行可用 | 现有 PixiJS 俯视表现 |
| Oblique / Isometric 2.5D | 下一阶段优先开发；增强空间感、遮挡与观察体验 | MVP 仅运行；斜视编辑后续单独验收 | 2D 世界投影，优先继续 PixiJS，不引入完整 3D 引擎 |
| First-Person | 后续技术探索，通过 spike 才决定产品化 | 初期仅运行，不作为编辑视图 | 比较伪 3D raycast 与独立真正 3D renderer |

编辑和运行使用独立默认视图。停止运行回到原 AuthoringState 和编辑 Camera/ViewState。切换视图不是 Run、Restart 或 Stop，不生成新世界、不重新加载作品。

---

## 3. 单一权威与职责分层

```text
AuthoringState（World / Entity / Rule）
    ↓ 现有 Run 边界建立运行副本
唯一 WorldRuntime → 只读 RenderFrame / 运行快照
    │                      ↓
    │             IWorldRenderer + CameraController + ViewState
    │                      ├── TopDownRenderer（PixiJS）
    │                      ├── ObliqueRenderer（PixiJS）
    │                      └── Future FirstPersonRenderer（待 spike）
    ├── 共用 HUD 数据 / standings
    └── 共用 AudioDirector
```

- **World Model 和 WorldRuntime 是 authoritative source。** Renderer 只负责 projection、camera 的显示变换、sprite/model mapping、depth/occlusion 和 HUD 呈现。
- Entity 不因视角复制。每个可视对象以同一 `entity.id` 映射；渲染代理、sprite、mesh 只是资源，不是第二份可执行 Entity。
- 逻辑 `position`、size、rotation 仍采用统一 world coordinates；屏幕坐标不得回写 Entity。当前 `position` 在 Entity 顶层，以实际模型为准。
- 物理、SAT/碰撞分离、damage、CPU、waypoint、finish、elapsed、finishOrder、ranking 全由既有 Runtime / rules 决定。renderer 不预测或裁定比赛结果。
- 屏幕外实体照常模拟；culling 只减少绘制。角色朝向和 camera heading 不得共享可写字段。
- HUD 从共享运行状态读取名次、时间、倒计时和结果，不按屏幕距离计算名次；HUD 固定在屏幕层，不随世界投影倾斜。
- 输入仍交给共用控制入口。CameraController 不直接驱动选手；未来鼠标看向与角色转向是否关联，必须通过明确的输入映射进入 Runtime。

### 与现有实现的衔接

`src/components/WorldCanvas.vue` 继续连接 Pixi ticker、`runtime.step`、HUD 与音频，并在 `initializeRuntime()` 中重建比赛。Phase 1 已把 world layer、Top-Down 投影/逆投影、相机与显示清理抽入 renderer 适配边界，保留现有模拟时间步与输入语义；未来渲染器切换绝不能调用该初始化路径。

建议由稳定的运行宿主负责唯一模拟调度、Runtime 引用、输入和音频生命周期；renderer 自身不得启动第二个模拟 ticker。可逐步搬移显示职责，不重写 WorldRuntime。

---

## 4. Renderer / Camera 接口契约（设计草案）

Phase 1 已落地 `IWorldRenderer`、`TopDownRenderer`、`CameraController` 与 `ViewState` 的最小接口；下表仍是后续扩展必须保持的完整契约：

| 接口 | 责任 | 禁止行为 |
| --- | --- | --- |
| `IWorldRenderer.mount(host, assets)` | 初始化显示资源；声明支持的视图和交互能力 | 创建 WorldRuntime、开始比赛 |
| `render(readonlyFrame, camera)` | 按同一 tick 的只读状态绘图；允许纯视觉插值 | 修改实体、执行规则、推进时间 |
| `resize(viewport)` / `dispose()` | 更新显示尺寸、清理自己拥有的资源与监听 | 销毁 Runtime、停止共享音频、重置输入规则 |
| `project(worldPoint)` | world → screen，同一相机变换 | 修改 worldPoint |
| `unproject(screenPoint, plane)` | 可选；screen → world，用于后续编辑 | 把 sprite 像素当作物理坐标 |
| `pick(screenPoint)` | 可选；返回 entity ID / 命中点，按显示顺序命中 | 直接修改 AuthoringState |
| `CameraController.update(frame, viewState, dt)` | 根据目标、边界与用户偏好计算相机 | 写入 Entity rotation / position |

只读 RenderFrame 至少提供 tick 标识、world bounds、Entity ID / 逻辑变换 / 外观引用 / 运动状态，以及共享 HUD 数据。可使用只读引用或受控快照，避免每帧深拷贝整个项目。展示插值不得参与碰撞或规则。资源管理要区分 renderer 私有资源与共享纹理，防止切换时误释放共享资源。

---

## 5. ViewState 与兼容保存

### 显示状态

| 字段 | 定义 / 默认 | 约束 |
| --- | --- | --- |
| `viewMode` | `top-down` / `oblique` / `first-person`；缺省 `top-down` | 未实现模式必须安全回退 |
| `cameraTarget` | Entity ID 或 null；运行默认有效玩家 ID | ID 只作引用，不复制实体；失效时回退玩家或世界中心 |
| `zoom` | 正有限数，默认 1 | 初始建议范围 0.5–2；按支持能力校验 |
| `rotation` | camera 平面朝向（heading），弧度，默认 0 | 与 Entity.rotation 分离；MVP Oblique 固定朝向 |
| `pitch` | 可选相机俯仰，弧度 | 仅支持该能力的 renderer 使用 |
| `elevation` | 可选相机高度，显示单位 | 与实体高度、物理高度无关；不支持则忽略 |
| `followMode` | `none` / `participant`；编辑 none、运行 participant | Phase 1 保留当前镜头行为 |

`rotation` 即统一 heading 字段，不再维护另一个互相竞争的 heading。相机平移、平滑速度、dead-zone 偏移等是临时 camera state，不进 Entity 或业务规则。`pitch/elevation` 不表示所有 renderer 都支持自由旋转或升降。

### 保存边界

实际项目格式是 `CreatiBoxProject { formatVersion: '0.1', name, world }`；`04_DATA_SCHEMA.md` 的 `worlds[]` 是早期草案，不能按草案偷偷迁移当前文件。

Phase 4 已增加可选顶层 `view`，与 `world` 平级，由显示偏好状态持有并通过现有自动保存、导入和导出路径序列化：

```json
{
  "formatVersion": "0.1",
  "name": "Mixed Race",
  "world": { "id": "world_001", "name": "Race", "entities": [], "rules": [] },
  "view": {
    "version": 1,
    "edit": { "viewMode": "top-down", "cameraTarget": null, "zoom": 1, "rotation": 0, "followMode": "none" },
    "run": { "viewMode": "oblique", "cameraTarget": null, "zoom": 1, "rotation": 0, "followMode": "participant" }
  }
}
```

该片段说明存档形状；完整临时 ViewState 与持久化偏好分开：只保存用户选择的模式、zoom、朝向、可支持的 pitch/elevation、followMode 及可选目标引用；不保存逐帧 camera center、缓动过程或比赛进度。null 目标在运行时解析为玩家。

1. 没有 `view` 的旧 `.creatibox` 默认 Top-Down；不得给旧项目自动选择 Oblique。无项目配置时的本地偏好也不能覆盖这个兼容默认值。
2. 新项目 `view` 可省略；World / Entity / Rule 结构及 `formatVersion: '0.1'` 不因显示偏好强制变化。旧应用可能丢弃未知 view 字段，不承诺其保留视图，但不能影响可运行世界数据。
3. 导入、自动保存、导出共用幂等校验：非法 zoom、未知模式/版本、失效目标安全回退；不修改原始导入文件。view 损坏不使有效世界不可打开。
4. 切换只更新 Camera/ViewState；不改变 AuthoringState、world 内容、undo/redo 或创作修改标记。偏好保存走独立路径，不经实体编辑命令。
5. 已保存项目偏好优先于设备偏好；新建项目可采用设备运行偏好，编辑仍默认 Top-Down。未支持 First-Person 时配置回退 Top-Down 并给出简短提示。

---

## 6. 2.5D 投影与逆投影

初始固定朝向、正交斜投影：

```text
世界地面坐标 (x, y)，显示高度 z
screenX = (x - y) * scaleX
screenY = (x + y) * scaleY - z

world +X → 屏幕右下
world +Y → 屏幕左下
显示 +z  → 屏幕正上
```

`scaleX/scaleY` 为基础投影系数，均大于 0；初始可用 1 / 0.5 的常见 2:1 菱形表现，这是风格化斜视，不宣称严格几何等距。示例 `(100, 40, 0)` 投到 `(60, 70)`；显示 z=12 时为 `(60, 58)`。

第一阶段所有地面 `z/elevation = 0`。未来资产高度先作为显示元数据；公式中的 z 是换算后的显示高度，不能直接把不同单位相加。角色步态起伏是 sprite 局部偏移，不改 world position、深度脚点或碰撞体。

完整变换按顺序：减去 world camera center → 若支持则在地面绕 camera heading 旋转 → 斜投影 / 显示高度 → 统一 zoom → viewport center 平移。地面道路顶点和实体脚点使用同一变换；直立角色使用相应方向资产，不能把俯视图整体压扁就视为最终 Oblique。正交投影不因远近自动缩小对象；MVP 缩放来自统一 zoom 和资产比例，避免用透视尺寸误导碰撞距离。

### Hit testing / selection

先撤销 viewport 平移和 zoom，得到 `(u, v)`；已知显示平面 z 时：

```text
x = 0.5 * (u / scaleX + (v + z) / scaleY)
y = 0.5 * ((v + z) / scaleY - u / scaleX)
```

然后撤销 camera heading 旋转，加回 camera center。未知高度时一个屏幕点不能唯一确定空间点；必须选择已知编辑平面或对显示代理做命中。

Oblique MVP 仅运行。未来编辑使用屏幕命中选出 Entity ID、逆投影得到 world 拖拽位置，再通过现有编辑命令修改模型；选择框按投影后的 footprint 绘制。遮挡区域按逆绘制顺序选中可见对象，必要时提供对象列表切换。拖动、缩放、旋转、undo/redo 均通过后才能开放斜视编辑，不能用当前 Top-Down 的简单减平移算法代替。

---

## 7. 深度、遮挡与资产映射

### 排序策略

- 基础层序：地面/道路/起终点地面标记 → 世界实体/障碍/树干 → 特定前景效果 → 屏幕 HUD。墙属于世界实体层，不能失去原有支持。
- 世界实体按 **projectedY + elevation/order 信息**稳定排序。MVP 同地面采用脚点 projectedY 从小到大绘制，以显式局部 order、entity ID 打破平局。
- 具体键定义为 `(renderLayer, projectedGroundFootY, elevationOrder, localOrder, entityId)`；`projectedGroundFootY` 是同一 camera 下 z=0 的地面脚点，不含头顶高度或步态摆动。Phase 2 elevationOrder=0。未来高度层只能表达明确的显示层关系，不能随意把 sprite 高度相加导致角色跳层。
- 大树用树根、人物/动物用脚落地点、车用接地 footprint anchor；**禁止按 sprite center 排序**。anchor 偏移归资产映射，不更改逻辑 position 或 size。
- 一张大 sprite、长墙或跨越多个深度区间的道路不能仅靠单点排序正确遮挡所有对象。Phase 2 限定简单资产与地面道路；Phase 3 允许拆分显示片段、树干/树冠、按 footprint 分段，仍引用同一 Entity ID，不复制业务实体。
- 树冠挡住玩家时可降低树冠透明度或显示轮廓；这只是可读性表现，不改变 collision/visibility 业务状态。第一阶段不承诺桥上桥下、跨层通行或任意复杂交叉几何。

### 资产策略

`Entity kind + appearance + movementStyle + relative heading + viewMode → visual asset`。Top-Down 和 Oblique 可以映射不同矢量/sprite，未来 First-Person 映射 Billboard/低模；缺资源显示可辨识占位，不删除实体。

Phase 2 支持 Car / Horse / Human / Sheep、tree / road / obstacle / start / finish，并保留 wall。Phase 3 已增加 footprint 脚点、独立地面阴影、树根 anchor、树冠遮挡透明和连续方向投影；相对朝向由 Entity.rotation 与 camera heading 推导，不修改 Entity.rotation 来“转图片”。Clean/Dynamic 与 vehicle/runner/hoofed 继续分开，动画从共享运动状态取值。高质量纹理 atlas 仍是后续资产工作。

---

## 8. Camera 与运行时切换

### 镜头策略

按 participant ID 跟随，不按 car kind 查找。Phase 1 完全保留当前行为；Phase 2 起采用以下待实测默认值：屏幕中央约 20% dead zone、约 150 ms 的时间相关平滑、沿速度方向约 0.25 s 的 look-ahead（上限为短边 15%），zoom 默认 1、限制 0.5–2。数字是调试起点，不是已经验证的效果。

沿投影后的可视边界限制相机，世界小于 viewport 时居中；跟随目标失效则回退有效玩家或世界中心。默认固定 camera heading、不随每次转弯旋转、不启用摇晃；look-ahead 在减速/掉头时平滑收敛，提供减少动态选项。不能将相机抖动叠加到真实世界位置。First-Person 的视野、鼠标锁定、视角速率和退出方式由 spike 验证；禁止默认头部摇摆。

### 切换事务（Phase 4）

1. 在稳定运行宿主内校验目标视图和资源；旧 renderer 在准备期间继续服务同一 Runtime。
2. 捕获当前显示偏好与目标 ID；新 renderer 绑定同一个 Runtime 的只读帧，保持目标在合理屏幕位置。
3. 在帧边界更换 renderer / CameraViewState，释放旧显示资源。不得调用 `initializeRuntime`、`beginRace`、Restart 或重新生成赛道。
4. 模拟调度、输入监听、AudioDirector 和 HUD 数据源保持单一；不额外消耗随机数、不改变 elapsed、waypoint、finishOrder、耐久、phase 或结果。
5. 新 renderer 初始化失败时保留旧视图并提示；不能通过重新 Run 恢复。重复切换不得叠加 canvas、ticker、音轨或监听。

若初始化耗时，模拟仍按原调度策略推进；切换前后比较同一 simulation tick 的状态，不把正常时间流逝误报为状态污染。每个视图可保留自己的临时镜头偏好，业务世界引用始终不变。

---

## 9. First-Person：两条路线与决策门槛

**PixiJS 2D 不能自然完成真正第一人称。** Oblique 的投影和八向贴图不是完整透视 3D；不以继续压缩/旋转画布假装解决这一问题。

| 路线 | 适用性 | 主要限制 | spike 要回答的问题 |
| --- | --- | --- | --- |
| A. 伪 3D / raycast 试验 | 迷宫、网格墙、简单走廊的局部试验 | 当前通用世界含自由放置、旋转道路、大对象与混合实体；投射墙列及深度遮挡适配复杂，不作为默认通用路线 | 最小走廊能否复用只读 World；局限能否清楚展示；是否只保留为专用实验 |
| B. 真正 3D Renderer | 当前通用世界长期更合适的候选 | 新资产、GPU/包体、坐标适配、资源生命周期和浏览器兼容成本 | Three.js / Babylon.js 哪个更适合独立 renderer；同一 Runtime 连续性与预算能否成立 |

倾向将真正 3D 放在独立 renderer 层，**不是选择第二套游戏引擎逻辑**。Three.js 和 Babylon.js 暂为候选，不锁定版本、不添加依赖。引擎提供的默认相机移动、碰撞或物理不能绕过 WorldRuntime。

建议映射 `world (x,y) → 3D (X=x, Y=视觉高度, Z=y)`，按模型 forward axis 明确 rotation 映射并做四个方向校验。Phase 6 玩家相机只读取 participant 位置、heading 和显示眼高；道路/地面与实体使用 Billboard/低模。3D mesh 不成为物理权威；碰撞仍由 2D Runtime 的 footprint 决定。

spike 已交付[对比报告与最小原型](22_FIRST_PERSON_ARCHITECTURE_SPIKE.md)：通用 grid raycast No-Go，Three.js Conditional Go，Babylon.js 为文档级备选。Phase 6 已把 Three.js 作为异步显示层接入稳定运行宿主；它读取同一 Runtime，未引入垂直物理、第二套输入或比赛规则。

官方技术参考（2026-09-24 查阅，具体 API 在实施时按锁定版本复核）：

- [PixiJS performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips)：批处理与 culling 取舍的实现参考。
- [PixiJS render layers](https://pixijs.com/8.x/guides/concepts/render-layers)：显示层组织参考；本文的脚点排序为项目设计。
- [Three.js cameras](https://threejs.org/manual/pages/cameras.html)：透视相机候选路线参考。
- [Babylon.js camera documentation](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/cameras.md)：相机能力评估入口。

---

## 10. 声音与性能预算

视图不改变声音路由。沿用 AudioDirector 的 countdown、GO、engine / hoofbeat / footstep、collision、result、mute/unlock 与结束清理；切换不重播倒计时或创建音轨。未来 First-Person 可另行设计 positional audio，但不在当前范围。

桌面浏览器优先，**目标 60 fps，帧预算 16.7 ms**。下表保留长期预算；Phase 3 已完成当前产品规模的首次测量，不能据此声称所有压力规模或设备已达标：

| 场景 / 指标 | 初始预算与验证方法 |
| --- | --- |
| 正常 Race World | 1 玩家 + 0–3 CPU，最多 500 个总 Entity，其中静态环境为主；目标同时可见 200 个显示代理 |
| 压力场景 | 1,000 总 Entity、500 可见代理，仍仅 4 个活动参赛者；记录退化和降级，不扩大 CPU 产品范围 |
| 帧耗时 | 目标设备 1920×1080、DPR 上限 2；预热后 60 s 记录中位数 / p95；正常场景 p95 ≤16.7 ms，排序 CPU p95 ≤2 ms，投影/更新/提交 CPU p95 ≤6 ms（含排序） |
| 排序 | 仅对可见动态/脏键排序，稳定 O(n log n)；缓存静态键，camera heading 改变时重算；不改变模拟顺序 |
| Culling | 根据投影 bounds 加安全边距；包括树冠/阴影，防止脚点在屏幕外但图像可见时被误裁；CPU 成本实测后启用 |
| 批处理 | 共享 atlas/纹理与材质；在遮挡正确的前提下减少 draw calls，不能为批处理破坏深度次序 |
| 分配与复杂效果 | 缓存静态矢量、复用显示对象与数组；避免逐帧创建纹理/Graphics、全量销毁重画、大范围滤镜与动态阴影 |
| 生命周期 | 连续 50 次视图切换后 canvas/ticker/监听数量回到基线；可回收资源不持续增长，记录内存趋势 |

Phase 1 记录实际测试机器、OS、浏览器版本和 Top-Down 基线；Phase 3 以相同设备比较，正常场景不得通过减少 Runtime 精度达标。压力场景可降低阴影、动画采样、DPR 等纯显示成本，不可减少逻辑实体或跳过碰撞。Chrome/Edge 与 Safari 的浏览器 QA 分别记录，未测设备不宣称通过。

Phase 3 本地内置浏览器、1280×678 画布、21 Entity 曲线赛记录为：同时可见 5–8，帧间隔中位对应 120.5 fps，p95 9.30 ms，单帧模拟更新加显示重建平均 0.54 ms，无控制台 warning/error。1,000 Entity 的纯 CPU 裁剪与排序检查执行 50 次合计低于 500 ms。500 可见代理的 GPU 压力、Chrome/Edge 与 Safari 独立数据、draw-call/显存记录尚未验证；现阶段 renderer 仍逐帧重建可见 Graphics，后续需以对象池、静态缓存和 atlas 继续优化。

---

## 11. 禁止项、测试与本轮 Done Definition

全阶段禁止：3D physics、把 z 轴变成新物理维度、重写 WorldRuntime、复制实体或物种专用 Runtime、renderer 内的 AI/碰撞/finish/ranking、自由相机编辑器、VR、自由垂直运动/跳跃/复杂地形。

后续必须验证同一 world/seed、相同逐 tick 输入与 dt 下，Top-Down / Oblique / 无 renderer 的 Runtime 结果一致；相机和显示随机数不能影响模拟。切换不重置 elapsed / waypoints / finishOrder，AuthoringState 和 undo 栈不受影响，旧项目默认 Top-Down。详细矩阵见[开发计划](21_MULTI_VIEW_DEVELOPMENT_ROADMAP.md)。

**Phase 0 Done Definition（已完成）：** 两份设计文档完整，README 索引和 CHANGELOG 更新，编号连续、内部链接有效、全部 diff 只有 Markdown；提交 main，不开发代码、不部署，不把未来测试写成已通过。Phase 1–4 完成证据见[开发计划](21_MULTI_VIEW_DEVELOPMENT_ROADMAP.md)。

## 12. 与既有规范的关系

| 文档 | 本文补充内容 |
| --- | --- |
| [02 世界模型](02_WORLD_MODEL_SPEC.md) | Entity 与 Rule 单一权威，显示代理不成为新实体 |
| [04 数据结构](04_DATA_SCHEMA.md) | view 为显示偏好，遵守当前单 world 文件格式，兼容默认 Top-Down |
| [07 技术架构](07_TECH_STACK_AND_ARCHITECTURE.md) | 细化 runtime/renderer 边界；PixiJS 保持近期选型，3D 仅后续 spike |
| [09 UI / UX](09_UI_UX_SPEC.md) | 继承 Edit/Run 隔离，增加显示状态隔离与斜视编辑门禁 |
| [18 Unified Race 规划](18_ANIMAL_WORLD_UNIFIED_RACE_PLAN.md) / [19 工程规范](19_UNIFIED_RACE_IMPLEMENTATION_SPEC.md) | 复用已泛化的四类参赛者、MovementStyle、声音与比赛闭环，不重做 Animal World |

18 中残留的 car-only 基础描述与 19 的“实施中”是历史阶段措辞；当前基线以代码及 CHANGELOG 的 Unified Race 实现记录为准。本文仅冻结多视角设计，不追溯修改原阶段验收记录，也不授权执行 19 中的部署步骤。
