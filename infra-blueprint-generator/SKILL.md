---
name: infra-blueprint-generator
description: Generate evidence-based documentation for Terraform, Ansible, Kubernetes, Helm, ArgoCD, CI/CD, and cloud infrastructure repositories. Use for onboarding, architecture discovery, and agent context.
---

# Infrastructure Blueprint Generator

Document the repository in `<git-root>/.knowledge/blueprint/`, where `<git-root>` is returned by `git rev-parse --show-toplevel`.

## Options

```text
${TECH_STACK="Auto-detect|Terraform|Ansible|Kubernetes|Helm|ArgoCD|GitHub Actions|Mixed"}
${CLOUD_PROVIDER="Auto-detect|AWS|Azure|GCP|Multi-cloud|None"}
${OUTPUT_STRUCTURE="Per-module files|Single document"}
```

## Rules

- Describe the implementation in the repository, not a typical setup.
- Cite a file path for every claim. Write `Not determined from repo` when evidence is absent.
- Mark deductions with `Inferred:`.
- Report versions only when pinned in source files such as `.terraform.lock.hcl`, `Chart.yaml`, or image tags. Otherwise write `version not pinned`.
- Never include secret values. Record only the key and its source.
- Treat examples as format guidance; do not copy their names or flows.
- Include the generation date.

## Workflow

1. Find the repository root and inspect tracked files with `git ls-files` or `tree --gitignore`.
2. Read `Taskfile.yml` first when present.
3. Detect relevant stacks and clouds from their source files. Honor `TECH_STACK` and `CLOUD_PROVIDER` when specified.
4. Inventory every applicable Terraform root, Helm chart, ArgoCD application, Ansible playbook or role, workflow, and deployed service before writing.
5. Trace dependencies through source references, inputs, outputs, rendered configuration, and delivery workflows. Use `terraform graph` when available and useful.

Useful stack signals include:

- Terraform/Terragrunt: `*.tf`, `*.tfvars`, `.terraform.lock.hcl`, `terragrunt.hcl`
- Kubernetes: `apiVersion`, `kind`, manifests and overlays
- Helm: `Chart.yaml`, templates, `values*.yaml`
- ArgoCD: `Application`, `targetRevision`
- Ansible: playbooks, `roles/`, `group_vars/`, `host_vars/`
- CI/CD: `.github/workflows/` and other pipeline configuration

## Required Documentation

### Architecture overview

Explain what the repository provisions or deploys, the target cloud or platform, its toolchain, environment differences, and the path from a committed change to running infrastructure.

Add every applicable Mermaid diagram, omitting unsupported nodes:

- Component dependencies (always)
- Network topology
- Delivery flow
- Application and service dependencies

### Inventories

Each entry must include its name, type, pinned version when available, and source path. Cover applicable items only:

- **Cloud:** network, compute, clusters, data services, storage, messaging, DNS, identity, encryption
- **Cluster platform:** GitOps, observability, ingress, TLS, policy, RBAC, service mesh, secret operators
- **Applications:** image/tag, namespace, ports, replicas/resources, dependencies, and producing manifest/chart/overlay
- **Configuration:** environment variables, ConfigMaps, Terraform variables and tfvars, Helm values, templates, and Ansible variables; explain environment layering and precedence

Every diagram node must have a corresponding inventory or module entry.

### Module documentation

Derive modules from repository domains. Do not create empty domains or duplicate resources across modules; cross-link shared concerns instead.

Use this section order for each module:

1. Module Name
2. Purpose
3. Components
4. Dependencies
5. Key Files
6. Data/Config Flow
7. Security Notes
8. Common Gotchas
9. Related Modules

Trace data/config flow through actual files. Add a small Mermaid diagram when at least three parts interact. Include only evidenced gotchas; otherwise write `None observed`.

Possible domains include IaC, state/backend, configuration management, CI, GitOps, applications, cloud networking, cluster networking/ingress, secrets, observability, security/policy, and identity/access.

### Repository conventions

Document:

- Naming and directory conventions
- Environment configuration layering and precedence
- The repository-specific steps for adding modules, applications, overrides, jobs, and workloads
- Decisions visible in code or documentation; prefix undocumented rationale with `Inferred:`

## Output

- If `OUTPUT_STRUCTURE` is `Per-module files`, create `Infra_Blueprint.md` as the overview/index and one Markdown file per module.
- If it is `Single document`, create `Infra_Blueprint.md` with a table of contents.
- Always create `llms.md` with one linked row per module or major section, a one-line description, and useful search terms.
- Use stable headings, plain language, relative links, and exact source paths.
- End with a concise list of conventions future changes must follow.
