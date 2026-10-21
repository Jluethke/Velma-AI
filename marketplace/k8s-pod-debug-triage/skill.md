# Pod Debug Triage: describe, events, logs, debug containers

**One-line description:** Captures the evidence of a failed rollout before anything is rolled back (pod phase and container state, `kubectl describe` events, current and previous logs, namespace events sorted by time) and sorts the failure into one class (scheduling, image pull, config, crash loop, probe failure, quota/admission) with the evidence line that proves it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cluster_context` (string, required): kubeconfig context.
- `namespace` (string, required): Namespace.
- `app_name` (string, required): Deployment name.
- `rollout_result` (string, required): From `k8s-rollout-status-watch`; triage runs when it is not `complete`.

---

## Outputs

- `triage_report` (object): `failure_class`, `waiting_reason` (for example `CrashLoopBackOff`), `terminated_reason`, `exit_code`, `evidence` (exact lines), `evidence_dir` (saved files), `affected_pods`, `new_replicaset`.

---

## Phase 1: Capture Evidence First

### Entry Criteria
- `rollout_result` is not `complete`.
- Nothing has been rolled back yet. A rollback deletes the failing pods and their logs.

### Actions
1. Create a folder outside the repository, for example `~/triage/<app>-<UTC timestamp>/`, and save every command output there (`> file.txt 2>&1`).
2. Run and save:
```bash
kubectl --context "$CTX" -n NS get deploy,rs,pods -l app.kubernetes.io/name=APP -o wide          > overview.txt
kubectl --context "$CTX" -n NS describe deploy APP                                           > deploy-describe.txt
kubectl --context "$CTX" -n NS get events --sort-by=.lastTimestamp                           > events.txt
```
3. Pick the failing pods: those owned by the NEWEST ReplicaSet (see `overview.txt`) whose READY is not full or whose RESTARTS is above 0. For each (at most the ones needed to show the pattern; record which were skipped):
```bash
kubectl --context "$CTX" -n NS describe pod POD                         > POD-describe.txt
kubectl --context "$CTX" -n NS logs POD --all-containers --timestamps   > POD-logs.txt
kubectl --context "$CTX" -n NS logs POD --all-containers --previous --timestamps > POD-logs-previous.txt
kubectl --context "$CTX" -n NS get pod POD -o jsonpath='{range .status.containerStatuses[*]}{.name} waiting={.state.waiting.reason} lastTerminated={.lastState.terminated.reason} exit={.lastState.terminated.exitCode} restarts={.restartCount}{"\n"}{end}' > POD-state.txt
```
   `--previous` shows the log of the container instance that crashed; the current log of a crash-looping container is often empty. An error `previous terminated container ... not found` means it has not restarted yet.
4. Init containers: also run the jsonpath with `.status.initContainerStatuses[*]`; a pod stuck in `Init:` status fails there.

### Output
Evidence folder.

### Quality Gate
- `ls evidence_dir` lists the overview, events, and describe, logs, previous logs and state files for each chosen pod.

---

## Phase 2: Classify the Failure

### Entry Criteria
- Evidence captured.

### Actions
1. Use the first row that matches the evidence:

| Evidence | `failure_class` |
|---|---|
| Pod `Pending`; event `FailedScheduling` with `Insufficient cpu`, `Insufficient memory`, `didn't match Pod's node affinity/selector`, `untolerated taint`, or `didn't match pod topology spread constraints` | `scheduling` |
| ReplicaSet event `FailedCreate` with `exceeded quota` or `violates PodSecurity` or `admission webhook ... denied` | `admission` |
| `waiting=ErrImagePull` or `ImagePullBackOff`; event text `manifest unknown`, `unauthorized`, `not found`, or `no match for platform in manifest` | `image-pull` |
| `waiting=CreateContainerConfigError`; event `couldn't find key ... in Secret` or `configmap ... not found`, or `container has runAsNonRoot and image has non-numeric user` | `config` |
| `waiting=CreateContainerError` or `RunContainerError`; event mentions `exec format error`, `executable file not found in $PATH`, or `permission denied` on start | `container-start` |
| `waiting=CrashLoopBackOff` with `lastTerminated` set | `crash-loop` |
| Running but not Ready; events `Readiness probe failed` | `readiness` |
| Restarts with events `Liveness probe failed` or `Startup probe failed` then `Killing` | `probe-kill` |
| Running and Ready, rollout still not complete | `progress-stalled` (check `minReadySeconds` and surge settings in `deploy-describe.txt`) |

2. Copy the single evidence line that matched into `evidence`, with its file name.
3. `CrashLoopBackOff` is a waiting state after repeated exits; the container restarts with an increasing back-off delay (capped at five minutes per Kubernetes docs). The cause is in the exit code and the previous log, handled by `k8s-crashloopbackoff-decision`.

### Output
`failure_class` with evidence.

### Quality Gate
- Exactly one row is named and its evidence line is quoted from a saved file.

---

## Phase 3: Look Inside When Logs Are Not Enough

### Entry Criteria
- The class is `crash-loop`, `readiness`, `probe-kill` or `container-start`, and the previous log does not show the cause.

### Actions
1. Ephemeral debug container sharing the process namespace of the target container (works on distroless images; ephemeral containers are GA since Kubernetes 1.25):
```bash
kubectl --context "$CTX" -n NS debug -it POD --image=busybox --target=APP -- sh
```
   Inside: `ls -l /proc/1/root/app` (the target's filesystem through `/proc/1/root`, if permissions allow), `cat /proc/1/environ | tr '\0' '\n'` to read the target's environment (secret values appear; do not paste them into notes), `wget -qO- -T 2 localhost:<port>/readyz` to test the probe path from inside the pod network.
2. Crashing too fast to attach: copy the pod with a sleeping command and inspect the copy:
```bash
kubectl --context "$CTX" -n NS debug POD -it --copy-to=APP-debug --container=APP -- sh
```
   This needs a shell in the image; for distroless add `--image=busybox` and `--share-processes`. Delete the copy afterwards: `kubectl -n NS delete pod APP-debug`.
3. In a namespace enforcing Pod Security `restricted`, a root busybox debug container is rejected. Check `kubectl debug --help` for `--profile` (for example `--profile=restricted` on recent kubectl versions) and use it.
4. Record findings in `triage_report` and note that debug pods or ephemeral containers were created (they remain in the pod spec until the pod is deleted).

### Output
`triage_report`.

### Quality Gate
- Any debug copy pod is deleted: `kubectl -n NS get pod APP-debug` returns `NotFound`.
- `triage_report.failure_class` and `evidence` are filled.

---

## Worked Example

Illustrative only. `orders`, `rollout_result=failed-deadline`.

Phase 1 state file:
```
orders waiting=CrashLoopBackOff lastTerminated=OOMKilled exit=137 restarts=6
```
Previous log ends with `Booting worker with pid: 31` lines repeated for 33 workers. Events:
```
Warning  BackOff  pod/orders-6f8d7c9b54-qz2xw  Back-off restarting failed container orders in pod orders-6f8d7c9b54-qz2xw_shop(...)
```

Phase 2: row `crash-loop`, evidence `POD-state.txt: lastTerminated=OOMKilled exit=137`, `waiting_reason=CrashLoopBackOff`.

Phase 3 not needed; cause visible. Report passed to `k8s-rollout-undo` and `k8s-crashloopbackoff-decision`.

---

## Exit Criteria

DONE when the evidence folder is complete, the failure has one class with a quoted evidence line, and debug artifacts are cleaned up.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Pods already gone (rolled back by someone) | **Adjust**: use `events.txt` and the ReplicaSet describe; record the evidence gap. |
| Phase 1 | `logs --previous` not found | **Adjust**: the container has not restarted; use current logs. |
| Phase 2 | No row matches | **Return**: to the user with the evidence folder; do not guess a class. |
| Phase 3 | `kubectl debug` forbidden by RBAC | **Stop**: ask for the `pods/ephemeralcontainers` permission or a debug role. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
