# CreatiBox Multi-View 开发进度与验收计划 V0.1

## 1. 状态、目标与执行规则

Phase 0–6 已完成。运行模式可在 Top-Down、Oblique 与 First-Person 间连续切换并保存偏好；编辑仍固定 Top-Down。First-Person MVP 使用异步 Three.js 显示层并复用同一 WorldRuntime。

基线：`main` @ `7c58ad3c18cba4a44cd434ba78ddeee172c72f21`。架构契约见 [20_MULTI_VIEW_RENDERER_ARCHITECTURE.md](20_MULTI_VIEW_RENDERER_ARCHITECTURE.md)。先保持 Top-Down 不变，再实现 Oblique，最后通过 spike 决定是否做真正 First-Person。

进度按**交付物 + 阶段门禁**管理，不把工作量估计当作发布日期。每个 Phase 开始前确认上阶段证据；结束时记录 commit、变更范围、自动检查、浏览器观察、性能数据、未验证项和下一阶段条件。失败先修复或收缩显示范围，不能放宽单一 Runtime 原则。

---

## 2. 正式阶段安排

| Phase | 工作量初估 | 依赖 | 里程碑 | 当前状态 |
| --- | --- | --- | --- | --- |
| 0 文档 / 架构冻结 | 已完成 | 读取现有规范与 main | 两份规范、索引、变更记录、文档提交 | 2026-09-24 已完成 |
| 1 Renderer abstraction | 2–3 开发日 | Phase 0 | Top-Down 经适配层运行且无行为变化 | 2026-09-24 已完成 |
| 2 Oblique MVP | 3–5 开发日 | Phase 1 | 固定斜投影的四类混合竞速可运行 | 2026-09-24 已完成 |
| 3 Oblique polish | 3–5 开发日 | Phase 2 | 遮挡、资产锚点、方向和性能达标 | 2026-09-24 已完成 |
| 4 View switching | 2–3 开发日 | Phase 3 | 不重建 Runtime 的双视图切换与偏好保存 | 2026-09-24 已完成 |
| 5 First-Person architecture spike | 限时 3–5 开发日 | Phase 4 | 比较报告、最小原型、Go / No-Go | 2026-09-25 已完成；Three.js Conditional Go |
| 6 First-Person MVP | Go 后再估算，暂留 5–10 开发日 | Phase 5 Go + 独立排期确认 | 复用 2D Runtime 的第一人称运行视图 | 2026-09-25 已完成 MVP |

估计按一位熟悉现有代码的开发者计算，包括本阶段检查；不包含高质量资产采购/制作、课堂验证和等待评审时间。Phase 1–4 约 10–16 开发日，仅供规划。没有承诺上线日期；任一代码阶段的上线/部署另行安排，不继承旧 Unified Race 文档的自动部署要求。

---

## 3. Phase 0 — 文档 / 架构冻结（本轮）

### 交付

- 阅读 02 / 04 / 07 / 09 / 18 / 已存在的 19、README 与 `docs/CHANGELOG.md`，确认当前模型与历史草案差异。
- 新增 20 架构设计与 21 开发计划，保持连续编号和现有 Markdown 风格。
- 冻结单一 World/Entity/Rule/Runtime、显示状态隔离、投影、资产、排序、兼容和 First-Person 两路线。
- README 增加索引，CHANGELOG 明确“设计阶段，仅文档，无代码实现”。

### 门禁 / Done Definition

仅四个 Markdown 文件新增或修改；链接有效、编号无冲突、无 runtime/UI/renderer/依赖/资产/部署配置变化。检查 diff 后提交 main，并返回 commit hash 与新增/修改文件。本轮不运行浏览器产品验收、不宣称未来代码测试或性能预算已通过，不部署。若 main 存在自动部署触发器，提交前须确认不会因此发布本次文档变更。

---

## 4. Phase 1 — Renderer abstraction

### 工作包

1. 记录 Top-Down 基线：截图、输入/拖拽、镜头、HUD、race trace 和浏览器/设备信息。
2. 从 WorldCanvas 的显示职责抽出 `IWorldRenderer`、`CameraController`、`ViewState`，先包裹现有 Pixi 绘制，保持投影、资源与用户体验不变。
3. 固定运行宿主拥有唯一 WorldRuntime、模拟调度、输入、音频；renderer 只读状态。保留现有 Runtime 算法、时间步、Run/Restart/Stop 行为。
4. 建立 renderer mount/render/resize/dispose 与能力声明；编辑/运行 ViewState 分离，全部仍 Top-Down，暂不添加用户视图切换入口或持久化字段。

### 验收

- 既有 typecheck / test / build 通过，保留 Unified Race 全部回归（基线记录为 233 tests，执行时记录实际数量）。
- 相同输入与 dt 的 Runtime trace 与改造前一致；Top-Down 布局、拖拽、控制、跟随、结束、重赛、音效无回归。
- 运行宿主只创建一次 Runtime；renderer dispose 不销毁业务世界，不叠加 ticker 或音轨。
- 产出接口契约、回归截图/记录、已知差异清单。出现非预期行为差异时不得进入 Phase 2。

### 完成记录（2026-09-24）

- 新增 `ViewState`、`CameraController`、`IWorldRenderer` 与 `TopDownRenderer`。TopDown renderer 接管 Pixi world layer、显示清理、world/screen 投影、相机更新与资源释放。
- `WorldCanvas` 继续唯一持有 WorldRuntime、ticker、输入、HUD 与 AudioDirector；renderer 不创建或推进 Runtime。进入 Run / Restart 仍走既有初始化，单纯绘制和相机更新不触发初始化。
- 编辑与运行使用独立的默认 ViewState；当前均固定为 Top-Down。编辑拖拽坐标改为通过 renderer 的 inverse projection，结果与原先减去 world layer 平移相同。
- `npm run typecheck`、236 项测试和 `npm run build` 通过；236 项包括原 233 项回归与 3 项 renderer/camera 边界测试。
- 本地浏览器从首页完成默认混合比赛启动、倒计时、CPU 推进、HUD、重新比赛清零与返回编辑；无浏览器控制台错误。未改变 UI，未实现视图切换，未部署。

---

## 5. Phase 2 — Oblique MVP

### 工作包

- 在 PixiJS 内实现固定朝向的 2D world → Oblique 投影，z=0；道路顶点、起终点与实体脚点使用同一变换。
- 实现脚点稳定深度排序、camera follow、dead zone、受限 look-ahead、zoom、world bounds。
- 支持 Car / Horse / Human / Sheep、tree / road / obstacle / start / finish，保留 wall；实体逻辑尺寸不因资产更换而变。
- 采用矢量或简单 sprite 映射与可读朝向，HUD 读共享运行数据；不引入完整 3D 引擎。
- 先通过开发配置在一次 Run 开始前选 Top-Down 或 Oblique。该选择仍通过原 Run 入口建立运行副本；尚不提供运行中切换。

### 验收

- 四类玩家各与混合 CPU 跑同一 Race World；道路连接、起终点、树与障碍不漂移。
- 同 world/seed/输入/dt 的 Runtime trace 与 Top-Down 完全一致，碰撞/waypoint/排名不受投影影响。
- 摄像机持续跟随正确 Entity ID，缩放不更改速度、碰撞或位置；遮挡排序在简单资产范围正确。
- MVP 仅运行；编辑仍 Top-Down，不对未实现的斜视点击/拖拽作出承诺。长墙、多层交叉等限制有可复现记录。

### 完成记录（2026-09-24）

- 新增固定朝向 PixiJS `ObliqueRenderer`：`screenX=(x-y)*0.72`、`screenY=(x+y)*0.36-z`，并提供 z=0 地面逆投影、方向投影和缩放接口。
- 世界边界以投影菱形绘制；道路中心线、Car / Horse / Human / Sheep、tree / wall / obstacle / start / finish 使用同一投影。斜视对象增加简单接地阴影，未引入外部资产或 3D 引擎。
- 起终点进入地面层；其他实体按 projected foot point、Entity ID 稳定排序。大物件拆分、树冠遮挡与更高质量 anchor 留给 Phase 3。
- 运行相机按同一 participant ID 跟随投影位置，采用 20% dead zone、约 150 ms 时间平滑和最多短边 15% 的速度方向 look-ahead；zoom 继续由显示态控制，初始为 1。
- 本地开发时使用 `?view=oblique` 在一次 Run 前选择斜视；生产构建和编辑模式保持 Top-Down。没有运行中切换或 view 存档字段。
- 240 项测试、typecheck 与 production build 通过；自动测试证明 Top-Down / Oblique 在相同世界与时间步下产生相同 HUD 运行进度。浏览器实际完成 Horse 混合比赛启动、倒计时、CPU 推进、斜视道路/树/实体/阴影、HUD 与重赛，控制台无错误。未部署。

---

## 6. Phase 3 — Oblique polish

### 工作包

- 标定树根、车底 footprint、角色脚点与 sprite anchor；针对大型物件拆分可视片段，保持一个 Entity ID。
- 处理树冠遮挡、轮廓/透明度、地面阴影、显示高度层；高度不进入碰撞或规则，z 不是新物理轴。
- 增加八向或更多朝向、稳定 gait、资产缺失回退；实体大小与逻辑 footprint 保持可理解的一致性。
- HUD 使用屏幕坐标；设计并验证后续斜视编辑的 screen→world、pick、选框、拖动锚点映射。
- 斜视编辑作为独立可选交付：若 selection/drag/resize/rotate/undo 未全部通过，维持仅运行，不阻塞运行视图计划。
- 性能测量后优化 sorting、culling、纹理批处理、静态缓存与资源复用，不更改 Runtime 算法。

### 验收

- 玩家前后绕树、穿过起终点标记、不同体型相交、长障碍两侧通过时无明显错误覆盖或中心排序跳闪。
- 八向转向及静止/移动切换可辨；视觉高度与阴影不改变实际碰撞、waypoint 或名次。
- 投影/逆投影往返在支持平面内误差 ≤1e-6 world unit；交互误差以屏幕实测为准，已支持编辑操作指针漂移 ≤2 CSS px。
- 完成 20 第 10 节的正常场景 60 fps 预算与压力报告；真实设备信息、p95、排序成本、culling/批处理策略入档。
- 斜视编辑若未开放，明确写“仅映射验证，编辑未交付”。

### 完成记录（2026-09-24）

- 深度键改为旋转 footprint 最深角的 projected foot Y，不再用 sprite center 或按尺寸猜测偏移；长障碍、不同尺寸物件和动态实体继续以稳定 Entity ID 排序。
- 树在显示层拆成地面阴影、树干和树冠，仍对应同一个 Entity。树冠位于玩家前方且覆盖玩家脚点区域时降至 42% alpha；树根作为视觉锚点，树不随业务 rotation 倾倒。显示高度、阴影和透明度均未进入 Entity 或碰撞。
- Car 与三类生物继续使用投影后的连续朝向；自动测试证明完整一圈能稳定映射为八个不同方向。gait 仍由共享位移累计驱动，静止时冻结。
- Oblique renderer 按投影后的屏幕位置和包含树冠/阴影的安全边距裁剪。当前浏览器曲线赛 21 个对象中同时绘制 5–8 个；裁剪不删除逻辑实体，也不影响 Runtime step。
- 开发环境加入只读性能指标。1280×678 本地内置浏览器实测中位 120.5 fps、p95 帧间隔 9.30 ms、平均单帧模拟更新加显示重建 0.54 ms；正常产品场景达到 60 fps 预算，控制台无 warning/error。该结果只代表当前设备和当前 21 Entity 场景，不外推到其他浏览器或设备。
- 1,000 Entity 压力自动检查连续执行 50 次裁剪与稳定排序，合计须低于 500 ms；本轮通过。500 可见代理的真实 GPU/draw-call 压力尚未在浏览器验证，高质量纹理 atlas、静态 Graphics 缓存与显示对象池仍是后续性能工作，不把 CPU 检查冒充完整渲染结果。
- 244 项测试、typecheck 与 production build 通过。投影逆变换仍保持 1e-10 精度级测试；斜视编辑未交付，screen→world 只保留架构能力，编辑继续强制 Top-Down。未部署。

---

## 7. Phase 4 — View switching 与偏好

### 工作包

- 提供学生可理解的“俯视 / 斜视”运行视图入口；隐藏尚未实现的第一人称，不展示专业引擎设置。
- 在稳定宿主内执行 20 第 8 节切换事务；不因组件重挂载重新 Run，不重建 World 或 Runtime。
- 新 renderer 就绪前保留旧视图；失败返回旧视图，无重赛恢复。
- 按 20 第 5 节增加可选 `view` 偏好和独立显示存储路径，覆盖导入/导出/自动保存/重新打开；旧作品默认 Top-Down。
- 编辑默认 Top-Down；运行可选择两种视图。Stop 返回既有创作原稿及编辑镜头。

### 验收

- 在 countdown、GO 后行驶、碰撞、waypoint 边界、finish 同步步、结果页分别双向切换；elapsed、waypoint、finishOrder 等与对照执行一致。
- 切换保持 Runtime 对象身份与 Entity ID；无额外 initializeRuntime、随机世界生成、音效重启。
- 连续切换 50 次，无重复 canvas/ticker/输入监听、无持续资源增长；初始化失败注入可安全回退。
- AuthoringState 深比较及 undo/redo 栈保持不变，只有独立 ViewState / 偏好变化；不是将运行副本保存回项目。
- 旧格式无 view、有效新 view、未知 viewVersion/模式、非法数字、失效目标均有兼容测试。

### 完成记录（2026-09-24）

- 运行画面增加“俯视 / 斜视”双按钮。切换只 dispose 当前 renderer、创建目标 renderer、更新 ViewState 并重新跟随同一玩家；不调用 `initializeRuntime`，不停止或重建 AudioDirector。
- `WorldCanvas` 自动测试在比赛进行中往返切换 50 次：Runtime generation 始终为 1、canvas 始终为 1，切换瞬间 standings 不变，随后 elapsed 与比赛进度继续前进。
- 项目 envelope 增加可选 `view.version=1` 和 edit/run 显示偏好。旧项目保持无 `view` 且默认 Top-Down；用户主动切换后才写入可选配置。自动保存、导入和导出沿用同一 normalization 路径。
- 编辑偏好强制 Top-Down / none；运行当前支持 Top-Down / Oblique / participant。未知版本、First-Person、非法 zoom/rotation、损坏结构安全回退；zoom 限制 0.5–2，world 内容保持不变。
- 浏览器实测从 33.7 秒 Top-Down 切到 Oblique 后继续至 41.2 秒，Runtime generation=1、canvas=1；返回首页、等待自动保存、刷新并继续项目后，运行偏好恢复 Oblique。控制台无 warning/error。
- 247 项测试、typecheck 与 production build 通过。斜视编辑仍未开放，First-Person 仍隐藏；未部署。

---

## 8. Phase 5 — First-Person architecture spike

仅技术验证文档与最小原型，不承诺产品化；原型置于受控实验入口，不加入默认课堂流程，不在本轮实施。

### 必须比较

| 项目 | A. pseudo-3D raycast | B. Three.js / Babylon.js renderer |
| --- | --- | --- |
| 最小样例 | 网格迷宫 / 简单走廊，证明复用模型；同时记录通用世界不适配点 | 同一 2D Race World 地面、道路、四类实体代理与玩家相机 |
| 几何和遮挡 | 对自由放置 / 旋转物件、宽道路、大对象的限制 | 透视、Billboard/低模、透明物件、脚点对齐 |
| 共用逻辑 | 不增加墙列专属游戏规则 | 不采用引擎物理或第二套输入/比赛系统 |
| 工程成本 | 适配地图限制与自制绘制维护成本 | 分别比较 Three.js / Babylon.js 的适配量、包体、加载、资源回收与维护 |
| 体验与性能 | 明确适用范围，不能以走廊成功证明通用世界可行 | 桌面浏览器帧率、加载、输入/鼠标退出、眩晕与失败回退 |

三种候选均给出评估记录；允许根据明确的不适配证据淘汰候选，不为完成表格重建整个产品。至少交付 A 的受限走廊验证，以及 B 中最有希望候选的共享 Runtime 最小原型，并说明另一引擎是否仅完成文档/适配评估。

### Go / No-Go

Go 必须同时满足：使用同一 World/Entity/Rule/Runtime；固定 trace 比较通过；碰撞继续由 2D Runtime 提供；正常场景达到既定桌面预算；相机控制可退出、无默认 head bob；包体/首屏/GPU/资源清理成本可接受并有数据；无需自由垂直物理即可表达目标玩法。

报告需列出测试设备、原型 commit、运行方式、实际测量、限制、候选淘汰理由与建议。未通过则 No-Go 或收缩实验范围，**不自动进入 Phase 6**。通过后仍须确认独立产品范围与排期，选择 renderer 才锁定依赖与资产预算。

### 完成记录（2026-09-25）

- 新增 [22 First-Person Architecture Spike](22_FIRST_PERSON_ARCHITECTURE_SPIKE.md)，完成 grid raycast、Three.js 与 Babylon.js 比较。通用 raycast No-Go；Three.js Conditional Go；Babylon.js 保留文档级备选。
- 受限 DDA corridor 原型证明网格走廊可行，也确认自由坐标、旋转宽道路和通用实体不适合被迫栅格化。
- 开发隐藏入口 `?experiment=first-person` 运行 Three.js 低模 Race World；同一 WorldRuntime 提供 Entity、控制、AI、碰撞、waypoint、finish 和 ranking，Three 只读映射和显示。
- 900 fixed ticks 自动对照证明逐 tick 读取 3D transform/camera 不改变 Runtime project、elapsed 或 finishOrder。浏览器 1280×720 / DPR 2 实测 120 fps、17–19 draw calls、无 warning/error；退出后实验 canvas 从 1 回到 0。
- Three.js 异步实验 chunk 524.10 kB / gzip 131.62 kB，构建明确产生大 chunk warning；该成本和低端设备性能进入 Phase 6 门禁，不宣称已达产品预算。
- 250 项测试、typecheck 与 production build 通过。实验不进入首页或正式视图切换，不写 view 偏好，不部署。

---

## 9. Phase 6 — First-Person MVP（条件阶段）

仅在 Phase 5 成功并完成后续排期确认后执行：独立 renderer 读取统一 Runtime，增加玩家相机、道路/地面和 Entity Billboard/低模映射。物体 ID、能力、规则与存档世界模型不变。

初期只运行，不做第一人称编辑。玩家视点跟随同一 participant；水平控制通过现有 Runtime，3D 显示高度/眼高不成为物理状态。不做自由垂直物理、跳跃、复杂地形、VR、自由相机编辑器，不开启另一套 3D physics。

验收沿用双视图一致性矩阵并扩展为三视图，验证碰撞可见反馈、HUD 可读性、输入退出、切回 Top-Down/Oblique 的连续性、资产缺失与显卡能力失败回退。未满足时保留 Phase 4 成果，不替换默认编辑器。

### 完成记录（2026-09-25）

- 新增 production 可用但按需加载的 `FirstPersonRenderer`。Three.js 只读取 Runtime project / player；键盘、ticker、声音、HUD、碰撞、AI、waypoint、finish 和 ranking 仍由现有运行宿主管理。
- 运行视角增加“第一人称”，可与俯视、斜视连续切换并保存可选偏好。切换不创建 Runtime；WebGL 不可用或初始化失败时回退 Top-Down。
- 地面、分段道路、Car / Horse / Human / Sheep、tree / wall / obstacle 使用简单低模映射；Entity ID 与 2D position / rotation 保持唯一权威。
- 自动验证覆盖 50 次 First-Person 往返、canvas dispose、初始化失败回退、偏好兼容和 Runtime generation 不变。
- 浏览器实测同一比赛由 18.5 秒 First-Person 连续运行到 32.3 秒 Oblique、33.5 秒 Top-Down，Runtime generation 始终为 1；First-Person 17 draw calls / 354 triangles，离开后 3D canvas 为 0，控制台无 warning/error。
- 当前资产仍是无纹理低模代理；没有垂直物理、跳跃、复杂地形、VR、第一人称编辑或 positional audio。

---

## 10. 测试矩阵与证据规范

### 自动检查（后续代码阶段）

| 主题 | 用例 | 通过条件 |
| --- | --- | --- |
| 模拟一致性 | 同一序列化 world + race seed（若生成器未暴露 seed 则冻结生成结果）+ 固定逐 tick dt/玩家输入，在 headless、Top-Down、Oblique 比较 | 每 tick 位置/朝向/速度/耐久/state、phase、elapsed、waypoint、finishOrder、standings 完全一致；视觉插值字段不参与比较 |
| 四类混合回归 | 四类轮换玩家 × 3 赛道 × 2 长度 × 3 难度 = 72 环境；两种 renderer；保留已有 72 CPU 组合、同类与双类测试 | 共享 finish/ranking/碰撞语义无变化，不用 CPU 冒充玩家输入 |
| 调度隔离 | 相同模拟 tick 输入下，render 0/1/多次、不同渲染频率、切换或 cull | 调用 renderer 不推进模拟，不调用第二次 runtime.step，不消费模拟随机数 |
| 切换连续性 | 各阶段插入双向切换，50 次往返；资源加载失败 | 与未切换对照在同 tick 相等，Runtime 身份不变，不重复 finish / countdown / 音频 |
| 创作隔离 | cameraTarget/zoom/heading/pitch/follow、Run/Stop、偏好保存 | authoring world / entities / rules 与 undo 栈不变；运行变化不写回 |
| 投影和选择 | 原点、四象限、world 边界、不同 zoom、支持的 heading / plane；重叠与大对象 | 正逆往返误差达标，按可见层命中 Entity ID，不按 sprite center 判断世界位置 |
| 兼容 | 旧 car、现有 mixed、无 view、新 view、未知模式/版本、非法 zoom、丢失目标，保存/导入/重开 | 旧项目 Top-Down；新 view 可选且幂等；损坏显示配置不破坏有效 world |
| 资源和声音 | renderer mount/resize/dispose、反复切换、失焦/隐藏页、静音/无音频 | 无重复 ticker / 键监听 / 音轨；声音生命周期仍由运行宿主管理 |
| 性能 | 正常 500 总 / 200 可见、压力 1,000 总 / 500 可见，均最多 4 参赛者 | 正常场景预算达标；压力报告写明退化，不能靠降低模拟精度达标 |

确定性比较应固定生成结果、随机源和模拟时间步；只给相同 seed 但输入时序/dt 不同并不能证明 renderer 导致差异。若现有 Runtime 暂不支持跨机器位级复现，首先要求同环境相同 tick 精确一致，并单独记录跨环境浮点边界，不把结果差异归入允许的视觉误差。

### 浏览器 QA（Phase 1 起逐步执行）

- Chrome/Edge 与 Safari 桌面环境，记录 OS、版本、分辨率、DPR；首次进入、窗口 resize、焦点丢失和后台恢复。
- 四类玩家分别从首页进入比赛，观察倒计时、控制、混合 CPU、转弯、树/障碍遮挡、起终点、结果、重赛、返回编辑/首页。
- Phase 4 检查真实点击切换、持续按键、快速切换、终点附近切换、加载失败；镜头不甩动、不缩放世界逻辑，HUD 可读，声音不中断重播。
- 保存/导入/重开旧新作品；编辑布局和撤销历史不受运行视图影响。若斜视编辑未开放，确认不会误进入编辑交互。
- 记录复现步骤、fixture/world、seed/输入、截图或录像、性能 trace；分开标注 automated pass、browser observed、not verified，不以单张截图证明模拟正确。

---

## 11. 风险、回退与全程禁止项

| 风险 | 处理与回退 |
| --- | --- |
| 现有 canvas 生命周期把切换当成重新挂载 | 先固定运行宿主，再切 renderer；以 Runtime identity / trace 门禁阻断 |
| 大资产遮挡无法单点排序 | 拆显示片段、限制 MVP 资产形状，保留同一实体与碰撞体 |
| 镜头跟随/旋转造成眩晕 | 固定 heading、限制 look-ahead、减少动态选项，保留 Top-Down |
| 斜视编辑坐标误差 | 暂维持运行专用，完成逆投影和完整编辑验收后再开放 |
| GPU/资源成本超预算 | 降显示质量和 DPR，记录测量；不改模拟精度或隐藏逻辑实体 |
| 3D 路线膨胀为另一个游戏 | spike 判定 No-Go；回到稳定双视图，不重写 WorldRuntime |

全程禁止：实体副本成为业务对象、物理/waypoint/finish/ranking 放进 renderer、视图切换污染 AuthoringState、3D physics、z 物理化、独立 AnimalWorld/3D Runtime、自由相机编辑器和 VR。第一人称路线禁止假称 PixiJS 2D 自然等于真正 3D。

## 12. 下一轮实施入口

Phase 7 第一轮视觉与性能优化已完成，详见 [23_FIRST_PERSON_VISUAL_PERFORMANCE_POLISH.md](23_FIRST_PERSON_VISUAL_PERFORMANCE_POLISH.md)：四类 participant 获得可区分的程序化低模，道路边线/接缝、玩家自身遮挡、低端 DPR 和距离裁剪已处理。下一轮应做共享 geometry / material、静态对象 instancing、首次加载计时及 Chrome / Edge / Safari 和真实低端设备矩阵；继续保持 Top-Down 为默认编辑视图，不扩展 3D 物理。
