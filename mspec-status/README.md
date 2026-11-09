# mspec-status

A Claude Code mod that shows the working spec, task progress, and user story:

```text
mspec: PROJ-123-order-export · 3/10 tasks · US1 — Export orders (P1, MVP)
```

It uses Claude Code's native mod status row and keeps the existing **Specs** pane,
where you can expand each spec to see progress per section. No `statusLine` setting
or separate script is needed. Requires a Claude Code version with mods support.
See the [mods reference](https://code.claude.com/docs/en/plugins/mods/reference).

## Install

In Claude Code:

```text
/plugin marketplace add miteshmap/mspec
/plugin install mspec-status@mspec
```

Restart Claude Code after installing or updating. To try this checkout locally:

```bash
claude --plugin-dir /absolute/path/to/mspec/mspec-status
```

## How it selects the spec and story

- Running an mspec workflow command or Skill call with a spec folder, ID, or short
  name selects that spec. Namespaced skills are supported.
- An explicit story (`/mspec-implement 001 US2`) shows that story. A task scope
  (`T005-T012`) shows the section containing its first task.
- Otherwise, the first unfinished section supplies the story or phase, including
  Foundation and Cross-cutting. With every task done, this section is omitted.
- Before a spec is selected, or when a command omits its spec, the most recently
  modified `tasks.md` is preferred, falling back to `plan.md`, then `spec.md`.
  `/mspec-implement` defaults only to specs with a task file.
- Reading or editing a file under `.mspec/specs/<folder>/` selects that spec.
  Edits within the selected spec preserve an explicit story or task scope.

The count covers all numbered `T###` tasks in the spec, excluding Deferred tasks
and fenced examples. `[x]` and `[X]` count as complete. The story label comes from
the `## US# — Title` heading in `tasks.md`; without an explicit scope it indicates
the next unfinished phase, rather than inferring what the agent is doing in code.
Specs without tasks show their stage instead of a count. Projects without specs
leave the status row empty. Archived specs remain available in the pane.

The display refreshes on spec file tool calls, workflow commands, turn completion,
and every minute. `/mspec-status` rescans and opens the pane. The plugin only reads
project files; progress remains in `tasks.md`.

## Verify

```bash
claude plugin test mspec-status
claude plugin validate mspec-status
```

Run these from the repository root. The tests exercise status output, story and
task scopes, checklist changes, spec switching, missing specs, and pane rendering.
