# CreatiBox Changelog

## 2026-09-25

### First-Person 500/1,000 Entity WebGL pressure gate

- Added a development-only `?experiment=first-person-pressure&entities=500|1000` fixture that feeds ordinary Tree / Wall / Obstacle Entities through the production FirstPersonRenderer. It does not add a second Runtime, product navigation entry or saved project mode.
- Added fixture coverage for exact entity counts, stable IDs, the three static kinds, one authoritative player and a deterministic straight display path.
- Browser GPU evidence at standard tier: 500 static Entities held 120 fps, 8 draw calls, 22,614 triangles and 16.1 ms initialization; 1,000 held 120 fps, 8 draw calls, 45,178 triangles and 12.0 ms initialization. Both samples reported all fixture scenery within display range.
- Exiting the 1,000-Entity fixture removed the First-Person canvas; console warning/error count was zero. Validation: 263 tests, typecheck and production build pass. No deployment.

### First-Person static scenery instancing

- Batched trees into shared trunk/crown `InstancedMesh` draws and walls/obstacles into a shared solid batch while retaining their original Entity IDs, positions, rotations, sizes and colors.
- Compacted only range-visible, camera-frustum-visible scenery into each frame's instance buffers. Empty/off-camera batches submit no draw call, so the normal circuit scene remains at 20 draw calls / 502 triangles instead of regressing to 23 calls.
- Kept scenery entities in the same project and WorldRuntime; instancing is display-only and does not change collision, durability, rules, culling distance or simulation tick rate.
- Validation: 261 tests, typecheck and production build pass. Browser QA recorded standard tier, 11.9 ms initialization, 13 range-visible entities, complete First-Person canvas cleanup after switching to Oblique and no console warning/error. No deployment.

### First-Person shared resources and road instancing

- Reused one unit box, cylinder and sphere geometry across procedural First-Person models, and cached state-aware Lambert materials by color instead of allocating and mutating a material per mesh.
- Batched all road slabs into one `InstancedMesh` and both edge-line sets into a second instance batch. Entity IDs, Runtime state, collision bodies and view switching remain unchanged.
- Added a browser-visible First-Person load measurement. Local browser QA recorded a 12.6 ms lazy-load/initialization sample, 20 draw calls / 502 triangles with 13 visible entities, complete canvas cleanup after switching to Oblique and no console warning/error.
- Validation: 260 tests, typecheck and production build pass. The shared Three lazy chunk remains above Vite's 500 kB warning threshold. No deployment.

### Oblique Horse V1 runtime art integration

- Replaced the Oblique horse's procedural vector drawing with the approved transparent Horse Brown V1 atlas while retaining the vector renderer as a load-failure fallback.
- Added four authored directions, mirrored left-facing variants, one idle frame and a distance-driven four-frame run loop. Sprite animation, mirroring, scale and bottom-center anchoring remain display-only.
- Kept Top-Down visuals and the shared Entity, collision body, waypoints, ranking and WorldRuntime unchanged. Top-Down / Oblique switching continues without rebuilding the race.
- Validation: 260 tests and the production build pass. Browser QA rendered the atlas in a live Horse circuit race, preserved Runtime generation 1 across Top-Down / Oblique switching and recorded no console errors. No deployment.

### First-Person Phase 7 visual and performance polish

- Replaced generic First-Person boxes with distinct procedural low-poly Car, Horse, Human and Sheep silhouettes plus tree, obstacle, wall and start/finish mappings. Each model remains one display group keyed by the original Entity ID.
- Added overlapping road segments and edge lines, and hid only the player's own display proxy in First-Person to prevent camera/body occlusion without changing its Runtime entity or collision body.
- Added standard/low quality selection with bounded DPR and display distance, plus display-only range culling. Runtime tick rate, logical entities and collision ranges remain unchanged.
- Added 500/1,000-entity pressure fixtures. Browser QA observed standard tier, 10/21 entities visible, 35 draw calls / 842 triangles, Runtime generation 1, complete WebGL canvas cleanup and no console warning/error.
- The procedural adapter is 2.45 kB gzip; the shared Three lazy chunk remains 129.51 kB gzip and retains the explicit Vite large-chunk warning. No deployment.

### Multi-View Phase 6 First-Person MVP

- Added a lazily loaded Three.js First-Person run view beside Top-Down and Oblique. All three read the same WorldRuntime; switching preserves elapsed time, participants, waypoints, finish order, input, audio and HUD.
- Added low-poly ground, segmented roads and display proxies for race participants and world objects. Entity IDs and 2D coordinates remain authoritative; no 3D physics, vertical movement or duplicate game rules were added.
- Added optional First-Person run preference compatibility, WebGL initialization fallback to Top-Down, explicit geometry/material/renderer cleanup and 50-switch resource coverage.
- Browser QA kept Runtime generation 1 while elapsed advanced 18.5 → 32.3 → 33.5 seconds across First-Person → Oblique → Top-Down. First-Person rendered 17 draw calls / 354 triangles; its canvas was removed after exit and console warning/error count was zero.
- First-Person remains run-only with simple untextured proxies. No deployment.

### First-Person architecture spike

- Added a restricted DDA grid-raycast experiment and documented why it is No-Go as the general renderer for freely positioned, rotated CreatiBox worlds.
- Added a development-only, dynamically loaded Three.js prototype at `?experiment=first-person`. It maps the existing 2D Race World into low-poly 3D while the same WorldRuntime remains authoritative for input, AI, collision, waypoints, finish and ranking.
- Chose Three.js as Conditional Go for a future Phase 6; Babylon.js remains a documented alternative. The experiment is hidden from product navigation and preferences.
- Browser evidence at 1280×720 / DPR 2: 120 fps, 17–19 draw calls, one canvas while active, zero experiment canvases after exit, and no console warning/error.
- Build evidence: the lazy experiment chunk is 524.10 kB / gzip 131.62 kB and triggers Vite's large-chunk warning. This dependency and device cost remains a Phase 6 gate.
- Validation: typecheck, production build and 250 tests pass, including a 900-tick identical Runtime trace while sampling Three transforms. No deployment.

## 2026-09-24

### Multi-View Phase 4 continuous view switching

- Added student-facing Top-Down / Oblique controls during Run. Switching replaces only the renderer and ViewState while preserving the same WorldRuntime, ticker, input state, audio lifecycle, elapsed time, waypoints and finish order.
- Added optional versioned project `view` preferences beside `world`; legacy projects remain view-free and default Top-Down. Autosave/import/export normalize unsupported modes, versions and invalid camera values without changing world data.
- Added a 50-switch continuity regression: one Runtime generation, one canvas, unchanged standings at the switch boundary and continued progress afterward.
- Browser QA switched a live race from 33.7 s Top-Down to Oblique and observed continued progress at 41.2 s with one Runtime/canvas; autosave + reload restored Oblique and produced no console warning/error.
- Validation: typecheck, production build and 247 tests pass. Edit remains Top-Down, First-Person remains hidden, and no deployment was performed.

### Multi-View Phase 3 Oblique polish

- Replaced sprite-center depth guesses with stable deepest-footprint sorting for rotated and differently sized entities; added conservative viewport culling that never removes logical entities from WorldRuntime.
- Split Oblique trees into shadow, root-anchored trunk and crown display segments under one Entity ID. Crowns become translucent only while visually occluding the player; display height, alpha and shadows do not affect physics.
- Preserved continuous projected heading and distance-driven gait, with automated coverage for eight distinct direction buckets, long-object footprint ordering, culling and a 1,000-entity CPU pressure set.
- Local browser QA on a 1280×678 canvas measured 120.5 median fps, 9.30 ms p95 frame interval and 0.54 ms average update/render cost in the current 21-entity mixed race; 5–8 entities were visible after culling and no console warning/error occurred.
- Validation: typecheck, production build and 244 tests pass. The 500-visible GPU pressure target and separate Chrome/Edge/Safari measurements remain unverified; Oblique editing remains disabled and Edit stays Top-Down.
- No WorldRuntime, physics, rules, entity schema, dependency/version, user view-switching or deployment change.

### Multi-View Phase 2 Oblique MVP

- Added a PixiJS fixed-heading Oblique renderer using the shared 2D world coordinates, with inverse ground projection, projected entity direction and a diamond-shaped world ground.
- Projected roads and all current Race World objects (Car, Horse, Human, Sheep, tree, wall, obstacle, start and finish); added simple grounding shadows without a 3D engine or new asset dependency.
- Added stable projected-foot-point depth ordering, floor-layer start/finish markers, projected participant camera follow, a 20% dead zone, time-based smoothing and bounded velocity look-ahead.
- Oblique is run-only and selected through the local development query `?view=oblique`; production and Edit remain Top-Down. Runtime view switching, persistence and Oblique editing remain later phases.
- Validation: typecheck, production build and 240 tests pass, including matching Top-Down / Oblique runtime progress. Browser QA ran a Horse mixed race with projected road, trees, racers, shadows, HUD and restart; no console errors.
- No WorldRuntime, physics, rules, entity schema, dependency/version or deployment change.

### Multi-View Phase 1 renderer abstraction

- Added display-only `ViewState`, `CameraController`, `IWorldRenderer` and a `TopDownRenderer` adapter while preserving the existing PixiJS top-down output and camera formula.
- Kept one authoritative `WorldRuntime` in `WorldCanvas`; renderer operations cannot initialize or advance simulation, own input/audio/HUD, or write Entity coordinates.
- Routed camera follow, camera reset and screen-to-world edit coordinates through the renderer boundary. Edit and Run keep separate Top-Down defaults; no view-switching UI or Oblique / First-Person renderer exists yet.
- Validation: typecheck, production build and 236 tests pass (233 existing regressions plus 3 renderer/camera boundary tests). Local browser QA covered launch, countdown, CPU progress, HUD, restart reset and return to Edit with no console errors.
- Phase 1 only; no project-file view persistence, dependency/version change or deployment.

### Multi-View / Multi-Renderer architecture and roadmap

- 设计阶段，仅文档，无代码实现。Added `docs/20_MULTI_VIEW_RENDERER_ARCHITECTURE.md` and `docs/21_MULTI_VIEW_DEVELOPMENT_ROADMAP.md`; linked both from README.
- Defined one authoritative World / Entity / Rule / WorldRuntime, renderer and camera boundaries, optional ViewState preferences, legacy Top-Down defaults, Oblique projection / foot-point depth sorting, assets, selection mapping and camera strategy.
- Planned gated Phase 0–6 delivery: unchanged Top-Down adapter first, PixiJS Oblique MVP / polish / continuous view switching next, then a conditional First-Person spike comparing limited raycast experiments with Three.js / Babylon.js renderers.
- Defined runtime equivalence and switching continuity tests, authoring isolation, browser QA and desktop performance budgets. These are future acceptance criteria, not completed implementation or measured performance.
- Documentation only: no runtime, UI, renderer, assets, dependencies, file-format implementation, version or deployment configuration changes; no deployment as part of this work.

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
