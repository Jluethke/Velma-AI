# Argo Rollouts Canary with Prometheus Analysis

**One-line description:** Converts one Kubernetes Deployment into an Argo Rollouts `Rollout` with canary steps taken from the rollout plan and an `AnalysisTemplate` that runs the guardrail PromQL queries, so a failed analysis aborts the rollout and shifts traffic back to the stable ReplicaSet automatically.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rollout_plan` (object[], required): Output of `ffr-rollout-stage-plan`; stage percentages become `setWeight` steps.
- `guardrail_metrics` (object[], required): Output of `ffr-guardrail-metrics`; queries become analysis metrics.
- `k8s_manifests` (string, required): Path to the Deployment and Service manifests (plain YAML, Kustomize, or Helm chart directory) for the service.

---

## Outputs

- `argo_canary_config` (object): Paths of the `Rollout` and `AnalysisTemplate` files, the traffic routing mode, lint output, and the transcript of a test rollout (one success, one forced failure with abort).

---

## Phase 1: Convert the Deployment to a Rollout

### Entry Criteria
- Argo Rollouts controller is installed in the cluster: `kubectl get crd rollouts.argoproj.io` returns the CRD. The `kubectl argo rollouts` plugin is installed: `kubectl argo rollouts version` prints a version.

### Actions
1. Choose the traffic mode:

| Cluster has | Mode | Effect of `setWeight` |
|---|---|---|
| no mesh or supported ingress | replica-based (no `trafficRouting`) | weight is approximated by the ratio of canary to stable pods; with few replicas it is coarse |
| NGINX Ingress, Istio, SMI, ALB, or another supported router | `trafficRouting` block for that router | exact traffic percentage |

2. Copy the Deployment manifest to `rollout.yaml`. Change `apiVersion: apps/v1` to `apiVersion: argoproj.io/v1alpha1` and `kind: Deployment` to `kind: Rollout`. Keep `selector` and `template` identical. Remove the Deployment's `strategy` field.
3. Add the canary strategy. One `setWeight` per percentage stage from `rollout_plan`, each followed by a pause equal to that stage's `min_dwell`, and an inline analysis step:
```yaml
spec:
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 6h}
      - analysis:
          templates:
          - templateName: checkout-guardrails
      - setWeight: 25
      - pause: {duration: 6h}
      - analysis:
          templates:
          - templateName: checkout-guardrails
```
4. Apply the change in a test namespace first. Delete the old Deployment only after the Rollout's pods are Ready there; applying both at once doubles the pods selected by the Service.

### Output
`rollout.yaml` with canary steps.

### Quality Gate
- Each `setWeight` value appears in `rollout_plan`, and each pause equals that stage's `min_dwell`.
- `kubectl argo rollouts lint rollout.yaml` reports no errors (if the subcommand is not in your plugin version, use `kubectl apply --dry-run=server -f rollout.yaml`).

---

## Phase 2: Write the AnalysisTemplate

### Entry Criteria
- Rollout manifest exists.

### Actions
1. Write `analysis-template.yaml`, one metric per guardrail. The Argo analysis compares canary pods against an absolute condition, so filter the query to the canary pods or the canary hash (Argo adds the label `rollouts-pod-template-hash`; pass it as an argument with `valueFrom.podTemplateHashValue: Latest`):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: checkout-guardrails
spec:
  args:
  - name: canary-hash
  metrics:
  - name: error-ratio
    interval: 5m
    count: 3
    failureLimit: 1
    successCondition: len(result) > 0 && result[0] < 0.0144
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc:9090
        query: |
          sum(rate(http_server_request_duration_seconds_count{rollouts_pod_template_hash="{{args.canary-hash}}",http_response_status_code=~"5.."}[5m]))
          / sum(rate(http_server_request_duration_seconds_count{rollouts_pod_template_hash="{{args.canary-hash}}"}[5m]))
```
   The pod label reaches your application metrics only if the Prometheus scrape config copies it (a `relabel_configs` rule mapping `__meta_kubernetes_pod_label_rollouts_pod_template_hash` to `rollouts_pod_template_hash`). Check with `curl -s "$PROM/api/v1/label/rollouts_pod_template_hash/values"`; an empty list means the relabel rule is missing.
2. The threshold in `successCondition` is the Rule A threshold from `guardrail_metrics` (in the example, 14.4 times a 0.001 budget). Copy it; do not pick a new one.
3. Handle empty results. With no canary traffic the query returns no data or NaN, and the condition evaluates false or errors. Write `len(result) > 0 &&` explicitly and add `isNaN(result[0])` handling if your Argo version supports it (check the Argo Rollouts analysis docs). Decide with this rule: no data at a stage with traffic expected is a failure, not a pass.
4. `failureLimit` and `count` come from the plan: `count` = stage dwell divided by `interval`, `failureLimit` = how many failed measurements the owner accepts. If the owner gave no number, use the Argo default (0, meaning any failed measurement fails the run) and record it.
5. Pass the hash from the Rollout step: under `analysis`, add `args: [{name: canary-hash, valueFrom: {podTemplateHashValue: Latest}}]`.

### Output
`analysis-template.yaml`.

### Quality Gate
- The query in each metric, with a real hash substituted, returns a value when run with `curl "$PROM/api/v1/query"`.
- Every threshold traces to a `guardrail_metrics` entry (name it in a YAML comment).

---

## Phase 3: Test Success and Abort

### Entry Criteria
- Both manifests applied in a test namespace.

### Actions
1. Change the image tag to trigger a rollout, then watch: `kubectl argo rollouts get rollout checkout -n test --watch`.
2. Confirm the AnalysisRun is created and succeeds: `kubectl get analysisrun -n test` shows `Successful`.
3. Force a failure: deploy a canary image or config that returns 5xx on a test endpoint while a load generator calls it. Confirm the AnalysisRun shows `Failed` and the Rollout status shows `Degraded` with the canary scaled down and traffic back on stable.
4. After an abort, the Rollout stays degraded until you act. To retry with a fixed image, update the image; to return to stable fully, `kubectl argo rollouts undo checkout -n test` or re-apply the stable spec. `kubectl argo rollouts promote` skips remaining steps and is never the fix for a failed analysis.
5. Record which component owns the flag versus the deploy: Argo canary guards the new build; the feature flag guards the new behavior. Do not move the flag percentage and the canary weight at the same time, or a failure cannot be attributed.

### Output
`argo_canary_config`.

### Quality Gate
- One test rollout reached `Healthy` with a `Successful` AnalysisRun (paste `kubectl get analysisrun` output).
- One forced-failure rollout reached `Degraded` with a `Failed` AnalysisRun, and stable pods served all traffic afterward (paste the `get rollout` output).

---

## Worked Example

Illustrative only.

```
$ kubectl argo rollouts get rollout checkout -n test
Name:            checkout
Status:          ✖ Degraded
Message:         RolloutAborted: Rollout aborted update to revision 7: Metric "error-ratio" assessed Failed due to failed (2) > failureLimit (1)
Strategy:        Canary
  Step:          2/6
  SetWeight:     0
  ActualWeight:  0
$ kubectl get analysisrun -n test
NAME                     STATUS       AGE
checkout-6c9d8f-7-2      Failed       11m
checkout-5b7f4c-6-2      Successful   2h
```

---

## Exit Criteria

DONE when the service runs as a Rollout whose weights and pauses come from the plan, analysis metrics use guardrail queries and thresholds unchanged, and a test showed both a successful promotion and an automatic abort on a failed analysis.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rollouts CRD missing | **Stop**: the controller is not installed; installation is a cluster admin task. |
| Phase 2 | AnalysisRun `Error` (not `Failed`) | **Adjust**: the Prometheus address or query is wrong; run the query by hand and fix it. |
| Phase 2 | Analysis passes with no traffic | **Adjust**: add the `len(result) > 0` guard and a load source in test. |
| Phase 3 | Abort does not shift traffic back | **Stop**: check the `trafficRouting` config and Service selectors before using in production. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
