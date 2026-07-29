---
name: infra-blueprint-generator
description: 'Blueprint generator for DevOps/infrastructure repositories. Analyzes IaC and config files (.tf, .tfvars, .hcl, .yaml/.yml, .json, .tpl, .j2, Taskfile) across Terraform, Ansible, Kubernetes, Helm, ArgoCD/GitOps, GitHub Actions, and AWS/Azure/GCP. Produces docs in .knowledge/blueprint/: an architecture overview with multiple Mermaid diagrams, one doc per infra domain enumerating every resource with its source file, and an llms.md linked index for agents. Use to document how infra works, onboard engineers, or give coding agents context.'
---

# Infrastructure Blueprint Generator

Document a DevOps/infra repository for onboarding engineers and AI coding agents. All output goes to
`<git repo root>/.knowledge/blueprint/` (create it; find root with `git rev-parse --show-toplevel`).
Stack and cloud are detected from the repo in Step 1 — nothing to configure up front.

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
- **Diagrams (Mermaid).** Create every one that applies, not just one. Every node drawn must also
  appear in a Step 3 domain doc.
  1. **Component dependency map** — all tools/layers and directed dependencies (always).
  2. **Network topology** — VPC/subnets/LB → ingress → services (if networking exists).
  3. **Delivery flow** — commit → CI → registry → GitOps → cluster (if CI/CD exists).
  4. **Application map** — microservices and what each talks to: other services, DBs, queues (if
     apps exist).

## Step 3 — Domain Docs

One doc per domain that has files behind it. **Domain docs are the only place resources are
enumerated** — a resource fitting two domains is documented in exactly one and cross-linked, never
duplicated.

- **Cloud provisioning / IaC** — including state backend + locking
- **Networking** — cloud and cluster as one path: VPC → LB → ingress → service
- **Compute & data** — clusters, node groups, VMs, and the stateful services they use
- **Identity & secrets** — IAM/RBAC, KMS, workload identity, secrets operators; key names and their
  source only, never values
- **Delivery (CI → GitOps)** — workflows and ArgoCD apps as one flow; include sync policy
- **Observability**
- **Security & policy** — admission control, policy engines, image scanning
- **Applications / microservices** — per service: image + tag, namespace, ports/endpoints,
  replicas/resources, what it depends on (databases, queues, other services), and the
  manifest/chart/overlay producing it
- **Configuration management** — env vars, ConfigMap data, Terraform `variable` defaults +
  `*.tfvars`, values sections, Ansible `group_vars`/`host_vars`; per environment, with the layering
  order and precedence

Every domain doc uses this template, in this order:

- **Purpose** — one or two sentences.
- **Components** — what the list above names for this domain: name + type/version + source file.
- **Dependencies** — upstream and downstream, linking the neighbouring domain docs.
- **Key Files** — paths, each with a one-line note.
- **Data/Config Flow** — traced from actual files (format: "Terraform output → consumed in a values
  file → ingress annotation"). Add a small Mermaid diagram when 3+ parts interact.
- **Security Notes** — secrets handling, network rules, IAM/RBAC for this domain.
- **Common Gotchas** — only what is evidenced in code/comments/READMEs/CI; else "None observed".

## Conventions (in `Infra_Blueprint.md`)

- Naming conventions (resources, modules, releases, namespaces, workflows).
- Repository layout — what belongs where.
- Add-a-thing steps: add a Terraform module / ArgoCD app / Helm override / CI job / workload, in the
  order the repo expects.
- Notable decisions evident in code, rationale prefixed `Inferred:` unless documented.

## Output

- One file per domain doc, plus `Infra_Blueprint.md` carrying the overview, the conventions, and
  links to the domain docs.
- Always generate `llms.md`: one row per doc — a clickable markdown link (e.g.
  `[Networking](networking.md)`), a one-line description, and key search terms.
- Plain language for a developer new to *this* infra; stable headings and exact file paths so agents
  can navigate.
