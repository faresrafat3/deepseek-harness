---
name: questionnaire
description: Turn a decision you can't answer alone into a Markdown questionnaire for the one person who can (filled in async, or together over a meeting). Use when the user is blocked by a question that lives in someone else's head — a stakeholder, a domain expert, a vendor — and the recipient needs a structured form to answer. The recipient holds the knowledge; the questionnaire pulls it out.
whenToUse: "Grill the *send*, not the subject. Interview the user only about who it's going to and what they need back. Then write a Markdown questionnaire aimed at the gap between what the recipient knows and what the user needs. Order questions most-important-first (async means you may only get one pass). Save as to-questionnaire-<slug>.md in the current directory."
metadata:
  category: productivity
  scope: communication
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, to-questionnaire)
---

# Questionnaire

Turn something the user can't answer alone into a **questionnaire** — a Markdown document they hand to one person to fill in async, or fill out together over a meeting.

**Grill the send, not the subject.** Interview the user only about the *send* (who it's going to, what they need back). The questions in the document then target the **gap** between what the recipient knows and what the user needs.

## Process

1. **Who is it going to?** Ask, in one exchange, the recipient's role, expertise, and relationship to the user. This fixes the questionnaire's tone and how much context it must carry.
2. **What do you need back?** Ask, in one exchange, the specific decisions or facts the user can't resolve alone and needs from this person.
3. **Write the questionnaire.** Draft questions aimed at the gap, following the document structure below. Save it to `to-questionnaire-<slug>.md` in the current directory (slug from the topic) and report the path.

## Document structure

Frame the document as a **discovery questionnaire**: the user lacks context, the recipient holds it. Order questions most-important-first, since async means you may only get one pass. Group them under `##` headings by theme once there are more than a handful.

```markdown
# <Questionnaire title>

**Purpose:** why this questionnaire exists and the decision riding on it.

**From:** <the user>, **To:** <the recipient>, **How your answers will be used:** <where they go>

## Context

One paragraph orienting a recipient who wasn't in the user's head. Enough to answer well, not a page.

## How to answer

Deadline and rough effort. Partial answers and "I don't know" are useful: flag anything you're unsure of rather than skipping it.

## <Theme heading>

One `##` section per theme. Under each, its questions, most-important-first. Every question is one idea, never compound, with an answer stub directly beneath, and a one-line _why this matters_ only where the question could be misread or invite a throwaway answer.

### What load is the system expected to handle at launch?

_Why this matters: it decides whether we provision for burst traffic now or defer it._

>

## Anything else?

A closing catch-all: anything we didn't ask that we should know?
```

## What comes back

The recipient's answers are material for `grill-with-docs` or `to-spec` — fold them into the design discussion or build a spec from them.

## Anti-patterns

- **Interviewing the user about the subject.** That's `grill-me`. The questionnaire is for the recipient.
- **Compound questions** ("What X and Y and Z?"). One idea per question.
- **Compound answers** ("yes and no"). The recipient should pick or say "depends on…".
- **Burying the most important question** in the middle. Async may only get one pass.
- **Skipping the context paragraph.** The recipient was not in the user's head; orient them.
