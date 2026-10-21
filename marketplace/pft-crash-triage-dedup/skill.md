# Crash Triage and Deduplication

**One-line description:** Reproduces every fuzz crash, minimizes it with the fuzzer's own minimizer, extracts a dedup key from the bug type plus the top three stack frames inside project code (the crash-state convention ClusterFuzz uses), groups crashes into one cluster per root cause, and classifies each cluster by bug class with a fixed severity table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `go_fuzz_findings` (object[], optional): From `pft-go-native-fuzz`.
- `rust_fuzz_findings` (object[], optional): From `pft-rust-cargo-fuzz`.
- `cpp_fuzz_findings` (object[], optional): From `pft-cpp-libfuzzer-harness`.
- `py_fuzz_findings` (object[], optional): From `pft-py-atheris-fuzz`.
- `jvm_fuzz_findings` (object[], optional): From `pft-jvm-jazzer-fuzz`.
- `stack` (string, required): Which findings and tools apply.
- `repo_path` (string, required): Project root.

---

## Outputs

- `crash_clusters` (object[]): One row per root cause: dedup key, bug class, severity class, representative minimized input path, all member crash files, reproduce command, and the first project frame (file:line) to start the fix.

---

## Phase 1: Reproduce and Minimize

### Entry Criteria
- At least one findings input for `stack` has a crash file.

### Actions
1. Reproduce every crash file once with the stack command:

| `stack` | Reproduce | Minimize |
|---|---|---|
| cpp | `./out/<fuzzer> <crash file>` | `./out/<fuzzer> -minimize_crash=1 -runs=<user N> -exact_artifact_path=<out> <crash file>` |
| rust | `cargo +nightly fuzz run <target> <crash file>` | `cargo +nightly fuzz tmin <target> <crash file>` |
| go | `go test -run=<FuzzName>/<file name> ./<pkg>` | already minimized by `go test -fuzz` (bounded by `-fuzzminimizetime`) |
| python | `python fuzz/fuzz_<t>.py <crash file>` | `python fuzz/fuzz_<t>.py -minimize_crash=1 -runs=<user N> <crash file>` |
| jvm | regression mode: `mvn test -Dtest=<Class>` | Jazzer standalone accepts libFuzzer flags; check `jazzer --help` |

2. Record crashes that do not reproduce as `nondeterministic` with the harness name. Do not drop them silently.
3. Reproduce each minimized file once more; it must show the same first error line as the original.

### Output
Reproduced and minimized crash list.

### Quality Gate
- Every crash file has a reproduce result (reproduced or `nondeterministic`).
- Every minimized file reproduces with the same first error line.

---

## Phase 2: Extract the Dedup Key

### Entry Criteria
- Minimized list exists.

### Actions
1. From each report, take the bug type:

| Report text | Bug type |
|---|---|
| `AddressSanitizer: heap-buffer-overflow` + `READ` or `WRITE` | `heap-buffer-overflow-READ` or `-WRITE` |
| `AddressSanitizer: heap-use-after-free`, `double-free`, `stack-buffer-overflow`, `global-buffer-overflow`, `stack-overflow` | that name |
| `AddressSanitizer: SEGV on unknown address 0x000000000000` (or an address within the first page) | `null-deref` |
| `runtime error: <text>` (UBSan) | `ubsan-<first words>`, for example `ubsan-signed-integer-overflow` |
| `MemorySanitizer: use-of-uninitialized-value` | `msan-uninit` |
| `LeakSanitizer: detected memory leaks` | `leak` |
| `libFuzzer: out-of-memory` / `oom-` artifact | `oom` |
| `libFuzzer: timeout` / `timeout-` artifact | `timeout` |
| Rust `panicked at` | `panic-<message class>` (index out of bounds, overflow, unwrap on None or Err) |
| Go `panic:` or `t.Fatalf` message | `go-panic-<type>` or `go-assert` |
| Python `Uncaught Python exception` | `py-<ExceptionType>` |
| Jazzer `== Java Exception: <class>` | `java-<class simple name>`; keep the `DEDUP_TOKEN` too |

2. From the stack, take the top three frames that are inside the project's own source, skipping sanitizer runtime, libFuzzer, Atheris, Jazzer, standard library and the harness function. Write each as `function` (not file:line, since lines move with edits).
3. Dedup key = `bug type | frame1 | frame2 | frame3`. Three frames follows the ClusterFuzz crash-state convention.
4. For Jazzer, if two crashes share a `DEDUP_TOKEN`, they share a cluster even if your key differs; record both.

### Output
Key per crash.

### Quality Gate
- Every reproduced crash has a key with a bug type from the table and up to three project frames.

---

## Phase 3: Cluster and Classify

### Entry Criteria
- Keys exist.

### Actions
1. Group crashes with identical keys into one cluster. Choose the smallest minimized input as the representative.
2. Assign a severity class by the first matching row. These are classes, not scores:

| Bug type | Severity class |
|---|---|
| Any `-WRITE` overflow, use-after-free, double-free | memory corruption |
| `-READ` overflow, `msan-uninit` | memory disclosure |
| Jazzer `FuzzerSecurityIssueCritical` or `High` | injection or unsafe deserialization (use Jazzer's label) |
| `null-deref`, `stack-overflow`, `oom`, `timeout`, panics, uncaught exceptions | denial of service or crash |
| `ubsan-*`, `leak`, `go-assert`, failed round-trip assertions | correctness |

3. Two clusters with different bug types but the same top frame are likely one root cause. Keep them separate but link them in both rows.
4. Write each cluster's reproduce command and first project frame with file:line from the minimized run.
5. Sort clusters by severity class in the table order.

### Output
`crash_clusters`.

### Quality Gate
- Number of clusters plus number of `nondeterministic` crashes covers every input crash file (each file is in exactly one cluster or the nondeterministic list).
- Every cluster has a representative input that reproduces with its key.

---

## Worked Example

Illustrative. `stack` = `cpp`, 23 crash files from 3 runs.

| Dedup key | Members | Representative | Severity class |
|---|---|---|---|
| `heap-buffer-overflow-READ \| unfilter_row \| decode_idat \| img_decode_png` | 19 | `crash-1e9b...-min` (61 bytes) | memory disclosure |
| `ubsan-signed-integer-overflow \| row_bytes \| read_ihdr \| img_decode_png` | 3 | `crash-77ac...-min` (33 bytes) | correctness |
| `oom \| alloc_rows \| img_decode_png` | 1 | `oom-0c51...` | denial of service or crash |

The overflow and UBSan clusters share `img_decode_png` but differ in the top frame, so they stay separate. The UBSan cluster's `row_bytes` overflow feeds the buffer size used by `unfilter_row`; both rows are linked as a likely shared root cause.

---

## Exit Criteria

DONE when every crash file is reproduced and minimized or marked nondeterministic, and grouped into clusters keyed by bug type and top three project frames, each with a severity class, representative input and reproduce command.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Crash does not reproduce | **Adjust**: mark it nondeterministic, rerun once with `-runs=` set by the user; report the harness for state cleanup. |
| Phase 1 | Minimizer changes the bug type | **Adjust**: keep the original file as representative; the minimizer jumped to another bug, which gets its own entry. |
| Phase 2 | Stack has no project frames (crash inside a library) | **Adjust**: use the top three frames overall and mark the cluster `third-party`. |
| Phase 2 | Stack shows only addresses | **Retry**: set `ASAN_SYMBOLIZER_PATH` and rebuild with `-g`. |
| Phase 3 | Severity unclear | **Return**: keep the class "unclassified" with the report excerpt; do not guess a severity. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
