---
name: mspec-plan
description: Turn a feature spec into a technical implementation plan (`.mspec/specs/<id>-<short-name>/plan.md`) grounded in the actual codebase, covering decisions, data model, interfaces, and exact file changes and verification per user story and flow, checked against the constitution. Use when the user runs /mspec-plan or asks to plan, design or work out how to build a specified feature.
compatibility: Designed for Claude Code; asks questions with the AskUserQuestion tool.
---

# mspec-plan

Turns `spec.md` (what and why) into `plan.md` (how). The tasks step reads only these two files,
so anything vague here becomes a guess later: be exact about paths, fields and coverage.

- **Input**: `$ARGUMENTS`, the spec path or id, optionally with technical direction ("use a queue
  worker"). Empty → the most recently modified `.mspec/specs/*/spec.md`.
- **Reads**: `spec.md`, `.mspec/constitution.md`, the `.mspec/docs/` for affected capabilities,
  project instructions (`CLAUDE.md`, `AGENTS.md`, `README*`), the code the feature touches.
- **Writes**: `plan.md` in the spec's directory, from [the template](assets/plan-template.md).

## Rules

- Everything goes in `plan.md`: no separate research, data-model, contract or quickstart files.
- Do not write code or create tasks. Signatures and short snippets in the plan are fine.
- Do not edit the spec, except to replace a clarification marker the user answers (step 2).
  Report other spec gaps and suggest re-running mspec-spec.
- Reuse before adding: name the existing services, helpers and patterns the plan builds on.
- Do not repeat project-wide facts from project instructions or the constitution; cover only
  what this feature touches.

## Asking questions

Every question goes through the `AskUserQuestion` tool, never as plain text in chat.

- **Question**: self-contained, in plain language: the context, exactly what is undecided, and
  what changes depending on the answer.
- **Options**: answers with the recommended one first, each description stating its
  implications. The last option is always "Clarify/rephrase the question"; if picked, ask again
  in simpler words with a concrete example per option.
- **Limits**: max 4 options per question (tool limit). Max 3 design questions per run, only for
  real trade-offs with no clear default (scope, cost, security, a new dependency). Decide the
  rest yourself and record them under Decisions.

## Steps

1. **Locate.** Resolve the spec from the input. If `plan.md` exists, update it and keep what is
   still valid; e.g. if the user now answers a deferred clarification, plan that part and move
   it out of Deferred.

2. **Open clarifications.** If the spec has `[NEEDS CLARIFICATION]` markers, do not block. Ask
   once, one question per marker: up to 2 answers, then "Leave open for now", then
   "Clarify/rephrase the question".
   - **Answered**: replace the marker in the spec with the answer, set the spec's Status to
     `Draft`, and plan it normally.
   - **Left open**: plan everything else. Put only the dependent work under Deferred; do not
     guess the answer.

3. **Load context.** Read the spec, constitution, project instructions, the docs for affected
   capabilities and the code the feature touches. The stack, conventions and commands come from
   these, not from assumptions. Respect documented Decisions; overturning one is itself a
   Decision with a reason. Start from the docs' Code Map and Interfaces to find what to reuse.

4. **Constitution check.** Check the approach against every principle and change it to comply.
   Justify an unavoidable violation in the table (why it is needed, which simpler option was
   rejected). If it cannot be justified, stop and report. No constitution → write "No
   constitution" in that section, flag it and suggest mspec-constitution.

5. **Derive data model & interfaces** from the spec; do not brainstorm them. Describe them in the
   project's own terms (what counts as an entity, field or interface in this stack), taken from
   the constitution, project instructions and existing code. Tag every item with the `FR-###` /
   `US#` it serves.
   - **Data model** (if the feature stores or changes data): entities from the spec's Key
     Entities; fields and validation rules from the FRs, extensions and edge cases; state
     transitions from the stories' Pre/Post, flows and extensions.
   - **Interfaces** (if the feature exposes or consumes any): what users or other systems call
     or receive (routes, forms, APIs, permissions, events/hooks, feeds, CLI, external calls), in
     the form that fits the interface type. A machine-readable contract (e.g. an OpenAPI or
     JSON Schema snippet) goes in a fenced block in the plan. Skip if purely internal.

6. **Fill the template**, following the section guide below. Remove sections that do not apply
   and every `<placeholder>`.

7. **Validate**, fix, and re-check until all pass:
   - [ ] Every FR sits under exactly one of: a user story, Foundation, Deferred.
   - [ ] Every user story in the spec has a section.
   - [ ] Every story's Flows list holds `main` and each of its extensions, and its Verify has a
         line for each.
   - [ ] Every spec Key Entity has a Data Model entry.
   - [ ] Every FR implying input, output, access or an integration has an Interface.
   - [ ] Every Data Model entry and Interface is tagged and used by a story or Foundation.
   - [ ] Every `modify` path exists; every `new` path's parent exists or is created in the plan.
   - [ ] Every SC has a verification method.
   - [ ] The constitution check still holds for the final design.
   - [ ] No placeholders or open choices remain (record leftovers as Decisions).

8. **Write** `plan.md` with Status `Draft` (also when updating an `Approved` or `Implemented`
   plan) and report (see below).

## Section guide

| Section | What to write |
|---|---|
| **Technical Context** | What it touches, what it reuses (with paths), new dependencies, and whether **tests** are in scope and why. The tasks step adds test tasks only if this says so. |
| **Constitution Check** | One row per principle: Pass, or Violation with its justification. |
| **Decisions** | Non-obvious choices only: decision, why, rejected alternative. |
| **Data Model** | Per entity: fields with exact types and constraints (required, length, allowed values, defaults), each tagged with its FR; relationships; state changes. Tasks quote these verbatim. |
| **Interfaces** | Per interface: where it lives, inputs → outputs, access, error cases, and the FR / US it serves. |
| **Implementation** | Every file change, one line each: `path` (new \| modify) and what changes. Grouped under **Foundation** (blocking, shared), **US#** in spec priority order (with the FRs it covers, its flows, and how to verify each flow), and **Cross-cutting**. Name the flow step or extension a change serves when the file line alone doesn't show it. Keep stories independent; shared work goes in Foundation. |
| **Deferred** | Work blocked by an open clarification: the marker, the FRs it holds back, likely files. |
| **Verification** | Lint / static analysis / test commands, and how each SC is shown. |
| **Risks** | Real ones only, each with a mitigation. |

## Report

Keep it short:

- **Plan**: path (and which spec, if it was picked automatically)
- **Decisions**: the key ones, one line each
- **Changes**: number of new / modified files per section
- **Flags**: constitution violations, spec gaps, clarifications still deferred
- **Next**: mspec-tasks
