---
name: research
description: Delegate reading legwork to a background agent that investigates a question against primary sources and captures findings as a cited Markdown file. Use when the user wants a topic researched, docs or API facts gathered, or says "research this", "look up", "what does X say", "find the docs for", or hands over a question that's too long to read in-line.
whenToUse: "Spin up a background agent (DSH subagent) to do the reading. The subagent investigates the question against primary sources (official docs, source code, specs, first-party APIs), cites every claim, and writes a single Markdown file. The current session keeps working."
metadata:
  category: engineering
  scope: research
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, research)
---

# Research

Delegate reading legwork to a **background agent** so the current session keeps working. The subagent investigates, cites, and writes a single Markdown file.

## The brief

A research brief has four sections:

1. **The question.** One paragraph. State what the next session needs to know.
2. **The scope.** What's in and what's out (versions, platforms, time range).
3. **The deliverable.** A path for the output file. Use `~/.dsh/research/<YYYY-MM-DD>-<slug>.md` by default, or a repo path the user names.
4. **The sources.** What counts as a primary source for this question. (Default: official docs, source code, specs, first-party APIs.)

## The subagent's job

1. **Investigate against primary sources.** Not a secondary write-up of them. Follow every claim back to the source that owns it.
2. **Cite each claim.** Every factual line in the output file carries a source link.
3. **Write to the deliverable path.** A single Markdown file. Citations inline as `[label](url)` or numbered footnotes.
4. **Match the repo's convention.** If the repo already keeps research notes somewhere, put it there. If none, the default path is `~/.dsh/research/`.

## When to reach for it

- The question requires reading more than a few hundred lines.
- The current session is mid-flow and a long read would derail it.
- The question is reusable — another session will want the same answer later.
- The answer benefits from citations the user can verify.

## When not to reach for it

- The question is one or two short lookups the current agent can do with `grep` or `web_search` in seconds.
- The answer is a one-line fact, not a written-up finding.
- The session is so short-lived that a background subagent will outlive it.

## Working while it reads

The current session does **not** wait. The subagent returns a structured report when it finishes. The current session continues with the part of the work that doesn't depend on the answer; the part that does is parked, picked up when the report lands.

## Anti-patterns

- **Citing the search summary, not the source.** A search hit that paraphrases the docs is not a primary source. Quote the docs.
- **Restating the question as the answer.** The subagent's job is to find the answer in primary sources, not to rephrase the brief.
- **Saving the artifact to the workspace by default.** Use `~/.dsh/research/` unless the user names a path. The research file is a session artifact, not project content.
- **Skipping citations on "obvious" claims.** Every factual line gets one.

## What the next session does with it

The research file is input to the next skill in the chain. Usually:

- `grill-with-docs` — to convert the findings into a design discussion.
- `to-spec` — to turn the findings into a spec the team can build.
- `domain-modeling` — to fold new terms into `CONTEXT.md`.
