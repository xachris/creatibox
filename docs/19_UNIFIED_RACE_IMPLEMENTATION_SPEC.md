# Unified Race 工程实施规范

状态：实施中；验收完成前不宣称上线。基线 main b4c2229。

## 约束与数据契约

只扩展现有 WorldRuntime、Pixi renderer、raceAudio 和创建流程。禁止独立 AnimalWorld runtime、物种专属 AI/finish、3D、联网、云存档、生成式资源、生态行为、Horse+Rider，以及新 Railway 服务/域名。

EntityKind 加 horse/human/sheep。MovementStyle 为 vehicle/runner/hoofed；RaceCapability 包含 enabled、maxSpeed、acceleration、brakePower、turnRate。RaceParticipant 是 race.enabled===true 的 Entity 能力视图。默认 Car 260/vehicle、Horse 205/hoofed、Human 125/runner、Sheep 95/hoofed。参数必须有限正数。controlRole、controls、opponentProfile、外观与声音继续保存在 Entity。

导入/载入/运行边界使用幂等规范化；旧 car 缺 race 时用原 maxSpeed 迁移并保留其余配置；显式 disabled 永不启用。运行时只读 race 参数，运行副本不回写 authoring。格式维持 0.1（增量字段），旧文件可读；新旧项目保存重开均验证。

## 运行与规则

participants、唯一玩家、CPU、camera、countdown、finishOrder、result、restart 均按能力选取；恰好一个玩家，否则报错。无有效路径/终点/对应完赛规则、非法能力均有诊断。共享 waypoint、SAT、分离、impact cooldown、damage gate；GO 前不移动，玩家 Finished/Broken 后冻结；完赛者不阻塞终点。不同尺寸起跑网格不重叠。

增加 sourceCapability/targetCapability race 选择器，单侧 kind 与 capability 互斥；旧 kind 规则保持语义，新比赛用能力规则，非 race 实体不参赛。finishOrder 只记一次，同一仿真步冲线按 ID；未完赛按 waypoint + 当前段投影、ID 排名，结果明确未完赛。

## 创建、表现与声音

保留 Home，在 Racing Game 中支持四类玩家和 0–3 个独立选种 CPU；默认/随机/引导落同一模型，选择→review→直接开赛。CarShape/车色只对 Car 显示。renderer 增量扩展马头躯干四肢、人形、羊毛轮廓四肢，逻辑碰撞尺寸独立。vehicle 保留车感，runner 直接转向/停步，hoofed 平滑连续运动；步态由移动速度驱动，静止停止，Clean/Dynamic 独立。

扩展现有 AudioDirector：engine/hoofbeat/footstep 按玩家 style，蹄声/脚步按 speed/maxSpeed 调节，静止停止，仅玩家持续声。保留 countdown/GO/collision/result/UI/mute/unlock；restart/edit/home/unmount/type switch 清理旧轨，失败不阻塞运行。

## 阶段门禁

1. 本规范先独立提交；数据模型、迁移及旧 car 回归。
2. Runtime、能力规则、排名及 CPU 72 组合：3 track × 2 length × 3 difficulty × 4 species，有限时间完赛。
3. generator/UI、混合网格、持久化。
4. Pixi 矢量和 MovementStyle 步态。
5. 共享声音路由和生命周期。
6. npm install/typecheck/test/build、浏览器 QA、文档状态/CHANGELOG/README/work log、main 提交、原 Railway creatibox-web 部署与 URL 核实。

每阶段检查失败先修复再进入下一阶段。

## 验收证据

保留全部旧测试；新增四类玩家/CPU、0/1/2/3 CPU，72 场 mixed（四类轮换玩家×18 环境），4 同类赛，6 无序配对双向共12场。混合场玩家必须走玩家输入，不伪装为 CPU。覆盖 countdown/GO/input clear/camera/finish gating/restart/results/tie-break/collision、旧迁移、自定义速度/规则、保存导入重开、disabled、非法参数、缺玩家/多玩家、缺路径/终点/规则。声音覆盖 style、静止、restart/dispose、mute 和无重复 loop。

浏览器实际操作 Horse+Car/Human/Sheep 和 Human+mixed，从首页至结果，记录复现步骤、可见表现和限制。报告严格区分 automated pass、浏览器观察、未验证。只有全部标准成立才标记完成；最终返回 commit、文件摘要、测试数/矩阵、浏览器结果、Railway 状态/原 URL、已知限制。
