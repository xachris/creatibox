# CreatiBox MVP V0.1 Specification

## 1. MVP 目标

在一节约 40 分钟的课堂中，让学生能够独立创建一个简单赛车世界，并进行测试、修改和本地保存。

第一版不是完整游戏平台，也不是完整学校系统。

## 2. 使用流程

学生打开网页后：

1. 新建项目
2. 进入赛车 Creator
3. 放置赛车
4. 放置道路、墙、障碍物、起点和终点
5. 为赛车设置移动与转向行为
6. 设置碰撞后的状态变化
7. 运行场景
8. 修改设计
9. 保存项目
10. 下次重新打开继续编辑

## 3. V0.1 必须支持的实体

- Car
- Road
- Wall
- Obstacle
- Start
- Finish

## 4. V0.1 必须支持的状态

Car:

- Idle
- Moving
- Damaged
- Broken
- Finished

## 5. V0.1 必须支持的动作

- Move
- Turn
- Accelerate
- Brake
- Stop
- Damage
- Reset

## 6. V0.1 必须支持的关系

- Collide
- Touch
- Reach

## 7. V0.1 必须支持的转换

例如：

```text
Moving + Collide(Wall)
→ Damage
→ Damaged
```

```text
Damaged + durability <= 0
→ Stop
→ Broken
```

```text
Moving + Reach(Finish)
→ Stop
→ Finished
```

## 8. 编辑界面

建议第一版只包含：

### 左侧
对象 / 行为工具区

### 中间
2D 世界画布

### 右侧
当前对象属性

### 顶部
- 新建
- 运行
- 停止
- 保存
- 打开

## 9. 技术范围

第一版优先：

- Vue 3
- Vite
- PixiJS
- Blockly 或轻量规则编辑器
- localStorage
- JSON 导入 / 导出

第一版不需要后端。

## 10. 明确不做

V0.1 暂时不做：

- 登录
- 账号
- 班级
- 教师后台
- 学生监控
- 数据库
- 云同步
- AI
- PDF 报告
- 多人协作
- 机器人
- 音乐 Creator
- 建筑 Creator
- 故事 Creator
- 3D
- 开放代码编辑
- 公网内容导入

## 11. 成功标准

普通学生在不阅读长说明的情况下，可以：

- 5 分钟内看到作品开始运行
- 20 分钟内形成自己的赛车场景
- 40 分钟内继续增加规则、障碍和变化

如果必须由教师逐步带着完成，说明产品还没有达到目标。
