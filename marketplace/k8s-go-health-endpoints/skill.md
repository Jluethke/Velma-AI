# Go Health Endpoints and Graceful Shutdown

**One-line description:** Adds `/livez` and `/readyz` handlers (or the standard gRPC health service) to a Go server, drains with `signal.NotifyContext` plus `http.Server.Shutdown`, and proves a zero exit code on SIGTERM from a distroless or scratch image.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Go module root (contains `go.mod`).
- `workload_profile` (object, required): Output of `k8s-workload-inventory`; uses `port_name`, `container_port`, `dependencies`.

---

## Outputs

- `go_health_endpoints` (object): `probe_kind` (`http` or `grpc`), `liveness_path`, `readiness_path`, `grpc_service` (empty for HTTP), `port_name`, `dependency_checks`, `sigterm_exit_seconds` (measured), `files_changed`.

---

## Phase 1: Find the Server Construction

### Entry Criteria
- `workload_profile.stack` == `go`.

### Actions
1. Read the Go version: `go list -m -f '{{.GoVersion}}'` in `repo_dir` (or the `go` line in `go.mod`).
2. Find how the server starts: `grep -rnE "http\.ListenAndServe|&http\.Server\{|grpc\.NewServer|\.Serve\(" --include=*.go "$REPO"`.
3. Classify:

| Found | Situation | Required change |
|---|---|---|
| `http.ListenAndServe(addr, h)` | No `*http.Server` value, so no `Shutdown` | Replace with `srv := &http.Server{Addr: addr, Handler: h}` and `srv.ListenAndServe()` |
| `&http.Server{...}` with `Shutdown` already called | Graceful already | Check the signal wiring only |
| `grpc.NewServer()` | gRPC | Register `google.golang.org/grpc/health` and use a Kubernetes `grpc` probe |

4. Find the router (`http.NewServeMux`, chi, gin, echo) to know where to register routes. Go 1.22 and later `ServeMux` accepts method patterns such as `"GET /livez"`; on older versions use `"/livez"`.

### Output
Server classification row and router.

### Quality Gate
- The grep result line for the server start is recorded with file and line.

---

## Phase 2: Add Handlers and Shutdown

### Entry Criteria
- Phase 1 row known. Change one file at a time; run `go build ./... && go test ./...` after each.

### Actions
1. HTTP case, in `main.go` or the server package:
```go
var ready atomic.Bool // sync/atomic, Go 1.19+

mux.HandleFunc("GET /livez", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
})
mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
    if !ready.Load() {
        http.Error(w, "not ready", http.StatusServiceUnavailable)
        return
    }
    ctx, cancel := context.WithTimeout(r.Context(), dbCheckTimeout)
    defer cancel()
    if err := db.PingContext(ctx); err != nil {
        http.Error(w, "database", http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
})

ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
defer stop()
go func() {
    if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
        log.Fatal(err)
    }
}()
ready.Store(true)
<-ctx.Done()
ready.Store(false)
shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
defer cancel()
if err := srv.Shutdown(shutdownCtx); err != nil {
    log.Printf("shutdown: %v", err)
    os.Exit(1)
}
```
2. `dbCheckTimeout` must be below the readiness probe `timeoutSeconds` (Kubernetes default 1 second). `shutdownTimeout` must be below `terminationGracePeriodSeconds` (Kubernetes default 30 seconds). Read both constants from environment variables so `k8s-rolling-update-pdb` can align them; do not hard-code new numbers without a source.
3. `ListenAndServe` returns `http.ErrServerClosed` immediately when `Shutdown` starts; treating it as fatal is a common bug that exits before draining. The `errors.Is` check above prevents that.
4. gRPC case: `hs := health.NewServer(); healthpb.RegisterHealthServer(grpcServer, hs); hs.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)`; on SIGTERM call `hs.Shutdown()` (sets NOT_SERVING) then `grpcServer.GracefulStop()`. Imports: `google.golang.org/grpc/health` and `google.golang.org/grpc/health/grpc_health_v1`. Set `probe_kind=grpc`.
5. Tests: `httptest.NewRecorder()` with the mux; assert 200 on `/livez`, 503 on `/readyz` when `ready` is false.
6. Run `go vet ./...` and `go test ./...`.

### Output
Handlers, shutdown wiring, tests.

### Quality Gate
- `go vet ./...` and `go test ./...` exit 0.
- `grep -n "ErrServerClosed" -r --include=*.go .` shows the check.

---

## Phase 3: Prove the Exit Path in the Image

### Entry Criteria
- Image rebuilt: `docker build -t <app>:probe-test .`.

### Actions
1. `docker run -d --name probe-test -p 8080:<container_port> <app>:probe-test`.
2. HTTP: `curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/livez` prints 200. gRPC: `grpc_health_probe -addr=localhost:8080` (or `grpcurl -plaintext localhost:8080 grpc.health.v1.Health/Check`) prints `SERVING`.
3. `time docker stop -t 60 probe-test` then `docker inspect probe-test --format '{{.State.ExitCode}}'`.

| Exit code | Meaning | Action |
|---|---|---|
| 0 | Shutdown returned cleanly | Record `sigterm_exit_seconds` |
| 1 | `Shutdown` hit its timeout or `log.Fatal` fired on `ErrServerClosed` | Read `docker logs probe-test` |
| 137 | Killed after 60 seconds | Signal not reaching the process: check that the image `ENTRYPOINT` is the binary in exec form |
| 2 or 143 | Go runtime default signal exit; `NotifyContext` is not wired | Fix Phase 2 |

4. Distroless and scratch images have no shell; do not plan `kubectl exec ... sh` debugging. `k8s-pod-debug-triage` uses `kubectl debug` instead.
5. `docker rm probe-test`.

### Output
`go_health_endpoints`.

### Quality Gate
- Exit code is 0 and `sigterm_exit_seconds` is copied from `time`.

---

## Worked Example

Illustrative only. Go 1.23 service using `http.ListenAndServe(":8080", mux)` and `database/sql` with pgx.

Phase 1: row 1; router is `http.NewServeMux`; method patterns available (Go 1.22+).

Phase 2: replaced with `srv := &http.Server{Addr: ":8080", Handler: mux}`; constants from `DB_CHECK_TIMEOUT` and `SHUTDOWN_TIMEOUT`.
```
$ go vet ./... && go test ./...
ok      example.com/inventory/cmd/server   0.214s
```

Phase 3:
```
$ time docker stop -t 60 probe-test
real    0m0.41s
$ docker inspect probe-test --format '{{.State.ExitCode}}'
0
```

---

## Exit Criteria

DONE when liveness and readiness (or gRPC health) are served, SIGTERM drains through `Shutdown` or `GracefulStop`, and the container exits 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Framework wraps the server (for example gin `r.Run()`) | **Adjust**: construct `&http.Server{Handler: r}` and call `ListenAndServe` on it. |
| Phase 2 | `atomic.Bool` undefined | **Adjust**: Go is older than 1.19; use `int32` with `atomic.LoadInt32`/`StoreInt32`. |
| Phase 2 | Tests fail | **Adjust**: fix the code; never delete tests. |
| Phase 3 | `grpc_health_probe` not installed | **Adjust**: use `grpcurl`; Kubernetes `grpc` probes do not need the binary in the image. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
