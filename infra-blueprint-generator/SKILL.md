---
name: infra-blueprint-generator
description: 'Technology-focused blueprint generator for DevOps and infrastructure repositories. Analyzes IaC and config files (.tf, .tfvars, .hcl, .yaml/.yml, .json, .tpl, .j2, Taskfile) across Terraform, Ansible, Kubernetes, Helm, ArgoCD/GitOps, GitHub Actions, and AWS/Azure/GCP to produce onboarding- and AI-agent-ready documentation: a per-repo architecture overview with a 10,000-ft summary and component dependency map, cloud and Kubernetes resource inventories (networking, GitOps/CD, observability, ingress, security), an llms.md agent index, and modular per-domain docs (Ingress & Networking, CI/CD, Secrets, Observability, etc.) that each follow a strict fixed template. Use to document how infra works, onboard engineers, or give coding agents context so future changes stay consistent.'
---

# Infrastructure Blueprint Generator

Produces `Infra_Blueprint.md` (or a `blueprint/` folder of per-module files) plus `llms.md` — an indexed table of contents agents can search efficiently — documenting a DevOps/infra repository for **two audiences**:

1. **Engineers onboarding** — need a fast, accurate mental model of how the infra works without reading every repo.
2. **AI coding agents** — need structured, context-rich reference so future changes stay consistent with existing architecture and conventions.

Focus on DevOps configuration and pattern files: `.tf`, `.tfvars`, `.tf.json`, `.hcl`, `.yaml`/`.yml`, `.json`, `.tpl`, `.j2`, and `Taskfile.yml` if present. Reflect the **actual code**, never a generic "usual setup." Name tools, resource types, versions, and relationships explicitly.

## Configuration Variables

```
${TECH_STACK="Auto-detect|Terraform|Ansible|Kubernetes|Helm|ArgoCD|GitHub Actions|Mixed"}
${CLOUD_PROVIDER="Auto-detect|AWS|Azure|GCP|Multi-cloud|None"}
${AUDIENCE="Both|Onboarding|AI-Agent"}          <!-- Both = write for humans, structure for agents -->
${DETAIL_LEVEL="High-level|Detailed|Comprehensive|Implementation-Ready"}
${OUTPUT_STRUCTURE="Per-module files|Single document"}
${INCLUDE_DEPENDENCY_MAP=true|false}            <!-- Mermaid component/dependency diagram -->
${INCLUDE_K8S_INVENTORY=true|false}             <!-- auto-skip if no Kubernetes manifests found -->
${INCLUDE_SECURITY_NOTES=true|false}
${INCLUDE_DECISION_RECORDS=true|false}          <!-- capture notable infra decisions as ADRs -->
```

## Generated Prompt

"Create `Infra_Blueprint.md` documenting this infrastructure repository as a definitive reference for engineers onboarding and for AI coding agents making future changes. Reflect the **actual implementation** found in the files — name every tool, resource type, and version explicitly; never say 'the usual setup' or reference things vaguely. Note when the blueprint was generated and how to keep it current. Use the following approach.

## Grounding Rules (apply to every section)
- **Cite the source.** Every claim about a tool, resource, or relationship must trace to a file path (add the resource/block name when useful).
- **Never fill gaps with plausible defaults.** If something cannot be determined from the repo, write `Not determined from repo` — do not guess.
- **Versions come from files only** (`.terraform.lock.hcl`, `Chart.yaml`, image tags, `required_version`). If not pinned, write `version not pinned`.
- **Examples in this prompt show format only.** Never copy their component names, paths, or flows into the output.
- **Separate facts from inference.** Prefix anything deduced rather than read directly from a file with `Inferred:`.

---

## Phase 0 — Detection & Discovery
**Plan before writing anything.** This is a many-file analysis — survey first, then work a checklist:

1. **Map the file structure** — run `tree --gitignore` (fall back to `fd` or `git ls-files` if `tree` is unavailable) to see the repository layout without noise from ignored files.
2. **Read the Taskfile first if present** — `Taskfile.yml`/`Taskfile.yaml` encodes the intended workflow (plan/apply, lint, deploy, sync) and is the fastest map of how the repo is actually operated.
3. **Probe the stack with search tools** — use `grep`/`rg` for concrete signals (`kind:`, `apiVersion:`, `provider "`, `backend "`, `source =`, `targetRevision`) rather than reading every file; where Terraform is initialized, `terraform graph` (or module `source`/`depends_on`/output references) reveals dependency edges.
4. **Write a todo list of what needs analysis** — from the survey, list every directory/domain to document (e.g., each Terraform root, each Helm chart, the ArgoCD apps, the CI workflows), then work through it item by item so nothing is skipped or invented.

Scan `.tf`, `.tfvars`, `.tf.json`, `.hcl`, `.yaml`/`.yml`, `.json`, `.tpl`, `.j2`, and `Taskfile.yml` files and infer the stack from concrete signals:

${TECH_STACK == "Auto-detect" ? "Identify which of these are present and their role:" : "Focus on ${TECH_STACK}, but still note adjacent tools it integrates with:"}
- **Terraform / Terragrunt** — `*.tf`, `*.tfvars`, `*.tf.json`, `*.hcl` (incl. `terragrunt.hcl`, `.terraform.lock.hcl`), `backend`/`provider` blocks, `modules/`, `environments/`. Note providers, versions, the state backend (S3/GCS/Azure Blob + lock table), and any Terragrunt DRY/wrapper layering.
- **Ansible** — `playbook*.yml`, `roles/`, `inventory`/`hosts`, `group_vars/`, `host_vars/`, `ansible.cfg`, `*.j2` templates.
- **Kubernetes** — manifests with `apiVersion`/`kind`, `kustomization.yaml`, `overlays/`, `base/`.
- **Helm** — `Chart.yaml`, `values*.yaml`, `templates/*.tpl`/`*.yaml`, `charts/` dependencies.
- **ArgoCD / GitOps** — `Application`/`ApplicationSet`/`AppProject` CRs, `argocd/`, app-of-apps patterns, source repo/path/targetRevision references.
- **GitHub Actions** — `.github/workflows/*.yml`, reusable workflows, composite actions, `workflow_call`, environments/secrets references.
- **Task runner** — `Taskfile.yml`/`Taskfile.yaml` (go-task). Capture the tasks that wrap infra commands (plan/apply, lint, deploy, sync) — they document the intended workflow and belong in the relevant module's Data/Config Flow and Common Gotchas.
- **Cloud provider** — ${CLOUD_PROVIDER == "Auto-detect" ? "detect from Terraform providers and resource prefixes (aws_*, azurerm_*, google_*), CLI config, and manifest annotations" : "assume ${CLOUD_PROVIDER}"}. Note managed services in use (EKS/AKS/GKE, RDS/CloudSQL, IAM, KMS, etc.).

Then group the discovered resources into **domains/modules** (see Part 3) and map the repository/directory layout to those domains.

---

## Part 1 — Architecture Overview (per repository)
Write a plain-language overview a capable developer new to *this* infra can follow:
- **10,000-ft view first** — open with 3–5 sentences giving someone with zero context the whole picture: what this repo provisions/deploys, on which cloud, with which toolchain, and how a change travels from git commit to running infrastructure. An orientation add-on — Part 2's full resource knowledge base is still produced in complete detail.
- What the system does and how the pieces fit together at a high level.
- **What talks to what, and why.** Trace the real relationships — which layer provisions what, which tool deploys to where, where config/secrets originate and flow.
${INCLUDE_DEPENDENCY_MAP ? "- A **dependency map** as a Mermaid diagram showing components and directed dependencies. Format example only — replace every node and edge with this repo's actual components:\n  ```mermaid\n  graph LR\n    GHA[GitHub Actions CI] --> IMG[Container Registry]\n    TF[Terraform] --> EKS[EKS Cluster]\n    TF --> VPC[VPC / Networking]\n    ARGO[ArgoCD] -->|syncs| EKS\n    HELM[Helm Charts] --> ARGO\n    EKS --> ING[Ingress Controller]\n  ```\n  Omit any node or edge you cannot trace to a file." : "- Describe component relationships and dependency directions in text."}
- Environments (dev/stage/prod) and how they differ (workspaces, overlays, tfvars, value files).

---

## Part 2 — Resource Inventory

### 2a. Cloud Resources
If cloud IaC is present, inventory the cloud components (name + resource type + source file), grouped by function, stating what each depends on. Skip cleanly if there is none. Every node in the Part 1 dependency map must be traceable to an entry here:
- **Networking** — VPCs, subnets, route tables, NAT/internet gateways, peering/transit, security groups/firewall rules, DNS zones, load balancers.
- **Compute & cluster** — EKS/AKS/GKE, node groups/pools, VMs/scale sets.
- **Data** — RDS/CloudSQL, storage buckets, caches, queues.
- **Identity & security** — IAM roles/policies, KMS keys, OIDC/workload identity.

### 2b. Kubernetes Resources
${INCLUDE_K8S_INVENTORY ? "If Kubernetes manifests/Helm/ArgoCD are present, inventory what actually runs in the cluster (name + version/type + namespace + source file). Skip cleanly if there is no cluster.\n- **GitOps / CD tooling** — e.g., ArgoCD (Applications, projects, sync policy, source repos).\n- **Observability stack** — e.g., Prometheus, Grafana, Loki, Alertmanager, OpenTelemetry (scrape config, dashboards, alert rules).\n- **Ingress controller** — which one and its config (e.g., NGINX Ingress, Traefik, cloud LB controller; TLS via cert-manager).\n- **Security components** — NetworkPolicies, service mesh (Istio/Linkerd), RBAC roles/bindings, PodSecurity, admission/policy (OPA/Kyverno), secrets operators (External Secrets, Sealed Secrets, Vault).\n- **Workloads** — application Deployments/StatefulSets/DaemonSets/CronJobs and the Helm releases or Kustomize overlays that produce them." : "Skipped (INCLUDE_K8S_INVENTORY=false)."}

---

## Part 3 — Modular Documentation
Split the knowledge into **one module per domain**. Every module MUST follow this exact template, in this exact order, so both humans and agents can navigate predictably:

### Module Template
- **Module Name** — e.g., \"Networking — Cluster / Ingress,\" \"CI Pipeline,\" \"Secrets Management.\"
- **Purpose** — one or two sentences: what this domain does and why it exists in this infra.
- **Components** — explicit list of tools/resources (name + version/type), e.g., \"NGINX Ingress Controller v1.9,\" \"cert-manager,\" \"aws_eks_cluster.\"
- **Dependencies** — what this module depends on (upstream) and what depends on it (downstream).
- **Key Files** — relevant paths (`.tf`, `.yaml`, `.tpl`, `.j2`, …) each with a one-line note on what it does.
- **Data/Config Flow** — how config/data moves through the module, traced from the actual files. Format example: \"Terraform provisions VPC → outputs `vpc_id` → Helm chart consumes it via `values.yaml` → Ingress annotation references the subnet.\"
- **Security Notes** — ${INCLUDE_SECURITY_NOTES ? "policies, secrets handling, network rules, IAM/RBAC, and access controls tied to this module." : "brief note; (INCLUDE_SECURITY_NOTES disabled — keep minimal)."}
- **Common Gotchas** — quirks, manual steps, or ordering constraints evidenced in code, comments, READMEs, or CI scripts. Do not invent any; write \"None observed\" if none found.
- **Related Modules** — cross-links to other modules that interact with this one.

Derive modules only from files that exist — never emit a module for a domain with nothing behind it. Typical domains:
- **Cloud Provisioning / IaC** (Terraform: VPC, subnets, compute, managed services)
- **State & Backend** (Terraform remote state, locking)
- **Configuration Management** (Ansible roles/playbooks)
- **CI Pipeline** (GitHub Actions build/test/publish)
- **GitOps / Continuous Delivery** (ArgoCD Applications, sync)
- **Kubernetes Workloads** (Deployments, Helm releases, overlays)
- **Networking — Cloud** (VPC, subnets, routing, peering, security groups, DNS, load balancers)
- **Networking — Cluster / Ingress** (ingress controller, TLS/cert-manager, NetworkPolicies, service mesh)
- **Secrets Management** (External/Sealed Secrets, Vault, cloud KMS)
- **Observability** (Prometheus, Grafana, Loki, alerting)
- **Security & Policy** (NetworkPolicies, RBAC, service mesh, OPA/Kyverno)
- **Identity & Access** (cloud IAM, cluster RBAC, OIDC/workload identity)

Some resources fit more than one domain (e.g., NetworkPolicies under Networking or Security & Policy) — document each in exactly one module and cross-link the others via Related Modules; never duplicate.

---

## Part 4 — Conventions & Reference
_Document once; applies across all modules. Critical for agents making consistent future changes._
- **Naming conventions** — resource/module/file naming (e.g., `env-region-service`), Terraform module structure, Helm release/chart names, K8s namespace/label conventions, workflow naming.
- **Repository layout** — directory structure and what belongs where (modules vs. environments vs. overlays).
- **Config & variable conventions** — how variables/tfvars/values/secrets are layered per environment; precedence rules.
- **Add-a-thing patterns** — step-by-step for common changes: add a Terraform module, add an ArgoCD Application, add a Helm value override, add a GitHub Actions job, add a K8s workload — in the order the repo expects (e.g., provision → wire outputs → deploy → expose).
${INCLUDE_DECISION_RECORDS ? "- **Decision records (ADRs)** — notable infra choices evident in the code (why this cloud/tool/pattern, constraints, consequences). Rationale is almost always deduced — prefix it with `Inferred:` unless the repo documents it." : ""}

---

## Style Requirements (enforce throughout)
- Plain-language explanations; assume a capable developer who is new to *this specific* infra.
- Every module follows the template above, same fields, same order.
- Explicit naming of tools, resource types, versions, and relationships — no vague references.
- ${AUDIENCE == "AI-Agent" ? "Optimize for agents: stable headings, exact file paths, and machine-navigable structure." : AUDIENCE == "Onboarding" ? "Optimize for humans: lead with intuition and the 'why' before the 'what'." : "Serve both: human-readable prose with predictable, agent-navigable structure (stable headings, exact paths)."}
- ${OUTPUT_STRUCTURE == "Per-module files" ? "Write one file per module under a `blueprint/` folder plus an index, so modules can be updated independently." : "Write a single `Infra_Blueprint.md` with a table of contents linking to each module."}
- Always also generate `llms.md`: an indexed table of contents for agents — one row per module/section with its exact file path + heading anchor, a one-line description, and key search terms (tool names, resource types) — so an agent can locate the right doc without reading everything.

Conclude with a short summary of the most important conventions to follow so future changes stay consistent with the existing infrastructure."
