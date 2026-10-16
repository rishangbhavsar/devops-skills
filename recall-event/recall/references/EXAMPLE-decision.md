---
id: L-0003
domain: product
type: decision
status: active
context: "pricing v2 project, ~40 paying customers, mostly SMB"
stats: { ok: 0, fail: 0 }   # decisions only ever increment fail; no confidence
superseded_by: null
---

# flat per-seat pricing over usage-based pricing

## Signals
- Any feature/plan discussion touching pricing, packaging, or billing
- Sales asks for "custom usage deals" (this decision says no, with rationale)

## Context
Pricing v2 (2026-06): SMB customers, low willingness to predict usage, support team of 1, no metering infra.

## Options considered
- Usage-based: better margin on heavy users; lost — needs metering infra (~2 sprints) and SMBs churned in interviews when they couldn't predict cost.
- Hybrid (base + overage): worst-of-both for a 1-person support team.

## Decision & rationale
Flat per-seat. Predictability drives SMB conversion; heavy users few enough that margin loss is acceptable; zero metering infra needed now.

## Revisit when
- >20% of revenue from customers at 5x median usage, OR
- metering infra built for another reason, OR
- we move upmarket (procurement expects usage pricing)

## Pitfalls
(none yet)
