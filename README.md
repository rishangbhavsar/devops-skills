# DevOps Agent Skills

A collection of standalone agent skills for infrastructure discovery, repository documentation, environment-variable inventory, and project-local learning.

## Skills

| Skill | Purpose |
|---|---|
| [`infra-blueprint-generator`](infra-blueprint-generator/SKILL.md) | Generates evidence-based infrastructure architecture, inventories, Mermaid diagrams, module documentation, and an agent index under `.knowledge/blueprint/`. |
| [`readme-blueprint-generator`](readme-blueprint-generator/SKILL.md) | Creates or updates a repository README from project files and `.github/copilot/` documentation. |
| [`sync-envs`](sync-envs/SKILL.md) | Scans environment-variable reads and declarations, then safely creates or merges a searchable `envs.md` across one or more services. |
| [`recall`](recall-event/README.md) | Stores and recalls outcome-tracked incidents, practices, and decisions in a project-local `.agent-recall/` knowledge base. |

## Installation

Copy the desired skill directory into the skills location supported by your agent. For Claude Code, use a project-level directory such as:

```text
.claude/skills/<skill-name>/
```

Single-file skills need a directory containing `SKILL.md`. Install Recall by copying `recall-event/recall/` as the `recall` skill so its `references/` files remain beside `SKILL.md`.

Example:

```bash
mkdir -p .claude/skills
cp -R infra-blueprint-generator .claude/skills/
cp -R recall-event/recall .claude/skills/recall
```

Adapt the destination for agents that use a different skill layout.

## Repository guidance

Shared contribution and validation instructions are in [`AGENTS.md`](AGENTS.md). `CLAUDE.md` points Claude Code to that file.

These skills may inspect configuration and deployment files. They must document secret names or managed locations only—never secret values.

## Related resources

- [Project workflow analysis blueprint generator](https://www.skills.sh/github/awesome-copilot/project-workflow-analysis-blueprint-generator)
- [Architecture blueprint generator](https://www.skills.sh/github/awesome-copilot/architecture-blueprint-generator)
