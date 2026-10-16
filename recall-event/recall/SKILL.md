---
name: recall
description: Recall and record learnings from this repo's learning store (.agent-recall/) — resolved incidents, proven practices, and past decisions with rationale, across any domain (coding, devops, product, planning, process). Use this skill when (a) the user reports — or you hit — an error, bug, incident, failure, regression, or flaky behavior; (b) starting non-trivial work like writing a plan, spec, design, rollout, estimate, or prioritization; (c) a decision is being made that may already have recorded rationale; (d) work concludes with something reusable learned — offer to save; (e) the user reports that a previously suggested fix/practice/decision worked or failed — record the outcome; (f) the user types /recall or /learn or says "save this as a learning", "remember this", or asks what has been learned. For (a)–(c), read REGISTRY.md unprompted (it's a few lines), then ASK — naming the matching domain and how many learnings it holds — before opening any learning file; explicit invocations in (f) run directly without asking.
---

# Learn — cross-domain learning store

A git-versioned knowledge base at `.agent-recall/` in the repo root. Three learning
types: **incident** (diagnosed problem + fix), **practice** (proven way of recurring
work), **decision** (choice + rationale, ADR-style).

**`references/PROTOCOL.md` is the source of truth — read it before your first store
interaction each session, then follow it.** It fully specifies every flow, format, and
rule below; this file only routes you to the right section. Don't improvise formats
(other agents parse them). `references/` has one example per type.

## Trigger → flow

| Situation | Flow |
|---|---|
| The user reports — or you hit — an error/incident/failure | **RECALL** §5 — read REGISTRY, ask only if a domain matches, then check for a prior fix before debugging |
| Starting non-trivial work (plan, spec, design, rollout, estimate, prioritization) | **RECALL** §5 — same: registry first, ask on a hit, then surface prior practices/decisions |
| A recalled learning was applied, OR the user reports a past suggestion worked/failed | **RECORD OUTCOME** §6 — on an explicit outcome only; no approval needed |
| Work concludes with something reusable | **Offer SAVE** §7 — "worth saving as a <type>? (y/n)" |
| `/recall` or "remember this" | **SAVE** §7 (or direct RECALL) — no ask; write only on explicit "yes" |

## Init (first SAVE only, if `.agent-recall/` is absent)

Create the dir; copy `references/PROTOCOL.md` → `.agent-recall/PROTOCOL.md` verbatim;
create `REGISTRY.md` with only `# Format: <domain-slug> | <scope, max 10 words> — see
PROTOCOL.md`; include all in the same `learn(...)` commit. Never init
for a recall — an empty store has nothing to recall.

## Non-negotiables (full rules in PROTOCOL.md)

- Read `REGISTRY.md` unasked, then ask — naming the hit — before opening any learning
  (except explicit `/recall`).
- **Never record a Signal or Verification you didn't actually run.**
- Never increment a counter on silence — only on an explicit outcome.
- Write only after an explicit "yes"; never store secrets.
