# recall — a self-learning skill for agents

A Claude Code skill that gives your agent an **outcome-tracked memory of what works
here** — across any domain: coding, devops, product management, planning, process.
Three learning types share one lifecycle: **incident** (diagnosed problem + fix),
**practice** (proven way of doing recurring work), and **decision** (choice made +
rationale, ADR-style). Learn something once, save it (with your y/n approval), and the
agent recalls it the next time the situation appears — announcing exactly which learning
it's applying and tracking whether it actually helped. Confidence is **earned from real
success/failure counts**, never estimated.

Because the store is plain markdown committed to your repo, it's shared with your whole
team automatically and readable by any other agent (see [Other agents](#other-agents)).

## What it does

Three flows; `recall/references/PROTOCOL.md` is the full spec.

- **RECALL** (§5) — on an error, or at the start of a plan/spec/design, the agent reads
  `.agent-recall/REGISTRY.md`, asks *"3 `k8s` learnings may cover this — read them? (y/n)"* on a
  domain hit, picks among candidates by running their **Signals**, and announces provenance
  (ID, confidence, stats) before applying.
- **RECORD OUTCOME** (§6) — stats move only on an explicit worked/failed report, even a late one
  next session; silence counts as nothing. Confidence is derived from those counts.
- **SAVE** (§7) — after a hard-won fix, proven approach, or decision, the agent dedup-checks by
  content, classifies CREATE / APPEND / SUPERSEDE, shows the exact bytes, and writes only on "yes"
  as its own `learn(<domain>): ...` commit.

## Install (Claude Code)

1. Copy the `recall/` folder into your repo at `.claude/skills/recall/`
   (or `~/.claude/skills/recall/` to enable it across all projects).
2. That's it. The store (`.agent-recall/`) is created automatically in the repo root
   the first time a learning is saved, including a copy of PROTOCOL.md so the store is
   self-describing. Update the skill later and the agent notices the version mismatch on
   its next store interaction and offers to refresh that copy.
3. Recommended: also add the one-liner below to your `CLAUDE.md` — the skill description
   handles triggering, but a standing instruction makes recall-before-debugging more
   reliable:

   > Before debugging any reported error or incident, check `.agent-recall/REGISTRY.md`
   > for a prior learning (see the `recall` skill).

## Store layout (created on first save)

```
.agent-recall/
├── PROTOCOL.md            # the rules — copied from the skill, single source of truth
├── REGISTRY.md            # one line per domain; read first — a domain absent here is unrecallable
└── <domain>/
    ├── INDEX.md           # id | type | title | confidence | ok:N fail:N  (one per learning)
    └── L-0001-<slug>.md   # YAML frontmatter (type, stats, context, status) + typed
                           #   body: Signals + Fix/Approach/Decision + Pitfalls
```

Retiring a learning is `git rm` — history keeps it, so there's no archive directory to
maintain. Timestamps come from `git log` rather than fields in the files.

See `recall/references/EXAMPLE-{incident,practice,decision}.md` for complete examples of each type.

## Other agents

The store is agent-agnostic: everything an agent needs is in
`.agent-recall/PROTOCOL.md`, which lives in your repo after first save. To make
Codex, OpenCode, Cursor, Hermes, or any other agent participate, add one instruction to
your `AGENTS.md` (or the agent's equivalent rules file):

> This repo maintains an incident learning store. Before debugging any reported
> error, and before saving any fix, read and follow `.agent-recall/PROTOCOL.md`.

That single pointer is sufficient — the protocol file itself contains the full recall,
outcome-recording, and approval rules. (Cursor users: put the same text in a
`.cursor/rules/` file with `alwaysApply: true`. Claude Code + AGENTS.md repos: CLAUDE.md
can import it via `@AGENTS.md`.)

## Tweaking

- **Triggering too rarely / too often?** Edit the `description` in `recall/SKILL.md` —
  it's the sole triggering mechanism. Add or remove trigger words (your team's jargon:
  "sev2", "pager", "PRD", "sprint plan"). The start-of-work recall trigger (plans,
  specs, designs) is the most likely to under-fire — reinforce it via the CLAUDE.md
  one-liner if needed.
- **Recall reads the registry silently, then asks before opening any learning**
  (PROTOCOL.md §5 step 0). Want it fully silent (no ask at all) or fully manual (only
  `/recall` ever recalls)? Change §5 step 0 accordingly.
- **Stricter control?** PROTOCOL.md §6 lets outcome bookkeeping (stat updates) happen
  without approval. If you want approval on those too, change §6 rule 4.

## Why not built-in memory?

Claude Code auto memory is machine-local free-form notes; Hermes skills self-improve via LLM
review. Neither tracks *which learning was applied where and whether it helped*. This store adds
typed schemas, announced provenance, outcome-earned confidence, Signals-based diagnosis, a
supersede loop, human-approved writes, and git-native sharing across agents — and it refuses to
record checks it never ran, because a store of plausible guesses is worse than none.
