# CreatiBox World Model Specification V0.1

## 1. 目的

本文件定义 CreatiBox 世界中的基础实体、状态、动作、关系、生命周期与状态转换规则。

所有 Creator 都应建立在同一套世界模型上。

## 2. 统一实体模型

任何存在物统一表示为 Entity。

```text
Entity
├── Properties 属性
├── States 状态
├── Actions 动作
├── Interactions 关系 / 相互作用
└── Lifecycle 生命周期
```

## 3. 世界变化模型

```text
Entity → State → Action / Interaction → Transition → New State
```

例如：

```text
赛车
→ 行驶
→ 撞到墙
→ 耐久度下降
→ 受损
```

## 4. 实体分类

第一阶段世界模型支持以下大类：

- Human 人
- Animal 动物
- Plant 植物
- Vehicle 车辆
- Building 建筑
- Object 普通物体
- Environment 环境

后续可扩展，不允许把底层限制在赛车。

## 5. 通用属性

可复用属性：

### Identity
- id
- name
- type
- category

### Visual
- position
- rotation
- scale
- color
- appearance
- visible

### Physical
- size
- weight
- speed
- direction
- collision
- movable

### Condition
- health
- durability
- age
- temperature
- energy

实体只使用适合自己的属性。

## 6. 生命周期

通用生命周期：

```text
不存在
↓
创建 / 出生 / 建造 / 种植
↓
存在
↓
活动 / 使用 / 生长
↓
变化
↓
受损 / 衰退
↓
修复 / 恢复
或
销毁 / 死亡 / 消失
```

### Creation
- Create
- Spawn
- Generate
- Place
- Born
- Plant
- Build
- Craft

### Change
- Move
- Grow
- Transform
- Use
- Damage
- Repair

### End
- Destroy
- Die
- Collapse
- Demolish
- Disappear
- Decay

## 7. 通用动作

### Movement
- Move
- Forward
- Backward
- Rise
- Fall
- Jump
- Slide
- Roll
- Fly
- Swim
- Float
- Teleport

### Orientation
- Rotate
- Turn
- Tilt
- Flip
- Stand
- Sit
- Lie
- Crouch
- FallDown
- GetUp

### Transformation
- Grow
- Shrink
- Stretch
- Bend
- Fold
- Unfold
- Split
- Merge
- Break
- Melt
- Freeze
- Transform

### Condition
- Damage
- Heal
- Repair
- Burn
- Cool
- Heat
- Wet
- Dry
- Decay

## 8. 类别专属动作

### Human

- Walk
- Run
- Jump
- PickUp
- PutDown
- Carry
- Push
- Pull
- Throw
- Use
- Open
- Close
- Build
- Repair

### Animal

通用：
- Walk
- Run
- Jump
- Rest
- Sleep
- Eat
- Drink
- Hurt
- Die

不同物种再增加专属动作，例如：

Dog:
- Follow
- Chase
- Bark
- Sit
- Fetch

Bird:
- TakeOff
- Fly
- Land
- Perch

Fish:
- Swim
- Dive
- Surface

### Plant

- Plant
- Sprout
- Grow
- Mature
- Bloom
- Fruit
- Wither
- Fall
- Burn
- CutDown

### Vehicle

- Start
- Stop
- Move
- Accelerate
- Decelerate
- Turn
- Reverse
- Drift
- Crash
- Flip
- Damage
- Repair
- Destroy

### Building

- Build
- Expand
- Open
- Close
- LightOn
- LightOff
- Damage
- Burn
- Repair
- Collapse
- Demolish

### Object

- Move
- PickUp
- PutDown
- Carry
- Throw
- Drop
- Break
- Repair
- Open
- Close
- Use
- Consume
- Destroy

### Environment

Water:
- Flow
- Rise
- Fall
- Freeze
- Evaporate

Fire:
- Ignite
- Burn
- Spread
- Extinguish

Weather:
- Sunny
- Cloudy
- Rain
- Snow
- Wind
- Storm

## 9. Interaction 类型

### Spatial
- Inside
- Outside
- Above
- Below
- Near
- Far
- Enter
- Leave

### Ownership
- Own
- BelongTo
- Carry
- Store

### Physical
- Touch
- Hit
- Collide
- Push
- Pull
- Attach
- Detach

### Functional
- Use
- Open
- Close
- Activate
- Repair
- Build
- Destroy

### Biological
- Eat
- Feed
- Follow
- Chase
- Escape
- Protect

## 10. 状态转换语法

统一规则：

```text
WHEN
    Entity A
    + Current State
    + Trigger / Interaction

THEN
    Action

RESULT
    New State
```

赛车示例：

```text
WHEN
    Car state = Moving
    AND Car collides with Wall

THEN
    Damage Car by 20

RESULT
    Car state = Damaged
```

树示例：

```text
WHEN
    Tree state = Mature
    AND Tree is hit by Axe 5 times

THEN
    FallDown

RESULT
    Tree state = Fallen
```

苹果示例：

```text
WHEN
    Apple state = Mature

THEN
    Drop

RESULT
    Apple state = OnGround
```

## 11. 能力继承原则

```text
Universal Capabilities
        ↓
Category Capabilities
        ↓
Entity Capabilities
```

例如：

```text
Car
├── Universal: Move, Rotate, Damage
├── Vehicle: Accelerate, Brake
└── RaceCar: Drift, Boost
```

## 12. 设计原则

- 实体不是图片，而是有状态和生命周期的对象。
- 动作不能全部写死在具体 Creator 中。
- Creator 只是对底层能力的不同组合。
- 允许对象从无到有、变化、受损、修复、毁灭。
- 世界规则必须可以用数据描述，而不是依赖页面中的硬编码逻辑。
