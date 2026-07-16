---
name: infra-blueprint-generator
description: 'Blueprint generator for DevOps/infrastructure repositories. Analyzes IaC and config files (.tf, .tfvars, .hcl, .yaml/.yml, .json, .tpl, .j2, Taskfile) across Terraform, Ansible, Kubernetes, Helm, ArgoCD/GitOps, GitHub Actions, and AWS/Azure/GCP. Produces docs in .knowledge/blueprint/: architecture overview with multiple Mermaid diagrams, inventories of cloud resources, cluster components, applications/microservices, and configuration data, per-domain module docs with a fixed template, and an llms.md linked index for agents. Use to document how infra works, onboard engineers, or give coding agents context.'
---

# Infrastructure Blueprint Generator

Document a DevOps/infra repository for onboarding engineers and AI coding agents. All output goes to `<git repo root>/.knowledge/blueprint/` (create it; find root with `git rev-parse --show-toplevel`).

## Configuration Variables

```
${TECH_STACK="Auto-detect|Terraform|Ansible|Kubernetes|Helm|ArgoCD|GitHub Actions|Mixed"}
${CLOUD_PROVIDER="Auto-detect|AWS|Azure|GCP|Multi-cloud|None"}
${OUTPUT_STRUCTURE="Per-module files|Single document"}
```

## Generated Prompt

"Document this infrastructure repository in `<git repo root>/.knowledge/blueprint/`. Reflect the **actual implementation** — name every tool, resource type, and version explicitly; never write a generic 'usual setup'. Note the generation date.

## Grounding Rules (every section)
- Every claim traces to a file path. If it can't be determined from the repo, write `Not determined from repo` — never guess.
- Versions come from files only (`.terraform.lock.hcl`, `Chart.yaml`, image tags). Not pinned → write `version not pinned`.
- Examples in this prompt show **format only** — never copy their names or flows into the output.
- Prefix deductions with `Inferred:`.
- Never record secret values — only the key name and its source (e.g., External Secrets → AWS Secrets Manager path).

## Step 1 — Survey & Plan (before writing anything)
1. `tree --gitignore` (or `git ls-files`) to map the layout.
2. Read `Taskfile.yml` first if present — it encodes the intended workflow (plan/apply, deploy, sync).
3. Probe with `rg`/`grep` for stack signals instead of reading every file: `kind:`/`apiVersion:` (Kubernetes), `Chart.yaml`/`values*.yaml` (Helm), `provider "`/`backend "`/`*.tfvars`/`terragrunt.hcl` (Terraform/Terragrunt), `Application`/`targetRevision` (ArgoCD), `roles/` + `playbook*.yml` (Ansible), `.github/workflows/` (CI). Use `terraform graph` or module `source`/output references for dependency edges. ${TECH_STACK == "Auto-detect" ? "Detect what is present." : "Focus on ${TECH_STACK}; note tools it integrates with."} ${CLOUD_PROVIDER == "Auto-detect" ? "Detect cloud from providers and resource prefixes (aws_*, azurerm_*, google_*)." : "Assume ${CLOUD_PROVIDER}."}
4. Write a todo list of everything to analyze (each Terraform root, Helm chart, ArgoCD app, workflow, service) and work through it item by item.

## Step 2 — Architecture Overview
- **10,000-ft view**: 3–5 sentences — what this repo provisions/deploys, on which cloud, with which toolchain, how a change travels from commit to running infra.
- Environments (dev/stage/prod) and how they differ (workspaces, overlays, tfvars, values files).
- **Diagrams (Mermaid).** Create every diagram that applies — not just one. Omit any node you cannot trace to a file:
  1. **Component dependency map** — all tools/layers and directed dependencies (always).
  2. **Network topology** — VPC/subnets/LB → ingress → services (if networking exists).
  3. **Delivery flow** — commit → CI → registry → GitOps → cluster (if CI/CD exists).
  4. **Application map** — microservices and what each talks to: other services, DBs, queues (if apps exist).

## Step 3 — Inventories
Each entry: name + type/version + source file. Skip a subsection cleanly if nothing matches.

**3a. Cloud resources** — networking (VPC, subnets, routes, NAT, security groups, DNS, LBs), compute/cluster (EKS/AKS/GKE, node groups, VMs), data (databases, buckets, caches, queues), identity (IAM, KMS, OIDC/workload identity). Every dependency-map node must appear here or in 3b/3c.

**3b. Cluster platform** — GitOps/CD (ArgoCD apps, sync policy), observability (Prometheus, Grafana, Loki, alerts), ingress controller + TLS/cert-manager, security (NetworkPolicies, mesh, RBAC, OPA/Kyverno, secrets operators).

**3c. Applications / microservices** — for each service the repo deploys: name, image + tag, namespace, ports/endpoints, replicas/resources, what it depends on (databases, queues, other services), and the manifest/chart/overlay producing it.

**3d. Configuration data** — key + value (or value source) + file, per environment where layered: env vars (`env`/`envFrom`, `.env`, CI `env` blocks), ConfigMap data, Terraform `variable` defaults + `*.tfvars`, app config files (values sections, templates, Ansible group_vars/host_vars). Secrets: key name + source only.

## Step 4 — Module Docs
One module per domain, derived only from files that exist. Every module uses this exact template, in this order:

- **Module Name**
- **Purpose** — one or two sentences.
- **Components** — tools/resources with versions/types.
- **Dependencies** — upstream and downstream.
- **Key Files** — paths, each with a one-line note.
- **Data/Config Flow** — traced from actual files (e.g., "Terraform outputs `vpc_id` → consumed in `values.yaml` → ingress annotation"). Add a small Mermaid diagram when the module has 3+ interacting parts.
- **Security Notes** — secrets handling, network rules, IAM/RBAC for this module.
- **Common Gotchas** — only what is evidenced in code/comments/READMEs/CI; otherwise "None observed".
- **Related Modules** — cross-links.

Typical domains (emit only those with files behind them): Cloud Provisioning/IaC, State & Backend, Configuration Management, CI Pipeline, GitOps/CD, **Applications/Microservices**, Networking — Cloud, Networking — Cluster/Ingress, Secrets Management, Observability, Security & Policy, Identity & Access. A resource fitting two domains is documented in exactly one and cross-linked — never duplicated.

## Step 5 — Conventions
- Naming conventions (resources, modules, releases, namespaces, workflows).
- Repository layout — what belongs where.
- Config/variable layering per environment and precedence.
- Add-a-thing steps: add a Terraform module / ArgoCD app / Helm override / CI job / workload, in the order the repo expects.
- Notable decisions evident in code, rationale prefixed `Inferred:` unless documented.

## Output
- ${OUTPUT_STRUCTURE == "Per-module files" ? "One file per module in `.knowledge/blueprint/` plus `Infra_Blueprint.md` as index/overview." : "Single `.knowledge/blueprint/Infra_Blueprint.md` with a table of contents."}
- Always generate `.knowledge/blueprint/llms.md`: one row per module/section — a clickable markdown link to the file or heading (e.g., `[Secrets Management](secrets-management.md)` or `[Secrets Management](Infra_Blueprint.md#secrets-management)`), a one-line description, and key search terms.
- Plain language for a developer new to *this* infra; stable headings and exact file paths so agents can navigate.

End with a short summary of the conventions future changes must follow."
