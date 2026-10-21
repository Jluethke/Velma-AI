# Fuzz Coverage and Plateau Analysis

**One-line description:** Builds a line-coverage report from the fuzz corpus with the stack's own coverage tooling (llvm-profdata and llvm-cov, `cargo fuzz coverage`, `go test -coverprofile`, `coverage run` with `-atheris_runs`), finds the code the fuzzer never reaches, names the blocker for each uncovered region from a fixed list, and maps each blocker to one specific harness, dictionary or corpus change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `go_fuzz_findings` (object[], optional): Go run results.
- `rust_fuzz_findings` (object[], optional): Rust run results.
- `cpp_fuzz_findings` (object[], optional): C and C++ run results.
- `py_fuzz_findings` (object[], optional): Python run results.
- `jvm_fuzz_findings` (object[], optional): JVM run results.
- `seed_corpus` (object[], required): Corpus directories (the fuzzers have grown them during the runs).
- `stack` (string, required): Which stack's tooling to use.
- `repo_path` (string, required): Project root.

---

## Outputs

- `coverage_report` (object[]): Per target: tool and command used, line coverage summary of the target's own files, list of uncovered functions or regions that matter.
- `harness_improvements` (object[]): Per uncovered region: blocker class, the change to make, and the before and after coverage once the change was tried.

---

## Phase 1: Produce the Coverage Report

### Entry Criteria
- At least one fuzz run for `stack` finished and the corpus directory has files.

### Actions
1. Run the coverage command for the stack:

| `stack` | Commands |
|---|---|
| cpp | Build a separate binary with `-fprofile-instr-generate -fcoverage-mapping -fsanitize=fuzzer` (no ASan); `LLVM_PROFILE_FILE=cov.profraw ./png_fuzzer_cov -runs=0 fuzz/corpus/png`; `llvm-profdata merge -sparse cov.profraw -o cov.profdata`; `llvm-cov report ./png_fuzzer_cov -instr-profile=cov.profdata src/`; `llvm-cov show ./png_fuzzer_cov -instr-profile=cov.profdata -format=html -output-dir=cov_html src/` |
| rust | `rustup component add llvm-tools-preview`; `cargo +nightly fuzz coverage <target>` (writes `fuzz/coverage/<target>/coverage.profdata`); then run `llvm-cov report` (from the `llvm-tools-preview` component) on the coverage-built binary under `target/<triple>/coverage/<triple>/release/<target>` with `-instr-profile=fuzz/coverage/<target>/coverage.profdata`; confirm the binary path with `ls` |
| go | Copy the generated corpus into testdata so it is replayed: `cp $(go env GOCACHE)/fuzz/<module>/<pkg path>/FuzzX/* <pkg>/testdata/fuzz/FuzzX/` (in a scratch branch); `go test -run=FuzzX -coverprofile=c.out ./<pkg>`; `go tool cover -func=c.out` and `go tool cover -html=c.out -o cov.html` |
| python | `python -m coverage run fuzz/fuzz_<target>.py -atheris_runs=<number of corpus files + 1> fuzz/corpus/<target>`; `python -m coverage report --include="mypkg/*"`; `python -m coverage html` |
| jvm | Check `jazzer --help` for its coverage report and dump options in standalone mode, or replay the `Inputs` directory in regression mode with the JaCoCo agent and run `mvn jacoco:report` |

2. Restrict the report to the target's own source files; library and test files distort the numbers.
3. List uncovered functions and regions in the code paths named in the harness contract. Ignore unreachable error paths for other entry points.

### Output
`coverage_report`.

### Quality Gate
- Each report command exited 0 and printed a per-file table restricted to target files.
- The Go corpus copy happened on a scratch branch or was reverted (`git status --short testdata` is clean on the main branch).

---

## Phase 2: Name the Blocker for Each Region

### Entry Criteria
- Uncovered list exists.

### Actions
1. Open each uncovered region in the HTML report and read the branch that guards it. Assign exactly one blocker:

| Guard looks like | Blocker class |
|---|---|
| Comparison with a multi-byte constant or string (`memcmp(p, "IHDR", 4)`, `if magic == 0xCAFEBABE`, `s.startswith("v=")`) | magic value |
| CRC, hash, HMAC or length-prefix check before parsing continues | checksum |
| Deeply nested valid structure (a valid header and a valid chunk table) | structure |
| Input-size check (`if len < N`) where corpus inputs are all short | size |
| Code reached only through a different API call than the harness makes | harness scope |
| Code reached only after many calls (state built across calls) | state |
| Exec rate is so low that the run did few iterations | throughput |

2. Record the region, the guard line and the blocker.

### Output
Blocker list.

### Quality Gate
- Every uncovered region in scope has exactly one blocker and the guard line quoted.

---

## Phase 3: Map Blockers to Changes and Measure

### Entry Criteria
- Blocker list exists.

### Actions
1. Choose the change from this table:

| Blocker | Change |
|---|---|
| magic value | add the constant to the dictionary; for libFuzzer-based fuzzers also try `-use_value_profile=1` |
| checksum | under the `FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION` macro (C/C++) or a `cfg(fuzzing)` check (Rust, set by cargo-fuzz), skip the checksum verification; or compute the checksum in the harness before calling |
| structure | structure-aware input: `FuzzedDataProvider`, `arbitrary` derive, typed Go fuzz args, or a seed file that already has the valid outer structure |
| size | add a larger seed; raise `-max_len` with a value from the format's documented maximum |
| harness scope | write a second harness for the other entry point; do not widen one harness to call everything |
| state | write a stateful property test instead (Hypothesis, fast-check, proptest, rapid) or a harness that decodes a sequence of operations |
| throughput | remove logging and per-input setup from the harness; move setup to init |

2. Make one change at a time. Re-run the fuzzer for the same `fuzz_time`, then the coverage command, and record before and after line coverage for the target files.
3. Keep a change only if coverage of the region increased. Revert otherwise.
4. Never patch out a check in production builds; the macro or `cfg` must only be active in fuzz builds. Grep the release build flags to confirm.

### Output
`harness_improvements`.

### Quality Gate
- Each kept change shows higher coverage for its region in the after report.
- `grep -rn "FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION\|cfg(fuzzing)" src/` lists only guarded skips, each recorded in `harness_improvements`.

---

## Worked Example

Illustrative. `stack` = `cpp`, target `img_decode_png`.

```text
$ llvm-cov report ./png_fuzzer_cov -instr-profile=cov.profdata src/png.c src/png_filter.c
Filename          Regions  Missed Regions  Cover  Functions  Missed Functions  Executed  Lines  Missed Lines  Cover
src/png.c             412             171 58.50%        31                 9    70.97%    880           352 60.00%
src/png_filter.c       96              12 87.50%         6                 0   100.00%    210            19 90.95%
```

Uncovered: `decode_idat` and everything after the line `if (crc32(chunk) != stored_crc) return IMG_EBADDATA;` (png.c:288). Blocker: checksum. Change: wrap the comparison in `#ifndef FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION`. After a rerun of the same duration, `src/png.c` line coverage rose and `decode_idat` executed. The change was kept and recorded.

---

## Exit Criteria

DONE when each fuzzed target has a coverage report restricted to its files, every in-scope uncovered region has a named blocker, and each attempted change is recorded with before and after coverage.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `llvm-profdata` and the clang version differ | **Adjust**: use the `llvm-profdata` and `llvm-cov` that match the clang that built the binary (same major version). |
| Phase 1 | `cov.profraw` empty | **Retry**: the binary was built without `-fprofile-instr-generate -fcoverage-mapping`; rebuild. |
| Phase 2 | Region reachable only by impossible input | **Adjust**: mark it unreachable with the reasoning and exclude it. |
| Phase 3 | No change raises coverage | **Return**: report the region and blocker as an open item for a stateful or structure-aware harness. |
| Phase 3 | Checksum skip leaks into release flags | **Stop**: revert and guard it so only fuzz builds define the macro. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
