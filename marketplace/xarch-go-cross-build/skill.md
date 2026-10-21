# Cross-Compile a Go Program for aarch64

**One-line description:** Cross-builds a Go program for aarch64 Linux with `GOOS=linux GOARCH=arm64`, decides whether `CGO_ENABLED` must be on, sets `CC` to the cross compiler when cgo is required, and verifies the output is an aarch64 ELF and statically or dynamically linked as intended.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.
- `project_dir` (string, required): Path to the module root that holds `go.mod`.
- `cgo_enabled` (string, optional): Force cgo. One of `0` or `1`. If absent, decide from whether the module imports C.

---

## Outputs

- `go_binary` (object): The output path, the `GOARCH`, the cgo setting used, and the verified machine field.
- `go_report` (object): The build command, the linkage (static or dynamic), and the result.

---

## Phase 1: Decide cgo and the Environment

### Entry Criteria
- `go` is installed and `project_dir` holds `go.mod`.

### Actions
1. Decide cgo with this rule. If `cgo_enabled` is set, use it. Otherwise grep the module for cgo: `grep -rl 'import "C"' "$project_dir"` and check `go list -deps ./... | xargs` for known cgo packages (for example `net` with custom resolvers, `os/user`, sqlite drivers).

| Condition | Setting |
|---|---|
| No `import "C"`, pure Go | `CGO_ENABLED=0` (no C toolchain needed) |
| Any `import "C"` or a cgo dependency | `CGO_ENABLED=1` with `CC` set to the cross compiler |

2. For the pure-Go case the environment is just `GOOS=linux GOARCH=arm64`. Go says `arm64`, never `aarch64`; `GOARCH=aarch64` is an error (`unknown GOARCH`).
3. For the cgo case add `CC=aarch64-linux-gnu-gcc` (substitute `toolchain_prefix`) and `CGO_ENABLED=1`. Without `CC`, cgo uses the host `gcc` and produces x86-64 objects that fail to link.
4. Do not set `GOARM`; that is for 32-bit ARM only and has no meaning for `arm64`.

### Output
The decided environment variables.

### Quality Gate
- The environment names `GOARCH=arm64` (not `aarch64`).
- If cgo is on, `CC` is set to the prefixed cross compiler.

---

## Phase 2: Build and Verify

### Entry Criteria
- The environment is decided.

### Actions
1. Build. Pure Go:

```
cd "$project_dir" && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o app-arm64 ./...
```

With cgo:

```
cd "$project_dir" && CGO_ENABLED=1 GOOS=linux GOARCH=arm64 CC=aarch64-linux-gnu-gcc go build -o app-arm64 ./...
```

2. Verify the arch: `readelf -h app-arm64 | grep Machine` must print `AArch64`. Also run `file app-arm64`; a pure-Go `CGO_ENABLED=0` binary reports `statically linked`, while a cgo binary reports `dynamically linked` with an aarch64 interpreter.
3. If `file` reports the interpreter `/lib/ld-linux-aarch64.so.1`, the cgo binary needs glibc on the target. If you need a single self-contained file, set `CGO_ENABLED=0` where possible, or return to `xarch-musl-static-link` thinking for a static cgo build.
4. Do not strip the Go build down by deleting the cgo dependency to force `CGO_ENABLED=0`; only do that if the code truly does not need C.

### Output
`go_binary`, `go_report`.

### Quality Gate
- `go build` exits 0.
- `readelf -h app-arm64` shows `Machine: AArch64`, and `file` reports the linkage consistent with the cgo setting used.

---

## Worked Example

Illustrative. `project_dir` = `~/src/svc`, pure Go, `cgo_enabled` absent.

```
$ grep -rl 'import "C"' ~/src/svc
(no matches)
$ CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o app-arm64 ./...
$ readelf -h app-arm64 | grep Machine
  Machine:                           AArch64
$ file app-arm64
app-arm64: ELF 64-bit LSB executable, ARM aarch64, statically linked, ...
```

`go_binary` = `{ "path": "app-arm64", "goarch": "arm64", "cgo": "0", "machine": "AArch64", "linkage": "static" }`.

---

## Exit Criteria

DONE when the build exits 0 with `GOARCH=arm64`, the output is an `AArch64` ELF, and the linkage matches the chosen cgo setting.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `unknown GOARCH` error | **Stop**: `aarch64` was used; set `GOARCH=arm64`. |
| Phase 1 | Unsure if a dependency needs cgo | **Adjust**: build once with `CGO_ENABLED=0`; if it fails with an `import "C"` error, cgo is required. |
| Phase 2 | cgo link fails with host objects | **Adjust**: `CC` was not set; set `CC=aarch64-linux-gnu-gcc` and rebuild. |
| Phase 2 | Binary is X86-64 | **Stop**: `GOARCH` was not exported into the build shell; re-run with it inline. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
