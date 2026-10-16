# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **registry of Claude Code Agent Skills for DevOps workflows** — a curated collection of
standalone skills, each installable independently into a target repo's `.claude/skills/`. There is no
build, lint, or test toolchain — each skill is a self-contained Markdown prompt (plus optional
reference files) that gets copied into a target repo's `.claude/skills/` directory and invoked by
an agent there. Changes here are validated by reading and reasoning about the prompt text, not by
running code.

## Layout

- `infra-blueprint-generator/SKILL.md` — single-file skill. Generates architecture documentation
  (single `.knowledge/blueprint/infra_blueprint.md`) for DevOps/IaC repos (Terraform, Ansible,
  Kubernetes, Helm, ArgoCD, GitHub Actions). Stack/cloud are auto-detected, not configured. Points
  at files/globs instead of enumerating resources; only Applications and Configuration get tables.
- `readme-blueprint-generator/SKILL.md` — single-file skill. Generates a repository `README.md`,
  grounded in the actual source tree (with an optional fast path when `.github/copilot/` docs
  exist). Same never-guess grounding discipline as the other skills.
- `sync-envs/SKILL.md` — single-file skill. Scans a repo (or every microservice repo beneath CWD)
  for env-var reads and generates a searchable `envs.md` knowledge base (Variable | Type | Default
  | Description). Re-runs merge rather than clobber hand-curated descriptions.
- `recall-event/` — multi-file skill (`recall/`) implementing a git-versioned, outcome-tracked
  learning store (`.agent-recall/` in a target repo) with three learning types: incident,
  practice, decision. (Directory is `recall-event/`; the skill's `name` is `recall`.)
  - `recall/SKILL.md` — trigger description + routing table; defers all actual rules to
    `references/PROTOCOL.md`.
  - `recall/references/PROTOCOL.md` — source of truth for every flow, format, and rule (recall,
    record-outcome, save, supersede, confidence derivation, safety rules). Edit here, not in
    SKILL.md, when changing behavior.
  - `recall/references/EXAMPLE-{incident,practice,decision}.md` — canonical worked examples of
    each learning-file format; other agents parse these formats, so don't improvise new fields.
  - `evals/evals.json` — scenario-based evals (prompt + expected behavior + pass/fail assertions)
    used to check the skill's behavior end-to-end; there's no runner script, evals are executed by
    having an agent follow the prompt and grading the transcript against the assertions.
  - `README.md` — install instructions and design rationale; keep in sync with SKILL.md/PROTOCOL.md
    if triggering conditions or store layout change.
- `html-plan-report/` — multi-file skill. Writes a coding task's plan as an HTML page under
  `.plan/` in the target repo, settles decisions via AskUserQuestion, gates coding on approval.
  - `SKILL.md` — workflow; `references/visual-guide.md` — diagram rules.
  - `assets/` — `plan-template.html` / `plan-lite.html` plus shared `plan.css`/`plan.js`
    (synced to `.plan/_assets/`, never inlined).
  - `scripts/` — stdlib Python: `validate_plan.py`, `update_index.py` (builds `.plan/index.html`),
    `bundle_plan.py` (single-file export). These are the only runnable code in the repo.
  - `overwrite.example.md` — sample; users copy it to `overwrite.md` to override defaults.

## Conventions when editing a skill

- **SKILL.md frontmatter (`name`, `description`) is the sole triggering mechanism** — the
  description must enumerate concrete trigger phrases/situations, since agents match on it to
  decide when to invoke the skill. When triggering feels off, tune wording here first.
- Every skill instructs the agent to ground output in files that actually exist in the target
  repo and to never guess (e.g. infra-blueprint-generator's "Grounding Rules": cite a file path
  per claim, mark inferences as `Inferred:`, never invent versions or secret values). Preserve this
  pattern in any new skill or edit.
- Keep large, stable rule sets in a `references/*.md` file and have `SKILL.md` route to it rather
  than duplicating rules inline (see `recall`'s SKILL.md → PROTOCOL.md split). This keeps the
  always-loaded SKILL.md small.
- Never have a skill store secrets — only key names and where the value lives. This is enforced
  explicitly in `recall`'s PROTOCOL.md §8 (Security) and tested by `evals/evals.json` eval #3; carry the same
  rule into any skill that touches config/secrets data.
- `recall`'s file formats (frontmatter schema, INDEX.md line format, REGISTRY.md format) are parsed
  by other agents/tools — don't change field names or structure without updating every example in
  `references/` and the description in `README.md`.
