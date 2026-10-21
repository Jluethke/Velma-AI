# Go GOMAXPROCS and GOMEMLIMIT for Container Limits

**One-line description:** Aligns the Go scheduler and garbage collector with the pod's CPU and memory settings: confirms what GOMAXPROCS the binary actually uses (Go 1.25 container-aware default, `automaxprocs` before that, or the downward API when there is no CPU limit), and sets GOMEMLIMIT from the memory limit minus measured non-Go memory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Go module root.
- `resourced_deployment` (string, required): Deployment path from `k8s-requests-limits-from-usage`.
- `usage_report` (object, required): Output of `k8s-resource-usage-measure`; uses `throttle_ratio`.

---

## Outputs

- `go_runtime_settings` (object): `go_directive`, `toolchain_version`, `gomaxprocs_before`, `gomaxprocs_after`, `gomaxprocs_source` (`runtime-default`, `automaxprocs`, `downward-api`, `env-static`), `gomemlimit`, `non_go_memory_mib` (measured), `env` (name to value or valueFrom).

---

## Phase 1: Read the Versions and Current Values

### Entry Criteria
- `stack` == `go`, a pod is running.

### Actions
1. `go list -m -f '{{.GoVersion}}'` prints the `go` directive of the main module. `go version` in the build image prints the toolchain. Record both. Go 1.25 made the default GOMAXPROCS respect the cgroup CPU limit, and that behavior is enabled when the main module's `go` directive is 1.25 or later (GODEBUG `containermaxprocs` and `updatemaxprocs`).
2. Check for automaxprocs: `grep -rn "go.uber.org/automaxprocs" go.mod --include=*.go .`.
3. Read the value the running binary uses. If the app does not log it, add one line at startup in `main`: `log.Printf("GOMAXPROCS=%d", runtime.GOMAXPROCS(0))`, rebuild, deploy to a test namespace, and read `kubectl logs -n NS POD | grep GOMAXPROCS`. With automaxprocs the library logs `maxprocs: Updating GOMAXPROCS=...` itself.
4. Read the pod's CPU settings from `resourced_deployment`: `requests.cpu` and whether `limits.cpu` exists.
5. Note `usage_report.throttle_ratio`. Throttling with GOMAXPROCS above the CPU limit is a known cause of latency spikes: many threads burn the CFS quota early in each period.

### Output
Versions, `gomaxprocs_before`, CPU settings.

### Quality Gate
- `gomaxprocs_before` is copied from a log line, not computed.

---

## Phase 2: Choose the GOMAXPROCS Source

### Entry Criteria
- Phase 1 complete.

### Actions
1. Use the first matching row:

| CPU limit set | `go` directive | Action | `gomaxprocs_source` |
|---|---|---|---|
| Yes | 1.25 or later | Nothing; the runtime uses the limit (rounded up) and updates if it changes | `runtime-default` |
| Yes | Below 1.25 | Add `import _ "go.uber.org/automaxprocs"` in `main` (`go get go.uber.org/automaxprocs`), or raise the `go` directive to 1.25+ after confirming the toolchain and tests | `automaxprocs` |
| No | Any | The runtime sees no limit and uses the node CPU count. Set the env var from the request with the downward API (block below) | `downward-api` |

2. Downward API block (CPU with `divisor: "1"` is rounded UP to a whole number, so `250m` gives 1):
```yaml
env:
  - name: GOMAXPROCS
    valueFrom:
      resourceFieldRef:
        resource: requests.cpu
        divisor: "1"
```
   An explicit `GOMAXPROCS` env var overrides both the Go 1.25 default and automaxprocs (automaxprocs respects an existing env value).
3. Do not set GOMAXPROCS to a literal number in the manifest unless the CPU request is also a fixed literal; the downward API keeps them in sync.

### Output
`gomaxprocs_source` and env.

### Quality Gate
- The table row is named.
- For `downward-api`, `yq '.spec.template.spec.containers[0].env[] | select(.name=="GOMAXPROCS")' deployment.yaml` prints the block.

---

## Phase 3: Set GOMEMLIMIT from Measured Memory

### Entry Criteria
- A memory limit exists in `resourced_deployment` (GOMEMLIMIT needs Go 1.19 or later).

### Actions
1. Measure Go heap versus total memory in the running pod under load. Temporarily set `GODEBUG=gctrace=1` in a test namespace; each GC prints a line like `gc 42 @12.3s 1%: ... 180->184->96 MB, 192 MB goal, ...`. Record the largest `goal`. Compare with `container_memory_working_set_bytes` from `usage_report`. `non_go_memory_mib` = working set peak minus the Go runtime's total (`runtime/metrics` `/memory/classes/total:bytes`, or `go_memstats_sys_bytes` from the Prometheus Go collector). It covers cgo allocations, thread stacks outside the runtime, and mapped files.
2. `GOMEMLIMIT = memory_limit - non_go_memory`, written with a unit suffix the runtime accepts (`B`, `KiB`, `MiB`, `GiB`), for example `GOMEMLIMIT=410MiB`.
3. Do not set GOMEMLIMIT equal to the full memory limit through `resourceFieldRef limits.memory` when `non_go_memory_mib` is above zero: the Go heap would be allowed to use memory the non-Go part also needs, and the kernel OOM-kills first.
4. Keep `GOGC` at its default (100) unless a profile justifies a change. GOMEMLIMIT is a soft limit: near it the GC runs more often, and the runtime caps GC CPU use so it does not stop the program entirely; sustained operation at the limit means the memory limit is too small.
5. Remove `GODEBUG=gctrace=1` after measuring.

### Output
`go_runtime_settings`.

### Quality Gate
- `GOMEMLIMIT` arithmetic is written with each measured term.
- After rollout, `kubectl get pod POD -n NS -o jsonpath='{.spec.containers[0].env}'` lists GOMAXPROCS (or the runtime-default row applies) and GOMEMLIMIT, and the startup log line shows the GOMAXPROCS value the binary uses.
- `gctrace` env is absent from the final Deployment (`grep -c gctrace deployment.yaml` prints 0).

---

## Worked Example

Illustrative only. Go service, `go 1.22` directive, toolchain 1.23, no CPU limit, request `500m`, memory limit `512Mi`, node has 32 CPUs.

Phase 1: log line `GOMAXPROCS=32`; `throttle_ratio` 0 (no limit) but p99 latency spikes during GC.

Phase 2: row "No CPU limit", downward API env added; new log line `GOMAXPROCS=1`.

Phase 3:
```
gc 311 @904.2s 3%: 0.11+21+0.05 ms clock, ... 371->379->190 MB, 382 MB goal, 0 MB stacks, 0 MB globals, 1 P
```
Working set peak 455 MiB, Go runtime total 418 MiB, so `non_go_memory_mib = 37`. `GOMEMLIMIT = 512 - 37 = 475MiB`.

---

## Exit Criteria

DONE when the running binary's GOMAXPROCS matches the pod's CPU allotment by a named source, GOMEMLIMIT is set from measured non-Go memory, and diagnostic GODEBUG settings are removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | App does not log GOMAXPROCS and code changes are not allowed | **Adjust**: expose `runtime.GOMAXPROCS(0)` via the existing metrics endpoint or read `go_sched_gomaxprocs_threads` from the Prometheus Go collector. |
| Phase 2 | automaxprocs and Go 1.25 default both present | **Adjust**: keep one; remove automaxprocs after moving the `go` directive to 1.25+ and running `go test ./...`. |
| Phase 3 | Go total memory alone exceeds the memory limit | **Return**: to `k8s-requests-limits-from-usage`. |
| Phase 3 | GC CPU above recorded baseline after setting GOMEMLIMIT | **Adjust**: limit too tight for the live heap; raise the memory limit with measured data. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
