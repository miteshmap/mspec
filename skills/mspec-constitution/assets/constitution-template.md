# <Project> Constitution

## Overview
<What the product is and why it exists, in 1–2 sentences.> It serves:

- **<Audience>**, <what they do or get>.

Custom functionality:
- <capability> (`<module or package>`);

<Other key facts: theme/UI, notable non-goals.> See `README.md` for details.

<Facts only, taken from README* and the codebase; no rules here. Keep it under ~20 lines.>

## Principles

### 1. <Name>
- <Rule using MUST / MUST NOT / SHOULD>

Rationale: <one line, optional>

### 2. <Name>
- <Rule>

## Tech Stack & Constraints
Exact pins live in <manifest and hosting files>. Moving to a new major version (or a new minor
version of a language runtime or service) is a constitution amendment.

| Layer | Binding choice |
|---|---|
| <Layer, e.g. Language> | <Name and major/minor version, and where it is set> |

- <Binding stack, hosting, compliance or tooling choice, as a MUST / MUST NOT rule>
- Code MUST run on every version listed above. A change that needs a different version MUST
  update the manifests and this table in the same PR.

<One table row per layer the project uses. Major versions only (minor for language runtimes and
services); never patch pins, full module lists or commands. Rules list only choices that need an
amendment to change.>

## Governance
- This constitution overrides conflicting guidance in specs and plans.
- Amend only via /mspec-constitution, or by an amendment the user approves in /mspec-archive;
  every change bumps the version (semver).
- Reviews check changes against these principles; justify any exception in the PR.

**Version**: <X.Y.Z> | **Ratified**: <YYYY-MM-DD> | **Last amended**: <YYYY-MM-DD>
