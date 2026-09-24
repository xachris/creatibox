# CreatiBox First-Person Architecture Spike V0.1

## 1. 结论与范围

2026-09-25 完成 Phase 5 技术验证。本阶段结论：

- **伪 3D / grid raycast 作为通用 CreatiBox renderer：No-Go。** 它可复用只读坐标完成封闭网格走廊，但当前 Race World 使用自由坐标、旋转道路、任意尺寸物件与混合实体；强行栅格化会引入第二种场景表达和墙列专属规则。
- **Three.js 独立 renderer：Conditional Go。** 最小原型证明同一 `WorldRuntime`、Entity ID、2D 碰撞和比赛规则可以驱动透视画面；是否进入 Phase 6 仍需独立确认产品范围，不自动开始。
- **Babylon.js：本轮仅完成官方文档与适配评估。** 能力足够，但其 Universal Camera 和输入组合更接近完整 3D 游戏框架；CreatiBox 当前需要更薄的显示层，Three.js 的手动 camera/scene/renderer 组合更容易阻止第二套输入和物理。

原型只在开发环境通过 `?experiment=first-person` 打开，不出现在首页、运行视角按钮或 production 用户流程，不写入项目 `view`，不部署。

---

## 2. 候选比较

| 维度 | Grid raycast | Three.js | Babylon.js |
| --- | --- | --- | --- |
| 当前世界适配 | 低；需要把自由坐标转换为占格墙体 | 高；可直接映射 `world(x,y) → (x,height,z)` | 高；同样可直接映射 |
| 相机 | 自制逐列射线与鱼眼修正 | `PerspectiveCamera`，位置与 target 完全由 Runtime participant 决定 | Universal Camera 功能完整，但默认输入需全部清理或不 attach |
| 道路 / 大对象 | 网格走廊可用，曲线和旋转宽道路失真 | 几何、Billboard、低模均可，原型已显示曲线分段道路 | 能力充足，未安装或跑包体/帧率实测 |
| 输入 / 物理隔离 | 必须自制；易产生走廊专属碰撞 | 原型不使用 controls/physics，键盘仍交给 WorldRuntime | 官方 camera 可组合键鼠触控；需显式清空输入并禁止 collisions/gravity |
| 资源清理 | Canvas 数据简单 | geometry/material/renderer 必须显式 dispose | camera/scene/engine 与附加 input 必须显式 detach/dispose |
| 本轮证据 | DDA corridor 单元原型 | 真实 WebGL 浏览器原型、trace、性能、清理 | 官方文档评估 |
| 决策 | 通用路线 No-Go；可保留为专用迷宫实验 | Phase 6 首选，Conditional Go | 保留备选，不进入 Phase 6 首选 |

PixiJS 官方定位仍是 2D renderer，并建议 3D 模型需求评估 Babylon.js 或 Three.js；因此不继续把 Oblique 拉伸成“第一人称”。Three.js 官方要求 scene、camera、renderer 三部分，并明确 WebGL geometry、material、texture 与 renderer 需要主动释放。Babylon.js 官方 Universal Camera 默认组合键盘、鼠标、触控和手柄，虽然 inputs 可清除，但会增加与现有输入宿主的隔离工作。

官方参考：

- [PixiJS: What PixiJS Is Not](https://pixijs.com/7.x/guides/basics/what-pixijs-is-not)
- [Three.js: Creating a scene](https://threejs.org/manual/pages/creating-a-scene.html)
- [Three.js: Cleanup](https://threejs.org/manual/pages/cleanup.html)
- [Three.js: WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Babylon.js: Camera introduction](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/cameras/camera_introduction.md)
- [Babylon.js: Customizing camera inputs](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/cameras/customizingCameraInputs.md)

---

## 3. 已实现的最小验证

### A. 受限 raycast corridor

`raycastCorridor.ts` 实现 DDA grid ray，返回墙格、距离和命中侧，并对视场内各射线做鱼眼距离修正。fixture 是封闭矩形走廊；它证明算法可工作，也同时证明限制：输入必须先变成离散 wall grid，无法忠实表达现有任意旋转和曲线 world。

该原型不进入 WorldRuntime，不增加 grid collision，不把测试成功解释为通用世界可行。

### B. Three.js 共享 Runtime

开发入口创建一个现有 curve Race World 和唯一 `WorldRuntime`：

```text
WorldRuntime 2D Entity position / rotation
        ↓ read-only adapter
Three position (X=x, Y=displayHeight, Z=y)
        ↓
PerspectiveCamera + low-poly display proxy
```

- Car / Horse / Human / Sheep、tree / obstacle / wall 映射为低模代理；道路由共享 `trackPath` 分段成宽平面。
- 相机只读取 player position / rotation，固定眼高，无 head bob、自由垂直移动、跳跃或 pointer lock。
- 键盘集合直接传给 `WorldRuntime.step`；Three.js 不注册 controls，不使用 raycaster collision、physics、AI、waypoint、finish 或 ranking。
- 显示代理保存同一 Entity ID；映射函数不修改 Entity。
- 退出时取消动画帧、移除监听，dispose 所有 geometry/material/renderer，释放 WebGL context 并移除 canvas。

---

## 4. 测量与验证证据

环境：macOS 本地 Codex 内置浏览器，1280×720，DPR 2，开发服务器。原型使用 `three@0.186.1` 与 `@types/three@0.186.0`。

| 指标 | 结果 | 边界 |
| --- | --- | --- |
| 浏览器帧率 | 120 fps | 当前显示刷新率下的 HUD 一秒采样，不代表所有设备 |
| draw calls | 运行中 17–19 | 1 个简单 Race World，低模无纹理 |
| 画布 | 1 | 退出后实验 canvas 为 0 |
| 控制台 | 0 warning / error | 本地一次进入、运行、退出 |
| Runtime 等价 | 900 fixed ticks 完全相等 | 同环境、同 world、同 dt、无玩家输入 |
| 自动检查 | 250 tests 通过 | 包括 raycast、只读映射和 trace 对照 |
| production main chunk | 433.07 kB / gzip 140.23 kB | Phase 4 为 430.87 / 139.30；异步入口有约 2.2 / 0.93 kB 壳成本 |
| 懒加载实验 chunk | 524.10 kB / gzip 131.62 kB | 未做 tree-shaking 深化、模型/纹理/音频尚未加入 |

typecheck 与 production build 通过。Vite 对 524.10 kB 实验 chunk 给出大于 500 kB 警告；这是进入产品化前必须处理的成本，不能隐藏。

---

## 5. Conditional Go 条件

本轮只证明架构可行，未证明产品完成。Phase 6 开始前继续接受以下约束：

1. Three renderer 必须接入现有稳定运行宿主，切换不重建 Runtime、音频、输入或 HUD；开发实验内部自建 Runtime 不能直接当成最终集成。
2. 使用动态 import，First-Person 未选择时不得下载 Three chunk；记录首开加载时间和失败回退。
3. 第一版只映射平面道路、地面、Billboard/低模实体和固定玩家相机；碰撞继续完全来自 2D Runtime。
4. 禁止 Three controls、物理、AI、规则、自由垂直移动、跳跃、复杂地形、VR 和编辑模式。
5. 加入 renderer 初始化失败回退、50 次切换资源检查、四类玩家方向校验、碰撞可见反馈和正常/压力场景性能数据。
6. 131.62 kB gzip 依赖成本需要产品评审；若首开、GPU 或低端课堂设备数据不达标，Phase 6 No-Go，保留 Top-Down / Oblique。

Phase 5 到此结束。Phase 6 已于 2026-09-25 按上述条件完成运行视图 MVP：Three renderer 接入稳定运行宿主，支持三视图连续切换、偏好保存、失败回退和显式资源清理。默认编辑视图仍为 Top-Down；低模资产、包体与设备性能边界继续有效。
