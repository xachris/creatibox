# CreatiBox Changelog

## 2026-09-24

### Unified Race collision and identity correction

- Enlarged Horse, Human and Sheep SAT bodies to contain their complete vector silhouettes, preventing visible body overlap while keeping rendering separate from physics.
- Added all 16 directed species-pair live-overlap separation checks; the full suite now contains 233 tests.
- Driver identity is now car-only. Human is the participant; Horse and Sheep race independently in phase one. Animal/Human flows skip the driver step, display a coherent five-step progress indicator, and migrate away accidental legacy `driverPreset` fields.
- Review now states that entity collision is enabled. Horse + Rider remains a later explicit composition model; no entity can ride a Human or Sheep.

### Unified Race phase one implemented

- Generalized the existing `WorldRuntime` from car-only filtering to `RaceCapability` participants. Car, Horse, Human and Sheep now share countdown, player controls, waypoint AI, camera, collision, finish, ranking and restart.
- Added idempotent legacy-car normalization, capability rules, stable progress ranking, mixed-size start grids and persistence of species, movement style, controls, profiles, visuals and audio settings.
- Extended the existing race creation flow with one player species and 0–3 independently selected CPU species; car-only shape/color/audio choices stay hidden for animals.
- Added PixiJS vector Horse, Human and Sheep renderers with speed/distance-driven vehicle, runner and hoofed motion, plus player engine, hoofbeat and footstep routing through the existing AudioDirector.
- Automated validation: 214 tests, including 72 CPU environment/species cases, 72 mixed player-input simulations, same-species and directed pair races, compatibility, ranking, collision, persistence and audio lifecycle coverage. Typecheck and production build pass.
- Browser validation: completed Horse + Car/Human/Sheep and Human + Horse/Sheep/Car from Home through result on the actual app. Both players finished; restart, HUD, type-specific review and hidden car controls were observed.
- Kept the existing Railway project/service/domain; no AnimalWorld runtime, service or homepage entry was added.

### Animal World × Unified Race planning

- Added `docs/18_ANIMAL_WORLD_UNIFIED_RACE_PLAN.md`: evolve Racing into Unified Race / Race World, with Car, Horse, Human and Sheep sharing RaceParticipant / RaceCapability, controls, waypoint AI, camera, finish, ranking and restart.
- Defined vehicle / runner / hoofed movement styles, game-only default speeds (260 / 205 / 125 / 95), PixiJS vector visuals, and engine / hoofbeat / footstep extensions to the existing racing audio director.
- Specified first-phase scope, model / rules / runtime refactoring, legacy-project compatibility, test matrix and success criteria. Horse + Rider is phase two; Wander / Follow / Flee / Eat / Rest remain later Animal World work.
- Linked from README. Planning only — no implementation, runtime, UI, assets, dependencies, version or deployment changes in this commit.

## 2026-09-23

### V0.1.2 arcade collision physics (no overlap)

- Cars / walls / obstacles no longer interpenetrate: SAT manifold + multi-pass separation.
- Car–car hits shove both vehicles apart and damp the striker; hard hits apply light damage.
- Walls / obstacles bounce and scrape-damp; broken wrecks stay solid but can be shoved clear; finished cars ghost the finish line.
- Soft grind no longer melts durability (impact cooldown + closing-speed gate). Spawn grid spaced so the grid never starts stacked.
- Review fix: collision SFX now consumes a dedicated one-step impact event, so iterative separation cannot clear the sound trigger in the same frame.
- Removed the unrestricted Vite development-host setting; tunnel hosts must be explicitly allowed when needed.
- Package version bumped to `0.1.2`.


### V0.1.1 smoother racing SFX timbre

- Rebuilt synth engine: soft-saw / triangle / sine layers, filtered noise, seamless loop crossfades, soft limiting.
- Softened countdown / finish / brake / collision / UI cues (less square-wave harshness).
- Package version bumped to `0.1.1`.


### Racing audio and SFX playback (Phase A–C)

- Added UI feedback SFX (`uiSelect` / `uiStep` / `uiConfirm`) for home catalog, racing launch choices, wizard next/back, and start-race confirm.

- Fixed silent preview: missing session volume key was parsed as `0` via `Number(null)`, muting Howler globally; default is now 0.7. Added WAV format hints, louder engine levels, and an immediate countdown tick on race start.

- Added Howler-based `raceAudio` director with synthesized local WAV banks (no cloud assets).
- Ceremony: countdown ticks, GO, win / place / broken finish fanfares.
- Player engine: idle + move loops shaped by speed / throttle / brake; Light / Sport / Electric families differ in pitch and texture.
- Collision one-shots with cooldown; classroom mute toggle on the race HUD (session-persisted).
- Unlock on Start Race / Run click to satisfy browser autoplay rules.
- Tests: 6 director unit tests plus runtime/component coverage; WorldCanvas keeps mute control in run mode.


### Racing audio / SFX system design

- Added `docs/17_RACING_AUDIO_SFX_DESIGN.md`: event map for countdown/GO, engine idle–accel–cruise–coast, brake, collision, win/place/broken; layered architecture; Light/Sport/Electric family plan; Howler-based `AudioDirector` hooks; phased implementation A→D.
- Design only — no audio library, assets, or runtime playback code in this change. Existing `soundPreset` remains the student-facing family choice once Phase A+ lands.
- Linked from README.

### Cursor agent handover work log

- Established `docs/16_CURSOR_AGENT_WORK_LOG.md` as the ongoing Cursor Cloud Agent work journal after taking over from ChatGPT-side GitHub development.
- Document captures the handover baseline (`main` @ `912a198`), recording rules for every future session, known boundaries, and a reverse-chronological session log.
- Linked from README; product change summaries continue to live in this changelog — the work log covers process and handoff continuity.

### Racing direct-start and complete race loop

- Fixed both launch blockers: structuredClone on Vue proxies (including the pre-launch snapshot and autosave), and missing Runtime initialization on initial Run mount.
- Unified run/restart initialization; added 3 → 2 → 1 → GO, input focus/cleanup, default arrows + stronger Space throttle, player camera follow, race progress/results and Restart / Edit / Home actions.
- Extracted simulation into the shared-model WorldRuntime; fresh authoring copy for every run, bounded substeps, waypoint-gated finish rules and rotated rectangle collisions. Circuits no longer finish at spawn.
- Fixed CPU turning and curve preset obstacle placement. All three CPU cars finish every generated track/length/difficulty combination in regression tests.
- Added explicit missing-player/path/finish errors; kept the six-step onboarding and saved driver/motion/sound selections. Play mode prioritizes the race canvas; Home import now opens the editor and autosave enables Continue.
- Added dependency lockfile, component and simulation regression tests, and a dev-only browser held-key fixture (`tests/drive.html`).
- Local validation: npm install, typecheck, 31 tests and production build pass. Browser verified the complete home → review → countdown flow, player/CPU movement, scrolling camera, finish/result and fresh restart. Held-key checks use timed DOM keyboard events against the real app via the dev-only fixture.
- Known boundaries: brake-only Down; simple single-lap waypoint AI/physics; sound families remain saved placeholders; no classroom usability claim. npm audit reports two moderate development-only Vitest/mocker advisories; no production dependency advisory was reported. A test-framework major upgrade is outside this runtime fix.


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


### Preset composition direction

Racing creation is further simplified into curated preset composition:

- three track presets
- three initial car appearance families
- three initial colors
- two motion presets
- three sound families
- simple opponent presets
- large scrolling world with camera follow planned

The platform defines valid options; students combine them.
