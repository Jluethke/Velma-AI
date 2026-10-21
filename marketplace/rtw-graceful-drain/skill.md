# Graceful Drain of Realtime Connections on Deploy

**One-line description:** Makes a realtime server shut down without a reconnect storm: on SIGTERM it fails readiness, stops accepting upgrades, closes live connections with code 1012 in batches spread over a drain window that fits the platform grace period, and exits, with the stack-specific traps (Go `http.Server.Shutdown` ignores hijacked connections) handled and a rolling-restart test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Service repository.
- `stack` (string, required): `node`, `python` or `go`.
- `close_code_map` (object, required): From `rtw-close-code-map`; gives the restart code (1012) and its client action.
- `deploy_platform` (string, required): `kubernetes`, `ecs`, `systemd` or `other`, with the manifest or unit file path.

---

## Outputs

- `drain_impl` (object): `{ drain_window_s, batch_plan, grace_period_s, prestop, files_changed: [], restart_test: { command, observed_close_codes, reconnect_spread } }`.

---

## Phase 1: Fit the Drain Window to the Platform

### Entry Criteria
- Inputs present.

### Actions
1. Read the platform's kill timer:
   - Kubernetes: `terminationGracePeriodSeconds` in the pod spec (default 30 s per Kubernetes docs). `kubectl get deploy <name> -o jsonpath='{.spec.template.spec.terminationGracePeriodSeconds}'`. After it expires the kubelet sends SIGKILL.
   - ECS: `stopTimeout` in the container definition (ECS default 30 s per AWS docs).
   - systemd: `TimeoutStopSec` (`systemctl show <unit> -p TimeoutStopUSec`).
   Record the value as `grace_period_s`.
2. Kubernetes only: endpoint removal and SIGTERM happen in parallel, so for a short time new connections can still arrive after SIGTERM. Add a `preStop` hook that sleeps before SIGTERM is delivered (`lifecycle.preStop.exec.command: ["sleep", "<n>"]`, or `preStop.sleep.seconds` on Kubernetes versions that support the sleep action; check `kubectl version`). The preStop time counts against `terminationGracePeriodSeconds`. Record `<n>` and its source in `prestop`.
3. `drain_window_s` must satisfy `prestop_s + drain_window_s + exit_margin_s < grace_period_s`. Ask the owner for `exit_margin_s` (time to flush logs and close Redis); record it. If the inequality fails, raise `terminationGracePeriodSeconds` in the manifest rather than shrinking the drain to nothing.
4. Load balancer: the deregistration delay (`rtw-aws-alb-ws`) or `hard-stop-after` (`rtw-haproxy-ws-proxy`) must be at least `drain_window_s`. Note it for those flows.

### Output
`grace_period_s`, `prestop`, `drain_window_s`.

### Quality Gate
- The inequality in Action 3 holds with numbers shown.

---

## Phase 2: Implement the Shutdown Sequence

### Entry Criteria
- Window fixed.

### Actions
1. Sequence on SIGTERM (same for all stacks):
   1. Set a `draining` flag. The readiness endpoint returns 503 while it is set.
   2. Reject new upgrades with HTTP 503 (clients back off and land on another node).
   3. Split live connections into batches over `drain_window_s`: `batch_plan = { batches: B, interval_s: drain_window_s / B }`; choose B so each batch is no larger than what one other node can accept quickly, and record the reasoning. Close each with the restart code (1012) and a short reason. Spreading closes stops every client reconnecting in the same second; the client adds its own jitter for 1012 as well.
   4. Wait until zero connections remain or the window ends; then terminate the rest.
   5. Close Redis subscribers and exit 0.
2. Node: `process.on('SIGTERM', drain)`. Call `httpServer.close()` to stop new connections (it does not close upgraded sockets). Close sockets from `wss.clients` with `ws.close(1012, 'restart')`. Do NOT call `process.exit()` before the batches finish.
3. Python (uvicorn): uvicorn handles SIGTERM itself. Put the drain in the FastAPI `lifespan` shutdown part, iterating your connection registry and awaiting `websocket.close(code=1012)` per batch. Check `uvicorn --help` for `--timeout-graceful-shutdown` and set it to at least `drain_window_s` if present in your version.
4. Go: `ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM)`. `http.Server.Shutdown` does not close or wait for hijacked connections such as WebSockets (net/http docs). Register the drain with `srv.RegisterOnShutdown(drainWebSockets)` or call it yourself, sending `websocket.FormatCloseMessage(1012, "restart")` via `WriteControl` per client, then call `srv.Shutdown(ctx)` with a deadline.
5. SSE: end each response (Node `res.end()`, Go return from the handler, Python stop the generator). The browser `EventSource` reconnects by itself after its retry delay; long polling clients simply re-poll.

### Output
Drain code.

### Quality Gate
- Build check for the stack exits 0.
- `grep -rn "1012\|SERVICE_RESTART" src/` shows the close call uses the mapped constant.

---

## Phase 3: Test a Rolling Restart

### Entry Criteria
- Drain code deployed to a test environment with at least two replicas.

### Actions
1. Open many test connections (k6 or a script) spread over the replicas, each logging close codes and reconnect times.
2. Local check: `kill -TERM <pid>`; readiness returns 503 immediately (`curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/readyz`); clients receive 1012 in batches; the process exits before `grace_period_s`.
3. Platform check: `kubectl rollout restart deploy/<name>` then `kubectl rollout status deploy/<name>`. Count close codes: all should be 1012; any 1006 means a SIGKILL or a proxy cut the connection first.
4. Reconnect spread: histogram of reconnect times per second. Record the peak second count in `restart_test.reconnect_spread`.

### Output
`drain_impl`.

### Quality Gate
- Zero 1006 closes during the rollout (paste the close code counts).
- The pod or process exited with code 0 (`kubectl get pod -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'` or the shell's `$?`).

---

## Worked Example

Illustrative only.

Kubernetes, grace 30 s (default). preStop sleep 5 s (owner). Exit margin 3 s. `drain_window_s` must be under 22 s: set 20 s. 4000 connections per pod, B = 10 batches of 400 every 2 s.
```
$ kubectl rollout restart deploy/realtime && kubectl rollout status deploy/realtime
deployment "realtime" successfully rolled out
close codes: 1012 x 11982, 1006 x 0
peak reconnects per second: 431
```

---

## Exit Criteria

DONE when the drain window fits the platform grace period, SIGTERM leads to readiness failure, upgrade rejection and batched 1012 closes, the Go hijacked-connection trap is handled where relevant, and a rolling restart shows no 1006 closes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Grace period too short for any drain | **Adjust**: raise `terminationGracePeriodSeconds` (or `stopTimeout`) in the manifest. |
| Phase 2 | Go server exits but clients see 1006 | **Adjust**: `Shutdown` alone ran; add the hijacked-connection drain. |
| Phase 3 | 1006 closes during rollout | **Retry** after checking pod events (`kubectl describe pod`) for SIGKILL and the LB deregistration delay. |
| Phase 3 | Reconnect spike overloads the remaining pods | **Adjust**: more batches or longer window; confirm the client applies jitter on 1012. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
