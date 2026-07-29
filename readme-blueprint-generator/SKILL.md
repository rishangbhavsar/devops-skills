---
name: readme-blueprint-generator
description: Generate or refresh a repository's README.md, grounded in the actual source tree. Use when the user asks to "generate/write/update the README", "create README.md", "document this repo's README", or wants a top-level project readme. Detects the technology stack, architecture, structure, workflow, and env vars from real files; if `.github/copilot/` docs or `copilot-instructions.md` exist it uses them as a fast path, otherwise it reads the code directly. Never invents facts not in the repo.
---

# README Generator Prompt

Generate a comprehensive `README.md` for this repository, grounded in files that actually exist.

## Grounding rules
- Every statement traces to a real file (manifest, source, config, CI). Can't determine it from the
  repo → omit the section or write `Not determined from repo` — never guess a stack, command, or
  version.
- Versions come from files only (`package.json`, `pyproject.toml`, `go.mod`, lockfiles). Not pinned
  → say so.
- Prefix any deduction with `Inferred:`.
- Never emit a secret value — name the env var and where its value comes from.

## Step 1 — Gather sources

1. **Fast path (if present):** scan `.github/copilot/` (Architecture, Code_Exemplars,
   Coding_Standards, Project_Folder_Structure, Technology_Stack, Unit_Tests, Workflow_Analysis,
   Environment_Variables) and `.github/copilot-instructions.md`. These are curated summaries — use
   them, but still confirm against the code before stating a fact.
2. **Always (and the sole source when the fast path is absent):** read the real repo —
   `git ls-files` for layout, the language manifest(s) for stack/versions/scripts, entry points,
   Dockerfile/compose/CI for how it builds and runs, and `.env.example` for env vars. Most repos
   have no `.github/copilot/` dir; in that case this step is the whole job, not a fallback.

## Step 2 — Write the README with the following sections

Below, "Source from the *X* file" means the `.github/copilot/` doc when it exists, otherwise the
corresponding real files from Step 1.

### Project Name and Description
- Extract the project name and primary purpose (manifest `name`/`description`, or the docs)
- Include a concise description of what the project does

### Technology Stack
- List the primary technologies, languages, and frameworks used
- Include version information when available
- Source this information primarily from the Technology_Stack file

### Project Architecture
- Provide a high-level overview of the architecture
- Consider including a simple diagram if described in the documentation
- Source from the Architecture file

### Getting Started
- Include installation instructions based on the technology stack
- Add setup and configuration steps
- Include any prerequisites

### Project Structure
- Brief overview of the folder organization
- Source from Project_Folder_Structure file

### Key Features
- List main functionality and features of the project
- Extract from the docs, or from entry points, routes/commands, and public API surface

### Development Workflow
- Summarize the development process
- Include information about branching strategy if available
- Source from Workflow_Analysis file

### Coding Standards
- Summarize key coding standards and conventions
- Source from the Coding_Standards file

### Testing
- Explain testing approach and tools
- Source from Unit_Tests file

### Contributing
- Guidelines for contributing to the project
- Reference any code exemplars for guidance
- Source from Code_Exemplars and copilot-instructions

### Environment variables
- List all the environment variables the project reads, one row each
- Include default values if available; never print a secret's real value
- Source from the Environment_Variables file or `.env.example` / code

Keep the README concise yet informative, focusing on what new developers or users would need to know about the project.