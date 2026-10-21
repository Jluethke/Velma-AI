# Node.js Health Endpoints and SIGTERM Handling

**One-line description:** Adds `/livez` and `/readyz` to an Express or Fastify service, installs an explicit SIGTERM handler that fails readiness and closes the HTTP server, and removes the `npm start` PID 1 trap so the pod drains instead of being SIGKILLed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Application repository.
- `workload_profile` (object, required): Output of `k8s-workload-inventory`; uses `entrypoint_form`, `dependencies`, `container_port`, `existing_health_routes`.

---

## Outputs

- `node_health_endpoints` (object): `liveness_path`, `readiness_path`, `port_name`, `dependency_checks`, `sigterm_exit_seconds` (measured), `entrypoint_fixed` (yes/no), `files_changed`.

---

## Phase 1: Detect Framework and PID 1

### Entry Criteria
- `workload_profile.stack` == `node`.

### Actions
1. Detect the framework: `jq -r '.dependencies | keys[]' package.json | grep -E '^(express|fastify|koa|@nestjs/core|@hapi/hapi)$'`.
2. Read the Node version: `jq -r '.engines.node // empty' package.json` and the Dockerfile `FROM node:<version>` line. Record both.
3. PID 1 check, from `workload_profile.entrypoint_form`:

| `entrypoint_form` | Problem | Fix in this flow |
|---|---|---|
| `package-manager` (`npm start`, `yarn start`) | The package manager is PID 1 and signal forwarding is not reliable; the app may never see SIGTERM | Change Dockerfile to `CMD ["node", "dist/server.js"]` (the script `npm start` runs) |
| `shell-wrapped` | `/bin/sh -c` is PID 1 and does not forward SIGTERM | Exec form, or `exec node ...` as the last line of the script |
| `exec-direct` (`["node", ...]`) | Node is PID 1. The kernel does not apply default signal actions to PID 1, so the app MUST install its own SIGTERM handler | Phase 2 adds the handler; optionally add `tini` (`ENTRYPOINT ["/sbin/tini","--"]` on images that ship it, or `docker run --init` locally) |
| `init-wrapped` | None | Keep |

### Output
Framework, Node version, PID 1 fix plan.

### Quality Gate
- Framework and Node version are recorded with the file they came from.
- The PID 1 row is named.

---

## Phase 2: Add Endpoints and the SIGTERM Handler

### Entry Criteria
- Phase 1 complete. Change one file per step; run `npm test` after each.

### Actions
1. Express example (adapt names to the code base; do not invent helper modules that do not exist):
```js
let shuttingDown = false;

app.get('/livez', (req, res) => res.status(200).json({ status: 'ok' }));

app.get('/readyz', async (req, res) => {
  if (shuttingDown) return res.status(503).json({ status: 'shutting-down' });
  try {
    await pool.query('SELECT 1');            // existing pg Pool; set connectionTimeoutMillis on the Pool
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return res.status(503).json({ status: 'unavailable', check: 'database' });
  }
});

const server = app.listen(PORT);

process.on('SIGTERM', () => {
  shuttingDown = true;
  server.close((err) => {
    pool.end().finally(() => process.exit(err ? 1 : 0));
  });
});
```
2. Fastify: register `fastify.get('/livez', ...)` and `fastify.get('/readyz', ...)`; in the SIGTERM handler set the flag and call `await fastify.close()` (runs `onClose` hooks), then `process.exit(0)`.
3. Keep-alive connections: `server.close()` stops new connections and waits for open ones. Since Node 19 `server.close()` also closes idle keep-alive connections; on Node 18.2 to 18.x call `server.closeIdleConnections()` right after `server.close()`. Check the recorded Node version and pick the matching line.
4. Liveness rule: `/livez` must not call the database, cache or other services. Readiness rule: every dependency call has a client timeout below the readiness probe `timeoutSeconds` (Kubernetes default 1 second); for `pg` set `connectionTimeoutMillis` on the Pool.
5. Add tests with the existing HTTP test tool (supertest, `fastify.inject`). Assert `/livez` returns 200 and `/readyz` returns 503 when the pool query is stubbed to reject.
6. Apply the PID 1 fix from Phase 1 to the Dockerfile.

### Output
Endpoints, handler, tests, Dockerfile change.

### Quality Gate
- `npm test` exits 0 and the new tests appear in the output.
- `grep -n "process.on('SIGTERM'" -r src/ dist/ 2>/dev/null` (or the source directory) shows one handler.
- The Dockerfile final `CMD` or `ENTRYPOINT` does not start with `npm`, `yarn` or `pnpm`.

---

## Phase 3: Prove Drain on SIGTERM

### Entry Criteria
- Image rebuilt: `docker build -t <app>:probe-test .`.

### Actions
1. `docker run -d --name probe-test -p 8080:<container_port> <app>:probe-test`.
2. `curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/livez` prints 200.
3. Start a slow request in the background if the app has one, then `time docker stop -t 60 probe-test` and `docker inspect probe-test --format '{{.State.ExitCode}}'`.

| Exit code | Meaning | Action |
|---|---|---|
| 0 | Handler ran, server closed | Record `sigterm_exit_seconds` |
| 137 | Ignored SIGTERM, killed after 60 seconds | PID 1 is still wrong or the handler never registered; recheck Phase 1 |
| 143 | Default signal exit, no graceful close ran | Handler missing; add it |
| 1 | `server.close` callback got an error | Read `docker logs probe-test` |

4. `docker rm probe-test`.

### Output
`node_health_endpoints`.

### Quality Gate
- Exit code after `docker stop` is 0.
- `sigterm_exit_seconds` copied from the `time` output.

---

## Worked Example

Illustrative only. Express 4 on Node 20, Dockerfile `CMD ["npm","start"]`, PostgreSQL via `pg`.

Phase 1: row `package-manager`; `npm start` runs `node dist/server.js`.

Phase 2: endpoints and handler added to `src/server.ts`; Dockerfile changed to `CMD ["node","dist/server.js"]`.
```
$ npm test
 PASS  test/health.test.ts
  health
    ✓ livez returns 200 (21 ms)
    ✓ readyz returns 503 when db fails (9 ms)
Tests:       38 passed, 38 total
```

Phase 3:
```
$ time docker stop -t 60 probe-test
real    0m0.62s
$ docker inspect probe-test --format '{{.State.ExitCode}}'
0
```
Before the fix the same command took 60 seconds and printed 137.

---

## Exit Criteria

DONE when both endpoints exist with tests, Node receives SIGTERM directly, and the container exits 0 on `docker stop`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework not in the table (custom `http.createServer`) | **Adjust**: add routes in the request handler with the same rules. |
| Phase 2 | Tests fail | **Adjust**: fix the code; never delete or skip tests. |
| Phase 2 | No pool or client object to check | **Adjust**: readiness returns the `shuttingDown` flag only; record that dependencies are unchecked. |
| Phase 3 | Exit 137 persists | **Retry**: confirm with `docker exec probe-test ps -o pid,comm` that PID 1 is `node`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
