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

Three flows, all governed by `recall/references/PROTOCOL.md`:

- **RECALL** — on a reported problem, OR when starting non-trivial work (a plan, spec,
  design, rollout, prioritization), the agent checks `.agent-recall/REGISTRY.md` →
  the matching domain's `INDEX.md` → the learning file(s). When several learnings match
  one situation (one symptom with multiple root causes; one task with several
  context-dependent practices), it runs their **Signals** to determine which applies
  now, then announces provenance before applying: *"Found prior learning `k8s/L-0001`
  (incident, confidence HIGH, 3 ok/1 fail): increase
  --max-mutating-requests-inflight. Applying."* Decisions are announced as
  *"Per prior decision `product/L-0003`: ... Following it unless you want to revisit."*
- **RECORD OUTCOME** — after every application the learning's stats are updated
  (success or failure — your word is final). Failed fixes get a dated note in the
  learning's Pitfalls section, and repeated failure drives confidence down and
  eventually triggers a supersede suggestion.
- **SAVE** — after a hard-won fix, a proven approach, or a considered decision (or when
  you type `/recall`), the agent picks the type, dedup-checks the store, classifies the
  write (CREATE / APPEND / VERSION / SUPERSEDE — where an alternative valid
  cause/approach is a cross-linked CREATE, and SUPERSEDE is reserved for learnings that
  were wrong or obsolete), shows you a summary, and writes only after you say yes — as
  its own `learn(<domain>): ...` commit.

## Install (Claude Code)

1. Copy the `recall/` folder into your repo at `.claude/skills/recall/`
   (or `~/.claude/skills/recall/` to enable it across all projects).
2. That's it. The store (`.agent-recall/`) is created automatically in the repo root
   the first time a learning is saved, including a copy of PROTOCOL.md so the store is
   self-describing.
3. Recommended: also add the one-liner below to your `CLAUDE.md` — the skill description
   handles triggering, but a standing instruction makes recall-before-debugging more
   reliable:

   > Before debugging any reported error or incident, check `.agent-recall/REGISTRY.md`
   > for a prior learning (see the `recall` skill).

## Store layout (created on first save)

```
.agent-recall/
├── PROTOCOL.md            # the rules — copied from the skill, single source of truth
├── REGISTRY.md            # one line per domain; always read first (hard char cap)
├── <domain>/
│   ├── INDEX.md           # id | problem | confidence | ok:N fail:N  (one line per learning)
│   └── L-0001-<slug>.md   # YAML frontmatter (type, stats, context, status) + typed
│                          #   body: Signals + Fix/Approach/Decision + Pitfalls
└── _archive/              # retired learnings — never deleted
```

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
- **Stricter control?** PROTOCOL.md §6 lets outcome bookkeeping (stat updates) happen
  without approval. If you want approval on those too, change §6 rule 4.
- **Different decay thresholds?** Staleness (12 months) and failure thresholds live in
  PROTOCOL.md §8.
- **Domain cap** (30 domains / 2,500 chars) is in §2 — raise it if your registry grows,
  but remember it loads on every incident.

## Why not built-in memory?

Claude Code auto memory is machine-local free-form notes; Hermes skills self-improve via
LLM review. Neither tracks *which learning was applied to which situation and whether it
helped*. This skill's differentiators: typed learning schemas (incident / practice /
decision) instead of free-form notes, provenance announced on every recall, confidence
earned from recorded outcomes, multi-cause diagnosis via Signals before applying any
fix, an explicit wrong-learning → supersede loop, human-approved writes, and git-native
team sharing across different agents.

## Roadmap ideas

- `learn-cli` for deterministic frontmatter surgery (`record-outcome`, `prune`, `stats`)
  if agents mangle YAML.
- A Claude Code Stop hook that auto-offers SAVE after resolved incidents.
- FTS search helper for domains that outgrow readable indexes (>~50 learnings).
