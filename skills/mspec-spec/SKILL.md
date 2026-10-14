---
name: mspec-spec
description: Write or update a feature specification (`.mspec/specs/<id>-<short-name>/spec.md`) from a plain-language feature description, covering actors, prioritized user stories with step-by-step flows and their alternative and exception paths, testable requirements (including business rules) and measurable success criteria, with no implementation details. Use when the user runs /mspec-spec or asks to spec out, specify or write requirements for a feature.
compatibility: Designed for Claude Code; asks questions with the AskUserQuestion tool.
---

# mspec-spec

Turns a feature description into `spec.md`: **what** users need and **why**, written for a
product owner. The plan and tasks steps build on it, so every requirement must be testable.

- **Input**: `$ARGUMENTS`, the feature description, or an existing spec path or id to update.
  Empty → ask for a description in chat (the one plain-text question, since it has no options)
  and stop.
- **Reads**: `.mspec/constitution.md`, `.mspec/docs/` (current behaviour), existing specs under
  `.mspec/specs/` and `.mspec/archive/`.
- **Writes**: `.mspec/specs/<id>-<short-name>/spec.md`, from
  [the template](assets/spec-template.md).

## Rules

- Do not write code, branches, plans or tasks.
- One feature per run. If the input describes several, spec the main one and list the rest under
  Next actions.
- Never describe **how**: no frameworks, APIs, modules, tables or code structure.
- Remove sections that do not apply (no "N/A") and every `<placeholder>`.

## Asking questions

Every question goes through the `AskUserQuestion` tool, never as plain text in chat.

- **Question**: self-contained, in plain language, answerable without opening the spec: the
  feature context, exactly what is undecided, and what changes in scope, security or UX
  depending on the answer.
- **Options**: 2–3 answers with the recommended one first, each description stating its
  implications. The last option is always "Clarify/rephrase the question"; if picked, ask again
  in simpler words with a concrete example per option. The tool adds "Other" for a custom answer.
- **Limits**: max 4 options per question (tool limit), max 3 questions per run (one per
  clarification marker).

## Steps

1. **Locate.** If the input names an existing spec, update it and keep what is still valid.
   Otherwise create a new one:
   - **Short name**: 2–4 words, kebab-case, action-noun where possible, keep acronyms
     (`"Let users export invoices as CSV"` → `invoice-csv-export`).
   - **Id**: the ticket key if given (`PROJ-123`), else the next 3-digit number after the highest
     in `.mspec/specs/` and `.mspec/archive/` (`001` if none).

2. **Load context.** Read the constitution, `.mspec/docs/README.md` and the docs for the
   capabilities this feature touches. Use them to challenge the request: reuse their terms, fill
   vague parts from existing rules, and flag any conflict with a documented rule (`<doc> R#`) or
   principle in the report; do not silently drop either. A changed rule must be stated explicitly
   as a requirement. If the conflicting rule is tagged `(from code)` (never confirmed as
   intended), ask whether the current behaviour is intended or a bug. No constitution → skip the
   principle check and flag it.

3. **Draft.** Pull actors, actions, data and constraints out of the description and fill the
   template, following the section guide below. For each story, write the main flow first, then
   walk it step by step and ask what can differ or fail there: missing or invalid input, empty
   results, limits, permissions, slow or failed processing, a concurrent change, the actor
   abandoning. Each case that matters becomes an extension with its expected behaviour; a case
   that can happen at any step is `*a`, `*b`.

4. **Unknowns.** Use a sensible default and record it under Assumptions. Mark
   `[NEEDS CLARIFICATION: <question>]` only when the answer changes scope, security/privacy or UX
   and no reasonable default exists. Max 3 markers, ranked scope > security/privacy > UX >
   technical. Never ask about routine defaults (error messages, typical performance, standard
   auth, data retention norms).

5. **Validate**, fix, and re-check (max 3 passes):
   - [ ] No implementation details; readable by a non-technical stakeholder.
   - [ ] Every story has an actor, a numbered flow and an independent test; Pre and Post are
         stated unless obvious.
   - [ ] Every flow step was checked for what can differ or fail, and each case that matters is
         an extension with expected behaviour.
   - [ ] Every extension and every step that adds behaviour cites an FR; every FR is cited by a
         step, an extension or a cross-story edge case.
   - [ ] Every FR is testable and unambiguous; every business rule (limit, calculation,
         eligibility, policy) is its own FR.
   - [ ] Success criteria are measurable and technology-agnostic.
   - [ ] Primary flows, edge cases, scope, dependencies and assumptions are covered.

6. **Clarify.** If markers remain, ask them all in one `AskUserQuestion` call. Put the answers
   into the spec, remove those markers and re-validate. Markers the user leaves unanswered stay
   in place; mspec-plan can plan around them.

7. **Write** `spec.md` with Status `Draft` (also when updating an `Approved` or `Implemented`
   spec, so later stages know it changed) and report (see below).

## Section guide

| Section | What to write |
|---|---|
| **Actors** | Everyone and everything that starts or takes part in a story: users by role, and external systems. Primary actors start stories; secondary ones take part. |
| **User Stories** | Ordered P1, P2, … Each testable and shippable on its own (P1 alone is a usable MVP). Per story: why it matters, its actor, Pre (what must be true before) and Post (what is guaranteed on success), a numbered **Flow** of actor action → system response, **Extensions** keyed to the step they branch from (`2a`, `2b`; `*a` for any step), and an independent test. Flow and Extensions are the acceptance scenarios: write them as observable behaviour, never screens or components. A one-step story may have no extensions. |
| **Edge Cases** | Only cases that span several stories (e.g. the feature is disabled, the account is suspended), with expected behaviour. Per-step cases belong in the story's Extensions. |
| **Functional Requirements** | `FR-###`, one testable MUST each, for capabilities and business rules alike: a limit, calculation, eligibility condition or policy gets its own FR. |
| **Key Entities** | Only if data is involved: what each represents, key attributes, relationships; no storage details. |
| **Success Criteria** | `SC-###`, measurable (time, %, count) and user-facing: "Users export a year of invoices in under 10 seconds", not "API responds in 200 ms". |
| **Assumptions & Scope** | Every default you chose, plus what is out of scope. |

## Report

Keep it short:

- **Spec**: path
- **Stories**: title + priority + actor, with its number of steps and extensions, one line each
- **Flags**: checks still failing, open clarifications, constitution and doc-rule conflicts,
  missing constitution
- **Next**: mspec-plan (open clarifications can stay open); mspec-constitution first if none exists
- **Next actions**: deferred requests (omit if none)
