# CreatiBox Technical Architecture & Stack V0.1

## 1. Technical Goal

CreatiBox V0.1 is a browser-based, single-user, local-first creative world editor.

The architecture must support future expansion into:
- racing
- architecture
- story
- music
- animals
- cities
- multi-entity control
- multi-world projects

without rewriting the core runtime.

## 2. Locked V0.1 Stack

### Language
TypeScript

### UI Framework
Vue 3

### Build Tool
Vite

### 2D Renderer
PixiJS 8

### Visual Rule Editor
Blockly

Blockly is an editor only. It must NOT execute arbitrary JavaScript.

### Sound Playback
Howler.js

Use for:
- collision sounds
- engine sounds
- footsteps
- ambient audio
- UI sound effects

### Music Creation
Tone.js

Use for future Music Creator:
- notes
- rhythm
- tempo
- sequencing
- looping
- simple synthesis

### TTS
Web Speech API / SpeechSynthesis for the first browser-only implementation.

The system must enumerate available voices at runtime rather than assume a fixed voice list.

Prefer local voices when available.

TTS must be optional: if no suitable voice exists, text dialogue must still work.

### Persistence
- IndexedDB for local project storage
- JSON import/export
- later optional .creatibox extension

### Backend
None for V0.1.

## 3. Core Architecture

Editor Layer
→ World Model
→ Validation
→ Runtime
→ Media

Recommended module structure:

- editor/
  - world-editor
  - entity-editor
  - rule-editor
  - dialogue-editor
  - future music-editor
- model/
  - project
  - world
  - entity
  - group
  - rule
  - dialogue
- runtime/
  - renderer
  - state-machine
  - rule-engine
  - collision
  - lifecycle
  - group-control
  - dialogue-runtime
- media/
  - graphics
  - animation
  - sound
  - music
  - speech
- storage/
  - indexeddb
  - import-export

## 4. Game Is an Integrated Experience, Not the Base Architecture

CreatiBox must not be designed as "a racing game editor".

Game experiences emerge from combinations of:
- entities
- rules
- interaction
- media
- goals
- failure/success conditions
- worlds

The same engine should support:
- racing
- combat
- exploration
- simulation
- animal ecosystems
- city building
- story adventures

## 5. Single User, Multi-Entity Control

"Multi-person" in the CreatiBox model does NOT mean network multiplayer.

V0.1 and the near-term roadmap remain single-user.

One student may control:
- one character
- several characters
- a convoy
- a team
- an army
- a flock
- a herd
- multiple vehicles

This is modeled as Multi-Entity Control.

## 6. Entity Groups

A Group is a first-class world object containing entity references.

Examples:
- Convoy
- Team
- Army
- Herd
- Fleet

A Group can receive actions such as:
- MoveTo
- Follow
- Stop
- Spread
- Gather
- AttackTarget
- Retreat

Individual members may still have their own state.

## 7. Animation Strategy

Do not use generated video as the base form of entity movement.

Entity movement should be driven by:
- position
- rotation
- scale
- sprite/texture changes
- frame animation
- state animation

Video may later exist as a media object, but not as the world runtime's movement system.

## 8. Safety Boundary

The runtime executes only registered actions.

No:
- eval
- arbitrary JavaScript
- arbitrary network requests
- dynamic third-party script loading

All world behavior must be expressible as CreatiBox data and validated before execution.

## 9. Long-Term Extension Rule

New Creators should add:
- entity types
- capabilities
- rules
- media tools
- authoring UI

They should NOT create separate runtimes unless the medium fundamentally requires one.

Music may require a dedicated audio runtime but should still share the Project / World / Entity / Rule model where applicable.
