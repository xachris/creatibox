# CreatiBox Creation Modes

## 1. Purpose

CreatiBox should make creation fast without removing creative freedom.

Students should not be forced to define every property before an object can exist.

The platform therefore supports three creation modes that all produce the same underlying Entity structure.

---

## 2. Default Mode

Default Mode creates a sensible base object immediately.

Example:

```text
Create Car
→ basic car appears
→ student edits only what they care about
```

The platform supplies:

- default size
- default color
- default controls
- default speed
- default durability
- default appearance

This is the fastest path from intention to visible result.

Principle:

> Creation first, customization second.

---

## 3. Random Mode

Random Mode generates an object using bounded random values.

Example car attributes may vary within safe ranges:

- color
- width
- height
- maximum speed
- wheel count
- body style

Repeated creation should produce visibly different results.

Example:

```text
Create Car × 6
→ six different cars
```

Random Mode must remain bounded by valid capability ranges.

It must not generate values that break the runtime.

---

## 4. Guided Mode

Guided Mode asks the student a short sequence of human-readable questions.

Example car flow:

1. Name
2. Controls
3. Speed
4. Color / body style
5. Size / wheels
6. Create

Guided Mode is for deliberate design rather than fast placement.

---

## 5. Shared Data Model

The three modes are not separate object systems.

They differ only in how the initial properties are chosen:

```text
Default Mode
  ↓ predefined defaults

Random Mode
  ↓ bounded random generator

Guided Mode
  ↓ student choices

All three
  ↓
Entity
```

After creation, every object can be edited using the same property panel and world tools.

---

## 6. Product Principle

Students should be able to decide how much effort they want to spend at the moment of creation.

Sometimes they want:

> "Give me a car now."

Sometimes:

> "Surprise me."

Sometimes:

> "I want to design this carefully."

CreatiBox must support all three without forcing one workflow.

---

## 7. Future Extension

The same model should apply to future entities.

### Human

Default:
- standard character

Random:
- randomized appearance and basic properties

Guided:
- name, appearance, movement, abilities

### Animal

Default:
- standard species instance

Random:
- bounded size, speed, appearance

Guided:
- species, movement, needs, behavior

### Building

Default:
- basic building

Random:
- bounded dimensions, windows, doors, colors

Guided:
- type, size, floors, entrances, appearance

### World

Eventually the same pattern may apply to larger structures:

- default scene
- randomized scene
- guided scene creation

---

## 8. V0.1 Decision

Racing Creator uses all three creation modes for Car.

Other V0.1 entities may initially use Default Mode only.

The creation-mode system should expand to more entities after the first classroom validation.
