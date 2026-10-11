---
name: mspec-constitution
description: Create or amend the project constitution (`.mspec/constitution.md`), the short list of non-negotiable principles that specs, plans and code must follow. Use when the user runs /mspec-constitution or asks to set, add, change or remove project principles or governance rules.
compatibility: Designed for Claude Code; asks questions with the AskUserQuestion tool.
---

# mspec-constitution

Maintains `constitution.md`: the few non-negotiable rules that mspec-spec and mspec-plan check
every feature against. Keep it short; every rule must be checkable in a code review.

- **Input**: `$ARGUMENTS`, principles or amendments (may be empty; also use the conversation).
- **Reads**: the existing constitution, project instructions (`CLAUDE.md`, `AGENTS.md`,
  `README*`), dependency manifests (e.g. `package.json`, `composer.json`, `pyproject.toml`),
  runtime and hosting config (e.g. `.tool-versions`, `Dockerfile`, `.ddev/`, `.platform/`, CI
  workflows), lint and test config.
- **Writes**: `.mspec/constitution.md`, from [the template](assets/constitution-template.md).

## Rules

- Do not touch code, tests, config, other docs or the template.
- If the input also asks for features, refactors or builds, do not do them; list them under
  Next actions.
- Do not invent principles the user or repo does not support. If a value cannot be found, write
  `TODO(<FIELD>): <why>`.
- Do not restate what project instructions already cover in detail; reference them instead.
- Cite only `README*`, project instructions and manifests. Do not reference other spec or
  planning folders (e.g. a legacy `specs/`), even if you read them for facts.

## Asking questions

Every question goes through the `AskUserQuestion` tool, never as plain text in chat.

- **Question**: self-contained, in plain language: the context, exactly what is undecided, and
  what changes depending on the answer.
- **Options**: 2–3 answers with the recommended one first, each description stating its
  implications. The last option is always "Clarify/rephrase the question"; if picked, ask again
  in simpler words with a concrete example per option.
- **Limits**: max 4 options per question (tool limit). Ask only when it is unclear whether
  something is a principle, or when the version bump or a value cannot be decided from the repo.

## Steps

1. **Load.** If the constitution exists, read it and keep everything still valid; otherwise
   start from the template.

2. **Gather.** Take values from the user's input first, then from the repo. Respect the number of
   principles the user asks for (default 3–7).

3. **Draft**, following the section guide below.

4. **Version** (semver; `1.0.0` for a new file). If the bump is debatable, state the reasoning
   and pick one.
   - **MAJOR**: a principle removed or redefined incompatibly.
   - **MINOR**: a principle or section added (including the Overview), guidance materially
     expanded, or a stack-table row added, removed or moved to a new major (or runtime/service
     minor) version.
   - **PATCH**: wording, clarity, typos.

5. **Validate**, fix, and re-check:
   - [ ] No template `<placeholder>` left.
   - [ ] Dates are `YYYY-MM-DD`; version line updated.
   - [ ] No duplicate or contradicting principles.
   - [ ] Every rule is checkable in a code review.
   - [ ] Every stack-table version matches the manifests it was read from.

6. **Write** the file (overwrite) and report (see below).

## Section guide

| Section | What to write |
|---|---|
| **Overview** | What the product is and why, who it serves, and its main custom capabilities (one line each, naming the module or package), from `README*` and the codebase. Facts only, no rules; point to `README.md` for details. If the purpose cannot be found, write `TODO(OVERVIEW): <why>`. |
| **Principles** | Each: a short name, 1–4 rules using MUST / MUST NOT / SHOULD, and a one-line rationale if not obvious. No vague words ("clean", "robust", "where possible"). |
| **Tech Stack & Constraints** | A stack table, then binding choices as rules ("payments MUST go through the billing service"). The table has one row per layer the project actually uses (language, framework/CMS, key frameworks or platforms built on it, theme/UI, database, cache, search, config, CLI/build, hosting/CI), each with the binding version and where it is set. Use major versions (minor for language runtimes and services, e.g. PHP 8.3, MariaDB 10.11); never patch pins, which change on every update and live in the manifests. No full module lists or commands. If manifests disagree on a version, use the production value and flag the mismatch in the report. |
| **Governance** | Keep the template's amendment, versioning and review rules unless the user changes them. |
| **Version line** | `Ratified` = original adoption date (today for a new file); `Last amended` = today if anything changed. |

## Report

Keep it short, in chat (not in the file):

- **Version**: `old → new` and why
- **Principles**: added / changed / removed
- **Flags**: any `TODO(...)` left
- **Commit**: suggested message, e.g. `docs: amend constitution to v1.1.0 (add pricing principle)`
- **Next actions**: deferred non-constitution requests (omit if none)
