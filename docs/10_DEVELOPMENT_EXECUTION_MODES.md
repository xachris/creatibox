# CreatiBox Development Execution Modes

## 1. Purpose

This document records the three development execution modes considered for CreatiBox and the decision made for the current MVP.

The goal is to preserve the reasoning behind how the project is developed, so future work does not have to reconstruct the decision from conversation history.

---

## 2. Mode A: Chat + GitHub

### Description

Development is performed directly from Chat by creating and modifying files in the GitHub repository.

Chat is used for:
- product decisions
- architecture
- code generation
- repository edits
- documentation
- code review

### Strengths

- Minimal context switching
- Product discussion and implementation stay close together
- Easy to preserve decisions in the repository
- Suitable for relatively small MVPs

### Limitations

Chat is not a full interactive local development environment.

It cannot reliably replace:
- continuous local command execution
- browser interaction testing
- visual drag/drop verification
- console-based debugging loops

Code may be written correctly but still require later runtime verification.

### Best fit

- Small prototypes
- Documentation-heavy projects
- Early architecture work
- Repository scaffolding
- Static code changes

---

## 3. Mode B: Chat Design + Work Development

### Description

Chat is used for product thinking, architecture and review.

Work mode is used for:
- repository inspection
- package installation
- command execution
- browser testing
- iterative debugging
- larger multi-file changes

### Strengths

- Strongest execution environment
- Best for continuous build-test-fix loops
- Better for browser-based UI debugging
- Lower risk of claiming code works before it is actually executed

### Limitations

- Requires switching modes
- Product discussion and execution may feel more separated
- Can use more execution resources for tasks that do not need them

### Best fit

- Larger implementation phases
- Complex UI behavior
- Runtime debugging
- Integration work
- Release preparation

---

## 4. Mode C: Chat + GitHub + GitHub Actions

### Description

Development is performed directly from Chat into the GitHub repository.

GitHub Actions automatically validates commits.

The initial CI pipeline should run:

```text
checkout
↓
install dependencies
↓
type check
↓
build
↓
tests
```

This creates an automated safety net without requiring Work mode for every implementation step.

### Strengths

- Keeps development inside Chat
- Every important commit can be automatically verified
- Build failures become visible immediately in GitHub
- Creates repeatable validation
- Useful for experimenting with AI-assisted repository development

### Limitations

GitHub Actions cannot fully replace interactive browser testing.

It can detect:
- install failures
- TypeScript errors
- build failures
- automated test failures

It cannot fully validate:
- drag/drop feel
- visual layout quality
- pointer interaction correctness
- classroom usability
- audio experience

### Best fit

- Current CreatiBox MVP
- CI-driven early development
- Projects where repository correctness matters before visual polishing

---

## 5. Current Decision

For the first CreatiBox MVP, use:

> **Mode C: Chat + GitHub + GitHub Actions**

The purpose is to test whether the MVP can be developed directly through Chat while GitHub Actions provides automated technical validation.

Current workflow:

```text
Chat
↓
Edit GitHub repository
↓
GitHub commit
↓
GitHub Actions
↓
Install / Type Check / Build / Test
↓
Pass or Fail
↓
Fix in Chat if needed
```

---

## 6. Escalation Rule

Mode C is not a permanent restriction.

Switch to Mode B when any of the following become dominant:

- repeated failures that require runtime inspection
- visual editor bugs that cannot be understood from code alone
- PixiJS interaction problems
- drag/drop coordinate issues
- browser-only errors
- audio/TTS browser compatibility issues
- integration problems that require continuous local testing

This avoids forcing Chat-only development beyond the point where it remains efficient.

---

## 7. Validation Levels

CreatiBox development should distinguish three validation levels.

### Level 1: Static Validation

Performed by:
- TypeScript
- linting
- schema checks

### Level 2: Automated Runtime Validation

Performed by:
- unit tests
- integration tests
- GitHub Actions
- production build

### Level 3: Human Interaction Validation

Performed later through:
- browser use
- student testing
- classroom observation

GitHub Actions provides Levels 1 and 2.

It does not replace Level 3.

---

## 8. Current MVP Development Rule

Until there is a strong reason to escalate:

1. Product decisions remain in Chat and repository docs.
2. Code is written directly into GitHub.
3. Every meaningful implementation step must remain buildable.
4. GitHub Actions is used as the default automated validator.
5. Browser-specific behavior is explicitly marked as unverified until interactively tested.
6. Work mode remains available for later debugging or release hardening.

---

## 9. Decision Record

Date: 2026-09-23

Decision:

> CreatiBox MVP will initially be developed using Chat + GitHub + GitHub Actions.

Reason:

> This provides the fastest path from the current documented specification to a working repository while preserving automated technical validation and avoiding unnecessary mode switching during the earliest MVP stage.
