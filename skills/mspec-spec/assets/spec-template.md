# <Feature name>

**Status**: Draft | **Created**: <YYYY-MM-DD> | **Input**: "<user's feature description>"

## Actors
- **<Actor>** (primary | secondary): <who they are and what they can do here>

## User Stories

### US1 — <Title> (P1)
<Why this story matters at this priority, 1–2 sentences.>

**Actor**: <name> | **Pre**: <what must be true before it starts> | **Post**: <state guaranteed
when it succeeds>

**Flow**:
1. <Actor action> → <system response> (FR-###)
2. <...>

**Extensions**:
- 2a. <what differs or fails at step 2> → <system behaviour> (FR-###)
- *a. <what can happen at any step> → <system behaviour> (FR-###)

**Independent test**: <How this story alone can be tested and what value it delivers.>

### US2 — <Title> (P2)
<...>

## Edge Cases
<Only cases that span several stories; per-step cases go in the story's Extensions. Remove if
none.>
- <Condition> → <expected behaviour> (FR-###)

## Functional Requirements
- **FR-001**: <Actor/System> MUST <testable capability or business rule>
- **FR-002**: <...> [NEEDS CLARIFICATION: <specific question>]

## Key Entities
<Only if the feature involves data; otherwise remove.>
- **<Entity>**: <what it represents, key attributes, relationships; no storage details>

## Success Criteria
- **SC-001**: <Measurable, user-facing, technology-agnostic outcome>

## Assumptions & Scope
- <Default chosen where the request was silent>
- Out of scope: <what this feature deliberately does not cover>
