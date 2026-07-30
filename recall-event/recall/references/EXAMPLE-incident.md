---
id: L-0001
domain: k8s
type: incident
status: active
created: 2026-07-13
updated: 2026-07-13
context: "k8s 1.29, Ubuntu 22.04, payments team"
stats: { applied: 4, succeeded: 3, failed: 1, last_used: 2026-07-10 }
superseded_by: null
see_also: []
---

# kubectl apply stalls (API server saturated)

## Signals
1. `kubectl apply -f <manifest> -v=8` stalls while waiting for an API response.
2. A read-only API request also stalls, ruling out one manifest as the cause.
3. Control-plane metrics or provider status show request saturation or throttling.

## Root cause
The API server was saturated by concurrent mutating requests.

## Fix
1. Stop automated apply loops or reduce their concurrency.
2. Retry one server-side dry run: `kubectl apply --dry-run=server -f <manifest>`.
3. If saturation persists, escalate through the cluster owner's supported capacity or control-plane recovery procedure. Do not change control-plane limits without platform ownership, a rollback plan, and explicit approval.

## Verification
The dry run and a read-only API request complete within the project's normal latency, and saturation metrics recover.

## Instances
- 2026-07-05: payments-api — deployment job created overlapping apply loops.
- 2026-07-10: notifications-worker — same event; reducing pipeline concurrency resolved it.

## Pitfalls
- 2026-07-10: Restarting a worker node did not help because the bottleneck was the control plane.
