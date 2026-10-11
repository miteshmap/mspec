# <Capability name>

**Status**: Active | Deprecated | **Last updated**: <YYYY-MM-DD> | **Specs**: <ids that shaped it>

## Purpose
<What this capability does for users and why it exists. 2–4 sentences.>

## Behaviour
<Current rules as testable statements. IDs are stable within this doc and never reused; the
tag in brackets is the spec that introduced or last changed the rule, or "from code" if it was
read from the code and no spec has confirmed it yet.>
- **R1**: <Actor/System> MUST <behaviour> (<spec id | from code>)
- **R2**: <...>

## Data
<Only if the capability owns data; otherwise remove.>
- **<Entity>**: <what it represents, key fields and constraints, relationships>

## Interfaces
<Entry points users or other systems use: routes, forms, APIs, commands, events, feeds,
permissions. Remove if none.>
- **<Name>** (`<path / command / event>`): <purpose>. Access: <who>.

## Decisions
<Why it is built this way; the reasoning future specs must respect or consciously overturn.>
- **<Topic>**: <decision>. *Why*: <rationale>. (<spec id>)

## Code Map
- `<path>`: <what lives there>

## Known Gaps
<Deferred work, unanswered clarifications, known limitations. Remove if none.>
- <Gap> (<spec id>, <deferred task / clarification>)

## History
| Date | Spec | Change |
|------|------|--------|
| <YYYY-MM-DD> | <id-short-name> | <one line: added / changed / removed what> |
