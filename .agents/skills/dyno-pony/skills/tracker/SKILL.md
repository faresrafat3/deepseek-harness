---
name: tracker
description: Local markdown issue/spec/ticket tracker rooted at `~/.dsh/tracker/`. Use when a DSH workflow needs an issue surface and no real tracker (GitHub, Linear, etc.) is configured, or when the user asks to "create an issue", "open a ticket", "write a spec", "add to tracker", or invokes /tracker.
whenToUse: "Create, read, or update issues, specs, or tickets in a portable, local markdown tracker. Default tracker for all DSH workflows that assume an issue surface (to-spec, to-tickets, triage, code-review, wayfinder). Use when no `tracker.remote` is set in ~/.dsh/tracker/config.yaml."
metadata:
  category: workflow
  scope: portable
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, setup-matt-pocock-skills)
---

# Tracker

A **portable local tracker** rooted at `~/.dsh/tracker/`. The other DSH skills (to-spec, to-tickets, triage, code-review, wayfinder) assume an issue surface; this skill is the default one when no real tracker (GitHub Issues, GitLab, Linear) is configured.

## Layout

```
~/.dsh/tracker/
  config.yaml             # kind: local | github | gitlab, labels, paths
  issues/<NN>-<slug>.md   # one file per issue, numbered from 01
  specs/<NN>-<slug>.md    # one file per spec
  tickets/<NN>-<slug>.md  # one file per ticket
  labels.md               # canonical label vocabulary (default: 5-state triage)
```

Each `<NN>` is zero-padded (`01`, `02`, …) so `ls` returns them in order. Each file starts with a YAML front-matter block carrying the canonical roles, and a body that follows the per-artefact template (see `templates/`).

## Default config

```yaml
# ~/.dsh/tracker/config.yaml
kind: local
paths:
  issues: ~/.dsh/tracker/issues
  specs: ~/.dsh/tracker/specs
  tickets: ~/.dsh/tracker/tickets
labels:
  # Two categories:
  bug: bug
  enhancement: enhancement
  # Five states:
  needs-triage: needs-triage
  needs-info: needs-info
  ready-for-agent: ready-for-agent
  ready-for-human: ready-for-human
  wontfix: wontfix
```

The labels follow the canonical triage vocabulary from `mattpocock/skills` so cross-pollination with upstream is free. Override a label to map it to an existing tracker vocabulary (e.g. `needs-triage: "bug:triage"`).

## Creating an issue

1. Pick the next number under `issues/`: `ls ~/.dsh/tracker/issues | wc -l` then `printf '%02d' "$next"`.
2. Pick a slug from the issue title (`kebab-case`, ≤ 6 words).
3. Write `~/.dsh/tracker/issues/<NN>-<slug>.md`:

```markdown
---
kind: issue
state: needs-triage
category: bug | enhancement
created: 2026-09-05
---

# <title>

<body: what, who, why>

## Acceptance criteria

- [ ] criterion 1
- [ ] criterion 2
```

4. Run the file count again so the next caller sees the new max.

## Reading issues

- `ls ~/.dsh/tracker/issues` — all issues in numeric order.
- `ls ~/.dsh/tracker/issues | grep "01-"` — issue #1.
- `cat ~/.dsh/tracker/issues/01-*.md` — read body.

## Moving through states

Edit the `state:` front-matter key. The five canonical states (default `labels` block above) are the only legal values; any other value is a misuse and trips a checker.

## Specs and tickets

`specs/<NN>-<slug>.md` mirrors the to-spec template (Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope). `tickets/<NN>-<slug>.md` mirrors the to-tickets template (What to build, Blocked by, Acceptance criteria).

## Blocking edges (local only)

In the local tracker, blocking edges are **named** (text), not native (no GitHub `blocked by` link). The convention: in a ticket's `Blocked by:` section, list the blocking ticket numbers and slugs, not bare ids. `01-foo, 02-bar` is the canonical form.

## When to switch to a real tracker

The local tracker is the **default** for solo, single-machine, or experimental work. Switch to a real tracker (`kind: github` or `kind: gitlab`) the moment:

- **Multiple humans** need to read or move issues.
- **External users** are filing requests (bugs, feature asks).
- **Automation** (CI, release tooling) must observe state changes.
- **Cross-repo dependencies** require cross-repo links.

The other DSH skills (triage, to-spec, to-tickets) read `config.yaml.kind` and dispatch; switching to `github` swaps the local file writes for `gh issue create` / `gh issue edit` calls.

## Portability and review

- The whole `~/.dsh/tracker/` tree can be committed as a single git repo: `git init` in it, and `to-spec` / `to-tickets` can now be reviewed like any other Markdown.
- The local tracker never assumes a remote: it works offline, in airgapped machines, and in repos with no `origin`.
- An exported `tracker-<date>.tar.gz` is a single file that a fresh machine can drop in to reproduce the issue state.
