# Port C Golden Capture

**One-line description:** Builds a capture harness that links the original C library unchanged, runs every planned case input under AddressSanitizer and UndefinedBehaviorSanitizer, writes observed results as golden records, and marks every input that triggers undefined behavior as `ub` instead of recording its accidental output as truth.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the C repository at the reference commit.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.
- `case_inputs` (object[], required): Output of `port-edge-case-input-set`.
- `nondeterminism_sources` (object[], required): Output of `port-nondeterminism-inventory`.

---

## Outputs

- `c_corpus` (object): Path to the written `golden/` directory, record counts per behavior (ok, error, ub), the build and capture commands, and the environment block (compiler, flags, target triple, `int`/`long`/pointer sizes, `char` signedness).

---

## Phase 1: Build the Harness

### Entry Criteria
- Source at `reference_commit`, clean `git status --porcelain`, and the library builds.

### Actions
1. Write `tools/golden_harness.c`. It reads one case per line from stdin in a simple fixed format that a small Python helper (`tools/cases_to_c.py`) converts from `cases.jsonl`, calls the library function named in the case, and prints one JSON record per line to stdout. Keep JSON writing in the harness minimal: print integers as `{"$int":"%lld"}` (or `%llu` for unsigned), doubles as `{"$f64":"%016" PRIx64}` after `memcpy` into a `uint64_t`, buffers as hex that the Python helper converts to `$bytes`.
2. Map C error conventions to the error categories from `golden/categories.json`: return code (for example `-1`) plus `errno` value name (`EINVAL`, `ENOENT`: print with `strerrorname_np` on glibc 2.32+, or a switch you write), `NULL` return, or out-parameter status.
3. Build two variants with the same source files and flags the project uses, plus:
   - Sanitized: `-O1 -g -fno-omit-frame-pointer -fsanitize=address,undefined -fno-sanitize-recover=undefined`
   - Plain: the project's release flags (for example `-O2`), used to record the output production actually gives.
   Use the project's real compiler. If the project builds with CMake, add the harness as a separate target in a separate build directory (`cmake -S . -B build-golden -DCMAKE_C_FLAGS="..."`) rather than editing the main `CMakeLists.txt`; if that is impossible, keep the change in a patch file outside the source tree.
4. Record platform facts: `cc -dM -E - < /dev/null | grep -E "__SIZEOF_INT__|__SIZEOF_LONG__|__SIZEOF_POINTER__|__CHAR_UNSIGNED__|__x86_64__|__aarch64__"`. These decide `c_int`, `c_long`, and `c_char` in Rust.

### Output
Two harness binaries.

### Quality Gate
- `git -C <source_repo> diff --stat -- src include` prints nothing.
- Both binaries run a one-line smoke case and print one valid JSON line (`./golden_harness < smoke.txt | jq -c .` exits 0).

---

## Phase 2: Capture With Sanitizers

### Entry Criteria
- Both binaries build.

### Actions
1. Run each case through the sanitized binary in its own process so one crash does not hide the rest:
```
export UBSAN_OPTIONS=print_stacktrace=1:halt_on_error=1
export ASAN_OPTIONS=detect_leaks=1
python tools/run_cases.py --bin build-golden/golden_harness_san --cases cases.jsonl --out golden_san/
```
   `run_cases.py` runs the binary once per case with `subprocess.run`, captures stdout, stderr and the exit status.
2. Classify each case by the sanitized run:

| Sanitized run result | Record kind |
|---|---|
| exit 0, no sanitizer report | `ok` or `error` from the harness JSON |
| stderr contains `runtime error:` (UBSan) | `ub`, with the first `runtime error:` line as `note` |
| stderr contains `ERROR: AddressSanitizer` | `ub`, with the ASan error type (`heap-buffer-overflow`, `use-after-free`, ...) as `note` |
| stderr contains `ERROR: LeakSanitizer` only | the harness JSON result, tagged `leak` (a leak is not a wrong output, but the Rust port will not reproduce it) |
| killed by signal (SIGSEGV, SIGABRT) without a report | `ub`, `note` = signal name |

3. For `ok` and `error` cases, take the output from the plain (release-flag) binary and check it equals the sanitized output. If they differ, the case has undefined or unspecified behavior the sanitizers missed: mark it `ub` with note "differs between -O1 sanitized and release build".
4. Write the final records to `golden/B-*.jsonl`.

### Output
`golden/*.jsonl` with `ok`, `error`, and `ub` records.

### Quality Gate
- Records written equals cases read.
- Zero `ok` or `error` records come from a run with a sanitizer report.
- Every `ub` record has a non-empty `note`.
- A second capture into `golden2/` gives `diff -r golden golden2` with no output.

---

## Phase 3: Record the Environment

### Entry Criteria
- Capture complete and repeatable.

### Actions
1. Write `golden/ENV.json`: `cc --version` first line, both flag sets, the platform facts from Phase 1, `uname -m`, glibc version (`ldd --version | head -n 1`) when on Linux, and the reference commit.
2. Report the count of `ub` records per behavior. Each is a decision for the user: the Rust port must define a behavior for that input (usually an error), and the replay treats `ub` records as "port must not panic and must not return a value the source never documented" unless the user writes a specific expectation.
3. Set `c_corpus`.

### Output
`c_corpus`.

### Quality Gate
- `jq . golden/ENV.json` exits 0 and contains the `__SIZEOF_LONG__` value and `__CHAR_UNSIGNED__` status.

---

## Worked Example

Illustrative. Source `libcrc` with `uint32_t crc32_update(uint32_t crc, const uint8_t *buf, size_t len)` and `int parse_port(const char *s)`.
```
$ python tools/run_cases.py --bin build-golden/golden_harness_san --cases cases.jsonl --out golden_san/
cases=96 ok=81 error=9 ub=6 leak=0
$ grep -h '"kind":"ub"' golden/*.jsonl | jq -r .expect.note | sort | uniq -c
      4 runtime error: signed integer overflow: 2147483647 * 10 cannot be represented in type 'int'
      2 runtime error: null pointer passed as argument 1, which is declared to never be null
```
The 4 overflow cases are `parse_port("99999999999")`: C `int` accumulation overflows. The Rust port uses `checked_mul` and returns an error; the user approves this as the defined behavior for those inputs.

---

## Exit Criteria

DONE when every case has a record classified by a sanitized run, no `ok` or `error` record came from a run with undefined behavior, release and sanitized outputs agree, and platform facts are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Compiler lacks sanitizer support (old GCC, MSVC) | **Adjust**: use Clang (`clang -fsanitize=address,undefined`); MSVC supports only ASan (`/fsanitize=address`), so record that UB was not checked. |
| Phase 1 | Library uses global state between calls | **Adjust**: one process per case already isolates it; record the state each case starts from. |
| Phase 2 | Sanitized and release outputs differ | **Adjust**: mark `ub` as in the table; do not pick one output as golden. |
| Phase 2 | Many cases are `ub` | **Return**: report the count to the user; the inputs reveal real source defects and the port's behavior for them needs a decision. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
