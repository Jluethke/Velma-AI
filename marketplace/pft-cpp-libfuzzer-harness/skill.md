# C and C++ libFuzzer Harness

**One-line description:** Writes an `LLVMFuzzerTestOneInput` harness (with `FuzzedDataProvider` for multi-parameter APIs), builds it with `clang -fsanitize=fuzzer` plus the sanitizer variants, wires it into CMake behind an option, runs it with explicit libFuzzer flags, and reads the status, crash and artifact lines.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): C or C++ targets and harness contracts.
- `seed_corpus` (object[], required): Corpus directories.
- `fuzz_dictionary` (object[], optional): Dictionary paths.
- `sanitizer_build_config` (object[], required): Compile and link flags per variant from `pft-sanitizer-builds`.
- `repo_path` (string, required): Project root.
- `fuzz_time` (string, required): Seconds per target for `-max_total_time`, chosen by the user.

---

## Outputs

- `cpp_fuzz_findings` (object[]): One row per target and variant: binary, run command, `INFO: Seed`, final stats, and each artifact (`crash-`, `leak-`, `oom-`, `timeout-`, `slow-unit-`) with its `SUMMARY:` line.

---

## Phase 1: Write the Harness

### Entry Criteria
- clang with compiler-rt is installed: `clang --version` and `echo 'int LLVMFuzzerTestOneInput(const char*d, unsigned long s){return 0;}' | clang -x c -fsanitize=fuzzer - -o /tmp/t` succeed.

### Actions
1. Create `fuzz/<target>_fuzzer.cc`. Raw-bytes harness:

```cpp
#include <cstddef>
#include <cstdint>
#include "img.h"

extern "C" int LLVMFuzzerInitialize(int *argc, char ***argv) {
  img_init();                       // one-time setup from the contract
  return 0;
}

extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
  img_t *img = nullptr;
  if (img_decode_png(data, size, &img) == IMG_OK) {
    img_free(img);                  // free everything; leaks are findings
  }
  return 0;
}
```

2. Multi-parameter API: use `#include <fuzzer/FuzzedDataProvider.h>` and its methods `ConsumeIntegralInRange<T>(lo, hi)`, `ConsumeBool()`, `ConsumeRandomLengthString(max)`, `ConsumeBytes<uint8_t>(n)`, `ConsumeRemainingBytes<uint8_t>()`, `PickValueInArray(arr)`. Consume fixed-size values first and the variable-size payload last.
3. Return `0` normally. Returning `-1` tells recent libFuzzer releases not to add the input to the corpus; use it only for inputs the contract defines as uninteresting, and check your LLVM version's docs.
4. Never call `exit`, `abort` on invalid input, or keep data in `static` variables between calls. Do not catch `(...)` around the call.

### Output
Harness source.

### Quality Gate
- The harness calls exactly one entry function from the contract (read the file).
- `grep -nE "exit\(|catch \(\.\.\.\)|static [^c]" fuzz/<target>_fuzzer.cc` prints nothing.

---

## Phase 2: Build

### Entry Criteria
- Harness written.

### Actions
1. Quick build for one variant (flags from `sanitizer_build_config`):

```bash
clang++ -g -O1 -fno-omit-frame-pointer -fsanitize=fuzzer,address,undefined -fno-sanitize-recover=undefined \
  -DFUZZING_BUILD_MODE_UNSAFE_FOR_PRODUCTION -Iinclude fuzz/png_fuzzer.cc src/*.c -o out/png_fuzzer
```

2. CMake integration behind an option so normal builds are untouched:

```cmake
option(ENABLE_FUZZING "Build libFuzzer targets" OFF)
if(ENABLE_FUZZING)
  add_executable(png_fuzzer fuzz/png_fuzzer.cc)
  target_link_libraries(png_fuzzer PRIVATE img)
  target_compile_options(png_fuzzer PRIVATE -fsanitize=fuzzer,address,undefined)
  target_link_options(png_fuzzer PRIVATE -fsanitize=fuzzer,address,undefined)
endif()
```

Build the library itself with `-fsanitize=fuzzer-no-link,address,undefined` (for example through `CMAKE_C_FLAGS` in a dedicated build directory), so its code is instrumented for coverage. Configure with `CC=clang CXX=clang++ cmake -S . -B build-fuzz -DENABLE_FUZZING=ON` and build with `cmake --build build-fuzz --target png_fuzzer`.
3. Smoke run: `./out/png_fuzzer -runs=0 fuzz/corpus/png` runs the corpus once without mutation.

### Output
Fuzzer binaries per variant.

### Quality Gate
- The smoke run prints `INITED` and exits 0.
- The default non-fuzz build (`cmake -S . -B build && cmake --build build`) still succeeds.

---

## Phase 3: Run and Read Output

### Entry Criteria
- Binaries pass the smoke run.

### Actions
1. Run with explicit flags. Positional directories are corpora; the first is written to.

```bash
mkdir -p artifacts/png
./out/png_fuzzer fuzz/corpus/png -dict=fuzz/png.dict -max_total_time=<fuzz_time> \
  -artifact_prefix=artifacts/png/ -print_final_stats=1 -close_fd_mask=3
```

Optional flags to know (check `./out/png_fuzzer -help=1`): `-jobs=N -workers=N` or `-fork=N` for parallel runs; `-max_len` (default derived from the corpus); `-timeout` (documented default 1200 s per input); `-rss_limit_mb` (documented default 2048); `-use_value_profile=1` to help with comparisons; `-seed=N` to repeat a run.
2. Read the status lines: `INITED`, `NEW`, `REDUCE`, `pulse`, `DONE`, with `cov:` (edges), `ft:` (features), `corp:` (entries/bytes), `exec/s:` and `rss:`.
3. Read a crash report from the top: the `ERROR:` line names the bug class; `READ` or `WRITE of size N` gives access type; frames `#0..#N` give the stack; the `SUMMARY:` line is the one-line key; the final lines give the artifact path and `Base64:` of the input.
4. Reproduce each artifact: `./out/png_fuzzer artifacts/png/crash-<sha1>`; the same `SUMMARY:` line must appear.
5. Run every variant binary (MSan, TSan if built) over the final corpus with `-runs=0` to catch bugs the ASan build cannot see.

### Output
`cpp_fuzz_findings`.

### Quality Gate
- Each run log ends with `Done N runs` and the final stats, or an artifact path.
- Each artifact reproduces with an identical `SUMMARY:` line.

---

## Worked Example

Illustrative. `fuzz_time` = 900 (user choice), target `img_decode_png`.

```text
$ ./out/png_fuzzer fuzz/corpus/png -dict=fuzz/png.dict -max_total_time=900 -artifact_prefix=artifacts/png/
INFO: Seed: 2716631022
Dictionary: 4 entries
#5      INITED cov: 611 ft: 702 corp: 5/2163b exec/s: 0 rss: 41Mb
#9810   NEW    cov: 640 ft: 781 corp: 9/2.4Kb lim: 548 exec/s: 4905 rss: 44Mb L: 61/548 MS: 4 ...
=================================================================
==55102==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x6110000001c0
READ of size 1 at 0x6110000001c0 thread T0
    #0 0x5571 in unfilter_row src/png_filter.c:77:22
    #1 0x5573 in img_decode_png src/png.c:301:9
SUMMARY: AddressSanitizer: heap-buffer-overflow src/png_filter.c:77:22 in unfilter_row
artifact_prefix='artifacts/png/'; Test unit written to artifacts/png/crash-1e9b4c...
```

Finding: Paeth filter reads one byte past the row when width times bytes-per-pixel is not a multiple of 8.

---

## Exit Criteria

DONE when each C or C++ target has a harness, builds in every sanitizer variant without breaking the normal build, ran for `fuzz_time`, and each artifact reproduces with its `SUMMARY:` line recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `fuzzer/FuzzedDataProvider.h` not found | **Adjust**: use a clang version that ships it in its resource dir, or copy the header from the LLVM `compiler-rt` sources of the same version. |
| Phase 2 | Duplicate `main` symbol | **Adjust**: exclude the program's `main.c` from the fuzzer link; libFuzzer provides `main`. |
| Phase 2 | Coverage stays at `cov: 2` style tiny numbers | **Retry**: the library was not built with `-fsanitize=fuzzer-no-link`; rebuild it instrumented. |
| Phase 3 | `ERROR: libFuzzer: out-of-memory (malloc(...))` | **Return**: record it as an `oom-` finding; it may be a real unbounded allocation from a length field. |
| Phase 3 | Artifact does not reproduce | **Adjust**: remove global state from the harness per the contract; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
