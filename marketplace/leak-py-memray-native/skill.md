# Python Native Allocation Leaks With memray

**One-line description:** Records every allocation of a Python process, including native C and C++ frames from extension modules, with memray, then renders a leaks-mode flame graph and a temporal view to find allocations that tracemalloc cannot see.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Start command or PID.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `leak_layer` (string, required): From `leak-managed-vs-native-split`. This flow is for `native`, `both` or `allocator_retention` on Python.

---

## Outputs

- `py_native_leak_report` (object[]): Top leaked allocation stacks (Python and native frames) with bytes and allocation count still live at the end of the capture, plus the paths of the `.bin` capture and rendered HTML reports.

---

## Phase 1: Capture

### Entry Criteria
- Linux or macOS. memray does not support Windows.
- `pip install memray` succeeds in the target environment; `memray --version` prints a version.

### Actions
1. Choose capture mode:

   | Situation | Command |
   |---|---|
   | You can start the process | `PYTHONMALLOC=malloc memray run --native -o capture.bin app.py` |
   | Server started by a runner | `PYTHONMALLOC=malloc memray run --native -o capture.bin -m gunicorn -w 1 orders.wsgi:app` |
   | Process already running | `memray attach <pid> -o capture.bin` (needs `gdb` or `lldb`; check `memray attach --help` for the native and duration options your version has) |
   | The process forks workers | add `--follow-fork` to `memray run` |

2. Why `PYTHONMALLOC=malloc`: the pymalloc arena allocator reuses memory so freed objects look live; memray's docs recommend this setting for leaks mode so every allocation is a real `malloc`.
3. `--native` adds C and C++ frames to stacks. Without it you only see the Python line that called into the extension. Native symbols need debug info; install `-dbg` or `-debuginfo` packages for system libraries if frames show as `???`.
4. Run `load_recipe` for warmup plus a fixed N operations, then stop the process cleanly (SIGINT or the app's shutdown), so memray writes the end-of-run state.

### Output
`capture.bin`.

### Quality Gate
- `memray stats capture.bin` runs and prints total allocations and a top-allocators table.

---

## Phase 2: Find Leaked Allocations

### Entry Criteria
- `capture.bin` exists.

### Actions
1. Render the leaks flame graph: `memray flamegraph --leaks -o leaks.html capture.bin`. Leaks mode shows only memory allocated during the capture and not freed by the end.
2. Render the temporal view to see growth over time per stack: `memray flamegraph --temporal --leaks -o leaks_temporal.html capture.bin` (check `memray flamegraph --help`; `--temporal` exists in recent versions).
3. Open `leaks.html` in a browser. Widest boxes at the top of a stack are the allocation sites holding the most memory. Click a box to see the full stack with Python and native frames.
4. Text alternative for terminal-only hosts: `memray tree capture.bin` and `memray summary capture.bin`.
5. Ignore stacks under interpreter startup and import machinery (`_find_and_load`, `PyImport_`); they are one-time. A leak scales with N: rerun with 2N and confirm the same stack roughly doubles.

### Output
Ranked leaked stacks.

### Quality Gate
- `leaks.html` exists, and for each reported stack the bytes value from the flame graph tooltip or `memray summary` is recorded for both the N and 2N runs.

---

## Phase 3: Attribute to Code

### Entry Criteria
- Ranked leaked stacks exist.

### Actions
1. For each leaked stack, find the last frame in your own code (the Python line that called into the extension) and the first native frame below it.
2. Classify:

   | Native frame in | Likely cause |
   |---|---|
   | numpy, Pillow (PIL), OpenCV, lxml | your code keeps references to large buffers (a managed-side leak through a native buffer); check what holds the Python object |
   | a C extension you own or vendor | missing `Py_DECREF` or missing `free` in the extension |
   | `libssl`, `libcurl`, database drivers | connection or context objects not closed (C5) |
   | `malloc` called from `_PyObject_Malloc` with nothing beyond | pure Python objects; go back to `leak-py-tracemalloc-diff` |

3. Record each as an entry in `py_native_leak_report`.

### Output
`py_native_leak_report`.

### Quality Gate
- Each entry names one Python file:line and one native frame, and its classification row.

---

## Worked Example

Illustrative only.

Input: `leak_layer` = `native`; RSS grows 1.9 KB/op while tracemalloc is flat.

Phase 1: `PYTHONMALLOC=malloc memray run --native -o capture.bin -m gunicorn -w 1 thumbs.wsgi:app`; 20,000 requests; SIGINT. `memray stats capture.bin` prints `Total allocations: 41853220`.

Phase 2: `leaks.html` top stack: `thumbs/render.py:52 resize()` -> `ImagingNewDirty` in PIL `_imaging` -> `malloc`, 38.4 MB at N = 20,000 and 76.1 MB at 2N.

Phase 3: `render.py:52` appends each resized `Image` to `self._recent` and never trims it. Classification: library buffer held by Python reference. Report entry points at `render.py:52`.

---

## Exit Criteria

DONE when leaked native stacks are captured, confirmed to scale with operation count, and attributed to a file:line in the project.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Host is Windows | **Stop**: run the reproduction in a Linux container or WSL. |
| Phase 1 | `memray attach` fails | **Adjust**: restart the process under `memray run`; attach needs gdb or lldb and ptrace rights. |
| Phase 2 | Leaks view is empty | **Retry**: confirm `PYTHONMALLOC=malloc` was set and the process exited cleanly. |
| Phase 3 | Native frames are `???` | **Adjust**: install debug symbols for that library and re-render; do not guess the function. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
