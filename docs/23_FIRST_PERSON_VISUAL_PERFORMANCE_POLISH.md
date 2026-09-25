# CreatiBox First-Person Visual / Performance Polish V0.1

## 1. 状态与结论

2026-09-25 完成 Phase 7 第一轮视觉和低端设备优化。它只改变 First-Person 的显示映射，不改变 World、Entity、Runtime、碰撞、AI、规则或声音。

- Car、Horse、Human、Sheep 从统一方块升级为不同的程序化低模轮廓；tree、wall、obstacle、start、finish 也有独立映射。
- 道路段增加重叠余量和两侧边线，减少段间缝隙并改善弯道方向识别。
- 第一人称隐藏玩家自身的显示代理，避免相机进入车身/身体；玩家 Entity 和碰撞体仍完整存在于 Runtime。
- 依据 DPR、CPU 核心数和可用 device memory 选择 `standard` / `low` 显示档。低档限制 DPR 为 1.25、显示距离为 900；标准档限制 DPR 为 1.75、显示距离为 1400。
- 距离裁剪只切换 Three Object3D 的可见性，不删除 Entity，也不降低模拟频率。

## 2. 程序化资产映射

| Entity | 第一阶段低模组成 | 识别重点 |
| --- | --- | --- |
| Car | 车身、车舱、四轮、前灯 | 低、宽、车辆轮廓 |
| Horse | 躯干、颈、头、四腿 | 长躯干与高头部 |
| Human | 躯干、头、双腿、双臂 | 直立双足轮廓 |
| Sheep | 椭球羊毛、深色头、四腿 | 白色圆润身体 |
| Tree | 树干、低面数树冠 | 竖直地标 |
| Start / Finish | 双立柱与横梁 | 跨越道路的门架 |

所有显示部件挂在以原 Entity ID 标识的一个 `THREE.Group` 下。Group 只读取 `position`、`rotation`、`state`、`size`、`color`；部件不是新的业务实体。

## 3. 性能策略

- Three.js 继续通过动态 import 加载。未选择 First-Person 时不下载 3D 主包。
- renderer 初始化时确定画质档，并在 canvas 上记录 `data-quality-tier`，便于浏览器 QA。
- 每帧只对显示范围内的 Group 更新 transform 和材质状态；范围外对象保留但不提交绘制。
- 500 / 1,000 Entity 自动压力 fixture 验证裁剪不修改源数据，并把当前线性道路 fixture 的显示集合限制在 100 个以内。
- 不通过降低 WorldRuntime tick、删除逻辑实体或改变碰撞范围换取帧率。

## 4. 验证证据

- 自动检查：新增 5 项 presentation / pressure 测试；全套测试、typecheck、production build 通过。
- 浏览器：本地内置浏览器，1280×720。standard 档，21 个总实体中 10 个在显示范围；更新后的近景为 35 draw calls / 842 triangles。
- 三视图切换后 Runtime generation 保持 1；切到 Oblique 后 First-Person canvas 从 1 降为 0，控制台无 warning/error。
- Production：显示 adapter 5.80 kB / gzip 2.45 kB；Three 共享懒加载 chunk 520.96 kB / gzip 129.51 kB，仍触发 Vite 500 kB warning。

## 5. 已知限制与下一入口

- 当前是程序化无纹理低模，不是最终美术资产；没有动画骨骼、LOD mesh、纹理图集或资产下载失败策略。
- 本轮浏览器证据来自一个桌面环境；Chrome / Edge / Safari 与真实低端课堂设备仍需分别记录。
- 距离裁剪尚未使用 InstancedMesh，也未合并重复材质和几何。实体密度更高时 draw calls 会随可见复合部件增加。
- 下一轮优先做共享 geometry / material、静态对象 instancing、首次加载计时和多浏览器设备矩阵；继续禁止 3D physics、垂直运动、VR 和第一人称编辑。

## 6. 第二轮：共享资源与道路实例化

2026-09-25 完成第一批共享资源优化：程序化模型复用单位 box / cylinder / sphere geometry；Lambert material 按颜色与 Entity 状态缓存，Broken / Damaged 表现不再通过修改每个 mesh 的独立材质实现。道路面全部进入一个 `InstancedMesh`，两侧边线进入另一个实例批次，因此赛道段数不再线性增加 road draw call。

运行宿主现在记录 `data-first-person-load-ms`，覆盖 Three 懒加载、renderer 构造和首批场景对象准备时间。当前本地内置浏览器的单次样本为 12.6 ms；standard 档、13 个可见实体时为 20 draw calls / 502 triangles。切换到 Oblique 后 First-Person canvas 为 0，控制台无 warning/error。260 项测试、typecheck 与 production build 通过。

这不是跨设备结论。该轮尚未实例化 tree / wall / obstacle 等同类静态 Entity，也未完成 Chrome / Edge / Safari 和真实低端课堂设备矩阵；首次加载数据需在这些设备上重复采样。Three 懒加载 chunk 仍超过 Vite 500 kB warning threshold。

## 7. 第三轮：静态场景实例化

2026-09-25 将 tree 拆为共享树干 / 树冠两个实例批次，将 wall / obstacle 合并为一个盒体实例批次。每个实例矩阵仍由原 Entity ID 对应的 position、rotation、size 与 color 生成；Entity 继续存在于同一个项目和 WorldRuntime，碰撞、耐久、规则与 tick 不读取 Three 对象。

renderer 每帧只把距离范围内且位于当前相机视锥内的静态对象紧凑写入实例缓冲。空批次的 count 为 0，不提交 draw call。初版只做距离裁剪时，正常场景从 20 增至 23 draw calls，因此未接受；加入视锥紧凑提交后，同一 Horse 环形比赛恢复到 20 draw calls / 502 triangles，13 个距离范围内实体，standard 档首次初始化样本 11.9 ms。切回 Oblique 后 First-Person canvas 为 0，控制台无 warning/error。

261 项测试、typecheck 与 production build 通过。下一步仍是 Chrome / Edge / Safari 与真实低端课堂设备矩阵；若继续扩大场景密度，再增加含 WebGL 统计的专用压力场景，不用纯 CPU fixture 代替 GPU 证据。
