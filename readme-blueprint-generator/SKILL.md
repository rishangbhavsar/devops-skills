---
name: readme-blueprint-generator
description: Generate a repository README from `.github/copilot/`, `.github/copilot-instructions.md`, and project files. Use when creating or refreshing developer-facing setup, architecture, workflow, and contribution documentation.
---

# README Blueprint Generator

Create or update the repository-root `README.md` using evidence from the repository.

## Sources

1. Read `.github/copilot-instructions.md` and all files under `.github/copilot/` when present, especially documentation for architecture, technology stack, folder structure, workflows, coding standards, tests, code exemplars, and environment variables.
2. Verify commands, versions, paths, and configuration against project files. Do not invent missing details.
3. Preserve accurate, useful content from an existing `README.md`.

## README Content

Include applicable sections only:

- **Project name and description:** purpose and primary functionality
- **Technology stack:** languages, frameworks, tools, and versions when pinned
- **Architecture:** high-level components and relationships; add a simple Mermaid diagram only when supported by the sources
- **Getting started:** prerequisites, installation, configuration, and runnable commands
- **Project structure:** important directories and their roles
- **Key features:** implemented capabilities
- **Development workflow:** local workflow, branching, builds, and releases
- **Coding standards:** repository-specific conventions
- **Testing:** test tools and exact commands
- **Contributing:** contribution steps and links to relevant guidance or exemplars
- **Environment variables:** name, purpose, required/optional status, and non-secret default when documented

## Rules

- Optimize for a new developer getting the project running and making a safe first change.
- Use exact commands and relative links.
- Prefer concise tables for structured information.
- Never expose secret values or present example credentials as real defaults.
- If required information is unavailable, omit the claim or state that it is not documented.
- Keep the README concise; link to detailed repository documentation instead of duplicating it.
