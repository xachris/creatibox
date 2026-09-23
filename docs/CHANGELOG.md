# CreatiBox Changelog

## 2026-09-23

### Product direction reset

项目从原先较复杂的“学校级科创平台”收缩为课堂优先的单机网页创作工具。

### Removed from current MVP

- 账号系统
- 班级系统
- 教师后台
- 学生监控
- 后端数据库
- 云同步
- AI
- PDF 报告

### Core model established

CreatiBox 的核心世界语言确定为：

```text
Entity → State → Action → Interaction → Transition
```

实体应具有：

- 属性
- 状态
- 动作
- 关系
- 生命周期

### MVP direction

第一版以 Racing Creator 验证底层世界引擎。

赛车只是第一个 Creator，底层不得写死为赛车系统。

### Long-term direction

后续 Creator 可以包括：

- Music
- Architecture
- Story
- Animals
- Plants
- Machines
- Interactive Levels

这些 Creator 最终应能够组合进入同一个世界。


### Multi-entity and narrative model

Clarified that "multi-person" means single-user multi-entity control, not network multiplayer.

Added:
- Entity Groups such as convoy, army, herd and team
- Dialogue and narration as world actions
- manually authored scripts
- optional browser TTS
- text-only fallback when TTS is unavailable

### Technical stack locked for V0.1

- TypeScript
- Vue 3
- Vite
- PixiJS 8
- Blockly
- IndexedDB + JSON
- Howler.js for sound playback
- Tone.js reserved for music creation
- Web Speech API SpeechSynthesis for initial TTS


### Development execution mode

Recorded three implementation modes and selected Mode C for the current MVP: Chat + GitHub + GitHub Actions.


### MVP implementation started

Initial executable MVP foundation added:

- Vue 3 + TypeScript + Vite
- PixiJS world canvas
- racing entities
- edit/run separation
- keyboard driving
- collision and damage rules
- IndexedDB autosave
- .creatibox import/export
- Undo/Redo
- Vitest rule tests
- GitHub Actions CI

First full CI validation passed: install, typecheck, test and production build.


### Creation model refined

Object creation now supports three entry modes:

- Default: create a sensible base object immediately
- Random: generate bounded variations
- Guided: ask the student to define selected properties step by step

The three modes share the same Entity model and remain fully editable after creation.


### Racing MVP clarified

The first playable world is now defined around:

- road, cars, trees and a small number of obstacles
- player-controlled and computer-controlled car roles
- useful default controls with editable mappings
- simple waypoint-based opponent AI
- separation between abstract authoring geometry and polished visual assets
- curated local asset families for cars and environment
