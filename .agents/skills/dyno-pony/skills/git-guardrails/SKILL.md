---
name: git-guardrails
description: Set up a PreToolUse hook that blocks dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute in the bash tool. Use when the user wants to prevent destructive git operations, add git safety hooks, or says "block git push", "stop me from doing X", "safety net for git".
whenToUse: "A bash hook that runs before any bash call and rejects `git push` (all variants), `git reset --hard`, `git clean -f`/`-fd`, `git branch -D`, `git checkout .`, `git restore .`. The blocked command exits with code 2 and prints a clear BLOCKED message. Scope: project-local (`.claude/settings.json` or DSH equivalent) or global (`~/.claude/settings.json`)."
metadata:
  category: safety
  scope: hook
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, git-guardrails-claude-code)
---

# Git Guardrails

A **PreToolUse hook** that intercepts and blocks dangerous git commands before they execute. The agent sees a message telling it that it does not have authority to access these commands.

## What gets blocked

- `git push` (all variants including `--force`)
- `git reset --hard`
- `git clean -f` / `git clean -fd`
- `git branch -D`
- `git checkout .` / `git restore .`

When blocked, the agent sees a BLOCKED message and exit code 2.

## Setup

### 1. Choose scope

Ask the user: install for **this project only** or **all projects**?

- **Project-local** lives at `<repo>/.claude/settings.json` (or the DSH equivalent for the agent runtime).
- **Global** lives at `~/.claude/settings.json`.

DSH's `bash` capability accepts a `PreToolUse` hook list. See the DSH docs for the exact registration point in the user's runtime.

### 2. Install the hook script

Copy the script to:

- **Project**: `<repo>/.claude/hooks/block-dangerous-git.sh`
- **Global**: `~/.claude/hooks/block-dangerous-git.sh`

Make it executable: `chmod +x <path>`.

The script reads the bash tool's input as JSON (`{"tool_input":{"command":"..."}}`), matches the command against the blocked list, and exits 2 + prints a BLOCKED message to stderr on a hit.

### 3. Register the hook

Add the hook to the appropriate settings file:

**Project-local**:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.sh"
          }
        ]
      }
    ]
  }
}
```

**Global**: same shape, with `~/.claude/hooks/block-dangerous-git.sh` as the command.

If the settings file already exists, merge the hook into the existing `hooks.PreToolUse` array. Don't overwrite other settings.

### 4. Customise (optional)

Ask the user if they want to add or remove any patterns from the blocked list. Common additions:

- `git stash drop` — drop a stash without confirmation.
- `git tag -d <name>` — delete a tag.
- `git rebase` — interactive or otherwise (without a clear strategy).

### 5. Verify

Run a quick test against the installed script:

```bash
echo '{"tool_input":{"command":"git push origin main"}}' | <path-to-script>
```

Should exit with code 2 and print a BLOCKED message to stderr. Repeat for each blocked pattern.

## What this is NOT

- A substitute for backup. Branch protections and reflogs are the durable safety; this hook catches the agent's destructive commands.
- A guarantee. The hook matches against the *command* string, not the *effect*; an alias or wrapper that doesn't surface `git push` in argv evades it.
- A way to allow-list. This hook is a **block-list**; for an allow-list, swap the script for a positive check.

## Failure modes

- **Hook path moved.** A relocate of `~/.claude/hooks/` without updating the settings file silently disables the guard. Verify the path on every install.
- **Settings file overwritten.** If a sync or tool overwrites the settings, the hook is gone. Add a check-in test (curl-like invocation) to the project's `pre-commit` if you have one.
- **New destructive command not on the list.** The list is a snapshot, not a guarantee. Review it when adopting a new tool or workflow.
