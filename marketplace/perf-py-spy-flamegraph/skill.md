# Python Sampling Profile and Flame Graph with py-spy

**One-line description:** Records a py-spy sampling profile of a Python process (launched or attached by PID) as an SVG flame graph and a speedscope file, chooses on-CPU or wall-clock mode with `--idle` and `--gil`, adds native frames when C extensions are hot, and reads the widest frames.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Command, inputs, sizes, and for servers the load to apply.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_spy_profile` (object): Paths to `perf/profiles/pyspy_<mode>.svg` and `perf/profiles/pyspy_<mode>.speedscope.json`, the exact py-spy commands, py-spy version, the mode (`cpu` or `wall`), sample count, and the top frames by width with their percentages.

---

## Phase 1: Install and Get Permission to Sample

### Entry Criteria
- The workload runs under CPython (py-spy supports CPython only).

### Actions
1. Install: `python -m pip install py-spy`. Record `py-spy --version`.
2. Check permission by OS:

   | OS | Requirement |
   |---|---|
   | Linux | attaching to a running PID needs `sudo` or `kernel.yama.ptrace_scope` = 0 (`cat /proc/sys/kernel/yama/ptrace_scope`); launching a child with `py-spy record -- python ...` usually works without sudo |
   | Linux in Docker | run the container with `--cap-add SYS_PTRACE` |
   | macOS | `sudo` is required |
   | Windows | run the terminal as Administrator if attach fails |

3. Run `py-spy dump --pid <pid>` (or skip when launching) to confirm py-spy can read the process. It prints the current stack of each thread.

### Output
Working py-spy with confirmed access.

### Quality Gate
- `py-spy --version` prints a version.
- For attach mode, `py-spy dump --pid <pid>` prints at least one thread stack.

---

## Phase 2: Record in the Right Mode

### Entry Criteria
- Access confirmed.

### Actions
1. Choose the mode with this table:

   | Question | Mode | Flags |
   |---|---|---|
   | Is the process busy on CPU (hyperfine showed User+System close to wall time)? | `cpu` | default (idle threads are excluded) |
   | Is wall time much larger than CPU time, or is it a server waiting on I/O? | `wall` | `--idle` (include sleeping and waiting threads) |
   | Do you suspect threads waiting for the GIL? | `gil` | `--gil` (only samples threads holding the GIL) |
   | Is time inside numpy, a C extension or Cython? | add native | `--native` (Linux and Windows) |
   | Does the work run in `multiprocessing` workers? | add children | `--subprocesses` |

2. Launch mode for a batch or CLI workload (largest size):

```bash
py-spy record -o perf/profiles/pyspy_cpu.svg --format flamegraph -- python -m app.report --input data/orders_120000.csv
py-spy record -o perf/profiles/pyspy_cpu.speedscope.json --format speedscope -- python -m app.report --input data/orders_120000.csv
```

3. Attach mode for a running server under the load from `workload_spec` (start the load first):

```bash
sudo py-spy record -o perf/profiles/pyspy_wall.svg --idle --pid <pid> --duration <seconds from workload_spec>
```

4. Keep the default sampling rate (`--rate`, 100 samples per second per the py-spy help) unless the run is short; a short run gives few samples. Check `py-spy record --help` for the default on your version.
5. By default py-spy pauses the target briefly at each sample so it reads a consistent stack; `--nonblocking` avoids pausing at the cost of occasional bad stacks. Use `--nonblocking` only on a production process where pauses are not acceptable, and record it.

### Output
SVG and speedscope files.

### Quality Gate
- py-spy prints a final line with the sample count and errors; the error count is recorded.
- Both output files exist and are non-empty.

---

## Phase 3: Read the Flame Graph

### Entry Criteria
- Files exist.

### Actions
1. Open the SVG in a browser. In a py-spy flame graph each box is a function with file and line; width is the share of samples where it was on the stack; the parent is below, the callee above. The x-order is alphabetical, not time.
2. Hover the widest boxes near the top of each tower; the tooltip shows samples and percent. A wide box with nothing above it is self time.
3. Press Ctrl+F in the SVG and search for your package name (for example `app/`). The bottom right shows `Matched: NN%`, the share of samples inside your code.
4. Open the speedscope file at https://www.speedscope.app (runs locally in the browser) and use the `Left Heavy` view to merge stacks and the `Sandwich` view to sort by self time.
5. Record the top frames by self percent and total percent, each as `function (file:line)`.

### Output
`py_spy_profile`.

### Quality Gate
- `py_spy_profile.top_frames` lists at least the frames that together cover most of the samples, each with a percentage read from the tooltip or Sandwich view.
- The mode recorded matches the table row chosen.

---

## Worked Example

Illustrative. Batch job, CPU mode, size 120,000.

```
$ py-spy record -o perf/profiles/pyspy_cpu.svg -- python -m app.report --input data/orders_120000.csv
py-spy> Sampling process 100 times a second. Press Control-C to exit.
py-spy> Wrote flamegraph data to 'perf/profiles/pyspy_cpu.svg'. Samples: 4471 Errors: 0
```

Sandwich view: `find_customer (app/report.py:92)` self 86.3%; `add_row (app/report.py:61)` total 90.1%; `csv reader` total 2.4%. Search `app/` shows `Matched: 97.2%`.

---

## Exit Criteria

DONE when a py-spy SVG and speedscope file exist for the chosen mode, the sample and error counts are recorded, and the top frames with percentages are listed by function and line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Permission denied` or `Operation not permitted` | **Adjust**: use launch mode, `sudo`, or `--cap-add SYS_PTRACE`. |
| Phase 1 | PyPy or another runtime | **Stop**: py-spy supports CPython only; use `perf-py-cprofile-capture`. |
| Phase 2 | Very few samples | **Retry**: lengthen the workload (larger size) or `--duration`. |
| Phase 2 | Many sampling errors | **Retry**: without `--nonblocking`; record the error count. |
| Phase 3 | Flame graph is mostly `<module>` or `(idle)` | **Adjust**: switch mode per the table (drop `--idle` for CPU work). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
