# Tasks: <Feature name>

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: <YYYY-MM-DD> |
**Tests**: <included | not requested>

Format: ``- [ ] T### [P] [US#] <action> in `<path>` (FR-###)``. `[P]` = can run in parallel
(different file, no unfinished dependency). Work top to bottom: Foundation blocks every story;
each story is shippable on its own once its Verify task passes.

## Foundation
<Blocking work every story needs. Remove if none.>
- [ ] T001 <action> in `<path>`

## US1 — <Title> (P1, MVP)
**Goal**: <one line from the spec>
- [ ] T002 [P] [US1] <action> in `<path>` (FR-001): <exact constraints from the plan>
- [ ] T003 [US1] <action> in `<path>` (FR-002), after T002
- [ ] T004 [US1] Verify: <acceptance scenarios / tests from the plan's Verify line>

## US2 — <Title> (P2)
<...>

## Cross-cutting
- [ ] T0XX <config, docs or cleanup from the plan> in `<path>`
- [ ] T0XX Run checks: <commands from the plan's Verification>
- [ ] T0XX Verify SC-001: <how, from the plan>

## Deferred
<Work blocked by an open clarification. Remove if none.>
- [ ] T0XX [US#] <action> in `<path>` (FR-###). **Blocked by**: "<clarification question>"
