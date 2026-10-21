# Incident Kubernetes Scale Out

**One-line description:** Adds capacity to a saturated Kubernetes Deployment by raising the HorizontalPodAutoscaler floor or the replica count, checks that the cluster can schedule the new pods, and confirms per-pod saturation actually drops.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `mitigation_choice` (object, required): From `inc-stabilize-decision-table` with action "scale_out".
- `k8s_namespace` (string, required): Namespace of the Deployment.
- `deployment_name` (string, required): Name of the Deployment.
- `target_replicas` (integer, optional): Replica count chosen by the IC. When absent, Phase 1 asks the IC; this flow never invents a number.

---

## Outputs

- `scale_result` (object): {hpa_present, replicas_before, replicas_after, hpa_min_before, hpa_min_after, pending_pods, saturation_before, saturation_after, restore_commands}.

---

## Phase 1: Check Whether Scaling Can Help

### Entry Criteria
- `mitigation_choice.action` is "scale_out" and approved.

### Actions
1. Confirm the bottleneck is inside these pods, not a shared dependency. Re-read the saturation evidence in `mitigation_choice.evidence_row`. If the evidence is database connections, cache, or a downstream API, STOP: more replicas add more load to that dependency.
2. Check current state:
   ```
   kubectl get deployment <name> -n <ns> -o jsonpath='{.spec.replicas} {.status.readyReplicas}{"\n"}'
   kubectl get hpa -n <ns>
   kubectl top pods -n <ns> -l <selector>
   ```
   `kubectl top` requires metrics-server; if it errors, use the CPU and memory queries from `metric_findings`.
3. Check database connection math if the service holds a pool: new total connections = replicas_after times the pool size per pod. Read the pool size from the service config and the database limit (for PostgreSQL `SHOW max_connections;`, for MySQL `SHOW VARIABLES LIKE 'max_connections';`). If the new total exceeds the limit, lower `target_replicas` or stop.
4. If `target_replicas` is absent, ask the IC for a number and record who chose it.

### Output
Go or no-go with the numbers.

### Quality Gate
- The bottleneck is named and it is a per-pod resource.
- The connection math is written out, or the service has no database pool.

---

## Phase 2: Scale

### Entry Criteria
- Phase 1 says go.

### Actions
1. Use this table:

| HPA on this Deployment? | Command |
|---|---|
| No | `kubectl scale deployment/<name> -n <ns> --replicas=<target>` |
| Yes | `kubectl patch hpa <hpa-name> -n <ns> --type merge -p '{"spec":{"minReplicas":<target>}}'`. Also raise `maxReplicas` if target exceeds it. |

2. Do NOT run `kubectl scale` on a Deployment that has an HPA. The HPA controller overwrites `spec.replicas` on its next sync and your change disappears.
3. If the Deployment is managed by Argo CD or Flux with HPA min in git, pause sync as in `inc-k8s-rollout-undo` Phase 2, or the controller will revert the patch.
4. Record restore commands with the before values.

### Output
Scale command run and recorded.

### Quality Gate
- `kubectl get hpa -n <ns>` shows the new MINPODS, or `kubectl get deployment` shows the new desired replicas.

---

## Phase 3: Confirm Scheduling and Effect

### Entry Criteria
- Scale command is applied.

### Actions
1. Watch pods: `kubectl get pods -n <ns> -l <selector> -w` until no pod is Pending or ContainerCreating, or for the Deployment's `progressDeadlineSeconds`.
2. If any pod stays Pending, read why: `kubectl describe pod <pending-pod> -n <ns>` and look at Events.

| Event text | Meaning | Action |
|---|---|---|
| `Insufficient cpu` or `Insufficient memory` | No node has room | Check the Cluster Autoscaler or Karpenter logs; if nodes cannot be added, the replica target cannot be reached |
| `didn't match Pod's node affinity/selector` | Affinity limits placement | Do not edit affinity mid-incident without IC approval |
| `exceeded quota` | Namespace ResourceQuota | `kubectl describe resourcequota -n <ns>`; ask the cluster owner |

3. Compare saturation after the new pods are Ready: rerun the saturation query from `metric_findings` (CPU throttling ratio, per-pod memory) and the error ratio.
4. A pod becomes Ready only after its readiness probe passes; new pods with slow startup will not take traffic at once.

### Output
`scale_result`.

### Quality Gate
- Ready replica count equals the target (`kubectl get deployment` READY column), or the Pending reason is recorded.
- saturation_after is a number read from the same query as saturation_before.

---

## Worked Example

Illustrative only. Deployment `search` in `shop`, HPA `search` with min 4, max 10. IC chooses 8.

- Phase 1: Evidence is CPU throttling per pod (0.62 ratio). Pool: 10 connections per pod times 8 = 80; PostgreSQL `max_connections` = 200; other clients use 70. Go.
- Phase 2: `kubectl patch hpa search -n shop --type merge -p '{"spec":{"minReplicas":8}}'`. Restore: `... -p '{"spec":{"minReplicas":4}}'`.
- Phase 3: One pod Pending with `0/6 nodes are available: 6 Insufficient cpu`; Karpenter adds a node; all 8 Ready after a few minutes. Throttling ratio 0.62 to 0.08; error ratio back to baseline.

---

## Exit Criteria

DONE when the target replicas are Ready (or the blocking reason is recorded), saturation is measured before and after with the same query, and restore commands are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bottleneck is a shared dependency | **Stop**: return to `inc-stabilize-decision-table` row 5. |
| Phase 2 | HPA patch is reverted by GitOps | **Adjust**: pause sync, reapply, and record it. |
| Phase 3 | Pods Pending for lack of nodes | **Adjust**: accept the reachable count, record it, and consider `inc-traffic-shift`. |
| Phase 3 | Saturation does not drop | **Return**: scaling is not the fix; undo with the restore command and choose the next row. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
