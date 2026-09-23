# CreatiBox Data Schema Draft V0.1

## 1. 目标

CreatiBox 世界必须由结构化数据描述。

UI、Creator 和 Runtime 不应该把世界规则写死在页面逻辑中。

## 2. Project

建议项目结构：

```json
{
  "formatVersion": "0.1",
  "project": {
    "id": "project_001",
    "name": "My Racing World",
    "creatorType": "racing"
  },
  "worlds": [],
  "assets": [],
  "metadata": {}
}
```

## 3. World

```json
{
  "id": "world_001",
  "name": "Level 1",
  "entities": [],
  "rules": [],
  "nextWorld": null
}
```

未来可通过 `nextWorld` 或条件规则连接多个世界。

## 4. Entity

```json
{
  "id": "car_001",
  "type": "RaceCar",
  "category": "Vehicle",
  "properties": {
    "position": { "x": 100, "y": 200 },
    "rotation": 0,
    "speed": 0,
    "durability": 100
  },
  "state": "Idle",
  "capabilities": [
    "Move",
    "Turn",
    "Accelerate",
    "Brake",
    "Damage"
  ]
}
```

## 5. Rule

```json
{
  "id": "rule_001",
  "when": {
    "entity": "car_001",
    "state": "Moving",
    "interaction": {
      "type": "Collide",
      "targetType": "Wall"
    }
  },
  "then": [
    {
      "action": "Damage",
      "value": 20
    }
  ],
  "resultState": "Damaged"
}
```

## 6. 多阶段规则

```json
{
  "id": "rule_002",
  "when": {
    "entity": "car_001",
    "condition": {
      "property": "durability",
      "operator": "<=",
      "value": 0
    }
  },
  "then": [
    {
      "action": "Stop"
    }
  ],
  "resultState": "Broken"
}
```

## 7. Capability Definition

后续能力定义应独立于实体实例。

示意：

```json
{
  "id": "Accelerate",
  "appliesTo": ["Vehicle"],
  "parameters": {
    "amount": {
      "type": "number",
      "min": 0,
      "max": 100
    }
  }
}
```

## 8. Category Definition

```json
{
  "category": "Vehicle",
  "inherits": ["Entity"],
  "capabilities": [
    "Move",
    "Turn",
    "Accelerate",
    "Brake",
    "Damage"
  ]
}
```

## 9. 关键约束

- JSON 中不得出现任意 JavaScript。
- Runtime 只执行注册过的 Action。
- 未定义 Capability 不得执行。
- Creator UI 只负责编辑数据。
- Runtime 只负责解释数据并运行。
- 后续新增音乐、建筑、故事 Creator 时应尽量复用同一 Project / World / Entity / Rule 结构。
