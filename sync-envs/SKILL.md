---
name: sync-envs
description: Scan a project's (or every microservice repo's) source code for the environment variables it reads and generate an envs.md knowledge base — a Markdown table of Variable | Type | Default | Description so a team can search in plain English which var controls what. Use this whenever the user asks to "sync envs", "generate/update envs.md", "document/catalog environment variables", "list env vars used in the project", "what env vars does this service need", or wants an env-var reference across one or more microservices — even if they don't say "envs.md" by name.
---

# Generate envs.md

Scan a project's source and produce `envs.md` — a searchable **knowledge base** of every env var the
code reads. A teammate should be able to query it in plain English ("what sets the DB password?",
"where's the auth config?") and land on the right variable, so the **Description** must carry the
searchable concepts: the subsystem, the external service, and what the var controls.

## 1. Resolve scope

Run `git rev-parse --show-toplevel`.

- **Inside a git repo** → work at the repo root; write one `envs.md` there.
- **Not a git repo** → find every repo beneath CWD with `fd -H -t d '^\.git$' . -x dirname {}`; for
  each, `cd` in, `git pull --ff-only` (skip + note on failure), process independently.

## 2. Find every env-var read

Grep the tracked source for these idioms (languages the repo doesn't use just return nothing):
- **Node/JS/TS**: `process.env.NAME`, `process.env['NAME']`, `import.meta.env.NAME`
- **Python**: `os.environ[...]`, `os.getenv(...)`, Pydantic `BaseSettings` fields
- **Go**: `os.Getenv(...)`, `os.LookupEnv(...)`
- **Java/Spring**: `System.getenv(...)`, `@Value("${NAME}")`, `${NAME}` in `application.yml`/`.properties`
- **Ruby**: `ENV[...]`, `ENV.fetch(...)`
- **Shell/Docker**: `${NAME}` in scripts, `ENV`/`ARG` in `Dockerfile`, `environment:` in compose
- **Config**: keys in `.env.example`/`.sample`/`.template`, k8s/Helm `env:` blocks

Extract just the name (portable `grep`, since target repos may lack `rg`). Grep **tracked files
only** via `git ls-files` so you don't recurse into `node_modules/`, `vendor/`, or build output:
```bash
git ls-files -z | xargs -0 grep -hoE "process\.env\.[A-Z0-9_]+" | sed 's/.*\.//' | sort -u
```
Adapt the pattern per language. **Dynamic names** (`os.getenv(f"{prefix}_URL")`, `process.env[key]`)
can't be grepped — note the pattern in a row rather than dropping it.

**Custom accessors:** projects often wrap env reads in a helper or config object rather than calling
the raw idioms everywhere (e.g. *something like* `config.get("X")`, `getEnv("X")`, `settings.X`, a
`Config`/`Env` class — these are illustrations, not names to grep for). You must **identify the
project's actual wrapper**: find where the raw idioms are called, and if they're centralized in one
helper/class, that's the accessor — then track *its* call sites to enumerate the vars. Not always
present, but check; missing it means missing every var read through it.

Sometimes the wrapper doesn't read fixed names at all — it resolves **reference tokens from config
files** (e.g. `${env.NAME}` / `${input:name}` in a YAML/JSON spec). The call sites then reveal no
concrete names; the names live in the config and docs. When you find such a resolver, grep the config
and example specs for its token syntax to enumerate the vars, and add one row describing the dynamic
pattern itself so a reader knows any such token is a required env var.

Then **read each var's call sites** so the Description reflects real purpose, not a name-guess.

## 3. Fill each row (from the code, never guessing)

- **Type** — `string` | `integer` | `boolean` | `enum` | `url` | `path`. Infer from usage: `integer`
  if parsed (`int()`/`parseInt`/`Atoi`), `boolean` if compared truthy, `enum` if checked against a
  fixed set (list the values in Description), else `string`.
- **Default** — the code's fallback literal (`os.getenv("X", "5")` → `5`; `.env.example` value); `-`
  if required with none. When the literal is a sentinel the code reinterprets (e.g. `getenv("X", "")`
  then treated as enabled unless `0/false/no`), record the **effective** default (`true`), not the raw
  `""`.
- **Description** — for plain-English search. State (a) the subsystem/feature (auth, database, email,
  caching, logging…), (b) any external service it points at, (c) what changing it does. One or two
  sentences.

## Grounding rules

- Every var comes from a real match in a tracked file — cite nothing you didn't grep. If purpose is
  unclear from code, write `Inferred: <guess>`, don't invent.
- **Secrets belong in the table.** For credential-like names (`KEY|TOKEN|SECRET|PASSWORD|PASS|CREDENTIAL|PRIVATE`)
  keep the data-type, describe what it authenticates and to which service — but **never emit the real
  value**: Default is the fallback only if clearly a placeholder/mock, else `-` or `null`.
- **Reconcile declared vs. used.** Cross-check code reads against whatever declares vars —
  `.env.example`/compose/Helm, or (if none exist) example spec/config files. Include a var found in
  either place; if it's declared but never read, or read but declared nowhere, list it and say so —
  visible gaps keep the KB trustworthy.
- **Test-only vars** (matched only under `tests/`, `spec/`, `__tests__`) are usually noise for a
  runtime KB — include them only with a `Test-only` note in the Description, or omit if clearly a
  fixture. Don't drop them silently.

## Output — `envs.md`

Both cases use the same structure — `# Environment Variables` title, the generated-by line, one `##`
section per service (with its table), and a closing per-service summary. The only difference:

- **Single repo** → `envs.md` at the repo root, one `##` section, no index.
- **Multiple repos** → one consolidated `envs.md` at CWD (don't scatter it), a `##` section per
  service, preceded by a linked index so readers can jump by name:

```markdown
# Environment Variables

_Generated by /sync-envs — <total> variables across <N> services._

- [<Service Name> — <repo-name>](#anchor)   ← index: multi-repo only
```

Each section is headed with a friendly service name + the git project name — derived from the git
remote basename or directory name, **never hardcoded**. Sort rows alphabetically. Example:

```markdown
## <Service Name> <repo-name>

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `HOST` | string | `0.0.0.0` | IP to bind the server to; `0.0.0.0` exposes on all interfaces |
| `PORT` | integer | `8080` | HTTP port the app listens on |
| `RELOAD` | boolean | `true` | Auto-reload on source changes (dev only; disable in production) |
| `LOG_LEVEL` | enum | `DEBUG` | Log verbosity: NOTSET, DEBUG, INFO, WARNING, ERROR, FATAL |
| `<DB>_PASSWORD` | string | - | Password for the database user; required to connect to the data store |
| `<IDP>_SERVER_URL` | url | - | Base URL of the identity provider used for auth |
```

End with a one-line summary per service (path + variable count).

## Updating an existing envs.md

A re-run must **merge, not clobber** — teammates hand-curate descriptions. If `envs.md` exists: add
rows for new vars; **keep the existing Description** for vars still present (rewrite only if the code's
type/default changed); don't delete a vanished var — mark it `⚠️ not found in latest scan`. Report
added / updated / flagged counts per service.
