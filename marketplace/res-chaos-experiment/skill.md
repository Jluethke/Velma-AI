# Chaos Experiment With Chaos Toolkit and Chaos Mesh

**One-line description:** Runs a hypothesis-driven chaos experiment in a shared Kubernetes environment: a Chaos Toolkit experiment whose steady-state hypothesis is a PromQL SLO check (jq -e exit code), whose method applies a time-boxed Chaos Mesh NetworkChaos or PodChaos, and whose rollbacks always remove it, then reads the journal to decide whether the system held.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dependency_map` (object[], required): Output of `res-dependency-map`.
- `fault_results` (object[], required): Output of `res-toxiproxy-faults`. Only faults that PASSED there may be run here.
- `steady_state_slo` (object, required): `prometheus_url`, `query` (a PromQL expression returning one number, for example the 5-minute error ratio of the service), `max_value` (the SLO threshold), `namespace` and `target_labels` for the experiment, and the written approval of the environment owner. All user inputs.

---

## Outputs

- `chaos_journal` (object): Experiment file path, Chaos Mesh manifest, `chaos run` command, journal path, journal `status` and `deviated` values, the steady-state probe values before, during and after, and the conclusion with follow-up items.

---

## Phase 1: Design the Experiment

### Entry Criteria
- `fault_results` has at least one PASS for a critical dependency.
- Chaos Mesh installed in the cluster (`kubectl get crd networkchaos.chaos-mesh.org` returns the CRD) and Chaos Toolkit installed (`chaos --version`).
- Owner approval present in `steady_state_slo`.

### Actions
1. Pick ONE fault that passed in Toxiproxy for a critical dependency. Write the hypothesis in one sentence: "While <dependency> has <fault> for <duration>, `query` stays at or below `max_value`."
2. Translate to Chaos Mesh (fault values copied from the passing Toxiproxy row):

| Toxiproxy fault | Chaos Mesh kind and action |
|---|---|
| latency | `NetworkChaos`, `action: delay`, `delay: { latency: "<ms>ms", jitter: "<ms>ms" }` |
| dependency down | `NetworkChaos`, `action: partition`, `direction: to` |
| reset or instance loss | `PodChaos`, `action: pod-kill`, `mode: one` |

3. Blast radius: target only the labels in `target_labels`, `mode: one` or `fixed-percent` with a value the owner approved, and always set `duration` so Chaos Mesh removes the fault by itself even if the runner dies.
4. Write `netchaos.yaml`:
   ```yaml
   apiVersion: chaos-mesh.org/v1alpha1
   kind: NetworkChaos
   metadata: { name: payments-delay, namespace: <namespace> }
   spec:
     action: delay
     mode: all
     selector: { namespaces: [<namespace>], labelSelectors: { app: payments } }
     delay: { latency: "1000ms", jitter: "50ms" }
     duration: "5m"
   ```
   Check field names against the Chaos Mesh docs for the installed version (`kubectl explain networkchaos.spec`).
5. Do NOT target production unless the owner approval explicitly names production and this exact experiment.

### Output
Hypothesis and Chaos Mesh manifest.

### Quality Gate
- `kubectl apply --dry-run=server -f netchaos.yaml` succeeds.
- The manifest has a `duration` and a label selector limited to `target_labels`.

---

## Phase 2: Write and Validate the Chaos Toolkit Experiment

### Entry Criteria
- Manifest validated.

### Actions
1. Write `experiment.json`:
   ```json
   {
     "version": "1.0.0",
     "title": "Checkout holds SLO while payments is slow",
     "description": "Hypothesis from res-chaos-experiment Phase 1",
     "steady-state-hypothesis": {
       "title": "Error ratio within SLO",
       "probes": [{
         "type": "probe", "name": "error-ratio-within-slo", "tolerance": 0,
         "provider": { "type": "process", "path": "sh",
           "arguments": ["-c", "curl -s --data-urlencode 'query=<query>' <prometheus_url>/api/v1/query | jq -e '(.data.result[0].value[1] | tonumber) <= <max_value>'"] }
       }]
     },
     "method": [
       { "type": "action", "name": "inject-payments-delay",
         "provider": { "type": "process", "path": "kubectl", "arguments": ["apply", "-f", "netchaos.yaml"] },
         "pauses": { "after": 180 } }
     ],
     "rollbacks": [
       { "type": "action", "name": "remove-payments-delay",
         "provider": { "type": "process", "path": "kubectl", "arguments": ["delete", "-f", "netchaos.yaml", "--ignore-not-found"] } }
     ]
   }
   ```
   `tolerance: 0` means the probe passes when the process exits 0; `jq -e` exits 0 only when the comparison is true. The pause must exceed the PromQL range in `query` so the check sees fault-time data.
2. Run the probe command by hand first and confirm exit code 0 in the steady state: `sh -c "<the same command>"; echo $?`.
3. Validate: `chaos validate experiment.json` must report the experiment as valid.
4. Check rollback behavior for your Chaos Toolkit version with `chaos run --help` (newer versions have `--rollback-strategy`; choose `always` if available so rollbacks run even when the hypothesis deviates).

### Output
Validated experiment.

### Quality Gate
- `chaos validate experiment.json` succeeds (output saved).
- The manual probe run exits 0 before the experiment.

---

## Phase 3: Run and Read the Journal

### Entry Criteria
- Validated; owner notified of the run window.

### Actions
1. Run: `chaos run experiment.json --journal-path journal.json` (add `--rollback-strategy always` if supported).
2. Watch live: `kubectl get networkchaos -n <namespace> -w` and the service dashboard. If a user-facing alert outside the experiment's scope fires, delete the chaos object immediately: `kubectl delete -f netchaos.yaml`.
3. Read the journal: `jq '{status, deviated, steady_states: .steady_states, rollbacks: [.rollbacks[].status]}' journal.json`.
4. Interpret with this table:

| `status` | `deviated` | Conclusion |
|---|---|---|
| completed | false | Hypothesis held; system tolerated the fault |
| completed | true | Hypothesis broken; find which control did not engage (timeout, retry, breaker, fallback) using the same metrics as `res-toxiproxy-faults` Phase 3 |
| failed or aborted | any | Experiment did not run cleanly; fix the experiment, not the service, then rerun |

5. Confirm cleanup: `kubectl get networkchaos -n <namespace>` returns no experiment objects.
6. Record follow-ups for every deviation, routed to the owning flow.

### Output
`chaos_journal` with conclusion.

### Quality Gate
- `journal.json` exists and its `status` and `deviated` values are copied into the output.
- No chaos objects remain after the run.

---

## Worked Example

Illustrative. `steady_state_slo`: query `sum(rate(http_server_request_duration_seconds_count{service="checkout",http_response_status_code=~"5.."}[2m])) / sum(rate(http_server_request_duration_seconds_count{service="checkout"}[2m]))`, `max_value` 0.01, namespace `staging`, approved by the platform owner. Toxiproxy PASS: payments latency 791 ms.

Phase 3: `chaos run experiment.json --journal-path journal.json --rollback-strategy always` logs the steady-state check passing before the method, the `inject-payments-delay` action, the 180 s pause, the steady-state check passing again after the method, the rollback action, and `Experiment ended with status: completed` (exact log wording varies by Chaos Toolkit version). `jq` on the journal prints `{"status":"completed","deviated":false,...}`. `kubectl get networkchaos -n staging` prints `No resources found`.

---

## Exit Criteria

DONE when one approved, time-boxed, label-scoped fault has been run under a PromQL steady-state hypothesis, rollbacks removed it, and the journal's status and deviation are recorded with a conclusion and routed follow-ups.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No owner approval | **Stop**: do not run chaos in a shared environment without it. |
| Phase 1 | The fault failed in Toxiproxy | **Return**: fix it through `res-toxiproxy-faults` first; chaos in a shared environment is not where known failures are found. |
| Phase 2 | Probe exits non-zero in steady state | **Adjust**: the system is already outside SLO or the query is wrong; do not start the experiment. |
| Phase 3 | Rollback failed | **Stop**: delete the chaos object manually with `kubectl delete`, confirm with `kubectl get`, then report. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
