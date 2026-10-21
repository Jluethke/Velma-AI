# Python Health Endpoints for Kubernetes Probes

**One-line description:** Adds `/livez` and `/readyz` endpoints to a FastAPI, Flask or Django service (liveness with no dependency calls, readiness with time-bounded dependency checks), fixes the Django `ALLOWED_HOSTS` probe trap, and confirms gunicorn or uvicorn exits cleanly on SIGTERM.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Application repository.
- `workload_profile` (object, required): Output of `k8s-workload-inventory`; uses `existing_health_routes`, `dependencies`, `entrypoint_form`, `container_port`.

---

## Outputs

- `py_health_endpoints` (object): `liveness_path`, `readiness_path`, `port_name`, `host_header` (or empty), `dependency_checks` (name, timeout seconds), `sigterm_exit_seconds` (measured), `files_changed`.

---

## Phase 1: Detect the Framework and Server

### Entry Criteria
- `workload_profile.stack` == `python`.

### Actions
1. Detect the framework: `grep -rlE "^from fastapi|^import fastapi|^from flask|^from django" --include=*.py "$REPO" | head`. Use the first match type: FastAPI (also Starlette), Flask, Django.
2. Detect the server from the image command recorded in `workload_profile` or the Dockerfile: `gunicorn`, `uvicorn`, `gunicorn -k uvicorn.workers.UvicornWorker` (or `uvicorn_worker.UvicornWorker`), `hypercorn`, or `python app.py`.
3. If the server is `python app.py` with the Flask or Django development server (`app.run()`, `manage.py runserver`), record it: the development servers are not for production. Do not change the server in this flow; record an open question.
4. Read `existing_health_routes`. If a route already exists, read its handler. If it calls a database or another service, it is a readiness check, not a liveness check.

### Output
Framework, server, existing route analysis.

### Quality Gate
- The framework and server are named with the file and line where each was found.

---

## Phase 2: Add the Two Endpoints

### Entry Criteria
- Framework known. Edit ONE file per step and run the tests after each file.

### Actions
1. Rules for both endpoints:
   - `/livez` returns 200 with a constant body and calls NOTHING external. A liveness probe that checks the database restarts every pod when the database blips, which turns a dependency outage into a full outage.
   - `/readyz` checks each entry in `workload_profile.dependencies` that the app cannot serve without, with an explicit client timeout shorter than the readiness probe `timeoutSeconds` (Kubernetes default 1 second). Returns 503 when any required check fails.
   - Neither endpoint requires authentication, and neither logs at INFO on every call.
2. FastAPI: add to the app module:
```python
from fastapi import FastAPI, Response
from sqlalchemy import text

@app.get("/livez", include_in_schema=False)
def livez():
    return {"status": "ok"}

@app.get("/readyz", include_in_schema=False)
def readyz(response: Response):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        response.status_code = 503
        return {"status": "unavailable", "check": "database"}
    return {"status": "ok"}
```
   Use the engine object the app already has; do not create a new engine per request. Set the driver connect timeout in the URL or `connect_args` (for psycopg: `connect_args={"connect_timeout": N}` where N is in whole seconds), with N chosen below the probe timeout.
3. Flask: register a blueprint with the same two routes (`@bp.get("/livez")`, `@bp.get("/readyz")`) and return `("", 503)` on failure.
4. Django: add two views in a `health` app and two `path()` entries in the root `urls.py`. Use `django.db.connection.ensure_connection()` for the readiness check.
5. Django `ALLOWED_HOSTS` trap: the kubelet sends the pod IP and port as the `Host` header. If `ALLOWED_HOSTS` does not include it, Django answers 400 (`DisallowedHost`) and every probe fails. Fix by sending a fixed header from the probe: record `host_header` = one value already in `ALLOWED_HOSTS` (for example the service name); `k8s-probe-tuning` writes it as `httpGet.httpHeaders: [{name: Host, value: ...}]`. Do NOT set `ALLOWED_HOSTS = ['*']` to make probes pass.
6. Run the test suite: `pytest -q`. Add one test per endpoint with the framework test client (`fastapi.testclient.TestClient`, `app.test_client()`, or `django.test.Client`) asserting status 200 for `/livez` and 503 for `/readyz` when the database call is patched to raise.

### Output
Two endpoints and two tests.

### Quality Gate
- `pytest -q` exits 0 and the summary line includes the two new tests.
- `grep -n "livez" <file>` shows a handler with no database, cache or HTTP client call in its body.

---

## Phase 3: Verify SIGTERM Behavior in the Container

### Entry Criteria
- Image rebuilt with the endpoints: `docker build -t <app>:probe-test .`.

### Actions
1. Run the container: `docker run -d --name probe-test -p 8080:<container_port> <app>:probe-test`.
2. Check both endpoints: `curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/livez` prints 200. `/readyz` prints 200 with dependencies reachable, 503 without.
3. Send SIGTERM and time the exit: `time docker stop -t 60 probe-test`. `docker stop` sends SIGTERM, waits up to `-t` seconds, then SIGKILL. Read the exit code: `docker inspect probe-test --format '{{.State.ExitCode}}'`.

| Exit code | Meaning | Action |
|---|---|---|
| 0 | Clean shutdown | Record the measured seconds as `sigterm_exit_seconds` |
| 137 | Process ignored SIGTERM and was killed | Fix PID 1: use exec-form `CMD ["gunicorn", ...]`; if a shell script launches the server, end it with `exec gunicorn ...` |
| Other | Crash during shutdown | Read `docker logs probe-test` and fix the shutdown hook |

4. Gunicorn drains workers for up to `--graceful-timeout` (gunicorn default 30 seconds). Uvicorn stops accepting connections and waits for in-flight requests; `--timeout-graceful-shutdown` bounds it (check `uvicorn --help` for the flag on the installed version). Record the configured values; `k8s-rolling-update-pdb` sets `terminationGracePeriodSeconds` above the drain time.
5. Remove the container: `docker rm probe-test`.

### Output
`py_health_endpoints`.

### Quality Gate
- `docker inspect ... '{{.State.ExitCode}}'` printed 0 after `docker stop`.
- `sigterm_exit_seconds` is a measured number from the `time` output.

---

## Worked Example

Illustrative only. Django 5 app served by gunicorn on port 8000, dependency PostgreSQL.

Phase 1: `orders/settings.py` imports Django; Dockerfile `CMD ["gunicorn","-c","gunicorn.conf.py","orders.wsgi:application"]`. Existing `/healthz` runs a query, so it is a readiness check.

Phase 2: added `health/views.py` with `livez` and `readyz`; `ALLOWED_HOSTS = ["orders", "orders.shop.svc", "orders.example.com"]`, so `host_header=orders`.
```
$ pytest -q
........................                                    [100%]
24 passed in 3.12s
```

Phase 3:
```
$ curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: orders' localhost:8080/livez
200
$ time docker stop -t 60 probe-test
probe-test
real    0m1.84s
$ docker inspect probe-test --format '{{.State.ExitCode}}'
0
```
`sigterm_exit_seconds=1.84`.

---

## Exit Criteria

DONE when `/livez` and `/readyz` exist with tests, liveness calls nothing external, the container exits 0 on SIGTERM, and `py_health_endpoints` is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Development server in production image | **Return**: record for the image owner; probes still work but shutdown and concurrency do not. |
| Phase 2 | Tests fail after adding routes | **Adjust**: fix the route code; never delete or skip existing tests. |
| Phase 2 | Route conflicts with an existing `/livez` | **Adjust**: reuse the existing path if its handler meets the liveness rule. |
| Phase 3 | Exit code 137 on `docker stop` | **Retry**: fix PID 1 (exec form or `exec` in the script), rebuild, rerun. |
| Phase 3 | `/readyz` returns 200 with the database stopped | **Adjust**: the check is not reaching the database (cached connection); use `SELECT 1` on a fresh checkout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
