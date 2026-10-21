# Sanitizer Builds for Fuzzing

**One-line description:** Configures the sanitizer builds each fuzz target needs (AddressSanitizer plus UndefinedBehaviorSanitizer as the default pair, MemorySanitizer and ThreadSanitizer as separate builds) with the exact compiler flags, cargo-fuzz options, Go build flags or Atheris preload settings for the stack, and runtime options that stop on the first error with a symbolized stack.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): Targets and fuzzers from `pft-fuzz-target-selection`.
- `stack` (string, required): `cpp`, `rust`, `go`, `python` or `jvm`.
- `repo_path` (string, required): Project root.

---

## Outputs

- `sanitizer_build_config` (object[]): One row per build variant: sanitizer set, compile and link flags or tool options, runtime environment variables, which targets it applies to, and the proof run that triggered a planted bug.

---

## Phase 1: Choose Build Variants

### Entry Criteria
- `fuzz_targets` has at least one row.

### Actions
1. Pick variants from this compatibility table. Sanitizers in different rows cannot be combined in one binary.

| Variant | Finds | Combine with | Notes |
|---|---|---|---|
| ASan (`address`) | heap, stack, global buffer overflow, use-after-free, double free, leaks (LeakSanitizer on Linux) | UBSan | default fuzzing build |
| UBSan (`undefined`) | signed overflow, misaligned access, invalid shifts, bad enum or bool loads | ASan | add `-fno-sanitize-recover=undefined` so it aborts instead of printing and continuing |
| MSan (`memory`) | reads of uninitialized memory | nothing | every linked library, including the C++ standard library, must be built with MSan or you get false reports; Linux only |
| TSan (`thread`) | data races | nothing | only useful if the harness runs threads |

2. Choose per stack:

| `stack` | Variants to build |
|---|---|
| cpp | ASan+UBSan always; MSan if the code reads raw buffers and deps can be rebuilt; TSan if the target spawns threads |
| rust | cargo-fuzz default `--sanitizer address`; add `--sanitizer memory` only if there is `unsafe` reading uninitialized memory, `thread` if there are threads |
| go | native fuzzing has no ASan by default; `-race` for data races; check `go help build` for `-asan` and `-msan` platform support when cgo is used |
| python | pure Python needs none; native extensions get ASan through Atheris (Phase 2) |
| jvm | Jazzer's built-in bug detectors run by default; JNI native code: check `jazzer --help` for its ASan and UBSan options |

### Output
Variant list per target.

### Quality Gate
- No variant combines ASan with MSan or TSan (read the list).
- Every MSan variant names how its dependencies are instrumented.

---

## Phase 2: Write the Build Settings

### Entry Criteria
- Variants chosen.

### Actions
1. Use the exact settings per stack:

**cpp (clang only; GCC does not provide libFuzzer):**

```bash
# library objects
CFLAGS="-g -O1 -fno-omit-frame-pointer -fsanitize=address,undefined,fuzzer-no-link -fno-sanitize-recover=undefined -DFUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION"
# harness link
clang++ $CFLAGS -fsanitize=fuzzer harness.cc libtarget.a -o fuzz_target
# MSan variant: replace address,undefined with memory and add -fsanitize-memory-track-origins=2
```

`FUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION` is the conventional macro used to disable checksum checks and similar under fuzzing only.

**rust:** `cargo +nightly fuzz build <target>` builds with ASan by default; `--sanitizer none|address|leak|memory|thread` selects another; check `cargo fuzz build --help` for `--debug-assertions` and build-mode options in your version.

**go:** fuzzing instrumentation is added by `go test -fuzz`; a race variant is `go test -race -run=<Fuzz> ./pkg` replaying the corpus.

**python with native extension:** build the extension with `CC=clang CFLAGS="-fsanitize=address,fuzzer-no-link"` and run the harness with `LD_PRELOAD="$(python -c 'import atheris; print(atheris.path())')/asan_with_fuzzer.so"`. Confirm the `.so` name in that directory with `ls` before using it.

2. Set runtime options in a script or CI env, not by hand each time:

```bash
export ASAN_OPTIONS=abort_on_error=1:symbolize=1:detect_leaks=1
export UBSAN_OPTIONS=halt_on_error=1:print_stacktrace=1
export MSAN_OPTIONS=abort_on_error=1:symbolize=1
export ASAN_SYMBOLIZER_PATH=$(command -v llvm-symbolizer)
```

For Python, if LeakSanitizer reports leaks inside the interpreter itself, set `detect_leaks=0` and note it.

### Output
Build scripts and runtime env per variant.

### Quality Gate
- Each variant builds with exit 0.
- `nm -C fuzz_target | grep -c __asan_init` (or `__msan_init`, `__tsan_init`) prints a non-zero count for the matching variant.

---

## Phase 3: Prove Each Sanitizer Fires

### Entry Criteria
- Builds succeed.

### Actions
1. Plant one temporary bug per variant in a scratch copy or a guarded branch of the harness only (never in the library source on the main branch):

| Variant | Planted bug |
|---|---|
| ASan | `volatile char *p = (char*)malloc(1); p[1] = 0;` when the first input byte is `'Z'` |
| UBSan | `int x = INT_MAX; x += data[0];` |
| MSan | `int y; if (data[0] == 'Z' && y) {}` |
| Rust | `let v = vec![0u8]; unsafe { *v.as_ptr().add(1) };` when the first byte is `b'Z'` |

2. Run the variant on an input that triggers it (`printf Z > z.bin; ./fuzz_target z.bin`).
3. Confirm the report header: `ERROR: AddressSanitizer: heap-buffer-overflow`, `runtime error: signed integer overflow`, `WARNING: MemorySanitizer: use-of-uninitialized-value`.
4. Remove the planted bug and confirm `git diff` shows no trace of it.

### Output
`sanitizer_build_config`.

### Quality Gate
- Each variant printed its expected report header with a symbolized frame (file:line, not just addresses).
- `git diff` contains no planted bug.

---

## Worked Example

Illustrative. `stack` = `cpp`, target `img_decode_png`.

```text
$ clang++ -g -O1 -fno-omit-frame-pointer -fsanitize=fuzzer,address,undefined -fno-sanitize-recover=undefined \
    -DFUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION fuzz_png.cc libimg.a -o fuzz_png
$ printf Z > z.bin && ./fuzz_png z.bin
==31377==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x602000000011 ...
WRITE of size 1 at 0x602000000011 thread T0
    #0 0x55d1 in LLVMFuzzerTestOneInput fuzz_png.cc:14:10
SUMMARY: AddressSanitizer: heap-buffer-overflow fuzz_png.cc:14:10 in LLVMFuzzerTestOneInput
```

Planted bug removed. MSan variant skipped: zlib is linked from the system and is not MSan-instrumented, recorded as a gap.

---

## Exit Criteria

DONE when every fuzz target has its sanitizer variants built, runtime options set to abort with symbolized stacks, and each variant was shown to fire on a planted bug that was then removed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | MSan dependencies cannot be rebuilt | **Adjust**: skip the MSan variant and record the gap; do not run MSan with uninstrumented deps. |
| Phase 2 | `clang: error: unsupported option '-fsanitize=fuzzer'` | **Stop**: the compiler is not clang or lacks compiler-rt; install a clang with libFuzzer. |
| Phase 2 | cargo-fuzz requires nightly | **Adjust**: `rustup toolchain install nightly` and run with `cargo +nightly fuzz`. |
| Phase 3 | Report shows only addresses | **Retry**: set `ASAN_SYMBOLIZER_PATH` to an existing `llvm-symbolizer` and rebuild with `-g`. |
| Phase 3 | Planted bug not detected | **Stop**: the binary is not instrumented; check the `nm` gate and the build flags. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
