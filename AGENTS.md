# AGENTS.md

## Repository purpose

This repository contains standalone agent skills for DevOps and development workflows. Skills are Markdown prompts copied into an agent's project- or user-level skills directory. There is no shared build system or runtime.

## Skills

- `infra-blueprint-generator/SKILL.md` — generates evidence-based infrastructure documentation in `.knowledge/blueprint/`.
- `readme-blueprint-generator/SKILL.md` — creates or refreshes a repository README from project evidence and Copilot documentation.
- `sync-envs/SKILL.md` — inventories environment variables across one project or multiple repositories and maintains `envs.md`.
- `recall-event/recall/` — maintains a project-local `.agent-recall/` store for incidents, practices, and decisions.
  - `SKILL.md` routes recall, outcome, and save flows.
  - `references/PROTOCOL.md` defines behavior and file formats.
  - `references/EXAMPLE-*.md` are canonical schema examples.
  - `recall-event/evals/evals.json` contains behavior scenarios and assertions.
  - `recall-event/README.md` documents installation and usage.

## Editing conventions

- Keep `SKILL.md` frontmatter descriptions concise and specific enough to trigger on intended requests.
- Ground generated output in files that exist; mark inferences and never invent versions, commands, or architecture.
- Never expose or persist secret values. Document variable names and managed sources only.
- Prefer short `SKILL.md` routing instructions. Put large, stable contracts in `references/` when needed.
- Keep related protocol, examples, evals, and README documentation consistent.
- Preserve user-authored content when a skill updates existing files; require explicit approval before destructive replacement.
- Avoid mandatory tools, network access, or Git operations unless they are essential to the skill's stated behavior. Provide safe fallback behavior when they fail.

## Validation

There is no repository-wide test command. For changed skills:

1. Run `git diff --check`.
2. Validate JSON files with `python -m json.tool <file>`.
3. Check Markdown frontmatter, links, examples, and referenced paths.
4. For `recall-event`, verify protocol, examples, evals, and README remain aligned.
5. Review the diff for duplicated instructions, unsafe commands, project-specific assumptions, and accidental secret exposure.

Do not commit or push unless the user explicitly asks.
