# Hotspot Bottleneck Classification

**One-line description:** Assigns each ranked hotspot to exactly one bottleneck class (algorithmic, allocation, I/O, contention, or other) using frame-name rules per stack and the measured growth exponent between two input sizes, and picks the dominant class that decides which fix flow runs next.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hotspot_list` (object[], required): From `perf-flame-graph-read`.
- `stack` (string, required): `python`, `node`, `go`, `rust`, `jvm`, `c` or `cpp`.
- `baseline_results` (object, required): From `perf-bench-baseline-normalize`; supplies medians at two or more sizes.

---

## Outputs

- `bottleneck_class` (string): The dominant class: `algorithmic`, `allocation`, `io`, `contention` or `other`.
- `classified_hotspots` (object[]): Each hotspot with its class, the rule that matched, the evidence (frame names, exponent), and its share. Written to `perf/classified_hotspots.json`.

---

## Phase 1: Measure the Growth Exponent

### Entry Criteria
- `baseline_results` has medians for at least two sizes of the same benchmark.

### Actions
1. For the two sizes `n1 < n2` with medians `t1`, `t2`, compute the empirical exponent `k = ln(t2 / t1) / ln(n2 / n1)`. Example: `n2/n1 = 4`, `t2/t1 = 15.5` gives `k = ln(15.5)/ln(4) = 1.98`.
2. Compare `k` with the complexity the code should have for this task, written down from the problem itself (for example "one pass over rows plus one lookup per row should be linear, k close to 1"). Record both the measured `k` and the expected exponent with its reasoning.
3. If three or more sizes exist, compute `k` for each adjacent pair and record all of them; a stable `k` is stronger evidence than one pair.
4. Constant overheads make `k` read low at small sizes. If the smallest size runs very fast relative to process startup, note that `k` is a lower bound.

### Output
Measured and expected exponents.

### Quality Gate
- The exponent is computed from two medians in `baseline_results`, with the formula and numbers shown.
- The expected exponent has a written reason, not a bare number.

---

## Phase 2: Classify Each Hotspot

### Entry Criteria
- Exponents recorded.

### Actions
1. Apply the first matching rule to each hotspot (check rules in order):

   | Order | Class | Matches when the hotspot or its leaf frames include |
   |---|---|---|
   | 1 | `contention` | `futex`, `pthread_mutex_lock`, `sync.(*Mutex).Lock`, `runtime.semacquire`, `runtime.lock`, `Unsafe.park`, `Object.wait`, `_thread.lock.acquire`, `Atomics.wait`, or py-spy `--gil` shows threads waiting |
   | 2 | `io` | `read`, `write`, `recv`, `send`, `epoll_wait`, `poll`, `select`, `syscall.Syscall*`, `internal/poll`, `socket`, database driver frames (`psycopg`, `pg`, `mysql`, `jdbc`), `(idle)` dominant in a Node CPU profile, the hyperfine baseline marked "off-CPU dominant" (wall time much larger than User + System), or a wall-clock profile hotspot absent from the on-CPU profile |
   | 3 | `allocation` | `malloc`, `free`, `operator new`, `PyObject_Malloc`, `list_resize`, `runtime.mallocgc`, `runtime.gcBgMarkWorker`, `runtime.scanobject`, `(garbage collector)`, JVM `GC Thread`/`G1`/`ZGC` threads, `memmove` from growing buffers, or B/op and allocs/op rising with size |
   | 4 | `algorithmic` | a project frame with high self time whose cost per call or call count grows with input size, measured `k` above the expected exponent, or leaf frames doing search or comparison: `list.__contains__`, `list.index`, `Array.prototype.includes`, `indexOf`, `ArrayList.indexOf`/`contains`, `strcmp`/`compare` called from a nested loop, repeated `sort` |
   | 5 | `other` | none of the above (interpreter overhead, serialization, logging, framework) |

2. Write the matched rule number and the exact frame names that matched into the hotspot's evidence.
3. A hotspot can show allocation frames caused by an algorithmic problem (for example quadratic string building). If rule 4 also matches strongly (k above expected), record both in evidence and keep the class from the first matching rule, adding `secondary_class`.

### Output
Classified hotspots.

### Quality Gate
- Every hotspot has exactly one class and the rule number that produced it.
- Every evidence entry quotes frame names present in `hotspot_list`.

---

## Phase 3: Pick the Dominant Class

### Entry Criteria
- All hotspots classified.

### Actions
1. Sum `self_pct` per class over `confirmed` hotspots first; if none are confirmed, over all hotspots.
2. The class with the largest sum is `bottleneck_class`. On a tie, prefer `algorithmic`, then `io`, then `allocation`, because complexity fixes change scaling and the others change constants.
3. If `bottleneck_class` is `contention`, stop the CPU fix path and report it: lock contention and races need a concurrency procedure, not this chain.
4. If it is `other`, record the top frames and report that none of the fix flows in this chain targets them.
5. Write `perf/classified_hotspots.json` and validate it with `python -m json.tool`.

### Output
`bottleneck_class`, `classified_hotspots`.

### Quality Gate
- `bottleneck_class` equals the class with the largest summed share, with the sums shown.
- `perf/classified_hotspots.json` parses with exit code 0.

---

## Worked Example

Illustrative. Python, sizes 30,000 and 120,000.

- Phase 1: `t1 = 2.902 s`, `t2 = 45.011 s`, `k = ln(15.51)/ln(4) = 1.98`. Expected: one pass plus one lookup per row, linear, k near 1.
- Phase 2: `find_customer (app/report.py:92)` leaf `list.__contains__` absent but the loop `for c in self.customers` scans a list per row: rule 4, `algorithmic`. `csv.reader.__next__` 2.4%: rule 5, `other`.
- Phase 3: sums `algorithmic` 86.3, `other` 2.4. `bottleneck_class = "algorithmic"`.

---

## Exit Criteria

DONE when every hotspot has one class with the matching rule and quoted evidence, the growth exponent is computed from measured medians, and `bottleneck_class` is the largest summed class.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Only one size in `baseline_results` | **Return**: to the harness flow to add a second size from `workload_spec`. |
| Phase 2 | A frame matches no rule but is clearly the cost | **Adjust**: class `other`, describe it; do not stretch a rule. |
| Phase 3 | `contention` dominant | **Stop**: report it; hand off to a concurrency or race-fixing procedure. |
| Phase 3 | `other` dominant | **Return**: the fix flows in this chain do not apply; report the top frames. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
