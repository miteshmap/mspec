# "My spec driven delivery" kit (mspec)

A lightweight spec-driven workflow: describe a feature, plan it against the real code, break it
into tasks, build it, then fold the result into living docs. Each stage is one Claude Code skill
(`.claude/skills/mspec-*`) and writes **one file**, so the requirements for a feature are always
three files in one folder.

## Workflow

```
/mspec-constitution  (once, then amend as needed)
        │
/mspec-spec ──► /mspec-plan ──► /mspec-tasks ──► /mspec-implement ──► /mspec-archive
 spec.md         plan.md         tasks.md          code + [x] tasks      docs/ + archive/
 what & why      how             checklist         verified build        as-built truth
```

| Command | Input (`$ARGUMENTS`) | Writes | Run when |
|---|---|---|---|
| `/mspec-constitution` | Principles to add or change (optional) | `constitution.md` | Setting up, or a project-wide rule changes |
| `/mspec-spec` | Plain-language feature description, or a spec id to update | `specs/<id>-<name>/spec.md` | Starting a feature or changing its requirements |
| `/mspec-plan` | Spec id (empty = latest), optional technical direction | `plan.md` | The spec is ready |
| `/mspec-tasks` | Spec id (empty = latest), optional notes (`include tests`) | `tasks.md` | The plan is ready; this is the approval point |
| `/mspec-implement` | Spec id, optional scope: `US2`, `T005-T012`, `next` | Code, `tasks.md` checkboxes | Building or resuming a feature |
| `/mspec-archive` | Spec id, or `init`, or `audit` | `docs/*.md`, moves the spec to `archive/` | The feature is built and reviewed |

Every skill ends with a short report and the next command to run. Questions are asked through
multiple-choice prompts with a recommended answer first; pick "Clarify/rephrase the question" if
one is unclear.

## Folder layout

```
.mspec/
├── constitution.md              # Non-negotiable principles every spec/plan/task is checked against
├── specs/<id>-<short-name>/     # Features in progress
│   ├── spec.md                  # What and why (user stories, FR-###, SC-###), no implementation
│   ├── plan.md                  # How: decisions, data model, interfaces, file changes per story
│   └── tasks.md                 # Ordered checklist T###, grouped by story; the progress record
├── archive/<id>-<short-name>/   # Finished specs, moved here unchanged by mspec-archive
└── docs/                        # Living docs: current behaviour, one file per capability
    ├── README.md                # Index of capabilities and archived specs
    └── <capability>.md
```

Spec ids are the ticket key when given (e.g. `PROJ-123`), otherwise the next 3-digit number
(`001`, `002`, …).

## A feature, start to finish

```text
/mspec-spec Let users export their order history as CSV
/mspec-plan PROJ-123
/mspec-tasks PROJ-123
/mspec-implement PROJ-123 next      # Foundation first; repeat `next`, or omit to run everything
/mspec-archive PROJ-123
```

1. **Spec**: review the user stories and FRs as a product owner would. Up to 3 open questions are
   asked; any left unanswered stay as `[NEEDS CLARIFICATION]` and the plan works around them.
2. **Plan**: check the Decisions and the Implementation file list. Wrong paths or approach? Fix
   them now; tasks copy them verbatim.
3. **Tasks**: generating tasks sets spec and plan to `Approved`. Edit the spec or plan later and
   they drop back to `Draft`; re-run `/mspec-tasks` (completed tasks keep their IDs).
4. **Implement**: tasks are checked `[x]` only after they are verified, so you can stop at any
   time and resume. Each story ends with a Verify task; manual checks are handed to you to confirm.
   Nothing is committed unless you ask.
5. **Archive**: merges what was actually built into `docs/`, proposes constitution amendments,
   and moves the spec folder to `archive/`.

## Status lifecycle

| Status | Set by | Meaning |
|---|---|---|
| `Draft` | mspec-spec, mspec-plan | New or changed since tasks were generated |
| `Approved` | mspec-tasks | Spec, plan and tasks agree; ready to build |
| `Implemented` | mspec-implement | All non-deferred tasks verified and the final audit passed |

## Living docs

`docs/` describes the project **as it is now**, and `/mspec-spec` and `/mspec-plan` read it to
reuse existing rules and flag conflicts. Only `/mspec-archive` writes to it:

- `/mspec-archive init`: document existing code that predates mspec, a few capabilities per run.
  Re-run until the index has no `Pending` rows. Rules read from code are tagged `(from code)`
  until a spec confirms them.
- `/mspec-archive audit`: report stale rules, missing Code Map paths, undocumented code and
  contradictions. Changes nothing without asking.

## Traceability

IDs link the files together, so nothing needs a separate checklist:

- `US#`: user story (spec) → plan section → task phase
- `FR-###`: functional requirement (spec) → data model / interface / file change (plan) → task
- `SC-###`: success criterion (spec) → verification method (plan) → Verify task
- `R#`: a rule in a capability doc, cited when a new spec conflicts with it

## Tips

- One feature per spec. If a description holds several, the extras are listed under Next actions.
- Keep the spec free of "how"; put technical direction in the `/mspec-plan` input instead.
- Tests are only planned and tasked if the plan's Technical Context puts them in scope, or you
  pass `include tests` to `/mspec-tasks`.
- Project conventions (commands, lint, review agents, commit style) come from `CLAUDE.md`, not
  from the skills, so the skills stay stack-agnostic.
- Templates live in each skill's `assets/` folder; change them there, not in generated files.
