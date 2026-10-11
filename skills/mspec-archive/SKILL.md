---
name: mspec-archive
description: Maintain the project's living capability docs (`.mspec/docs/`). Archives an implemented feature by merging its as-built behaviour into the docs, proposing constitution amendments and moving the spec to `.mspec/archive/`; bootstraps docs from an existing codebase (`init`); audits docs for stale or undocumented features (`audit`). Use when the user runs /mspec-archive, asks to archive, close or document a finished feature, document an existing codebase, or audit the docs.
compatibility: Designed for Claude Code; asks questions with the AskUserQuestion tool.
---

# mspec-archive

Specs describe a *change*; docs describe the project *as it is now*. This skill folds a finished
spec into the docs, so `.mspec/docs/` stays the single source of truth that future specs and plans
are checked against.

- **Input**: `$ARGUMENTS`, one of:
  - a spec path or id → archive mode. Empty → the most recently modified spec under
    `.mspec/specs/` whose tasks are all done.
  - `init` (optionally with capability names) → **Init mode** below: document existing code.
  - `audit` → **Audit mode** below: check docs against the code.
- **Reads**: the spec's `spec.md`, `plan.md`, `tasks.md`; the code it changed; `.mspec/docs/`;
  `.mspec/constitution.md`; project instructions (`CLAUDE.md`, `AGENTS.md`, `README*`).
- **Writes**: `.mspec/docs/<capability>.md` (from [the doc template](assets/doc-template.md)),
  `.mspec/docs/README.md` (from [the index template](assets/docs-index-template.md)), the
  constitution (approved amendments only), and moves the spec folder to `.mspec/archive/`.

## Rules

- **One doc per capability**, not per spec: a doc holds the merged current truth for an area. A
  spec may update several docs or create a new one.
- **As-built wins.** Document what the code does, not what the spec planned. Use task notes,
  `(added)` tasks and plan Decisions to find deviations, and confirm in the code. Flag any spec
  requirement the code does not meet.
- Docs state the current behaviour. Replace superseded rules instead of appending; the past lives
  only in History and the archive.
- Keep docs at the level of what, why and where: rules, data, interfaces, decisions, code map. No
  task lists or line-by-line implementation detail.
- Do not edit code, and do not commit or push unless the user asks.
- Never delete a doc rule as stale without asking.
- Never guess a rationale. Rules read from code rather than confirmed by a spec are tagged
  `(from code)`; when a later spec confirms or changes one, archive replaces the tag with that
  spec's id.

## Asking questions

Every question goes through the `AskUserQuestion` tool, never as plain text in chat.

- **Question**: self-contained, in plain language: the context, exactly what is undecided, and
  what changes depending on the answer.
- **Options**: answers with the recommended one first, each description stating its
  implications. The last option is always "Clarify/rephrase the question"; if picked, ask again
  in simpler words with a concrete example per option.
- **Limits**: max 4 options per question (tool limit). Ask at the step that needs the answer,
  with that step's questions in one call.

## Steps (archive)

1. **Completion gate.** Read `tasks.md`.
   - Unchecked non-Deferred tasks → ask: stop (recommended) or archive as partial, with the open
     tasks recorded as Known Gaps.
   - Deferred tasks or open clarifications → they are recorded as Known Gaps; no question needed.

2. **Reconcile.** Build the as-built picture: spec requirements and scenarios, plan decisions,
   data model and interfaces, task notes and additions, checked against the code. List anything
   specified but not built, or built differently.

3. **Map to capabilities.** Match the feature to existing docs (by index, purpose and code map).
   If it is unclear whether it extends an existing doc or needs a new one, ask.

4. **Update docs.** For each affected doc, following the section guide below:
   - Add new rules, rewrite changed ones, remove superseded ones (keeping IDs stable). Retag
     `(from code)` rules this spec confirmed or changed with the spec id.
   - Update Data, Interfaces, Decisions (only decisions future work must respect), Code Map and
     Known Gaps.
   - Add one History row.
   - If the feature changes behaviour another doc describes, update that doc too.

5. **Staleness check** on every doc touched: Code Map paths still exist, and each rule still
   matches the code. Flag mismatches; ask before removing or deprecating anything.

6. **Constitution gaps.** Look for what this feature exposed: plan decisions that should apply to
   every future feature, justified constitution violations that suggest a principle is wrong, or
   repeated conventions nobody wrote down. Propose up to 3 amendments, one question each
   (apply / skip). Apply approved ones following mspec-constitution's rules (rule format,
   semver bump, dates). No constitution → skip the questions and list the proposals under Next
   as input for mspec-constitution.

7. **Archive.** Move `.mspec/specs/<id>-<short-name>/` to `.mspec/archive/<id>-<short-name>/`
   unchanged, and update the index (capabilities and archived specs tables).

8. **Validate**, fix, and re-check:
   - [ ] Every built FR is reflected in a doc rule; every unbuilt or deferred one is a Known Gap.
   - [ ] Every Code Map path exists.
   - [ ] No two docs contradict each other.
   - [ ] The index lists every doc and the newly archived spec.
   - [ ] No template `<placeholder>` left.

9. **Report** (see below).

## Init mode

Run with `init` to document an existing codebase, in batches across several runs. The index
tracks progress, so re-running `init` continues where the last run stopped.

1. **Discover** (first run only, when the index has no capabilities yet). Read project
   instructions, the constitution and the project's own code; skip dependencies, generated and
   third-party code. Propose capabilities, each with a name, a one-line purpose and its code
   paths. Every area of the project's own code must map to a capability or be listed as
   "not documented" with a reason (e.g. build glue).

2. **Confirm.** Show the full list in one question (confirm / adjust via "Other"). Then write the
   index with every capability marked `Pending`.

3. **Document a batch**: the capabilities named in the input, else the next 3 `Pending` ones. For
   each, read its code thoroughly and fill the doc template:
   - **Behaviour**: rules the code actually enforces, each tagged `(from code)`.
   - **Data, Interfaces, Code Map**: from the code.
   - **Decisions**: only with evidence (code comment, commit message, project docs), cited.
     Otherwise add a Known Gap: `Rationale undocumented: <topic>`.
   - **Suspected bugs, dead code or inconsistencies**: a Known Gap ("Suspected issue: …") and a
     report flag, never a rule.
   - **History**: one row, spec `—`, "Documented from code".

4. **Update the index**: documented capabilities `Pending` → `Active`.

5. **Constitution gaps** (only once no `Pending` remain): propose up to 3 principles from
   conventions the code follows consistently, as in archive step 6.

6. **Validate**, fix, and re-check:
   - [ ] Every rule is backed by code in the Code Map; every Code Map path exists.
   - [ ] No guessed rationale; no suspected bug written as a rule.
   - [ ] The index status matches the docs on disk.
   - [ ] No template `<placeholder>` left.

## Audit mode

Run with `audit` to keep docs honest between features. Report only; change nothing without
asking. If `.mspec/docs/` is empty, suggest `init` instead.

- **Stale**: rules or Code Map paths the code no longer supports.
- **Undocumented**: significant code areas (modules, components, services, routes) that appear in
  no doc's Code Map.
- **Contradictions**: docs that disagree with each other or with the constitution.
- **Long-open gaps**: Known Gaps from specs archived long ago, and `(from code)` rules never
  confirmed by a spec.

Then offer to fix: update or deprecate stale rules, or add undocumented areas to the index as
`Pending` for `init` to document.

## Section guide

| Section | What to write |
|---|---|
| **Purpose** | What the capability does for users and why it exists. |
| **Behaviour** | Current rules as testable MUST statements, stable `R#` IDs, each tagged with the spec that last changed it, or `(from code)` if unconfirmed. The part future specs are challenged against. |
| **Data / Interfaces** | Current entities and entry points, with key constraints and access. |
| **Decisions** | Lasting reasons behind the design; skip one-off implementation choices. |
| **Code Map** | Main paths only, one line each. |
| **Known Gaps** | Deferred work, open clarifications, limitations, with their source spec. |
| **History** | One row per spec: date, spec, what changed. |

## Report

Keep it short:

- **Mode**: archived spec → archive path, init batch, or audit
- **Docs**: created / updated, with rules added, changed, removed (init: capabilities documented
  this run and how many remain `Pending`)
- **Constitution**: amendments applied (version change) or skipped
- **Flags**: as-built deviations, unbuilt FRs, stale items, contradictions, suspected issues,
  undocumented rationale, new Known Gaps
- **Next**: suggested commit message (e.g. `docs: archive 003-invoice-csv-export`); for init with
  capabilities left, re-run `init`
