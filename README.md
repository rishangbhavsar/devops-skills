# devops-skills

A registry of [Claude Code](https://claude.com/claude-code) Agent Skills for DevOps workflows.
Each skill is a standalone Markdown prompt (plus optional reference files) that you copy into a
target repo's `.claude/skills/` and invoke from an agent. No build, lint, or test toolchain — a
skill is validated by reading and reasoning about its prompt text.

## Skills

| Skill | What it does |
|-------|--------------|
| [`infra-blueprint-generator`](infra-blueprint-generator/) | Documents a DevOps/IaC repo (Terraform, Ansible, Kubernetes, Helm, ArgoCD, GitHub Actions, AWS/Azure/GCP) into `.knowledge/blueprint/` — architecture overview, Mermaid diagrams, per-domain docs enumerating every resource with its source file, `llms.md` index. |
| [`readme-blueprint-generator`](readme-blueprint-generator/) | Generates or refreshes a repo's `README.md`, grounded in the actual source tree (with a fast path when `.github/copilot/` docs exist). |
| [`sync-envs`](sync-envs/) | Scans one repo (or every microservice repo beneath CWD) for env-var reads and produces a searchable `envs.md` knowledge base. Re-runs merge, not clobber. |
| [`recall-event`](recall-event/) | A git-versioned, outcome-tracked learning store (`.agent-recall/`) with three learning types — incident, practice, decision. Skill `name` is `recall`; see its [README](recall-event/README.md). |

## Install

Copy the skill's folder into a target repo:

```bash
DEST=<target-repo>/.claude/skills

# single-file skills (-D creates the parent dirs)
install -D infra-blueprint-generator/SKILL.md  "$DEST/infra-blueprint-generator/SKILL.md"
install -D readme-blueprint-generator/SKILL.md "$DEST/readme-blueprint-generator/SKILL.md"
install -D sync-envs/SKILL.md                  "$DEST/sync-envs/SKILL.md"

# multi-file skill (copy the whole recall/ folder)
mkdir -p "$DEST" && cp -r recall-event/recall "$DEST/recall"
```

Use `~/.claude/skills/` instead of `<target-repo>/.claude/skills/` to enable a skill across all
projects. Each skill's `SKILL.md` `description` frontmatter is the sole triggering mechanism — the
agent decides when to invoke based on it.

## Extra links
- https://www.skills.sh/github/awesome-copilot/project-workflow-analysis-blueprint-generator
- https://www.skills.sh/github/awesome-copilot/architecture-blueprint-generator
