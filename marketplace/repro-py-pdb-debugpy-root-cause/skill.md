# Python Root Cause with pdb and debugpy

**One-line description:** Drives the red pytest test into the debugger with `pytest --pdb` (post-mortem) or `--trace` (step from the start), or attaches debugpy for an IDE session, then walks frames with `w`, `u`, `d`, `p`, `pp` and conditional breakpoints to find the first point where program state diverges from what the code's author intended.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `regression_test` (object, required): Output of `repro-red-test-gate`.
- `repo_path` (string, required): Absolute path to the local clone.

---

## Outputs

- `py_debug_trace` (object): The debugger transcript (commands and printed values), the frame and line where state first goes wrong, the variable values proving it, and the stated defect in one sentence ("At X, variable Y is Z because W"). Empty when `stack` is not python.

---

## Phase 1: Post-Mortem at the Failure

### Entry Criteria
- `regression_test` is red.

### Actions
1. Run: `python -m pytest "<node id>" -x --pdb -p no:cacheprovider`. On failure pytest drops into `(Pdb)` in the frame that raised.
2. If the repo sets `-p no:pdb` or captures output oddly, add `-s` (disable capture) so prompts show.
3. In `(Pdb)` run, in this order, and paste each output:
   1. `w` (where): prints the stack, newest frame last, current frame marked `>`.
   2. `ll` (longlist): the full source of the current function.
   3. `p <each local named in the failing line>`; use `pp` for dicts and lists; `p type(x)` when types matter; `p locals().keys()` to list names.
4. Walk outward with `u` (up, toward the caller) and inspect locals in each frame until you reach the frame where an argument or local first holds the bad value. Use `d` to move back down.
5. Note: list comprehensions and generator expressions create their own frames in Python 3.11 and earlier; in 3.12+ comprehensions are inlined (PEP 709). Expect frame counts to differ by version.

### Output
Frame where the bad value is first visible, with values.

### Quality Gate
- Transcript includes `w` output and at least one `p` of the bad value.

---

## Phase 2: Step to the Origin

### Entry Criteria
- The frame showing the bad value is known.

### Actions
1. Find where that value was produced. Set a breakpoint just before it and rerun from the start: `python -m pytest "<node id>" --trace` (stops at the first line of the test), then at `(Pdb)`: `b <file>:<line>` and `c`.
2. If the line runs many times before the bad case, use a conditional breakpoint: `b <file>:<line>, <expression that is true only for the bad input>` (for example `b src/importer/csv_reader.py:80, raw[:2] == b"\xff\xfe"`). Use `condition <bp number> <expr>` to add a condition later.
3. Step: `n` (next line, stays in the frame), `s` (step into a call), `r` (run to return; prints `--Return--` and the return value), `until <line>` to leave a loop.
4. Use `display <expr>` to print an expression automatically every time execution stops in that frame.
5. Stop when you can state: the line, the inputs to that line, the value it produced, and the value it should have produced according to the docstring, spec, type hints or the regression test's expected value.
6. Never edit source while in the debugger. You can try a hypothesis in place with `!<statement>` (for example `!raw = raw.decode("utf-16")`) then `c` to see whether the test would pass; record the result as evidence, then quit with `q`.

### Output
Origin line with before and after values.

### Quality Gate
- The transcript shows the origin line being executed (`n` or `s` output showing `-> <line>`) with the bad value printed after it.

---

## Phase 3: debugpy for IDE or Remote Sessions (Optional)

### Entry Criteria
- The terminal debugger is unusable: process is a server, runs in a container, spawns subprocesses, or the user wants an IDE.

### Actions
1. Install only into the test environment: `python -m pip install debugpy` (do not add it to project dependencies).
2. Start the test waiting for a client: `python -m debugpy --listen 127.0.0.1:5678 --wait-for-client -m pytest "<node id>" -x`. In a container use `--listen 0.0.0.0:5678` and publish the port (`docker run -p 5678:5678 ...`).
3. VS Code `launch.json` attach config: `{"name": "Attach", "type": "debugpy", "request": "attach", "connect": {"host": "localhost", "port": 5678}, "pathMappings": [{"localRoot": "${workspaceFolder}", "remoteRoot": "/src"}]}`. Older extension versions use `"type": "python"`.
4. For subprocesses, debugpy follows them by default in recent versions; check the debugpy README for `subProcess` settings if breakpoints in children do not bind.
5. Record the same evidence as Phases 1 and 2 (call stack, variable values) from the IDE panes.

### Output
Same evidence captured through debugpy.

### Quality Gate
- The IDE call stack and variable values are copied as text into `py_debug_trace`, not described.

---

## Worked Example

Illustrative only. Red test: `test_read_rows_utf16_bom_decodes_header`.

```
$ python -m pytest tests/importer/test_csv_reader.py::test_read_rows_utf16_bom_decodes_header --pdb -x
> src/importer/csv_reader.py(88)read_rows()
-> text = raw.decode(self.encoding)
(Pdb) p self.encoding
'utf-8'
(Pdb) p raw[:4]
b'\xff\xfei\x00'
(Pdb) u
> src/importer/csv_reader.py(64)__init__()
-> self.encoding = encoding or detect_encoding(path)
(Pdb) p encoding, detect_encoding(path)
(None, 'utf-8')
```

Phase 2: `b src/importer/encoding.py:19` then stepping shows `detect_encoding` checks only `codecs.BOM_UTF8` and falls through to `'utf-8'`. Defect: "At encoding.py:19, a UTF-16 LE BOM is not recognized, so the default 'utf-8' is returned."

---

## Exit Criteria

DONE when `py_debug_trace` names the origin line and contains printed values showing the wrong value produced there and its inputs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `(Pdb)` prompt appears | **Adjust**: add `-s`; check `addopts` for `-p no:pdb`; under xdist (`-n`) run with `-p no:xdist` or `-n 0`. |
| Phase 1 | Crash is a segfault in a C extension, no traceback | **Adjust**: run with `python -X faulthandler -m pytest ...` to print the Python stack at the signal, then use gdb with `py-bt` per the native debugger flow. |
| Phase 2 | Hang instead of exception | **Adjust**: `py-spy dump --pid <pid>` (if installed) or `python -X faulthandler` with `faulthandler.dump_traceback_later`; then break at the reported frame. |
| Phase 2 | Weak model "fixes" code inside pdb and reports success | **Stop**: in-debugger experiments are evidence only; the fix is made in `repro-minimal-fix`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
