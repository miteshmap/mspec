# Tasks: <Feature name>

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: <YYYY-MM-DD> |
**Tests**: <included | not requested> |
**Skills**: <tagged skill names, or "none found"> (from <sources, e.g. session, CLAUDE.md>)

Format: ``- [ ] T### [P] [US#] <action> in `<path>` (FR-###). Skill: `<name>`. Agent: `<name>` ``.
`[P]` = can run in parallel (different file, no unfinished dependency). `Skill` = load and follow
this skill while doing the task. `Agent` = a subagent that could run an independent task; only a
suggestion, and the user chooses at implement time. Both are omitted when nothing fits. Work top
to bottom: Foundation blocks every story; each story is shippable on its own once its Verify task
passes.

## Foundation
<Blocking work every story needs. Remove if none.>
- [ ] T001 <action> in `<path>`. Skill: `<skill>`

## US1 — <Title> (P1, MVP)
**Goal**: <one line from the spec>
- [ ] T002 [P] [US1] <action> in `<path>` (FR-001): <exact constraints from the plan>. Skill: `<skill>`. Agent: `<agent>`
- [ ] T003 [US1] <action> in `<path>` (FR-002), after T002. Skill: `<skill>`
- [ ] T004 [US1] Verify: <acceptance scenarios / tests from the plan's Verify line>. Skill: `<test skill>`

## US2 — <Title> (P2)
<...>

## Cross-cutting
- [ ] T0XX <config, docs or cleanup from the plan> in `<path>`
- [ ] T0XX Run checks: <commands from the plan's Verification>
- [ ] T0XX Verify SC-001: <how, from the plan>

## Deferred
<Work blocked by an open clarification. Remove if none.>
- [ ] T0XX [US#] <action> in `<path>` (FR-###). Skill: `<skill>`. **Blocked by**: "<clarification question>"
