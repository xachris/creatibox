# CreatiBox Dialogue, Script & TTS System V0.1

## 1. Purpose

CreatiBox must support narrative creation even without AI.

Students should be able to write:
- character dialogue
- narration
- scene text
- instructions
- story scripts
- branching choices

Text can optionally be spoken through TTS.

This gives students a creative space for writing, storytelling and drama inside the same world system.

## 2. Dialogue Is a World Capability

Dialogue is not a separate chat product.

It is an Action / Event capability inside a World.

Example:

WHEN Player reaches Gate
THEN Character A says "We finally made it."

## 3. Dialogue Types

V0.1 data model should allow:

### Character Dialogue
A named entity speaks.

### Narration
No speaking entity is required.

### System Text
Instructions, goals or status text.

### Choice
A player selects from predefined options.

Future:
### Branching Dialogue
Different choices trigger different rules or states.

## 4. Dialogue Node

Recommended fields:

- id
- speakerEntityId
- text
- mode
- ttsEnabled
- voicePreference
- rate
- pitch
- next
- choices

## 5. TTS

V0.1 uses browser SpeechSynthesis.

The application should:
- enumerate voices available on the device
- allow choosing language/voice when available
- support rate and pitch
- gracefully fall back to text-only display

The project should not require cloud TTS.

A voice selected on one computer may not exist on another computer, so projects should store a preference/fallback strategy rather than depend on a device-specific voice ID.

## 6. Dialogue Editor

Students need a simple editor, not a screenplay application.

Recommended first UI:

Speaker: [Character A]
Text: [________________________]
Voice: [Auto / voice]
TTS: [On/Off]
Next: [Dialogue 2]

Students should be able to add multiple lines and reorder them.

## 7. Script Sequence

Dialogue can be mixed with world actions.

Example:

1. Narration: "The race begins at sunset."
2. Character A says: "Ready?"
3. Character B says: "Let's go."
4. Start music
5. Move Car A
6. Move Car B
7. Show text: "GO!"

This means CreatiBox supports a simple script timeline without needing AI.

## 8. Dialogue as Trigger and Effect

Dialogue can be triggered by:
- entering an area
- touching an object
- time
- previous dialogue
- world state
- user choice

Dialogue can cause:
- state changes
- movement
- object creation
- world transition
- score changes
- new dialogue

## 9. Branching Choices

Future-ready structure:

Character: "Which road should we take?"

Choice A: Forest
→ worldState.route = forest

Choice B: City
→ worldState.route = city

Then later rules can depend on that state.

## 10. Creative Value

The dialogue system should make it possible for students to create:
- mini plays
- interactive stories
- narrated races
- role-play scenes
- adventure games
- comic-style sequences
- historical simulations
- animal stories
- city stories

CreatiBox therefore supports both physical causality and narrative causality.

## 11. Relationship to AI

AI is not required.

Students manually author the dialogue.

If AI is added later, it may suggest or rewrite dialogue, but the saved project must remain deterministic and editable.

## 12. V0.1 Boundary

For the first playable release:
- dialogue data structure should exist
- text rendering can be basic
- TTS can be basic
- branching dialogue can wait

The first racing classroom prototype does not require a full story editor before testing.
