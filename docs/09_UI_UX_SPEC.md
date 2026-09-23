# CreatiBox UI / UX Specification V0.1

## 1. Design Goal

CreatiBox should feel like a familiar creation tool, not a programming IDE.

Primary inspirations:
- PowerPoint: select, move, resize, group, undo
- Canva: object library, templates, approachable visual editing
- Figma: canvas, layers, properties, reusable components
- Game editors: Edit / Play separation and world testing

The interface must remain simpler than professional tools.

Core rule:

> Simple things should be obvious; advanced things should be discoverable.

## 2. Main Layout

Recommended desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ CreatiBox   New  Open  Save  Undo Redo   ▶ Run  ■ Stop     │
├────────────┬───────────────────────────────────┬─────────────┤
│ Library    │                                   │ Properties  │
│            │                                   │             │
│ Objects    │            WORLD CANVAS           │ Position    │
│ Shapes     │                                   │ Size        │
│ Characters │                                   │ Color       │
│ Rules      │                                   │ State       │
│ Dialogue   │                                   │ Behavior    │
│            │                                   │             │
├────────────┴───────────────────────────────────┴─────────────┤
│ Worlds / Scene tabs / optional status bar                   │
└──────────────────────────────────────────────────────────────┘
```

## 3. Top Bar

Always-visible global actions:

- New
- Open
- Save
- Undo
- Redo
- Run
- Pause
- Stop / Reset
- Sound control

Run must be visually prominent.

Stop returns the user from Runtime State to the saved Authoring State.

## 4. Left Panel: Creation Library

The left panel answers:

> What do I want to add?

V0.1 categories:

### Objects
- Car
- Road
- Wall
- Obstacle
- Start
- Finish

### Shapes
- Rectangle
- Circle
- Line
- Polygon

### Future categories
- Characters
- Animals
- Plants
- Buildings
- Sound
- Dialogue
- Rules

Students drag items from the library onto the canvas.

Do not expose internal technical terms such as Entity Schema or Runtime.

## 5. Center: World Canvas

The canvas is the primary creative surface.

It must support familiar direct manipulation:

- click to select
- drag to move
- resize handles
- rotation handle
- delete
- duplicate
- copy / paste
- multi-select
- box select
- group / ungroup
- zoom
- pan

Selected objects should have a clear bounding box.

## 6. Right Panel: Properties

The right panel answers:

> What can I change about this thing?

Show only properties relevant to the selected object.

Example for Car:

### Appearance
- color
- size
- rotation

### Movement
- max speed
- acceleration
- turning

### Condition
- durability
- visible meter on/off

### Behavior
- editable rules
- available capabilities

Progressive disclosure is required.

Basic properties appear first.
Advanced settings remain collapsed by default.

## 7. Edit Mode vs Play Mode

### Edit Mode

The user is the author.

They can:
- create
- move
- delete
- configure
- group
- edit rules
- edit dialogue

### Play Mode

The world runs.

The user may control entities according to the project's rules.

Authoring controls should become unavailable or visually inactive.

Runtime changes must not overwrite Authoring State.

## 8. Object Creation

Students can build custom visual objects from simple geometry.

Workflow:

```text
Add shapes
→ resize / rotate / recolor
→ multi-select
→ group
→ Save as Custom Object
```

Example:

```text
Rectangle + Circle + Circle
→ Car
```

Custom objects should appear in a personal local object library within the project.

## 9. Layers and Hierarchy

A lightweight layer/object panel may be added after the first canvas works.

It should show relationships such as:

```text
Car
├── Body
├── Wheel Left
└── Wheel Right
```

Do not show a complex professional layer tree by default in the earliest prototype.

## 10. Rule Editing UX

Rules should read like natural sentences.

Prefer:

```text
WHEN [Car] touches [Wall]
THEN [Car] loses [20] durability
```

instead of exposing programming syntax.

Blockly may implement this visually, but its appearance should be redesigned to match CreatiBox.

Students should never need to understand:
- JavaScript
- functions
- variables
- class
- event loop

unless a later advanced mode intentionally introduces them.

## 11. Dialogue Editing UX

Dialogue should be accessible directly from a selected character or from a Dialogue section.

Simple form:

```text
Speaker: Alice
Text: [ We need to reach the bridge. ]
TTS: On
Voice: Auto
Next: Bob #2
```

Students can reorder dialogue lines.

A future timeline/script view can combine:
- dialogue
- narration
- sound
- music
- movement
- scene changes

## 12. Multi-Entity Control UX

Students can:

- select one entity
- Shift-select multiple entities
- box-select a group
- Group selected entities

Groups can be named:

- Convoy
- Team
- Army
- Herd

When a Group is selected, the property panel exposes group-level actions.

Individual entities retain their own states.

## 13. Undo / Redo

Undo / Redo is mandatory from the first usable editor version.

It should cover at minimum:

- add
- delete
- move
- resize
- rotate
- property changes
- group / ungroup
- rule edits

## 14. Save / Open

The interface should make project portability obvious.

### Save
- autosave to IndexedDB
- Export Project downloads a .creatibox file

### Open
- Open Recent (local browser projects)
- Import Project (.creatibox)

The user should not need to know that the internal format is JSON.

## 15. Student-Friendly Interaction Principles

### Immediate feedback
Every action should visibly change something.

### Low reading burden
Prefer icons + short labels over paragraphs.

### Few modal dialogs
Keep the user on the canvas.

### Progressive complexity
First view: simple.
Advanced behaviors: available when needed.

### Reversible actions
Students should feel safe experimenting.

### No dead ends
Every screen should make the next action obvious.

## 16. First 5-Minute Experience

A new student should be able to:

1. open CreatiBox
2. drag a car onto the canvas
3. place a road and finish point
4. press Run
5. see the car/world respond

No tutorial longer than a few short hints should be required.

## 17. 40-Minute Experience

The interface should support a natural progression:

### 0-5 min
Understand the canvas and create something.

### 5-15 min
Change appearance and layout.

### 15-25 min
Add rules and interactions.

### 25-35 min
Test, fail, undo, modify.

### 35-40 min
Save/export the project.

## 18. Visual Style

Avoid Scratch-like childlike styling.

Recommended:

- clean light interface
- neutral canvas/editor surfaces
- moderate rounded corners
- strong but restrained accent color
- clear icons
- readable typography
- generous spacing
- minimal decoration

The product should feel creative and modern rather than juvenile.

## 19. V0.1 UI Scope

Must have:

- top toolbar
- left object library
- center canvas
- right properties panel
- selection and transform handles
- drag/drop
- undo/redo
- run/stop
- save/open
- simple rule editing entry

Can wait:

- advanced layer tree
- timeline
- full script editor
- advanced animation editor
- theme customization
- touch/mobile layout

## 20. UX Acceptance Criteria

The V0.1 interface succeeds if a first-time student can:

- identify where to add an object
- place and move it without instruction
- change at least one property
- understand Run and Stop
- recover from a mistake using Undo
- save or export the project

The interface should feel like a creation tool first and a programming tool second.
