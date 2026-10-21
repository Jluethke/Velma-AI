# Go Multi-Stage Dockerfile

**One-line description:** Writes a multi-stage Dockerfile that builds a static Go binary with `CGO_ENABLED=0`, `-trimpath` and module and build cache mounts, cross-compiles through `TARGETOS`/`TARGETARCH` on the build platform, and ships it alone on `distroless/static` or `scratch` with CA certificates, time zone data and a non-root user.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Module root containing `go.mod`.
- `build_profile` (object, required): From `ctr-stack-inventory` with `stack=go`; supplies the `package main` path and cgo status.
- `pinned_bases` (object, required): From `ctr-pin-base-digest`.

---

## Outputs

- `go_dockerfile` (object): Dockerfile path, the exact `go build` line, the runtime base, and Phase 3 verification output (`file`, `go version -m`).

---

## Phase 1: Builder Stage

### Entry Criteria
- `go.mod` and `go.sum` exist.
- The main package path is known (for example `./cmd/api`).

### Actions
1. Write:
```
# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM <builder_ref> AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY . .
ARG TARGETOS TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/api
```
2. Flag meanings, so you do not remove them: `CGO_ENABLED=0` makes a static binary with Go's own DNS resolver and no libc dependency; `-trimpath` removes local file paths (needed for reproducible output); `-ldflags="-s -w"` strips the symbol table and DWARF debug info (smaller; stack traces still show function names).
3. `--platform=$BUILDPLATFORM` runs the compiler natively and cross-compiles to the target. Without it, multi-arch builds run the compiler under QEMU emulation and are much slower.
4. Vendored modules: if `vendor/modules.txt` exists, skip `go mod download` and build with `-mod=vendor`.
5. Version stamping: pass `ARG VERSION` and add `-X main.version=${VERSION}` inside `-ldflags`. Only use a variable that exists in the code (`grep -rn "var version" --include=*.go`). Do not invent one.
6. If `build_profile.native_deps` shows cgo: keep `CGO_ENABLED=1`, drop `$BUILDPLATFORM` cross-compiling (cgo cross-compiling needs a C cross toolchain), and use `distroless/base-debian12` at runtime. Record this in the output.

### Output
Builder stage.

### Quality Gate
- `docker build --target build <project_dir>` exits 0.
- `grep -n "CGO_ENABLED=0" Dockerfile` matches unless cgo is recorded as required.

---

## Phase 2: Runtime Stage

### Entry Criteria
- Builder stage builds.

### Actions
1. Distroless static (default):
```
FROM <runtime_ref> AS runtime
COPY --from=build /out/app /app
USER 65532:65532
EXPOSE <listen_port>
ENTRYPOINT ["/app"]
```
   `distroless/static-debian12` already contains CA certificates, `/etc/passwd` with `nonroot`, and tzdata.
2. Scratch (only when `base_preference=scratch`): scratch has no CA certificates, no tzdata and no `/etc/passwd`. Add them explicitly:
```
FROM scratch AS runtime
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /out/app /app
USER 65532:65532
ENTRYPOINT ["/app"]
```
   For time zones on scratch, embed the database: build with `-tags timetzdata` or add `import _ "time/tzdata"` in main. Without it, `time.LoadLocation("America/New_York")` returns an error at runtime.
3. Use a numeric `USER`. Kubernetes `runAsNonRoot: true` cannot verify a name and refuses to start the pod.
4. Do NOT add a shell, curl or busybox to make health checks easier; see `ctr-healthcheck` for the binary-subcommand approach.

### Output
Complete Dockerfile.

### Quality Gate
- `docker build -t <name>:dev <project_dir>` exits 0.
- `docker image inspect -f '{{.Config.User}}' <name>:dev` prints a numeric UID that is not `0`.

---

## Phase 3: Verify the Binary

### Entry Criteria
- Image built.

### Actions
1. Extract the binary and inspect it on the host:
```
docker create --name goext <name>:dev
docker cp goext:/app ./app.extracted
docker rm goext
file ./app.extracted
go version -m ./app.extracted
```
2. Read `file` output: `statically linked` is required for distroless static and scratch. `dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2` means cgo was on; the binary will fail on static bases with `no such file or directory`.
3. Read `go version -m` output: confirm `build CGO_ENABLED=0`, `build -trimpath=true`, `build GOOS=` and `GOARCH=` the target, and the Go version equals `build_profile.runtime_version`.
4. TLS works: if the app calls HTTPS endpoints, run it and check logs for `x509: certificate signed by unknown authority`. That message means CA certificates are missing (scratch case).
5. Delete `./app.extracted` afterward; it must not be left in the repo.

### Output
`go_dockerfile` with verification output.

### Quality Gate
- `file` prints `statically linked` (or the cgo exception is recorded).
- `go version -m` shows `-trimpath=true` and the expected `GOARCH`.

---

## Worked Example

Illustrative. Module `example.com/inventory`, main at `./cmd/inventory`, Go 1.23, port 8080.

Phase 1: build line `CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/inventory`.

Phase 2: `FROM gcr.io/distroless/static-debian12:nonroot@sha256:...`, `USER 65532:65532`, `ENTRYPOINT ["/app"]`.

Phase 3:
```
./app.extracted: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, stripped
./app.extracted: go1.23.4
        path    example.com/inventory/cmd/inventory
        build   -trimpath=true
        build   CGO_ENABLED=0
        build   GOARCH=amd64
```

---

## Exit Criteria

DONE when the runtime image contains one static binary (plus certificates and tzdata for scratch), runs as a numeric non-root UID, and `file` and `go version -m` output confirm the build flags.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `go: updates to go.mod needed` | **Stop**: `go.mod` is not tidy; ask the user to run `go mod tidy` and commit. |
| Phase 1 | `build constraints exclude all Go files` | **Adjust**: the main path is wrong; recheck `package main` directories from the inventory. |
| Phase 2 | `exec /app: no such file or directory` at start | **Return**: binary is dynamically linked; rerun Phase 3 step 2 and fix cgo. |
| Phase 3 | `x509: certificate signed by unknown authority` | **Adjust**: copy `ca-certificates.crt` into the scratch image, rebuild. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
