# CreatiBox Preset Composition System

## 1. Product Direction

CreatiBox should optimize for fast composition, not low-level configuration.

The platform provides a small curated set of valid choices.

The student combines them.

Core principle:

> Platform defines good options. Student creates combinations.

This is closer to music production, PowerPoint, Canva, and game level editors than to programming from scratch.

---

## 2. V0.1 Racing Composition Model

A playable racing world can be assembled from a few preset dimensions:

```text
Track Preset
+ Car Appearance Preset
+ Motion Preset
+ Sound Preset
+ Control Preset
+ Opponent Preset
= Playable Racing World
```

The number of choices should remain intentionally small.

---

## 3. Track Presets

V0.1 should begin with three track presets.

### Track A: Straight

Purpose:
- easiest to understand
- easiest to test
- suitable for speed comparison

Length options:
- 1 km
- 2 km

### Track B: Gentle Curve

Purpose:
- introduces steering
- still easy for beginners

Contains:
- long straight
- one or two wide bends

### Track C: Simple Circuit

Purpose:
- feels more like a real racing game
- introduces repeated turns

Contains:
- start / finish
- several broad turns
- short straight sections

The student should not draw the entire road from zero in the first MVP.

They select a track preset and optionally modify it later.

---

## 4. World Space

Track length should map to a larger virtual world than the visible screen.

The camera follows the player car.

Example:

```text
Visible screen
≈ a small window into the world

World
≈ 1 km or 2 km track
```

The player should feel that the car is travelling through space rather than moving inside one fixed classroom-sized rectangle.

---

## 5. Car Appearance Presets

Start with only three appearance choices.

Example:

### Appearance A
Classic

### Appearance B
Sport

### Appearance C
Heavy / Boxy

Each appearance can support a small color palette.

Initial colors:

- Red
- Blue
- Yellow

This yields:

```text
3 shapes × 3 colors = 9 visible car combinations
```

More combinations can be added later without changing the architecture.

---

## 6. Motion Presets

The visual difference between a stopped car and a moving car should be visible.

Start with only two motion presets.

### Motion A: Clean

- subtle wheel movement
- small body vibration
- light speed lines at higher speed

### Motion B: Dynamic

- stronger wheel motion
- stronger body response
- more visible speed effect
- slight skid / turn emphasis

These are presentation presets, not separate physics engines.

---

## 7. Sound Presets

Start with a small number of bundled sound families.

Example:

### Sound A: Light Engine
Suitable for compact / normal cars.

### Sound B: Sport Engine
More aggressive tone.

### Sound C: Electric
Cleaner motor sound.

Sound behavior should depend on state:

```text
Idle
→ idle sound

Accelerating
→ rising engine sound

Moving
→ continuous movement sound

Braking / turning
→ optional tire sound

Collision
→ collision sound
```

The student chooses a sound family, not individual audio implementation details.

---

## 8. Controls

Racing MVP should provide a useful default control preset.

Default:

```text
Arrow Left / Right
→ steer

Arrow Up / Down
→ forward / brake-reverse

Space
→ accelerator / boost-style primary action
```

The exact behavior may be refined during testing.

Controls remain editable.

The system must always display the active controls when Run mode begins.

---

## 9. Opponent Presets

Computer opponents should also use presets.

Start with three simple profiles:

### Easy
- lower max speed
- slower steering response

### Normal
- balanced speed and steering

### Fast
- higher speed
- stronger path following

The user chooses:

```text
Opponent count
+ Opponent profile
```

The system creates the cars automatically.

---

## 10. Composition UI

Instead of exposing dozens of properties, the first creation screen should offer a small set of cards.

Example:

```text
TRACK
[ Straight ] [ Curve ] [ Circuit ]

CAR
[ Classic ] [ Sport ] [ Boxy ]

COLOR
[ Red ] [ Blue ] [ Yellow ]

MOTION
[ Clean ] [ Dynamic ]

SOUND
[ Light ] [ Sport ] [ Electric ]

OPPONENTS
[ 0 ] [ 1 ] [ 2 ] [ 3 ]

DIFFICULTY
[ Easy ] [ Normal ] [ Fast ]

[ Create Race ]
```

This creates a playable scene immediately.

Advanced editing remains available afterward.

---

## 11. Default / Random / Guided Relationship

The existing three creation modes remain.

### Default

Uses the first or recommended preset in every category.

### Random

Randomly chooses among valid presets.

### Guided

Shows the preset cards and lets the student choose.

The system should prefer preset selection over raw numeric entry.

Raw numeric editing remains an advanced option.

---

## 12. Design Rule

For the first classroom version:

- fewer options are better
- options must be visually distinct
- every option must work
- every combination must remain valid
- no option should require explanation longer than a sentence

The MVP should feel like building with high-quality LEGO pieces.

---

## 13. Next Implementation Order

1. Track preset system
2. Large scrolling world + camera follow
3. Player control preset
4. Opponent role + waypoint AI
5. Car appearance preset mapping
6. Motion preset
7. Sound preset
8. One-click race creation screen
9. Save / reload all preset choices
10. Classroom playtest
