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

## Step 2 — Write the README

Sections in this order. `←` names the `.github/copilot/` doc to source from when it exists;
otherwise use the real files from Step 1.

- **Project Name and Description** ← manifest `name`/`description` — what the project does, concisely
- **Technology Stack** ← Technology_Stack — languages, frameworks, versions
- **Project Architecture** ← Architecture — high-level overview; a simple diagram if documented
- **Getting Started** ← manifests, Dockerfile/compose — prerequisites, install, setup, config
- **Project Structure** ← Project_Folder_Structure — folder organization
- **Key Features** ← entry points, routes/commands, public API surface
- **Development Workflow** ← Workflow_Analysis — dev process, branching strategy if available
- **Coding Standards** ← Coding_Standards
- **Testing** ← Unit_Tests — approach and tools
- **Contributing** ← Code_Exemplars, copilot-instructions
- **Environment variables** ← Environment_Variables, `.env.example`, code — one row per var, with
  default if available

Keep it concise: what a new developer or user needs to know.
