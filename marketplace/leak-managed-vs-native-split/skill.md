# Split Managed Heap Growth From Native Growth

**One-line description:** Compares the runtime's managed heap floor with RSS and the process memory map to decide whether growth lives in the garbage-collected heap, in native memory outside it, or in allocator retention, which decides which tool flow runs next.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `growth_series` (string, required): CSV from `leak-rss-growth-confirm` with `rss_kb` and `heap_bytes` columns.
- `growth_verdict` (string, required): From `leak-rss-growth-confirm`. Must be `growing` or `bounded_plateau`.
- `stack` (string, required): `python`, `node`, `browser`, `jvm`, `go` or `cpp`.

---

## Outputs

- `leak_layer` (string): One of `managed`, `native`, `both`, `allocator_retention`.
- `split_evidence` (object): Slopes of RSS and managed heap from the same floor points, the runtime-specific breakdown (for example Node `external`, Go `HeapReleased`), and the top growing regions from the memory map.

---

## Phase 1: Compare the Two Slopes

### Entry Criteria
- `growth_verdict` is `growing` or `bounded_plateau`.

### Actions
1. If `stack` is `cpp`, set `leak_layer` = `native` and go to Phase 3. There is no managed heap.
2. Using the same floor rows as the growth fit, fit two slopes against `ops` with `scipy.stats.linregress`: one for `rss_kb * 1024`, one for `heap_bytes`.
3. Classify with this table. "Grows" means the 95 percent interval of the slope is entirely above 0, computed the same way as in `leak-rss-growth-confirm`.

   | RSS slope | Managed heap slope | Provisional layer |
   |---|---|---|
   | grows | grows, and heap slope interval overlaps RSS slope interval | `managed` |
   | grows | grows, but RSS slope interval lies entirely above heap slope interval | `both` |
   | grows | does not grow | `native` (confirm in Phase 2) |
   | does not grow | grows | `managed` (heap not yet large enough to move RSS; keep `managed`) |

### Output
Provisional `leak_layer` and the two slopes.

### Quality Gate
- Both `linregress` outputs (slope, stderr) are printed and stored in `split_evidence`.
- The table row used is named.

---

## Phase 2: Runtime-Specific Breakdown

### Entry Criteria
- Provisional layer is `native` or `both`.

### Actions
1. Read the runtime's own accounting of memory outside the managed heap:

   | Stack | Command or field | Growth here means |
   |---|---|---|
   | python | RSS grows while `tracemalloc.get_traced_memory()[0]` is flat | C extension or library calling `malloc` directly (numpy buffers, lxml, image libraries), or pymalloc arena retention |
   | node | `process.memoryUsage().external` and `.arrayBuffers` | `Buffer` and `ArrayBuffer` memory, native addons |
   | browser | DevTools Memory panel total vs JS heap; DOM node count in Performance monitor | DOM and canvas memory outside the JS heap |
   | jvm | `jcmd <pid> VM.native_memory summary` (needs `-XX:NativeMemoryTracking=summary` at start) | metaspace, threads, direct buffers, code cache, GC structures |
   | go | `runtime.MemStats`: `HeapInuse`, `HeapIdle`, `HeapReleased`, `StackInuse`, `Sys` | `StackInuse` growth means goroutines; `Sys` minus heap growth with flat `HeapInuse` means cgo or retained spans |

2. Read the process memory map to see which region type grows. Take one map early and one late in the run:
   - Linux: `pmap -x <pid> | sort -k3 -n | tail -20` and `grep -E '^(Rss|Anonymous|Private_Dirty):' /proc/<pid>/smaps_rollup`.
   - macOS: `vmmap --summary <pid>`.
   - Windows: Sysinternals `VMMap` (GUI) or `vmmap -p <pid> out.csv` if your VMMap version supports the command-line form; check its help.
3. Rules:
   - Growth in file-backed mappings, not anonymous memory: page cache or mmap'd files. Not a heap leak. Set `leak_layer` = `native` and note "file-backed" so the causes triage looks at mmap and file handles.
   - Many anonymous regions of the same size appearing on glibc: candidate allocator arenas. Mark for Phase 3.
   - Thread stacks growing (Go `StackInuse`, JVM NMT `Thread`): thread or goroutine leak. Note it.

### Output
Breakdown table and memory map deltas in `split_evidence`.

### Quality Gate
- Two map snapshots (early and late) are saved, and the regions that grew are listed with their size change.
- Every claim about where growth lives cites a field name from the table above with its two values.

---

## Phase 3: Check Allocator Retention

### Entry Criteria
- Layer is `native` or `both`, on Linux with glibc (`ldd --version` prints "GNU libc").

### Actions
1. Stop the load and wait one sample interval.
2. Ask glibc to return free memory: `gdb -p <pid> -batch -ex 'call (int)malloc_trim(0)'`. This pauses the process briefly; do it on a test instance, never in production without approval.
3. Sample RSS again.
4. Decide:

   | After `malloc_trim(0)` | `leak_layer` |
   |---|---|
   | RSS drops back near the warmup level | `allocator_retention` (memory was freed but kept by the allocator) |
   | RSS drops only partly | `both` (keep the provisional layer and note retention) |
   | RSS does not drop | keep the provisional layer (`native` or `both`) |

5. If glibc is not in use (musl, jemalloc, tcmalloc, macOS, Windows), skip this phase and keep the provisional layer; record "trim test not applicable".

### Output
Final `leak_layer` and `split_evidence`.

### Quality Gate
- RSS values before and after `malloc_trim(0)` are both recorded, or the phase records why it was not applicable.
- `leak_layer` is exactly one of the four allowed values.

---

## Worked Example

Illustrative only.

Input: `stack` = `node`, `growth_verdict` = `growing`.

Phase 1: RSS slope 2,310 bytes/op (interval 2,050 to 2,570). `heapUsed` slope 140 bytes/op (interval 90 to 190). RSS interval lies above heap interval: provisional `both`.

Phase 2: `process.memoryUsage().external` rose from 18 MB to 431 MB over the run; `arrayBuffers` tracked it. `pmap -x` late snapshot shows anonymous regions growing. Note: Buffer retention.

Phase 3: Linux glibc 2.35. `malloc_trim(0)` dropped RSS from 1.21 GB to 1.17 GB only: keep `both`. Next flows: heap snapshot comparison filtered on `ArrayBuffer` and `Buffer` retainers.

---

## Exit Criteria

DONE when `leak_layer` is set from measured slopes and breakdown fields, and `split_evidence` records every number used.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `growth_verdict` is `flat` or `inconclusive` | **Stop**: there is nothing to split; go back to `leak-rss-growth-confirm`. |
| Phase 1 | `heap_bytes` column empty | **Return**: rerun `leak-rss-growth-confirm` with the heap metric enabled. |
| Phase 2 | JVM started without NMT | **Adjust**: restart a test instance with `-XX:NativeMemoryTracking=summary`; NMT cannot be turned on in a running JVM. |
| Phase 3 | `gdb` attach fails with ptrace permission error | **Adjust**: run as the same user with `sudo`, or set `kernel.yama.ptrace_scope` on a test host only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
