---
name: mspec-tasks
description: Break a feature's spec and plan into an ordered, dependency-aware task checklist (`.mspec/specs/<id>-<short-name>/tasks.md`) grouped by user story, where each task names its file, requirement and exact constraints so it can be implemented without extra context. Use when the user runs /mspec-tasks or asks to create, generate or update tasks for a planned feature.
compatibility: Designed for Claude Code; asks questions with the AskUserQuestion tool.
---

# mspec-tasks

Turns `spec.md` + `plan.md` into `tasks.md`: the checklist someone (or an agent) works through to
build the feature. Each task must be doable with no context beyond the task line, the spec and
the plan.

- **Input**: `$ARGUMENTS`, the spec path or id, optionally with notes ("include tests").
  Empty → the most recently modified `.mspec/specs/*/plan.md`.
- **Reads**: `spec.md` and `plan.md`; for current agent's skills and subagents
  and the project instruction files (see Skill discovery). No plan → stop and suggest running
  mspec-plan.
- **Writes**: `tasks.md` in the same directory, from [the template](assets/tasks-template.md).

## Rules

- Everything goes in `tasks.md`: no separate checklist, dependency or strategy files.
- Do not write code, and do not edit the spec or plan, except their Status line (step 5).
- Take every path, field, constraint and command from the plan; never invent them. If something
  implementation clearly needs is missing from the plan (e.g. a data migration for a new field),
  add the task with `(not in plan)` and flag it in the report.
- Tests: add test tasks only if the plan's Technical Context (or the user's input) says tests are
  in scope. Then each story's test tasks come before its implementation tasks.
- Skill and agent names come only from Skill discovery; never invent them, and never tag `mspec-*`
  skills. When nothing clearly fits a task, leave it untagged: a wrong skill is worse than none.

## Asking questions

Every question goes through the `AskUserQuestion` tool, never as plain text in chat. Ask only if
the spec and plan contradict each other or a task cannot be written without a missing decision;
otherwise flag gaps in the report.

- **Question**: self-contained, in plain language: the context, exactly what is undecided, and
  what changes depending on the answer.
- **Options**: answers with the recommended one first, each description stating its
  implications. The last option is always "Clarify/rephrase the question"; if picked, ask again
  in simpler words with a concrete example per option.
- **Limits**: max 4 options per question (tool limit), max 3 questions per run.

## Skill discovery

Tasks are tagged with skills the agent running mspec (Claude Code, Copilot, Codex, Cursor, …) can
actually use. Build a catalog (name, description, source) from these sources, in order, using
whichever exist:

1. **Session**: the skills and subagents the running agent already exposes (e.g. Claude Code's
   available skills and agents). These come first because mspec-implement can invoke them.
2. **Instruction files** that map work to skills: `CLAUDE.md`, `AGENTS.md`,
   `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` (respect their
   `applyTo` globs), `GEMINI.md`, `.cursor/rules/*`. An explicit mapping ("use X for module code")
   beats a description match.
3. **Skill folders**: `.claude/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md`,
   `.github/skills/*/SKILL.md`, `.agents/skills/*/SKILL.md`. Read only the frontmatter `name` and
   `description`.
4. **Subagents**, for `[P]` suggestions only: the session's agent list, `.claude/agents/*.md`,
   `.github/agents/*.md`.

No skills found → skip tagging and say so in the report.

## Steps

1. **Locate.** Resolve the feature directory. If `tasks.md` exists, update it: keep completed
   (`[x]`) tasks and their IDs, never renumber, and give new tasks the next free IDs. E.g. when a
   deferred clarification has been planned, move its tasks out of Deferred.

2. **Load.** From the spec: user stories with priorities and acceptance scenarios, FRs, SCs. From
   the plan: Technical Context (dependencies, tests), Data Model, Interfaces, Implementation
   (Foundation, US#, Cross-cutting, Deferred) and Verification. If a clarification the plan
   defers is now answered in the spec, flag that the plan needs a re-run. Run Skill discovery.

3. **Generate** tasks phase by phase, following the task guide below, and tag each task with
   its skill.

4. **Validate**, fix, and re-check until all pass:
   - [ ] Every file line in the plan's Implementation has at least one task.
   - [ ] Every FR has at least one task (or a Deferred task).
   - [ ] Every Data Model field and Interface appears in a task, constraints quoted exactly.
   - [ ] Every new dependency in the plan has an install/setup task in Foundation.
   - [ ] Every story ends with a Verify task; Cross-cutting ends with checks and SC verification.
   - [ ] Every task has an ID, a file path (except Verify/Run tasks) and the right labels.
   - [ ] `[P]` tasks touch different files and depend on nothing unfinished.
   - [ ] No task depends on a later task or on another story (except Foundation).
   - [ ] Every `Skill:` and `Agent:` name is in the discovery catalog; no `mspec-*` skills.
   - [ ] `Agent:` appears only on `[P]` tasks with no `after T###`.

5. **Write** `tasks.md`, set Status to `Approved` in `spec.md` and `plan.md` (generating tasks is
   the approval point), and report (see below).

## Task guide

| Phase | What goes in |
|---|---|
| **Foundation** | New dependencies first, then the plan's Foundation changes. No story label. Blocks all stories. |
| **US#** (one per story, spec priority order; P1 marked MVP) | The plan's changes for that story, in build order: data → logic → interfaces → UI. Tests first if in scope. Last task: Verify, from the plan's Verify line. |
| **Cross-cutting** | The plan's Cross-cutting changes, then "Run checks" with the plan's commands, then one Verify task per SC. No story label. |
| **Deferred** | The plan's Deferred items as tasks, each naming its blocking clarification. |

**Each task:**
- One action on one file (a tightly coupled pair is fine), small enough to finish and check in
  one go. Split a file change that serves several FRs into separate tasks.
- Starts with a verb, names the file in backticks, ends with the FR(s) it serves.
- Quotes the plan's constraints exactly (types, lengths, allowed values, permissions, error
  cases) instead of "add validation".
- Adds `after T###` only when the dependency isn't the previous task.
- Ends with ``Skill: `<name>` `` (max 2, comma-separated) when a skill clearly matches the task's
  file type and action (e.g. a module service → a backend skill, a template → a frontend skill),
  not merely the feature's topic. Verify and Run checks tasks may name a test or review skill.
- A `[P]` task with no `after` may add ``Agent: `<name>` ``: a subagent that could run it in
  parallel. This is only a suggestion; the user decides at implement time whether to use it.

## Report

Keep it short:

- **Tasks**: path, total count, count per phase, how many `[P]`
- **MVP**: Foundation + US1 (task range)
- **Skills**: sources used, each tagged skill with its task count, untagged tasks, tasks with an
  `Agent:` suggestion (or "none found")
- **Flags**: `(not in plan)` tasks, spec/plan gaps or contradictions, Deferred tasks and what
  blocks them
- **Next**: mspec-implement, starting with Foundation
