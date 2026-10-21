# Python Fuzzing with Atheris

**One-line description:** Writes an Atheris harness that instruments the target with `atheris.instrument_imports()`, decodes input through `atheris.FuzzedDataProvider`, lets only documented exceptions pass, runs it with libFuzzer flags for a fixed time, and reads the `Uncaught Python exception` reports and crash files; optionally drives existing Hypothesis tests through `fuzz_one_input`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): Python targets and harness contracts.
- `seed_corpus` (object[], required): Corpus directories.
- `fuzz_dictionary` (object[], optional): Dictionary paths.
- `sanitizer_build_config` (object[], optional): ASan preload settings when the target has native extensions.
- `repo_path` (string, required): Project root.
- `fuzz_time` (string, required): Seconds per target for `-max_total_time`, chosen by the user.

---

## Outputs

- `py_fuzz_findings` (object[]): One row per target: harness path, run command, `INFO: Seed`, final stats, and each crash file with its exception type, message and top traceback frames.

---

## Phase 1: Install and Write the Harness

### Entry Criteria
- Linux or macOS (Atheris does not support Windows; use WSL).
- The target imports in the project's virtual environment.

### Actions
1. `python -m pip install atheris`. Confirm: `python -c "import atheris; print(atheris.__file__)"`. On macOS, Atheris needs a clang with libFuzzer; follow its README if the wheel is not available for your Python.
2. Create `fuzz/fuzz_<target>.py`:

```python
import sys
import atheris

with atheris.instrument_imports():
    from mypkg import config_parser          # only imports inside this block get coverage

def TestOneInput(data: bytes) -> None:
    fdp = atheris.FuzzedDataProvider(data)
    text = fdp.ConsumeUnicodeNoSurrogates(fdp.remaining_bytes())
    try:
        cfg = config_parser.loads(text)
    except config_parser.ConfigError:        # allowed errors from the contract only
        return
    assert config_parser.loads(config_parser.dumps(cfg)) == cfg   # round-trip from the catalog

def main() -> None:
    atheris.Setup(sys.argv, TestOneInput)
    atheris.Fuzz()

if __name__ == "__main__":
    main()
```

3. FuzzedDataProvider methods to use: `ConsumeBytes(n)`, `ConsumeUnicode(n)`, `ConsumeUnicodeNoSurrogates(n)`, `ConsumeInt(n_bytes)`, `ConsumeIntInRange(lo, hi)`, `ConsumeFloat()`, `ConsumeBool()`, `PickValueInList(lst)`, `remaining_bytes()`. Check `help(atheris.FuzzedDataProvider)` for others before using them.
4. Never write `except Exception:` or bare `except:` in `TestOneInput`. That hides every bug.
5. To fuzz an existing Hypothesis test, call its `fuzz_one_input` attribute: `atheris.Setup(sys.argv, atheris.instrument_func(test_P3_no_crash.hypothesis.fuzz_one_input))`.

### Output
Harness file.

### Quality Gate
- `python fuzz/fuzz_<target>.py -runs=0 fuzz/corpus/<target>` exits 0 and prints `INITED`.
- `grep -nE "except( Exception)?:" fuzz/fuzz_<target>.py` prints nothing.

---

## Phase 2: Run

### Entry Criteria
- Smoke run passes.

### Actions
1. Run with libFuzzer flags:

```bash
mkdir -p artifacts/<target>
python fuzz/fuzz_<target>.py fuzz/corpus/<target> -dict=fuzz/<target>.dict \
  -max_total_time=<fuzz_time> -artifact_prefix=artifacts/<target>/ -print_final_stats=1
```

2. For native extensions, add the preload from `sanitizer_build_config`: `LD_PRELOAD="$(python -c 'import atheris; print(atheris.path())')/asan_with_fuzzer.so" ASAN_OPTIONS=detect_leaks=0 python fuzz/...`. Check the `.so` file name in that directory first.
3. Read the libFuzzer status lines (`INITED`, `NEW`, `pulse`, `DONE`; `cov`, `ft`, `corp`, `exec/s`). Python harnesses run far fewer executions per second than native ones; judge progress by whether `cov` grows, not by speed.
4. On an exception Atheris prints:

```text
 === Uncaught Python exception: ===
IndexError: list index out of range
Traceback (most recent call last):
  File "fuzz/fuzz_config.py", line 11, in TestOneInput
  File ".../mypkg/config_parser.py", line 214, in loads
...
==12001== ERROR: libFuzzer: fuzz target exited
artifact_prefix='artifacts/config/'; Test unit written to artifacts/config/crash-0a4d...
```

### Output
Run logs and crash files.

### Quality Gate
- The log shows `INITED` and ends with `Done N runs` or a `Test unit written to` path.

---

## Phase 3: Reproduce and Record

### Entry Criteria
- Run finished.

### Actions
1. Reproduce each crash: `python fuzz/fuzz_<target>.py artifacts/<target>/crash-0a4d...`. The same exception type and top project frame must appear.
2. Minimize: `python fuzz/fuzz_<target>.py -minimize_crash=1 -runs=<user N> artifacts/<target>/crash-0a4d...`; the minimized file is written with a `minimized-from-` prefix.
3. Show the input: `xxd artifacts/<target>/crash-0a4d... | head` or decode it the way the harness does.
4. Record the exception type, message and the top three frames inside the project (ignore frames in `atheris` and the harness) in `py_fuzz_findings`.

### Output
`py_fuzz_findings`.

### Quality Gate
- Each crash reproduces with the same exception type and top project frame.

---

## Worked Example

Illustrative. Target `config_parser.loads`, `fuzz_time` = 600 (user choice).

```text
$ python fuzz/fuzz_config.py fuzz/corpus/config -max_total_time=600 -artifact_prefix=artifacts/config/
INFO: Using built-in libfuzzer
INFO: Seed: 1882216490
#11     INITED cov: 302 ft: 310 corp: 11/740b exec/s: 0 rss: 48Mb
#1580   NEW    cov: 318 ft: 341 corp: 14/812b lim: 29 exec/s: 790 rss: 49Mb
 === Uncaught Python exception: ===
IndexError: list index out of range
  File ".../mypkg/config_parser.py", line 214, in loads
    key, value = parts[0], parts[1]
artifact_prefix='artifacts/config/'; Test unit written to artifacts/config/crash-0a4d71e2...
$ xxd artifacts/config/crash-0a4d71e2...
00000000: 5b61 5d0a 6b                             [a].k
```

Finding: a key with no `=` in a section raises `IndexError` instead of `ConfigError`.

---

## Exit Criteria

DONE when each Python target ran under Atheris for `fuzz_time` with only documented exceptions allowed, and every crash file reproduces with its exception and frames recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `pip install atheris` fails to build | **Adjust**: use a Python version with a published Atheris wheel, or install clang with libFuzzer per the Atheris README. |
| Phase 1 | Coverage never grows above the INITED value | **Retry**: the target was imported outside `instrument_imports()`; move the import inside the block. |
| Phase 2 | LeakSanitizer reports from the interpreter | **Adjust**: set `ASAN_OPTIONS=detect_leaks=0` and record it. |
| Phase 2 | Crash in the harness itself | **Adjust**: fix the harness bug (for example wrong FuzzedDataProvider use) and rerun; do not count it as a target finding. |
| Phase 3 | Crash does not reproduce | **Adjust**: the target keeps module-level state; reset it in `TestOneInput` and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
