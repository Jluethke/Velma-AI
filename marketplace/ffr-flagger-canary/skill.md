# Flagger Canary with Metric Analysis and Load Testing

**One-line description:** Defines a Flagger `Canary` resource for one Deployment with `stepWeight`, `maxWeight`, `interval`, and `threshold` taken from the rollout plan, wires the guardrails as built-in or `MetricTemplate` metrics, adds the load-tester webhook so analysis has traffic, and proves both promotion and automatic rollback.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rollout_plan` (object[], required): Output of `ffr-rollout-stage-plan`.
- `guardrail_metrics` (object[], required): Output of `ffr-guardrail-metrics`.
- `k8s_manifests` (string, required): Path to the Deployment manifests for the service.

---

## Outputs

- `flagger_canary_config` (object): Paths of the `Canary` and any `MetricTemplate` files, the mesh or ingress provider, and the event log of one promoted and one failed canary.

---

## Phase 1: Map the Plan to Canary Analysis Fields

### Entry Criteria
- Flagger is installed for your mesh or ingress: `kubectl get crd canaries.flagger.app` returns the CRD, and the Flagger deployment's `-mesh-provider` (or `meshProvider` Helm value) is known.

### Actions
1. Flagger moves traffic in equal steps, so the plan's percentages must fit this model:

| Field | Meaning | Source |
|---|---|---|
| `analysis.interval` | time between checks and weight steps | `rollout_plan` stage dwell divided by checks per stage |
| `analysis.stepWeight` | traffic added per step | difference between consecutive plan percentages, if they are evenly spaced |
| `analysis.stepWeights` | explicit list of weights (newer Flagger versions; check `kubectl explain canary.spec.analysis`) | the plan's percentages directly, if uneven |
| `analysis.maxWeight` | weight at which Flagger promotes | the last plan percentage below 100 |
| `analysis.threshold` | failed checks before rollback | owner input; if none, record an open question |

2. If the plan's percentages are uneven and `kubectl explain canary.spec.analysis.stepWeights` returns "field does not exist", record that the plan cannot be represented exactly and return to the owner.
3. Note that Flagger replaces the Deployment's Service: it creates `<name>-primary` and `<name>-canary` Deployments and Services. Do not create Services with those names yourself.

### Output
Analysis field values with sources.

### Quality Gate
- Every analysis field value traces to a `rollout_plan` value or an owner input (written next to it).
- `kubectl explain canary.spec.analysis` was run and its field list confirms each field you use.

---

## Phase 2: Write the Canary and Metrics

### Entry Criteria
- Field values known.

### Actions
1. Write `canary.yaml`:
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: checkout
  namespace: test
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: checkout
  service:
    port: 8080
  analysis:
    interval: 1h
    threshold: 2
    maxWeight: 50
    stepWeight: 25
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 98.56
      interval: 5m
    webhooks:
    - name: load-test
      url: http://flagger-loadtester.test/
      timeout: 5s
      metadata:
        cmd: "hey -z 1m -q 10 -c 2 http://checkout-canary.test:8080/healthz"
```
2. Built-in metrics `request-success-rate` (percent) and `request-duration` (milliseconds, p99) exist for supported meshes and ingresses. Convert the guardrail threshold to these units: an error ratio limit of 0.0144 is a success rate minimum of 98.56 percent. Show the conversion.
3. For a guardrail not covered by built-ins, write a `MetricTemplate` with the guardrail's PromQL. Use Flagger's template variables (`{{ namespace }}`, `{{ target }}`, `{{ interval }}`) so the query targets the canary workload:
```yaml
apiVersion: flagger.app/v1beta1
kind: MetricTemplate
metadata:
  name: checkout-5xx-ratio
  namespace: test
spec:
  provider:
    type: prometheus
    address: http://prometheus.monitoring:9090
  query: |
    sum(rate(http_server_request_duration_seconds_count{namespace="{{ namespace }}",pod=~"{{ target }}-[0-9a-zA-Z]+(-[0-9a-zA-Z]+)",http_response_status_code=~"5.."}[{{ interval }}]))
    / sum(rate(http_server_request_duration_seconds_count{namespace="{{ namespace }}",pod=~"{{ target }}-[0-9a-zA-Z]+(-[0-9a-zA-Z]+)"}[{{ interval }}]))
```
Reference it in `metrics` with `templateRef: {name: checkout-5xx-ratio}` and `thresholdRange: {max: 0.0144}`.
4. Keep the load-test webhook. Without traffic to the canary, Flagger finds no metric values and halts advancement; in low-traffic services the canary never progresses or, worse, passes on very few requests. The load tester is the `flagger-loadtester` deployment from the Flagger repository; install it in the namespace if missing.

### Output
`canary.yaml` and any `MetricTemplate` files.

### Quality Gate
- `kubectl apply --dry-run=server -f canary.yaml` succeeds.
- Each threshold shows its conversion from a `guardrail_metrics` value.

---

## Phase 3: Test Promotion and Rollback

### Entry Criteria
- Canary applied in a test namespace; `kubectl get canary checkout -n test` shows `Initialized`.

### Actions
1. Trigger a rollout by changing the Deployment image. Watch: `kubectl get canary checkout -n test -w` and `kubectl describe canary checkout -n test` (events list each step).
2. Confirm the phases progress to `Succeeded` and the event log shows weight steps up to `maxWeight` and "Promotion completed".
3. Force a failure: deploy an image that returns 5xx on the load-tested path. Confirm the events show failed checks reaching `threshold`, then rollback, and the phase `Failed`, with the primary Deployment still on the old image.
4. Read the Flagger controller logs if something stalls: `kubectl logs -n <flagger-namespace> deploy/flagger | grep checkout`.

### Output
`flagger_canary_config`.

### Quality Gate
- One canary reached `Succeeded` (paste `kubectl get canary` and the promotion event).
- One canary reached `Failed` with the primary image unchanged (`kubectl get deploy checkout-primary -n test -o jsonpath='{.spec.template.spec.containers[0].image}'` shows the old tag).

---

## Worked Example

Illustrative only.

```
$ kubectl describe canary checkout -n test | tail -6
  Normal   Synced  3m   flagger  New revision detected! Scaling up checkout.test
  Normal   Synced  2m   flagger  Starting canary analysis for checkout.test
  Normal   Synced  2m   flagger  Advance checkout.test canary weight 25
  Warning  Synced  1m   flagger  Halt checkout.test advancement success rate 91.20% < 98.56%
  Warning  Synced  30s  flagger  Halt checkout.test advancement success rate 89.75% < 98.56%
  Warning  Synced  10s  flagger  Rolling back checkout.test failed checks threshold reached 2
$ kubectl get canary checkout -n test
NAME       STATUS   WEIGHT   LASTTRANSITIONTIME
checkout   Failed   0        2026-10-20T14:02:11Z
```

---

## Exit Criteria

DONE when the `Canary` fields trace to the plan, guardrails are expressed as built-in or templated metrics with shown unit conversions, a load source exists, and tests showed one promotion and one automatic rollback.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Plan percentages uneven and `stepWeights` unsupported | **Return**: ask the owner to accept even steps or upgrade Flagger. |
| Phase 2 | "no values found for metric" in events | **Adjust**: check the load tester runs and the query's pod regex matches canary pods. |
| Phase 3 | Canary stuck in `Progressing` | **Adjust**: read Flagger logs; usually the canary Deployment never becomes ready. |
| Phase 3 | Rollback leaves the new image on primary | **Stop**: do not use in production; check that nothing else (a GitOps tool) is overwriting the primary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
