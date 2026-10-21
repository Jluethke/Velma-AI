# Hardened Runtime Smoke Test

**One-line description:** Starts the final image under production-like restrictions (`--read-only`, `--cap-drop ALL`, `no-new-privileges`, memory and PID limits the user supplies, non-root), sends one real request, then checks graceful shutdown timing and exit code with `docker stop`, so runtime faults surface before the image ships.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `image_name` (string, required): Local image name; the `:dev` tag is the candidate.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies entrypoint and port.
- `app_port` (string, optional): Port inside the container. Empty for workers.
- `user_report` (object, required): From `ctr-nonroot-user`; supplies UID and writable paths.
- `healthcheck_report` (object, required): From `ctr-healthcheck`; supplies the health path.

---

## Outputs

- `smoke_report` (object): The exact `docker run` command, request result, health status, UID observed, stop time and exit code, and every error line from the logs.

---

## Phase 1: Start Under Restrictions

### Entry Criteria
- `user_report` shows a non-root UID.

### Actions
1. Build the run command from the reports. Add `--tmpfs` only for paths listed as writable in `user_report`:
```
docker run -d --name smoke \
  --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -p 127.0.0.1:<app_port>:<app_port> \
  <image_name>:dev
```
2. Resource limits: add `--memory <value>` and `--pids-limit <value>` ONLY with values the user supplies (for example from the target deployment's manifest). Do not invent limits. Record "not applied" otherwise.
3. Do NOT add `--privileged`, `--cap-add`, or `--user 0` to make it start. Each startup error must be fixed in the image or reported.
4. Wait for health: poll `docker inspect --format '{{.State.Health.Status}}' smoke` until `healthy` or `unhealthy`. If the image has no `HEALTHCHECK` (recorded in `healthcheck_report`), poll the health path with `curl -fsS` from the host instead.

### Output
Running container and its health state.

### Quality Gate
- `docker inspect --format '{{.State.Status}}' smoke` prints `running`.
- Health reaches `healthy` (or the curl poll returns 200).

---

## Phase 2: Exercise and Inspect

### Entry Criteria
- Container healthy.

### Actions
1. Send one real request that touches the app's main path (not only the health endpoint), for example `curl -fsS -w '\n%{http_code}\n' http://127.0.0.1:<app_port>/<a documented route>`. Use a route from the repo's README, OpenAPI file or route table; do not guess.
2. Process identity: `docker top smoke -eo uid,pid,comm` shows the UID from `user_report`.
3. Logs: `docker logs smoke 2>&1 | grep -iE "error|exception|permission denied|read-only|EACCES|traceback|panic"`. Every match goes into the report with its line.
4. Capabilities actually held: `docker inspect -f '{{.HostConfig.CapDrop}}' smoke` shows `[ALL]`.

### Output
Request result, UID, and log findings.

### Quality Gate
- The request returns the documented status code (pasted).
- The log grep output is pasted (empty or with each match explained).

---

## Phase 3: Graceful Shutdown

### Entry Criteria
- Phase 2 complete.

### Actions
1. Time the stop: `time docker stop smoke` (PowerShell: `Measure-Command { docker stop smoke }`). Docker sends SIGTERM (or the image's `STOPSIGNAL`), waits 10 seconds by default, then SIGKILL.
2. Read the exit code: `docker inspect -f '{{.State.ExitCode}}' smoke`.

| Exit code | Stop time | Meaning | Action |
|---|---|---|---|
| 0 | short | App handled SIGTERM and exited cleanly | Pass |
| 143 | short | Terminated by SIGTERM (128+15) without a handler, but it was PID 1-signalable | Pass; note no cleanup ran |
| 137 | near the stop timeout | SIGTERM ignored, SIGKILL sent (128+9) | Fail: fix PID 1 (exec-form CMD, init such as tini, or a signal handler) |
| 137 | short, with `OOMKilled: true` | Out of memory | Fail: check `docker inspect -f '{{.State.OOMKilled}}' smoke` |
| other | any | App error on shutdown | Fail: read last log lines |

3. `docker logs --tail 20 smoke` should show the app's shutdown message if it has one.
4. Clean up: `docker rm smoke`.

### Output
`smoke_report`.

### Quality Gate
- Exit code and stop time are pasted and map to a "Pass" row, or the failure row is recorded with its action.

---

## Worked Example

Illustrative. Go service, port 8080, UID 65532, route `GET /v1/items` documented in `api/openapi.yaml`.

Phase 1: run command as above; status `healthy` after 2 probes.

Phase 2: `curl` returns `[]` and `200`. `docker top` shows `65532  50122  app`. Log grep empty. `CapDrop` is `[ALL]`.

Phase 3: `docker stop` takes 0.3 s; exit code `0`; last log line `{"level":"info","msg":"server stopped"}`. Verdict pass.

---

## Exit Criteria

DONE when the image runs read-only, non-root and without capabilities, serves a real request, and stops on SIGTERM with a pass row exit code.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Exits immediately with `Read-only file system` | **Return**: send the path to `ctr-nonroot-user` Phase 2 to declare it writable. |
| Phase 1 | `operation not permitted` on startup | **Stop**: the app needs a capability; report which syscall or action from the log and ask the user before adding any capability. |
| Phase 2 | Request route unknown | **Stop**: ask the user for a documented route; do not report a pass from the health endpoint alone. |
| Phase 3 | Exit 137 after timeout | **Return**: to the stack Dockerfile flow's PID 1 step. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
