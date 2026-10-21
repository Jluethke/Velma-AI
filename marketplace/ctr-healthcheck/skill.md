# Add a Container HEALTHCHECK

**One-line description:** Adds a `HEALTHCHECK` instruction that works in the chosen runtime image (curl or wget on slim images, the language runtime or a binary subcommand on distroless and scratch), sets only documented option values, and reads the result from `docker inspect --format '{{json .State.Health}}'`, noting that Kubernetes ignores `HEALTHCHECK` and needs probes instead.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Build context with the Dockerfile.
- `image_name` (string, required): Local image name.
- `build_profile` (object, required): From `ctr-stack-inventory`; supplies stack and listen port.
- `healthcheck_path` (string, optional): HTTP path the app serves for health, for example `/healthz`. Empty means find one in Phase 1.
- `app_port` (string, optional): Port inside the container. Empty for non-HTTP workers.

---

## Outputs

- `healthcheck_report` (object): The `HEALTHCHECK` line, the probe method, option values with their source, the health state sequence observed, and the equivalent Kubernetes probe snippet.

---

## Phase 1: Find the Health Signal

### Entry Criteria
- Image builds and starts.

### Actions
1. If `healthcheck_path` is empty, search for an existing endpoint: `grep -rnE "health|ready|live|actuator" <project_dir>/src --include=*.{py,js,ts,go,java,kt}`. Spring Boot Actuator exposes `/actuator/health` when `spring-boot-starter-actuator` is a dependency.
2. If no endpoint exists and the app serves HTTP, record an open question "add a health endpoint?" and use a TCP or root-path probe only as a temporary measure. Do not write application code in this flow.
3. For non-HTTP workers (queue consumers), the signal is process-level: the app touches a heartbeat file, or exposes a CLI subcommand. If neither exists, record that a `HEALTHCHECK` cannot be meaningful and stop after reporting.
4. Confirm the endpoint responds: start the container, then `curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:<app_port><healthcheck_path>` from the host. Expect `200`.

### Output
Health signal and confirmed response code.

### Quality Gate
- The `curl` output shows `200` for the chosen path, or the open question is recorded.

---

## Phase 2: Write the HEALTHCHECK

### Entry Criteria
- Health signal confirmed.

### Actions
1. Pick the probe command by runtime image. It must exist inside the image and use exec form when there is no shell:

| Runtime image | HEALTHCHECK CMD |
|---|---|
| Debian slim with curl installed | `CMD ["curl", "-fsS", "-o", "/dev/null", "http://127.0.0.1:<port><path>"]` (install with `apt-get install -y --no-install-recommends curl`; note it adds packages to scan) |
| Alpine (busybox wget present) | `CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:<port><path>"]` |
| Python, any base incl. distroless | `CMD ["python", "-c", "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:<port><path>'); sys.exit(0)"]` (on distroless use the interpreter path from the image, for example `/opt/venv/bin/python`) |
| Node, any base incl. distroless | `CMD ["node", "-e", "require('http').get('http://127.0.0.1:<port><path>', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]` (on distroless the binary is `/nodejs/bin/node`) |
| Go on distroless or scratch | A subcommand in the same binary: `CMD ["/app", "healthcheck"]`. If the binary has no such subcommand, record an open question; do not add a shell or curl. |
| Java on distroless | No small HTTP client in the image. Skip `HEALTHCHECK`, rely on orchestrator probes, and record it. |

2. Use `127.0.0.1`, not `localhost`. Some images resolve `localhost` to `::1` first while the app listens only on IPv4.
3. Options. Docker's documented defaults are `--interval=30s --timeout=30s --start-period=0s --retries=3` (and `--start-interval=5s` on Docker Engine 25 and later). Use the defaults unless the user gives values or the app's measured startup time requires a `--start-period`. To measure startup, time from `docker run` to the first `200` in Phase 1. Record the measured number as the source of `--start-period`.
4. Write the line in the runtime stage, after `USER`:
```
HEALTHCHECK --start-period=<measured or 0s> CMD ["python", "-c", "..."]
```
5. Do NOT use `CMD-SHELL` or `HEALTHCHECK CMD curl ... || exit 1` on images without `/bin/sh`.

### Output
Dockerfile with `HEALTHCHECK`.

### Quality Gate
- `docker image inspect -f '{{json .Config.Healthcheck}}' <image_name>:dev` shows the `Test` array starting with `"CMD"` (exec form) on shell-less images.

---

## Phase 3: Observe Health States

### Entry Criteria
- Image rebuilt.

### Actions
1. `docker run -d --name hc-check -p <app_port>:<app_port> <image_name>:dev`.
2. Poll: `docker inspect --format '{{.State.Health.Status}}' hc-check` until it leaves `starting`. Expect `healthy`.
3. Read the log of probe runs: `docker inspect --format '{{json .State.Health}}' hc-check`. Each entry in `Log` has `ExitCode` and `Output`. Exit code 0 means pass; 1 means fail.
4. Negative test: stop the app process inside the container is not possible on distroless, so instead run the image with a wrong port in the env (if the app reads `PORT`), e.g. `docker run -d --name hc-bad -e PORT=1 <image_name>:dev`, and confirm status becomes `unhealthy` after `retries` failures. Remove both containers.
5. Write the Kubernetes equivalent for the report (`HEALTHCHECK` is ignored by Kubernetes):
```
readinessProbe:
  httpGet: {path: <path>, port: <port>}
livenessProbe:
  httpGet: {path: <path>, port: <port>}
```
   Leave timing fields to the deployment owner unless they gave values.

### Output
`healthcheck_report`.

### Quality Gate
- Step 2 reaches `healthy`, with the `docker inspect` output pasted.
- Step 4 reaches `unhealthy`, proving the check can fail.

---

## Worked Example

Illustrative. Node 22 on distroless, port 3000, `/healthz` exists.

Phase 1: `curl` prints `200`. Startup to first 200 measured at 2.1 s.

Phase 2: `HEALTHCHECK --start-period=3s CMD ["/nodejs/bin/node", "-e", "require('http').get('http://127.0.0.1:3000/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]`.

Phase 3: status `starting` then `healthy`; `Log[0].ExitCode` is `0`. With `-e PORT=1`, status becomes `unhealthy` after 3 failed probes; `Output` shows `connect ECONNREFUSED 127.0.0.1:3000`.

---

## Exit Criteria

DONE when the image's health check runs with a command that exists in the image, reaches `healthy` on a good start and `unhealthy` on a bad one, and the Kubernetes probe equivalent is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No health endpoint | **Return**: record the open question; use a temporary probe and say so. |
| Phase 2 | `exec: "curl": executable file not found` in health log | **Adjust**: switch to the runtime-language row of the table. |
| Phase 3 | Stays `starting` then `unhealthy` on a good start | **Adjust**: check `Output` in the health log; usually wrong port, `localhost` vs `127.0.0.1`, or startup longer than `--start-period`. |
| Phase 3 | Never becomes `unhealthy` in the negative test | **Stop**: the check does not test the app; rewrite the probe. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
