# CreatiBox Racing MVP Implementation Plan V0.1

## 1. Objective

This implementation phase turns the current editor prototype into a small but playable racing creator.

The target experience is:

```text
Choose a few presets
→ Generate a racing world
→ Press Run
→ Drive immediately
→ Race against computer cars
→ Stop
→ Modify
→ Run again
```

The implementation must follow the existing product specifications, especially:

- Racing MVP Specification
- Preset Composition System
- Default / Random / Guided Creation Modes
- Edit / Run separation
- Local-first save model

---

## 2. Scope for This Phase

Implement the following in order.

### Phase A — World Size and Track Presets

Add three track presets:

1. Straight
2. Gentle Curve
3. Simple Circuit

Add track length options:

- 1 km
- 2 km

The logical world must be larger than the visible screen.

The camera follows the player car during Run mode.

### Phase B — Racing World Entities

Add or formalize:

- Player Car
- Computer Car
- Road
- Tree
- Obstacle
- Start
- Finish
- Waypoint

Waypoints are runtime/editor helper entities and do not need to be visually prominent in Play mode.

### Phase C — Car Roles

Every car must have:

```text
controlRole:
- player
- computer
```

Player cars use a control preset.

Computer cars use waypoint following.

### Phase D — Default Controls

Default player controls:

- Arrow Left / Arrow Right: steer
- Arrow Up / Arrow Down: forward / brake-reverse
- Space: accelerator / primary throttle action

The active controls must be shown when Run mode starts.

Controls remain editable later.

### Phase E — Opponent AI

V0.1 computer opponents use simple waypoint following.

Each opponent has a profile:

- Easy
- Normal
- Fast

Profiles vary:

- maxSpeed
- steering response
- acceleration
- path offset

No advanced pathfinding is required.

### Phase F — One-Click Race Composer

Add a simple race creation panel using presets:

```text
Track
[ Straight ] [ Curve ] [ Circuit ]

Length
[ 1 km ] [ 2 km ]

Car
[ Classic ] [ Sport ] [ Boxy ]

Color
[ Red ] [ Blue ] [ Yellow ]

Motion
[ Clean ] [ Dynamic ]

Sound
[ Light ] [ Sport ] [ Electric ]

Opponents
[ 0 ] [ 1 ] [ 2 ] [ 3 ]

Difficulty
[ Easy ] [ Normal ] [ Fast ]

[ Create Race ]
```

The student should be able to generate a playable world without editing raw properties.

### Phase G — Motion Presets

Add two visual motion presets:

- Clean
- Dynamic

Initial effects may use:

- wheel movement cues
- body vibration
- speed lines
- stronger turn response

The implementation should remain lightweight.

### Phase H — Sound Presets

Add three sound-family placeholders:

- Light
- Sport
- Electric

V0.1 may begin with simple synthesized or bundled local sounds.

Sound must react to at least:

- idle
- acceleration / movement
- collision

No cloud audio dependency.

### Phase I — Visual Asset Mapping

Keep logical car properties separate from visual assets.

Initial mapping:

```text
Car body preset
+ Color preset
→ Visual asset / renderer style
```

V0.1 may use polished vector-like PixiJS rendering first.

Pre-generated sprite assets can replace these renderers without changing the Entity model.

---

## 3. Data Model Changes

Car gains:

- controlRole
- controlPreset
- motionPreset
- soundPreset
- opponentProfile
- visualPreset

World gains:

- trackPreset
- trackLength
- waypoints
- worldBounds

Tree becomes a first-class EntityKind.

Waypoint becomes a helper type or dedicated world structure.

---

## 4. Camera Model

Editor mode:

- camera may show the full or navigable map
- objects remain directly editable

Run mode:

```text
Player position
→ Camera target
→ View follows player
```

The world is not constrained to the visible browser rectangle.

---

## 5. Track Representation

V0.1 tracks are generated from preset data.

Recommended representation:

```text
TrackPreset
├── world bounds
├── road segments
├── waypoints
├── start
├── finish
├── tree placements
└── obstacle placements
```

This allows the same preset to create both:

- visible road geometry
- AI navigation path

---

## 6. World Generation Rule

Race creation should be deterministic from chosen presets except where Random Mode is explicitly used.

Example:

```text
Track = Gentle Curve
Length = 1 km
Car = Sport
Color = Red
Opponents = 2
Difficulty = Normal

→ Generate complete world
```

The user can edit the generated world afterward.

---

## 7. V0.1 Visual Rule

Do not block the MVP on final artwork.

Use this progression:

```text
Stage 1
Polished PixiJS vector rendering

Stage 2
Curated local sprite assets

Stage 3
Expanded asset families
```

The Entity and preset systems must not depend on a specific artwork implementation.

---

## 8. Acceptance Criteria

This phase is complete when the online build allows a user to:

1. create a race using preset cards,
2. generate a world larger than the screen,
3. see road, trees and obstacles,
4. have one player car,
5. optionally have 1–3 computer cars,
6. press Run,
7. see the active control hint,
8. drive using the default controls,
9. have the camera follow the player,
10. see computer cars move toward the finish,
11. stop and return to Edit mode,
12. save and reopen the project.

---

## 9. Explicit Non-Goals

Do not implement yet:

- network multiplayer
- realistic tire physics
- realistic engine simulation
- 3D
- advanced collision deformation
- cloud saves
- user accounts
- procedural cities
- advanced racing line optimization

---

## 10. Development Order

Implementation order:

```text
Data model
→ Track presets
→ World generator
→ Large world + camera
→ Player controls
→ Computer waypoint AI
→ Race composer UI
→ Motion presets
→ Sound presets
→ Visual polish
→ Save/load verification
→ Browser playtest
```

Every meaningful implementation step must continue to pass GitHub Actions:

```text
install
→ typecheck
→ test
→ build
```

## 11. Playable Runtime Closure (2026-09-23)

- `WorldCanvas.initializeRuntime()` is the single entry for initial Run mount, Edit → Run and Restart. It creates a fresh `WorldRuntime` from authoring JSON, clears input/contact/progress state, and focuses/follows the player after Pixi initialization.
- Runtime logic now lives under `src/runtime/`, using the existing Entity / World / Rule model. Vue/Pixi present the result; they do not own vehicle simulation rules.
- Lifecycle: three-second countdown → racing → player Finished/Broken → result. All cars remain stationary before GO. CPU finishing does not stop the player's race. The result freezes the scene and offers Restart / Edit / Home.
- Controls: arrows steer/accelerate/brake; Space accelerates more strongly. Down is brake-only in this MVP. Input is cleared on blur, hidden tab, mode change and restart; edit inputs retain normal keyboard behavior.
- Cars visit ordered checkpoints before the finish interaction is eligible. This prevents instant completion on the circuit's shared start/finish. Finish transitions still require the world's `reach → finish` rule.
- Rotated rectangles use a separating-axis collision test. Substeps limit missed collisions; AI slows for sharp turns. Generated obstacles sit beside the outgoing road instead of blocking the default curve AI route.
- Missing player, invalid/missing trackPath, or missing finish/rule produces an actionable visible error. Renderer failure also has a visible error.
- JSON cloning is shared by snapshots, runtime and autosave, avoiding structuredClone failures on nested Vue proxies. Runtime state never overwrites authoring state.

### Regression coverage

`npm test` covers initial Run mount, countdown 3/2/1/GO, edit/run/restart, camera movement, key clearing, authoring isolation, finish/result state, errors, controls and all 18 track × length × CPU-profile combinations (three opponents each).

For browser held-key verification, `tests/drive.html` is a dev-only manual QA fixture. It embeds the real app and dispatches timed keyboard events to the actual canvas; it does not read or mutate runtime state. Open it with the dev server. It is not a production build entry. Native keyboard play can also be tested directly at `/`.

### Current boundaries

- Single lap, ordered waypoint gates; no lap selection or advanced ranking/tie resolution.
- Simple steering and collision response; no reverse, realistic tire physics or advanced AI overtaking.
- Motion/driver/sound preset choices remain saved. Engine audio is still a preset placeholder; this closure does not add audio synthesis.
- Track length labels use the existing logical-world scale, not physically calibrated kilometer distances.
