# Plan: <Feature name>

**Spec**: [spec.md](spec.md) | **Status**: Draft | **Date**: <YYYY-MM-DD>

## Summary
<2–3 sentences: what will be built and the core technical approach.>

## Technical Context
- **Touches**: <components, modules, services or packages this feature changes>
- **Reuses**: <existing code, helpers or libraries to build on, with paths>
- **New dependencies**: <libraries or services to add, or "None">
- **Tests**: <in scope or not, and why (spec, constitution or user request); test types and
  where they live>

## Constitution Check
| Principle | Status | Note |
|-----------|--------|------|
| <name> | Pass / Violation | <how the plan complies, or why the violation is justified and what simpler option was rejected> |

## Decisions
<Only non-obvious choices.>
- **<Topic>**: <decision>. *Why*: <rationale>. *Rejected*: <alternative and reason>.

## Data Model
<Only if the feature stores or changes data; otherwise remove.>
### <Entity / bundle / table> (Key Entity: <spec name>)
| Field | Type | Constraints | FR |
|-------|------|-------------|----|
| <name> | <type> | <required, max length, allowed values, default, unique> | FR-00X |

Relationships: <...> | States: <from → to, trigger> (<US#>)

## Interfaces
<Only what the feature exposes or consumes: routes, forms, APIs, events/hooks, permissions,
feeds, CLI commands, external calls. Remove if none.>
- **<Name>** (`<path / hook / event>`), FR-00X / US#: <inputs → outputs>.
  Access: <permission or role>. Errors: <cases and responses>.
  <Optional: machine-readable contract (OpenAPI / JSON Schema) in a fenced block here.>

## Implementation
### Foundation
<Blocking work every story needs. Remove if none.>
- `<path>` (new | modify): <what changes>

### US1 — <Title> (P1)
**Covers**: FR-001, FR-002 | **Flows**: main, 2a, *a
- `<path>` (new | modify): <what changes> (<flow step or extension, if not obvious>)

**Verify**: one line per flow, with the test or exact steps and any data or setup it needs.
- main: <...>
- 2a: <...>

### US2 — <Title> (P2)
<...>

### Cross-cutting
<Config export, docs, cleanup spanning stories. Remove if none.>
- `<path>` (new | modify): <what changes>

### Deferred
<Work blocked by an open clarification in the spec. Remove if none.>
- **Awaiting**: "<NEEDS CLARIFICATION question>". **Holds back**: FR-00X. **Likely touches**:
  `<path>`

## Verification
- **Checks**: <lint / static analysis / test commands to run>
- **Success criteria**: SC-001 → <how it is measured or demonstrated>

## Risks
<Only real ones; otherwise remove.>
- <Risk> → <mitigation>
