# Native Allocator Retention and Fragmentation Check

**One-line description:** Separates real native leaks from glibc malloc arena retention and fragmentation using `malloc_info`, `malloc_trim`, `pmap` arena patterns and controlled `MALLOC_ARENA_MAX` or jemalloc runs, and uses jemalloc heap profiling (`prof:true`, `jeprof --base`) when live native allocations really grow.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `split_evidence` (object, required): From `leak-managed-vs-native-split`. Memory map snapshots and the `malloc_trim` result.
- `stack` (string, required): Any value; this flow applies to the native layer of every stack (Python C extensions, Node addons, JVM JNI, Go cgo, C and C++).
- `load_recipe` (object, required): From `leak-intake-load-recipe`.

---

## Outputs

- `allocator_report` (object): Verdict (`allocator_retention`, `fragmentation`, `native_leak`), arena count and per-arena free bytes from `malloc_info`, RSS slopes under each allocator configuration tried, and jemalloc profile diff results when run.

---

## Phase 1: Read glibc Allocator State

### Entry Criteria
- Linux with glibc (`ldd --version` first line names GNU libc). For musl or other allocators, skip to Phase 3.
- Test instance where pausing the process under gdb is acceptable.

### Actions
1. Count arenas in the memory map. On 64-bit glibc, each non-main arena reserves its own heap region. List large anonymous mappings:
   `pmap -x <pid> | grep anon | sort -k2 -n | tail -60` (column 2 is size in KB, column 3 is RSS in KB).
   Then count how many anonymous regions share the same size: `pmap -x <pid> | grep anon | awk '{print $2}' | sort | uniq -c | sort -rn | head`. Many regions of one identical size, whose number grew with thread count, point at per-thread arenas (glibc reserves each non-main arena heap with a fixed maximum size, documented in its malloc source as `HEAP_MAX_SIZE`).
2. Dump allocator statistics from inside the process without code changes:
   `gdb -p <pid> -batch -ex 'call (int)malloc_info(0, (FILE*)stderr)'`
   The XML goes to the process's stderr (its log). Each `<heap nr="N">` has `<total type="fast"...>`, `<total type="rest"...>`, `<system type="current" size="...">`. Large `rest` free sizes relative to `system current` mean memory is free inside the arena but not returned to the OS.
3. Record `malloc_trim(0)` result from `split_evidence`; repeat it now if missing: `gdb -p <pid> -batch -ex 'call (int)malloc_trim(0)'`, sampling RSS before and after.

### Output
Arena count, `malloc_info` totals, trim delta.

### Quality Gate
- The `malloc_info` XML is saved to a file, and the sum of `system current` and of free bytes across heaps is computed and recorded.

---

## Phase 2: Controlled Allocator Runs

### Entry Criteria
- Phase 1 done, or allocator is not glibc.

### Actions
1. Rerun `load_recipe` under each configuration below, one at a time, sampling RSS the same way as `leak-rss-growth-confirm`, and fit the RSS slope against operations:

   | Run | How | Tells you |
   |---|---|---|
   | A baseline | unchanged | reference slope |
   | B fewer arenas | `MALLOC_ARENA_MAX=2` env var (or `GLIBC_TUNABLES=glibc.malloc.arena_max=2`) | if slope drops sharply, growth was per-thread arena retention |
   | C jemalloc | `LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2` (path varies; find it with `ldconfig -p \| grep jemalloc`) | if slope drops, glibc fragmentation was the cause |

   The value 2 in run B is a diagnostic setting to make the effect visible, not a tuned production value; choose the production value from measured runs.
2. Decide:

   | Result | Verdict |
   |---|---|
   | B or C slope interval contains 0, A slope grows | `allocator_retention` or `fragmentation` (B fixes it: retention; only C fixes it: fragmentation) |
   | all three slopes grow similarly | `native_leak`: live allocations grow; go to Phase 3 |

3. JVM note: `MALLOC_ARENA_MAX` is a common setting for JVMs with many threads; set it in the container environment, not in JVM flags.

### Output
Slopes per run and verdict.

### Quality Gate
- Each run's slope and interval are printed from `scipy.stats.linregress` output and recorded with the run letter.

---

## Phase 3: jemalloc Heap Profile for Native Leaks

### Entry Criteria
- Verdict `native_leak`, or a non-glibc allocator.

### Actions
1. Use a jemalloc built with profiling (`--enable-prof`). Check: `MALLOC_CONF=prof:true` with a non-profiling build prints a warning or ignores it; jemalloc's `jeprof` script must be installed (often in the `libjemalloc-dev` or jemalloc source package).
2. Run with periodic dumps:
   `LD_PRELOAD=<libjemalloc.so.2> MALLOC_CONF=prof:true,prof_prefix:/tmp/jeprof.out,lg_prof_interval:30 ./server`
   `lg_prof_interval:30` dumps a profile every 2^30 bytes (1 GiB) allocated; choose the exponent so you get several dumps during the load, per the jemalloc manual.
3. Diff an early and a late dump:
   `jeprof --text --base=/tmp/jeprof.out.<pid>.<early>.i<n>.heap ./server /tmp/jeprof.out.<pid>.<late>.i<m>.heap`
   The top entries are call sites whose live bytes grew between dumps.
4. Alternative with gperftools tcmalloc: `LD_PRELOAD=libtcmalloc.so HEAPPROFILE=/tmp/hprof ./server`, then `pprof --text --base=/tmp/hprof.0001.heap ./server /tmp/hprof.0005.heap` (the gperftools `pprof`, not Go's; check which one is on `PATH`).

### Output
`allocator_report`.

### Quality Gate
- For `native_leak`, the `jeprof --text --base` output is saved and its top call site is in the report with file:line.

---

## Worked Example

Illustrative only.

Input: JVM service, NMT total delta 3 MB while RSS grew 210 MB; 200 worker threads.

Phase 1: `pmap -x` shows 61 anonymous regions near 65,404 KB each. `malloc_info` sums: system current 3.9 GB across heaps, free in `rest` 2.6 GB. `malloc_trim(0)` dropped RSS from 4.1 GB to 1.8 GB.

Phase 2: run A slope 4.1 KB/op (interval 3.8 to 4.4); run B (`MALLOC_ARENA_MAX=2`) 0.02 KB/op (interval -0.05 to 0.09); run C (jemalloc) 0.04 KB/op (interval -0.03 to 0.11). Verdict: `allocator_retention`.

Phase 3: not needed.

---

## Exit Criteria

DONE when the verdict is backed by slopes from controlled allocator runs, and any `native_leak` has a jemalloc or tcmalloc profile diff naming the growing call site.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Process statically linked or not glibc | **Adjust**: skip to Phase 2 runs B and C if applicable, otherwise Phase 3. |
| Phase 2 | jemalloc preload crashes the process | **Adjust**: the program may pair `malloc` from one allocator with `free` from another (static linking); rebuild against jemalloc instead. |
| Phase 3 | No profile files appear | **Retry**: confirm the jemalloc build has profiling (`MALLOC_CONF=stats_print:true` output includes `config.prof: true`). |
| Phase 3 | Verdict is retention and someone proposes "fix by restarting nightly" | **Stop**: apply the measured allocator setting instead and prove it in the soak flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
