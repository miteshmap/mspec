---
name: mspec-implement
description: Implement a feature by executing its `tasks.md` in order, following `plan.md` and `spec.md`, verifying each task against its requirement and constraints before checking it off, and validating each user story and the whole feature at the end. Use when the user runs /mspec-implement or asks to implement, build, execute or continue the tasks of a planned feature.
compatibility: Designed for Claude Code; asks questions with the AskUserQuestion tool.
---

# mspec-implement

Executes `tasks.md` and proves each task is done as defined. `tasks.md` is the progress record: a
task is checked `[x]` only after it has been verified, so any run can stop and resume safely.

- **Input**: `$ARGUMENTS`, the spec path or id, optionally with a scope: a story (`US2`), a task
  range (`T005-T012`) or `next` (the next incomplete phase only). Empty → the most recently
  modified `.mspec/specs/*/tasks.md`, all open tasks.
- **Reads**: `tasks.md`, `plan.md`, `spec.md`, `.mspec/constitution.md`, project instructions
  (`CLAUDE.md`, `AGENTS.md`, `README*`), and the code each task touches.
- **Writes**: the files the tasks name (including `(added)` tasks), `tasks.md` (checkboxes, notes,
  added tasks), `plan.md` Decisions for approved deviations only, and the Status line of
  `spec.md` and `plan.md` (step 4). No other files.

## Rules

- Do only what the tasks say. No unrelated refactors, fixes or "improvements"; mention them in
  the report instead.
- Follow the constitution and the project's conventions (read neighbouring code first). If project
  instructions define an implementation or review workflow (e.g. specific agents, required
  checks), follow it.
- Never implement Deferred tasks.
- Do not edit `spec.md` beyond its Status line. Edit `plan.md` only to record an approved
  deviation under Decisions, or its Status line.
- Do not commit or push unless the user asks.
- Never check off a task that failed verification, and never weaken a test to make it pass.

## Asking questions

Every question goes through the `AskUserQuestion` tool, never as plain text in chat.

- **Question**: self-contained, in plain language: the context (task ID, what was found),
  exactly what is undecided, and what changes depending on the answer.
- **Options**: answers with the recommended one first, each description stating its
  implications. The last option is always "Clarify/rephrase the question"; if picked, ask again
  in simpler words with a concrete example per option.
- **Limits**: max 4 options per question (tool limit). Ask only at the stop points below.

## Steps

1. **Pre-flight.**
   - No `tasks.md` → stop and suggest mspec-tasks.
   - `spec.md` or `plan.md` has Status `Draft` (changed after tasks were generated) → ask whether
     to continue or re-run mspec-tasks first.
   - Note the working-tree state (e.g. `git status`) so the final diff shows only this run's
     changes. If unrelated uncommitted changes exist, mention them.
   - No constitution → continue, and flag it in the report.
   - Resume: start at the first unchecked, non-Deferred task in scope.

2. **Execute each task in order.** Phases run top to bottom: Foundation before any story, and
   `after T###` dependencies are respected. For each task:
   1. **Understand**: read the task line, the FR(s) it cites in the spec, the plan sections it
      relies on (constraints, interfaces, decisions), and the target file with its neighbours.
   2. **Implement** exactly that task, with the smallest change that fully meets it.
   3. **Verify** (see task done criteria below). On failure, fix and re-verify, up to 3 attempts.
   4. **Record**: check it off `[x]` in `tasks.md` straight away. Append `(note: …)` only for a
      deviation or something the next task must know.

3. **Story checkpoint.** At each story's Verify task, prove the acceptance scenarios (see story
   done criteria). A story is done only when its Verify task passes. If it fails, stop that story;
   do not start dependent work.

4. **Feature completion.** When all in-scope tasks are checked, run Cross-cutting's checks and SC
   verification, then the final audit below. When the audit passes and no non-Deferred task is
   left unchecked, set Status to `Implemented` in `spec.md` and `plan.md`.

5. **Report** (see below).

## Done criteria

**Task**: all must hold before `[x]`:
- [ ] The change is in the file the task names and does what the task line says.
- [ ] Every constraint the task quotes (types, lengths, allowed values, permissions, error cases)
      is implemented exactly as written.
- [ ] The cited FR's behaviour for this slice is actually met, not just scaffolded: no TODOs,
      stubs or placeholder values.
- [ ] Fast checks pass on the changed files: syntax/lint/static analysis from project
      instructions or the plan, scoped to what changed.
- [ ] Related existing tests still pass. For a test task (tests first): the new test runs and
      fails for the expected reason before implementation, and passes after it.

**Story**: the Verify task's scenarios pass, by automated tests where they exist, otherwise by
running the feature the way the project runs (CLI, HTTP request, app, browser). If a scenario can
only be checked by a person, give exact manual steps and ask the user to confirm; check it off only
on confirmation.

**Feature**: final audit, all must hold:
- [ ] Every in-scope task is `[x]`; Deferred tasks are untouched.
- [ ] Every in-scope FR and acceptance scenario in the spec is met by the code (re-read the spec
      against the diff, not just the checkboxes).
- [ ] Full project checks and tests pass (the "Run checks" task).
- [ ] The diff touches only files in the plan or tasks (plus noted additions); no debug code,
      commented-out code or unrelated changes.

## Stop points

Stop, leave the task unchecked, and ask or report when:

| Situation | Action |
|---|---|
| A task still fails after 3 attempts | Stop. Report the error, what was tried, and a suggested fix. |
| A task can't be done as written (path, API or assumption is wrong) | Trivial and obvious fix (e.g. a renamed file): do it and add a note. Otherwise ask: adapt (recorded in plan Decisions) or stop and re-run mspec-plan. |
| The work needs something no task covers | Small and within the story: add a task with the next free ID marked `(added)`, then do it. Changes design, data model, interfaces or adds a dependency: ask first. |
| A change would break a constitution principle | Stop and ask; never proceed silently. |
| A `[P]` task fails | Finish the other independent tasks in the group, then stop before anything that depends on the failed one. |

## Report

Keep it short:

- **Progress**: tasks done this run / total, per phase; stories verified
- **Checks**: lint, static analysis and test results (pass/fail with counts)
- **Changes**: files created / modified
- **Flags**: deviations and `(added)` tasks, failures and blockers, Deferred tasks remaining,
  unrelated issues noticed
- **Next**: what's left (next task or story), or review and commit with a suggested message,
  then mspec-archive
