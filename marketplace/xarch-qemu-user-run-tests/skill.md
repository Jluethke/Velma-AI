# Run an aarch64 Test Binary under qemu-user

**One-line description:** Runs a cross-built aarch64 test binary on the x86-64 host with `qemu-aarch64`, pointing `QEMU_LD_PREFIX` at the sysroot so the dynamic loader and libraries resolve, records pass and fail counts, and flags the emulation gaps that make qemu-user results advisory rather than final.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `binary_path` (string, required): Path to the aarch64 test binary or test runner to execute.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot the binary links against.
- `binfmt_state` (object, required): Output of `xarch-qemu-binfmt-register`. If binfmt is registered, the binary can also be run directly.

---

## Outputs

- `qemu_test_report` (object): The command used, the exit code, and the parsed pass and fail counts.
- `qemu_failures` (object[]): Each failing test with its message. Empty when all pass.

---

## Phase 1: Resolve the Loader and Run

### Entry Criteria
- `binary_path` is an aarch64 ELF (`readelf -h` shows `AArch64`).
- `sysroot.path` holds the aarch64 loader (`ld-linux-aarch64.so.1` or `ld-musl-aarch64.so.1`).

### Actions
1. Set `QEMU_LD_PREFIX` to the sysroot so qemu finds the target loader and shared libraries: `export QEMU_LD_PREFIX=<sysroot.path>`. Without it a dynamically linked binary fails with `qemu: Could not open '/lib/ld-linux-aarch64.so.1'`.
2. Run explicitly: `qemu-aarch64 "$binary_path" <test args>`. Explicit invocation makes the interpreter and prefix unambiguous. If binfmt is active you can also run `"$binary_path"` directly, but set `QEMU_LD_PREFIX` either way.
3. Capture the exit code (`echo $?`) and the full stdout and stderr. For a test runner, pass its machine-readable flag, for example `--gtest_output=xml:res.xml` for GoogleTest or `-rA` for pytest-style summaries.
4. Do not treat a crash in an atomics-heavy or thread-timing test as a real failure without re-checking on hardware; qemu-user models instructions, not exact multicore timing.

### Output
The raw run output and exit code.

### Quality Gate
- The run started (no `Could not open` loader error).
- An exit code was captured.

---

## Phase 2: Parse Results and Record Emulation Gaps

### Entry Criteria
- The run produced output.

### Actions
1. Parse pass and fail counts from the runner output. For GoogleTest read the `[  PASSED  ]` and `[  FAILED  ]` lines; for a plain binary, exit 0 is pass.
2. For each failure, record the test name and message in `qemu_failures`.
3. Note the emulation gaps that make this advisory: qemu-user does not model cache coherency or weak-memory ordering the way real AArch64 hardware does, syscalls are translated and a few are unimplemented (`qemu: Unsupported syscall: N`), and timing-based tests are unreliable. List any `Unsupported syscall` lines seen.
4. Record a clear verdict: all tests passed under emulation, or a list of failures. State that passing under qemu-user is necessary but not sufficient, and hardware or on-target testing is still required for release.
5. Do not delete or skip a failing test to make the suite green. If a failure is an emulation artifact, mark it as such with the reason, and keep it for the on-target run.

### Output
`qemu_test_report`, `qemu_failures`.

### Quality Gate
- `qemu_test_report` records parsed pass and fail counts matching the runner output.
- Any `Unsupported syscall` lines are listed, and `qemu_failures` lists every reported failure.

---

## Worked Example

Illustrative. `binary_path` = `build-aarch64/unit_tests`, `sysroot.path` = `/opt/sysroots/aarch64-bookworm`.

```
$ export QEMU_LD_PREFIX=/opt/sysroots/aarch64-bookworm
$ qemu-aarch64 build-aarch64/unit_tests
[==========] Running 42 tests.
[  PASSED  ] 41 tests.
[  FAILED  ] 1 test, listed below:
[  FAILED  ] TimerTest.FiresWithin10ms
$ echo $?
1
```

`qemu_test_report` = `{ "passed": 41, "failed": 1, "exit_code": 1 }`. `qemu_failures` = `[{ "test": "TimerTest.FiresWithin10ms", "note": "timing-sensitive; re-check on hardware" }]`.

---

## Exit Criteria

DONE when the binary ran under qemu with the loader resolved, pass and fail counts are recorded, emulation gaps are noted, and the report states on-target testing is still required.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Could not open ld-linux-aarch64.so.1` | **Adjust**: set `QEMU_LD_PREFIX` to the sysroot path. |
| Phase 1 | `qemu-aarch64: command not found` | **Return**: install `qemu-user-static` via `xarch-qemu-binfmt-register`. |
| Phase 2 | `Unsupported syscall: N` | **Adjust**: record it; run that test on hardware, do not delete it. |
| Phase 2 | A timing test fails only under qemu | **Adjust**: mark it an emulation artifact with the reason; keep it for the on-target run. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
