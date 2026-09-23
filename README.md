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
- [变更记录](docs/CHANGELOG.md)

## 当前阶段

**V0.1 设计冻结前阶段**

当前任务是先固定世界模型与第一版 MVP 边界，再进入代码实现。
