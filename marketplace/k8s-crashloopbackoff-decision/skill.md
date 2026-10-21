# CrashLoopBackOff Decision Table

**One-line description:** Turns a crash-loop triage report into one root cause and one fix by reading the last terminated reason, the exit code, and the previous container log against a decision table (OOMKilled 137, liveness kill, app error 1, 126/127 command problems, 139 segfault, 143 SIGTERM, 0 exit, 134 abort) and names the flow that owns the fix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `triage_report` (object, required): From `k8s-pod-debug-triage` with `waiting_reason` == `CrashLoopBackOff`.
- `workload_profile` (object, required): From `k8s-workload-inventory`; uses `stack`, `entrypoint_form`, `image_platforms`.

---

## Outputs

- `crash_cause` (object): `table_row`, `exit_code`, `terminated_reason`, `evidence_lines`, `confidence` (`confirmed` when a log or event line proves it, `probable` otherwise).
- `fix_plan` (object): `owner_flow`, `change` (one concrete change), `verification_command`, `do_not` (the tempting wrong fixes for this cause).

---

## Phase 1: Read the Three Signals

### Entry Criteria
- `triage_report.waiting_reason` == `CrashLoopBackOff` and `triage_report.evidence_dir` exists.

### Actions
1. From `POD-state.txt` read `lastTerminated` (the reason) and `exit` (the code).
2. From `POD-describe.txt` read the `Last State: Terminated` block (`Reason`, `Exit Code`, `Started`, `Finished`). `Finished` minus `Started` is how long the container lived; record it.
3. From `POD-logs-previous.txt` read from the END backward until the first error line or stack trace start (`grep -nE "Error|Exception|Traceback|panic:|FATAL" POD-logs-previous.txt | tail` finds the line numbers). The cause is usually in the final lines.
4. From `events.txt` read lines for the pod that contain `Liveness probe failed`, `Startup probe failed`, `Killing`, or `OOMKilling` (node-level OOM).

### Output
Reason, exit code, lifetime, last log lines, probe events.

### Quality Gate
- Each of the four signals is copied verbatim or recorded as "absent".

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Signals recorded.

### Actions
1. Use the first row that matches. Exit codes above 128 are 128 plus a signal number (137 = SIGKILL 9, 143 = SIGTERM 15, 139 = SIGSEGV 11, 134 = SIGABRT 6).

| Row | Reason / exit code | Extra evidence | Cause | Owner flow and change |
|---|---|---|---|---|
| C1 | `OOMKilled` / 137 | none needed | Container exceeded `limits.memory` | `k8s-requests-limits-from-usage` with new peak; then the stack runtime flow (`k8s-py-gunicorn-worker-sizing`, `k8s-node-heap-sizing`, `k8s-go-gomaxprocs-gomemlimit`, `k8s-jvm-container-heap`) to keep the runtime under the limit |
| C2 | `Error` / 137 | Events show `Liveness probe failed` or `Startup probe failed` then `Killing` | Kubelet killed it for a failed probe | `k8s-probe-tuning`: startup budget too small or liveness checks a dependency |
| C3 | `Error` / 137 | No probe events, no OOM | Killed by something else (node OOM `OOMKilling` event, preemption, external kill) | Read node events: `kubectl describe node <node>`; usually node memory pressure, so requests too low (`k8s-requests-limits-from-usage`) |
| C4 | `Error` / 1 (or other small code) | Stack trace or error in previous log | Application error at startup (missing env var, cannot reach database, bad config value, failed migration) | Fix the named cause; if it is config, `k8s-configmap-secret-wiring` |
| C5 | `ContainerCannotRun` or `Error` / 127 | `executable file not found` or `not found` | Command or binary path wrong in image or `command:` | Image build or `command:` override; compare with `docker image inspect` Entrypoint/Cmd |
| C6 | `Error` / 126 | `permission denied` | Binary not executable, or read-only filesystem blocks a write at start | Image file mode (`chmod +x` in the Dockerfile), or add an `emptyDir` (`k8s-security-context-hardening`) |
| C7 | Any / 1 or 255 | `exec format error` | Image architecture differs from the node | Rebuild for the node architecture (`workload_profile.image_platforms`) |
| C8 | `Error` / 139 | Segfault, native library message | Native crash (C extension, JNI, glibc/musl mismatch) | Image base or native dependency; not a Kubernetes setting |
| C9 | `Error` / 134 | `JavaScript heap out of memory` or JVM `hs_err` / abort | Runtime heap limit reached (heap limit below need) | Stack runtime flow; heap flag too small or leak |
| C10 | `Completed` / 0 | Log shows a normal finish | Process exits on success; a Deployment restarts every exit | The workload is a Job or the server runs in the background (daemonizing); run it in the foreground |
| C11 | `Error` / 143 | Log shows shutdown right after start | Something sends SIGTERM (probe kill with grace, or a sidecar/init order issue) | Check probe events (C2) and the entrypoint wrapper |
| C12 | Anything else | | Unclassified | **Return** the evidence to the user; do not guess |

2. Set `confidence`: `confirmed` when an evidence line from the table's "Extra evidence" column was found; `probable` when only the exit code matched.
3. For C4, name the exact log line: for example `KeyError: 'DATABASE_URL'`, `ECONNREFUSED 10.43.12.7:5432`, `Caused by: org.postgresql.util.PSQLException: Connection refused`.

### Output
`crash_cause`.

### Quality Gate
- One row id is named, with the exit code and at least one evidence line quoted from a saved file.

---

## Phase 3: Write the Fix Plan

### Entry Criteria
- Cause identified.

### Actions
1. Write ONE change in `fix_plan.change`, in the owner flow named by the row. Do not combine several speculative changes.
2. Write the `verification_command` that proves the fix, for example `kubectl -n NS rollout status deployment/APP --timeout=660s` plus `kubectl -n NS get pods -l app.kubernetes.io/name=APP` showing RESTARTS 0 after the startup budget has passed.
3. Write `do_not` for the row:

| Row | Do not |
|---|---|
| C1, C9 | Remove the memory limit; raise it without a new measurement |
| C2 | Delete the liveness probe; set a huge `initialDelaySeconds` |
| C3 | Ignore node pressure; set the pod's priority to preempt others without approval |
| C4 | Catch and ignore the startup exception so the pod looks Running |
| C6 | Set `readOnlyRootFilesystem: false` or run as root |
| C10 | Add `sleep infinity` to keep the container alive |

4. The fix ships as a normal change through the same chain from the owner flow onward; it is never a `kubectl edit` on the live Deployment.

### Output
`fix_plan`.

### Quality Gate
- `fix_plan.change` names one file and one field or code line.
- `fix_plan.verification_command` is a runnable command.

---

## Worked Example

Illustrative only. Triage evidence: `lastTerminated=OOMKilled exit=137 restarts=6`; container lived 9 seconds; previous log shows 33 `Booting worker` lines; `workload_profile.stack=python`.

Phase 2: row C1, `confirmed` (reason OOMKilled is itself proof). 33 workers on a 16-CPU node while the pod requests 500m points to worker count, not the app's per-request memory.

Phase 3:
- `owner_flow`: `k8s-py-gunicorn-worker-sizing`.
- `change`: set `WEB_CONCURRENCY=3` in the Deployment `env` and `workers = int(os.environ["WEB_CONCURRENCY"])` in `gunicorn.conf.py`.
- `verification_command`: `kubectl -n shop rollout status deployment/orders --timeout=660s && kubectl -n shop get pods -l app.kubernetes.io/name=orders`.
- `do_not`: raise `limits.memory` to 2Gi to fit 33 workers.

---

## Exit Criteria

DONE when the crash maps to exactly one table row with quoted evidence and the fix plan names one change, its owner flow, a verification command and the wrong fixes to avoid.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Previous log empty | **Adjust**: the app crashes before logging; use `kubectl debug --copy-to` from `k8s-pod-debug-triage` Phase 3 to run the command by hand. |
| Phase 2 | Two rows seem to match | **Adjust**: take the first in table order; it has the stronger evidence. |
| Phase 2 | Row C12 | **Return**: hand the evidence folder to the user. |
| Phase 3 | Fix needs changes in two flows | **Adjust**: plan the first change only, verify, then rerun this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
