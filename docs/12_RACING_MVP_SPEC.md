# CreatiBox Racing MVP Specification

## 1. Goal

The first CreatiBox MVP should be a small but genuinely playable racing world.

The goal is not to build a complete racing game.

The goal is to prove that a student can:

1. create a small world,
2. place and configure entities,
3. control a player car,
4. race against computer-controlled cars,
5. see their abstract design represented by attractive visual assets.

---

## 2. Minimal World

The first racing world only needs a small set of entity types.

### Required

- Car
- Road
- Tree
- Obstacle
- Start
- Finish

### Optional later

- Barrier
- Sign
- Rock
- Lamp
- Building
- Water
- Spectator

The first MVP should remain intentionally small.

A believable world can emerge from only a few entity types when they are arranged well.

---

## 3. Car Roles

Every car must have a control role.

```text
Car
├── Player Controlled
└── Computer Controlled
```

### Player Controlled Car

Controlled by the student.

Default control scheme:

- Arrow keys: direction
- Space: accelerator

The default controls must always be visible to the student when Run mode begins.

The student may later modify the control mapping.

### Computer Controlled Car

Used as an opponent.

The computer should be able to:

- follow the road / race path,
- move toward the finish,
- avoid leaving the track where practical,
- respond to obstacles,
- have bounded speed differences.

The first AI does not need advanced racing strategy.

A simple waypoint/path-following controller is sufficient for V0.1.

---

## 4. Default Controls First

CreatiBox should provide useful defaults before asking the student to configure anything.

Principle:

> Create first. Modify only when needed.

For a new racing car, the platform should already know:

- how it moves,
- how fast it can move,
- which controls operate it,
- how much durability it has,
- what visual asset family it belongs to.

The student can change these later.

---

## 5. Creation Modes

Car creation continues to support:

### Default

Create a sensible base car immediately.

### Random

Create a bounded variation of the base car.

Possible randomized values:

- color family
- body style
- speed
- size
- wheel configuration
- durability
- opponent skill profile

### Guided

Ask the student to customize selected properties step by step.

The three modes all produce the same Car entity.

---

## 6. Racing Scene Construction

A minimal scene should be easy to build.

Example:

```text
Road
+ Player Car
+ 2 Computer Cars
+ Trees beside the road
+ A few obstacles
+ Start
+ Finish
= Small Racing World
```

The scene should not require dozens of object types.

The first classroom goal is to make a recognizable and playable world quickly.

---

## 7. Opponent AI

The first opponent system should be deterministic and understandable.

Recommended model:

```text
Race Path
↓
Waypoints
↓
Computer Car follows next waypoint
↓
Adjust steering
↓
Accelerate within speed limit
↓
Reach next waypoint
↓
Continue
```

Each computer car may have:

- maxSpeed
- acceleration
- steeringRate
- reactionDelay
- laneOffset

Random Mode may vary these values within safe ranges.

This produces visibly different opponents without requiring complex AI.

---

## 8. Visual Representation

The internal editor may use simple 2D geometry for authoring.

However, the final play experience should not remain visually limited to primitive rectangles.

CreatiBox should separate:

```text
Student Design
↓
Abstract Shape / Properties
↓
Visual Mapping
↓
Game Asset
```

Example:

```text
Student chooses:
- red
- sport body
- long / low
- 4 wheels

CreatiBox maps this to:
- red sports-car sprite family
- matching proportions / style
```

The student is designing the object concept.

The platform provides polished visual assets.

---

## 9. Asset Library Strategy

The platform should maintain curated asset families.

### Car assets

Possible families:

- classic
- sports
- rally
- futuristic
- compact
- heavy

Each family can contain multiple variants.

### Environment assets

- trees
- road surfaces
- barriers
- rocks
- signs
- grass
- finish gates

Assets should be visually consistent.

For V0.1, assets may be pre-generated and bundled with the app.

No external image search or arbitrary web asset loading is required.

---

## 10. Mapping Rules

Visual mapping should be data-driven.

Example:

```text
carShape = sport
colorFamily = red
sizeRatio = long-low
↓
assetFamily = sports-car
variant = red-02
```

If no exact asset match exists, CreatiBox should choose the nearest valid asset rather than fail.

The student's logical properties remain authoritative even if the visual representation is approximate.

---

## 11. Editor vs Play View

### Editor

May show:

- simplified geometry
- bounding boxes
- paths
- waypoints
- selection handles
- object properties

### Play

Should prioritize:

- polished car sprites
- road appearance
- environment assets
- readable motion
- opponent cars
- clear start / finish

The same world data powers both views.

---

## 12. V0.1 Racing Acceptance Criteria

The first Racing MVP is successful when a student can:

1. create a small road scene,
2. add trees and a few obstacles,
3. create a player car,
4. see the default controls clearly,
5. change the controls if desired,
6. create at least one computer-controlled opponent,
7. press Run,
8. drive the player car,
9. race against computer cars,
10. reach the finish,
11. stop and return to Edit mode,
12. save and reopen the project.

---

## 13. Non-Goals for First Racing MVP

Do not require yet:

- network multiplayer
- realistic vehicle physics
- advanced racing AI
- damage animation systems
- large open maps
- 3D rendering
- procedural cities
- cloud accounts
- online asset marketplace

The first objective is a small, playable, editable world.
