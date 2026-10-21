# Port Python Golden Capture

**One-line description:** Runs the original Python code over every planned case input inside a pinned environment (fixed `PYTHONHASHSEED`, `TZ`, locale, frozen clock) and writes the observed results, exceptions and process outputs as golden records in the typed JSON Lines schema, without changing a line of the source.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the Python repository at the reference commit.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.
- `case_inputs` (object[], required): Output of `port-edge-case-input-set`.
- `nondeterminism_sources` (object[], required): Output of `port-nondeterminism-inventory`.

---

## Outputs

- `py_corpus` (object): Path to the written `golden/` directory, record count per behavior, the exact capture command, and the environment block (Python version, `PYTHONHASHSEED`, `TZ`, `LC_ALL`, platform).

---

## Phase 1: Build the Capture Harness

### Entry Criteria
- Source is at `reference_commit` with a clean `git status --porcelain`.
- A virtualenv with the source's dependencies is active (`python -c "import <pkg>"` exits 0).

### Actions
1. Create `tools/golden_capture.py` outside the package being ported (it must not ship). It has four parts, each a function:
   - `decode(v)`: typed encoding to Python value. `{"$int": s}` to `int(s)`; `{"$f64": h}` to `struct.unpack(">d", bytes.fromhex(h))[0]`, `"nan"` to `float("nan")`; `{"$bytes": b}` to `base64.b64decode(b)`; `{"$badstr": b, "enc": "utf-16-surrogatepass"}` to `base64.b64decode(b).decode("utf-16-le", "surrogatepass")`.
   - `encode(v)`: the reverse. Check `bool` before `int` (`isinstance(True, int)` is `True` in Python). Floats: NaN to `{"$f64": "nan"}`, else `struct.pack(">d", v).hex()`. Strings: try `v.encode("utf-8")`; on `UnicodeEncodeError` use `$badstr`. Dicts with non-`str` keys to `$map`. `set` and `frozenset` to `$set`. `datetime` to `$instant` (reject naive datetimes: raise, so the gap is visible). `Decimal` to `$decimal` with `str(v)`.
   - `call(record)`: resolve `record["call"]` with `importlib.import_module` and `getattr`, call it with decoded `args` and `kwargs`. On exception, map `type(e).__name__` through `golden/categories.json` and write `{"kind": "error", "category": ..., "message": str(e)}`. An exception class missing from `categories.json` stops the run.
   - `run_process(record)`: for CLI behaviors, `subprocess.run([...], input=stdin_bytes, capture_output=True, env=pinned_env, timeout=<user value or none>)`; write `exit_code`, `stdout`, `stderr` decoded with `errors="surrogateescape"` and stored as `$badstr` when not valid UTF-8.
2. Apply each `nondeterminism_sources` row:
   - `inject`: pass the fixed value as the named parameter.
   - `freeze`: wrap `call` in `time_machine.travel("2024-01-02T03:04:05Z", tick=False)` (time-machine) or `freezegun.freeze_time(...)`. Use one fixed instant for the whole corpus and record it.
   - `pin_env`: the harness re-executes itself if `os.environ.get("PYTHONHASHSEED") != "0"`, because the hash seed is read at interpreter startup and cannot be changed later.
3. Do NOT edit any file under the source package. If a value cannot be controlled without editing the source, stop and report it.

### Output
`tools/golden_capture.py`.

### Quality Gate
- `git -C <source_repo> diff --stat -- <package dir>` prints nothing.
- `python tools/golden_capture.py --selftest` (a self-test you write) round-trips `encode(decode(x)) == x` for one value of every typed encoding and exits 0.

---

## Phase 2: Capture

### Entry Criteria
- Harness self-test passed.

### Actions
1. Run with the pinned environment, writing one file per behavior:
```
PYTHONHASHSEED=0 TZ=UTC LC_ALL=C.UTF-8 PYTHONUTF8=1 \
  python tools/golden_capture.py --cases cases.jsonl --out golden/
```
   On Windows PowerShell set each with `$env:PYTHONHASHSEED="0"` and so on; `TZ` does not affect Python on Windows, so freeze time-zone-dependent calls by injection.
2. Read the summary line the harness prints (cases read, records written, errors by category). Every case must produce exactly one record, including cases that raise.
3. Run the capture a second time into `golden2/` and compare: `diff -r golden golden2`. Any difference means nondeterminism leaked.

### Output
`golden/*.jsonl`.

### Quality Gate
- Records written equals cases read (from the summary line), and `wc -l golden/*.jsonl` totals the same number.
- `diff -r golden golden2` prints nothing.
- `jq -c . golden/*.jsonl > /dev/null` exits 0 (every line is valid JSON).

---

## Phase 3: Record the Environment

### Entry Criteria
- Two identical captures.

### Actions
1. Write `golden/ENV.json` with: `python -c "import sys,platform;print(sys.version, platform.platform())"`, the `pip freeze` output hash (`pip freeze | sha256sum`), `PYTHONHASHSEED`, `TZ`, `LC_ALL`, the frozen instant, and the reference commit.
2. Set `py_corpus` to the directory path, per-behavior counts (`wc -l golden/B-*.jsonl`), and the capture command.

### Output
`py_corpus`.

### Quality Gate
- `jq . golden/ENV.json` exits 0 and contains the reference commit.

---

## Worked Example

Illustrative. Source `slugkit`, 312 cases.

Phase 1 self-test:
```
$ python tools/golden_capture.py --selftest
selftest: 9 encodings round-trip OK
```
Phase 2:
```
$ PYTHONHASHSEED=0 TZ=UTC LC_ALL=C.UTF-8 python tools/golden_capture.py --cases cases.jsonl --out golden/
cases=312 records=312 ok=287 error=25 (invalid_argument=25) process=0
$ wc -l golden/*.jsonl | tail -n 1
312 total
$ diff -r golden golden2; echo $?
0
```
Sample record:
```
{"id":"B-001/0044","behavior":"B-001","call":"slugkit.slugify","input":{"args":["Straße 😀"],"kwargs":{"max_len":{"$int":"80"}},"stdin":null,"env":{},"files":{}},"expect":{"kind":"ok","value":"strasse"},"tags":["unicode:astral","audit:U-002"]}
```

---

## Exit Criteria

DONE when every case input has one golden record, two captures are identical, the source tree is unmodified, and the environment is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An exception class is missing from `categories.json` | **Stop**: return to `port-error-model-mapping` to add it; never default to a catch-all category. |
| Phase 1 | Value type has no typed encoding (custom class instance) | **Adjust**: encode its public fields as an object with a `"$type"` key and add the rule to `SCHEMA.md`. |
| Phase 2 | Captures differ between runs | **Return**: to `port-nondeterminism-inventory` with the differing record id. |
| Phase 2 | A case hangs | **Adjust**: ask the user for a timeout value; record a timeout as `{"kind": "error", "category": "timeout"}` only if the source documents that behavior, else drop the case with a note. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
