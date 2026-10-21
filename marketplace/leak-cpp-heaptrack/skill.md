# C and C++ Heap Growth Profiling With heaptrack

**One-line description:** Records every allocation and free of a native process with heaptrack (launched or attached by PID), then reads `heaptrack_print` sections and the `heaptrack_gui` consumed-over-time chart to find call sites whose live memory grows per operation, including memory still referenced by containers that leak checkers do not report.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. Growing call sites are matched to hypothesis ids (C1, C4 and C10 are common for referenced growth) or marked "none".

---

## Outputs

- `heaptrack_report` (object[]): Call sites ranked by memory leaked (not freed at end of capture) and by peak consumption, with bytes for an N run and a 2N run, the allocation stack with file:line, and the data file paths.

---

## Phase 1: Record

### Entry Criteria
- Linux. `heaptrack --version` prints a version (packages: `heaptrack` and `heaptrack-gui` on Debian, Ubuntu and Fedora).
- Binary built with `-g` (release optimization is fine; heaptrack has modest overhead compared with Valgrind).

### Actions
1. Launch under heaptrack: `heaptrack ./build/server --config test.conf`. It prints the output file name, for example `heaptrack.server.24410.zst` (older versions write `.gz`).
2. Or attach to a running process: `heaptrack -p <pid>`. Attaching needs gdb and ptrace permission, and only sees allocations after the attach.
3. Do not run under ASan or with another `LD_PRELOAD` allocator hook at the same time; heaptrack itself preloads a library.
4. Run warmup plus N operations, stop cleanly. Then repeat the whole capture with 2N operations into a second file. Comparing the two isolates per-operation growth from one-time allocations.

### Output
Two data files (N and 2N).

### Quality Gate
- `ls -la heaptrack.server.*` lists two files, and the op counts for each are recorded.

---

## Phase 2: Read heaptrack_print

### Entry Criteria
- Data files exist.

### Actions
1. Print the summary: `heaptrack_print heaptrack.server.24410.zst > ht_N.txt`. Do the same for the 2N file into `ht_2N.txt`.
2. Sections to read, as printed by `heaptrack_print`:
   - `MOST CALLS TO ALLOCATION FUNCTIONS`: allocation hot spots (performance, not leaks).
   - `PEAK MEMORY CONSUMERS`: call sites holding the most memory at peak.
   - `MOST MEMORY LEAKED`: call sites whose allocations were not freed by the end of the capture.
   - The final totals line, which includes total memory leaked.
3. Check `heaptrack_print --help` for options in your version, such as printing leak details, flame graph output, or a diff of two files (`-d`/`--diff` in recent versions). If diff is available: `heaptrack_print -d heaptrack.server.N.zst heaptrack.server.2N.zst`.
4. Compare `MOST MEMORY LEAKED` and `PEAK MEMORY CONSUMERS` between `ht_N.txt` and `ht_2N.txt`. A call site whose bytes roughly double between N and 2N grows per operation. Call sites with equal bytes in both are one-time allocations.
5. "Leaked" in heaptrack includes memory still referenced at exit (heaptrack does not scan for pointers). That is why it catches growing containers that LeakSanitizer and Memcheck "definitely lost" miss.

### Output
Ranked call sites with N and 2N bytes.

### Quality Gate
- For each reported call site, the bytes from both `ht_N.txt` and `ht_2N.txt` are quoted.

---

## Phase 3: Time View and Attribution

### Entry Criteria
- Ranked call sites exist.

### Actions
1. Open the 2N file in the GUI: `heaptrack_gui heaptrack.server.<pid>.zst`. Use the "Consumed" chart: each colored band is a top call site's live memory over time. A band rising steadily for the whole load is a leak; a band rising and then flat is a bounded cache or pool.
2. In the "Bottom-Up" or "Caller/Callee" view, expand the growing site to see which caller path holds the allocations.
3. For each growing site, open the source line and find where the allocated object is stored (a `std::map` member, a `std::vector` that only grows, a `std::shared_ptr` captured in a callback list, a cache without eviction).
4. `std::shared_ptr` cycles show here as steadily growing allocations from `std::make_shared` call sites; check for two objects holding `shared_ptr` to each other and replace one direction with `std::weak_ptr` in the fix step.

### Output
`heaptrack_report`.

### Quality Gate
- Each report entry has a growth classification (steady or plateau) read from the Consumed chart and a storage location file:line.

---

## Worked Example

Illustrative only.

Input: `teld`, LSan reports no Direct leaks after the earlier fix, RSS still grows.

Phase 1: `heaptrack ./build/teld -c test.conf` for 50,000 and 100,000 messages; files `heaptrack.teld.31002.zst`, `heaptrack.teld.31377.zst`.

Phase 2: `ht_N.txt` `MOST MEMORY LEAKED`: `14.40M leaked over 50000 calls from SeenIds::add(unsigned long) at src/dedupe.cpp:31`. `ht_2N.txt`: `28.80M leaked over 100000 calls` at the same site.

Phase 3: Consumed chart shows the `SeenIds::add` band rising linearly. `dedupe.cpp:31` inserts every message id into `std::unordered_set<uint64_t> seen_` with no eviction. Cause C1 (unbounded set).

---

## Exit Criteria

DONE when growing call sites are identified by comparing N and 2N captures and each has a storage location in source.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `heaptrack -p` fails to attach | **Adjust**: launch the process under heaptrack instead; attach needs gdb and ptrace rights. |
| Phase 1 | Platform is macOS or Windows | **Adjust**: use Instruments Allocations on macOS or Windows Performance Recorder heap tracing; heaptrack is Linux only. |
| Phase 2 | Every site is equal between N and 2N | **Return**: to `leak-native-malloc-fragmentation`; growth is in allocator retention, not live allocations. |
| Phase 3 | Stacks show only `??` | **Adjust**: rebuild with `-g` and install debug symbols for system libraries. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
