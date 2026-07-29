---
id: L-0001
domain: k8s
type: incident
status: active
context: "k8s 1.29, Ubuntu 22.04, payments team"
stats: { ok: 3, fail: 1 }
superseded_by: null
---

# kubectl apply hangs indefinitely (apiserver limits)

## Signals
- `kubectl apply -f ...` blocks with no output for >2 min
1. `kubectl get --raw /metrics | grep apiserver_current_inflight` — at/near limit -> this cause
2. apiserver logs show request queue saturation / 429s -> this cause (untested)
3. `kubectl top nodes` + node `df -h` — disk full instead -> different cause, see alternatives

## Root cause
API server overloaded; mutating request inflight limit reached.

## Fix
1. Edit the kube-apiserver static pod manifest (or deployment, on managed setups)
2. Increase `--max-mutating-requests-inflight` (e.g. 200 -> 400)
3. Wait for the apiserver to restart

## Verification
`kubectl apply --dry-run=server -f <manifest>` returns within 5s.

## Instances
- 2026-07-05: payments-api — first seen, inflight limit at 200.
- 2026-07-10: notifications-worker — same event, same fix; nothing service-specific.

## Pitfalls
- 2026-07-10: Restarting kubelet alone did NOT fix it (context: k8s 1.31).
