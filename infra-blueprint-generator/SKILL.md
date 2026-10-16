---
name: infra-blueprint-generator
description: 'Blueprint generator for DevOps/infrastructure repositories. Analyzes IaC and config files (.tf, .tfvars, .hcl, .yaml/.yml, .json, .tpl, .j2, Taskfile) across Terraform, Ansible, Kubernetes, Helm, ArgoCD/GitOps, GitHub Actions, and AWS/Azure/GCP. Produces a single `infra_blueprint.md`: an architecture overview with multiple Mermaid diagrams, a System Design Rationale section (why this architecture, trade-offs), a Key Files navigation section (globs/patterns per area, not per-resource enumeration), structured tables only for Applications/microservices and Configuration management, and conventions/notable-decisions notes. Use to document how infra works, onboard engineers, or give coding agents context — without generating docs that drift from the code.'
---

# Infrastructure Blueprint Generator

Document a DevOps/infra repository for onboarding engineers and AI coding agents. Output is a
single file, `<git repo root>/.knowledge/blueprint/infra_blueprint.md` (create the dir; find root
with `git rev-parse --show-toplevel`). Stack and cloud are detected from the repo in Step 1 —
nothing to configure up front.

Bias toward pointing at code, not restating it. Only two things get exhaustive structured tables
(Applications, Configuration management) — everything else is diagrams plus file/glob pointers, so
the doc stays cheap to keep in sync instead of drifting the moment a resource is added or renamed.

## Grounding Rules (every section)
- Every claim traces to a file path. Can't be determined from the repo → write
  `Not determined from repo` — never guess, never a generic "usual setup".
- Versions come from files only (`.terraform.lock.hcl`, `Chart.yaml`, image tags). Not pinned →
  write `version not pinned`.
- Prefix deductions with `Inferred:`.
- Never record a secret value — only the key name and its source (e.g. External Secrets → AWS
  Secrets Manager path).

## Step 1 — Survey & Plan

1. `git ls-files` (or `tree --gitignore`) to map the layout. Read `Taskfile.yml` first if present —
   it encodes the intended workflow (plan/apply, deploy, sync).
2. Probe for stack signals with `rg` instead of reading every file: `kind:`/`apiVersion:`
   (Kubernetes), `Chart.yaml`/`values*.yaml` (Helm), `provider "`/`backend "`/`*.tfvars`/
   `terragrunt.hcl` (Terraform/Terragrunt), `Application`/`targetRevision` (ArgoCD), `roles/` +
   `playbook*.yml` (Ansible), `.github/workflows/` (CI). Cloud comes from provider blocks and
   resource prefixes (`aws_*`, `azurerm_*`, `google_*`). Dependency edges come from
   `terraform graph`, module `source`, and output references.
3. Todo-list every unit to analyze — each Terraform root, Helm chart, ArgoCD app, workflow, service
   — and work through it item by item.

## Step 2 — Architecture Overview

- **10,000-ft view**: 3–5 sentences — what this repo provisions/deploys, on which cloud, with which
  toolchain, how a change travels from commit to running infra. Note the generation date.
- Environments (dev/stage/prod) and how they differ: workspaces, overlays, tfvars, values files.
- **Diagrams (Mermaid).** Create every one that applies, not just one. Every node drawn must be
  traceable to an entry in Step 4's Key Files section.
  1. **Component dependency map** — all tools/layers and directed dependencies (always).
  2. **Network topology** — VPC/subnets/LB → ingress → services (if networking exists).
  3. **Delivery flow** — commit → CI → registry → GitOps → cluster (if CI/CD exists).
  4. **Application map** — microservices and what each talks to: other services, DBs, queues (if
     apps exist).

## Step 3 — System Design Rationale

Separate from the Overview (what exists) and Diagrams (how it connects) — this is *why* it's built
this way. Only what's evidenced in code, comments, READMEs, ADRs, or PR descriptions; everything
else is `Inferred:` from the shape of the code, never invented.

- **Why this architecture** — e.g. why multi-account over single-account, why this cluster
  topology, why this state-backend choice.
- **Trade-offs taken** — what was given up for what (e.g. simpler CI at the cost of slower
  rollback; managed service over self-hosted for less ops burden).
- **Alternatives evidently rejected** — only if evidenced (a comment, a removed module left in
  git history via `git log -p`, an ADR) — never speculate on what *could* have been chosen.

If nothing is evidenced beyond the code's shape, keep this short and mark it plainly:
`Rationale not documented — inferred from structure:` followed by the inference.

## Step 4 — Key Files (navigation, not enumeration)

One flat section, organized by area, listing glob/path patterns an agent greps from — not
individual resources, not versions, not per-item tables:

- **Cloud provisioning / IaC** — including state backend + locking
- **Networking** — cloud and cluster as one path: VPC → LB → ingress → service
- **Compute & data** — clusters, node groups, VMs, and the stateful services they use
- **Identity & secrets** — IAM/RBAC, KMS, workload identity, secrets operators
- **Delivery (CI → GitOps)** — workflows and ArgoCD apps as one flow; note sync policy inline
- **Observability**
- **Security & policy** — admission control, policy engines, image scanning

Format per area: `<Area>` — one or two lines naming the pattern/entry-point files (e.g. "IAM/RBAC
lives in `modules/iam/*.tf` and `k8s/rbac/*.yaml`; workload identity wired in
`modules/iam/irsa.tf`"). No resource-by-resource listing, no versions — that's what the agent reads
the pointed-to files to get.

## Step 5 — Structured Exceptions

These two areas hold relational facts that span multiple files and aren't recoverable by grepping
one place — they keep tables. No other area gets one; if a repo seems to need a table elsewhere,
put it in Key Files as a pointer instead.

- **Applications / microservices** — table per service: image + tag, namespace, ports/endpoints,
  replicas/resources, what it depends on (databases, queues, other services), and the
  manifest/chart/overlay producing it.
  - *Regenerate when a service is added/removed or its manifest/chart changes.*
- **Configuration management** — env vars, ConfigMap data, Terraform `variable` defaults +
  `*.tfvars`, values sections, Ansible `group_vars`/`host_vars`; per environment, with the layering
  order and precedence (which source wins).
  - *Regenerate when a config source is added or the layering/precedence order changes.*

## Conventions & Notable Decisions

- Naming conventions (resources, modules, releases, namespaces, workflows).
- Repository layout — what belongs where.
- Add-a-thing steps: add a Terraform module / ArgoCD app / Helm override / CI job / workload, in the
  order the repo expects.
- Security posture (secrets handling, network rules, IAM/RBAC — key names and source only, never
  values) and any gotchas evidenced in code/comments/READMEs/CI. Prose, not enumerated; omit if
  none observed. (Architecture-level rationale and trade-offs live in Step 3, not here.)

## Output

Single file: `infra_blueprint.md`, with a table of contents at the top linking to each section
below, in this order:

1. Overview (10,000-ft view + generation date)
2. Environments
3. Diagrams
4. System Design Rationale
5. Key Files
6. Applications (table)
7. Configuration management (table)
8. Conventions & Notable Decisions

Plain language for a developer new to *this* infra; stable headings and exact file paths so agents
can navigate.
