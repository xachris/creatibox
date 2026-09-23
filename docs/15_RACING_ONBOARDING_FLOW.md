# CreatiBox Racing Onboarding Flow V0.1

## 1. Problem

The current MVP exposes the editor too early.

Even when racing runtime features already exist, the first impression is still:

> "This is an editor."

The desired first impression is:

> "I can choose something and play immediately."

Therefore the product needs an upper-level catalog and a guided launch flow before the editor.

---

## 2. Top-Level Catalog

CreatiBox opens to a simple activity catalog.

For V0.1 only one activity is available:

### Racing Game

Future catalog items may include:

- Story
- Animals
- Architecture
- Music
- Machines

Unavailable items must not distract the V0.1 user.

The first screen should make Racing Game the obvious primary action.

---

## 3. Racing Launch Flow

The racing flow is sequential.

```text
CreatiBox Home
↓
Choose Racing Game
↓
Choose Car
↓
Choose Driver
↓
Choose Track
↓
Choose Opponents
↓
Choose Motion / Sound
↓
Review
↓
Start Race
```

The user should never need to understand the editor before the first race.

---

## 4. Step 1 — Choose Car

Keep the choices intentionally small.

Body:

- Classic
- Sport
- Boxy

Color:

- Red
- Blue
- Yellow

The selected combination should be visually previewed.

---

## 5. Step 2 — Choose Driver

V0.1 uses lightweight driver presets.

Purpose:

- make the race feel personal
- prepare the architecture for future character systems

Initial presets:

- Driver A
- Driver B
- Driver C

The driver preset is saved with the player car.

Driver presets do not need advanced character simulation in V0.1.

---

## 6. Step 3 — Choose Track

Track choices:

- Straight
- Gentle Curve
- Circuit

Length:

- 1 km
- 2 km

Track preview should communicate the general shape.

---

## 7. Step 4 — Choose Opponents

Opponent count:

- 0
- 1
- 2
- 3

Difficulty:

- Easy
- Normal
- Fast

Computer cars use waypoint AI.

---

## 8. Step 5 — Feel

Motion:

- Clean
- Dynamic

Sound:

- Light
- Sport
- Electric

These remain presets.

The user should not configure raw engine parameters here.

---

## 9. Review Screen

Before launch, show a compact summary:

```text
Sport / Red
Driver B
Gentle Curve / 1 km
2 opponents / Normal
Dynamic / Sport sound
```

Primary action:

> Start Race

Secondary action:

> Edit Details

---

## 10. Launch Behavior

Start Race must:

1. generate the full race world,
2. enter Run mode immediately,
3. focus the player car,
4. show driving controls,
5. start computer opponents,
6. begin camera follow.

The user should not have to press Run again.

---

## 11. Editor Relationship

The editor remains important but becomes a secondary layer.

After stopping a race:

```text
Stop Race
↓
Return to Editor
↓
Modify world
↓
Run again
```

The product therefore supports both:

- instant play
- deeper creation

without forcing creation first.

---

## 12. Home Screen Actions

V0.1 home screen:

Primary:
- Racing Game

Secondary:
- Continue Last Project (when autosave exists)

Utilities:
- Import Project

Do not place the full object editor on the home screen.

---

## 13. Acceptance Criteria

The onboarding succeeds when a first-time user can:

1. open CreatiBox,
2. immediately identify Racing Game,
3. choose a car,
4. choose a driver,
5. choose a track,
6. choose opponents,
7. start the race,
8. drive within one minute,
9. stop and reach the editor,
10. return home and start another race.

---

## 14. Product Principle

> Play first. Create deeper when the user wants to.

The editor is the engine behind the experience, not the first thing the student must understand.
