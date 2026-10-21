# Confirm Growth With RSS and Heap Sampling

**One-line description:** Samples process RSS and the runtime's own heap metric at a fixed interval under the fixed load recipe, fits the post-GC floor against completed operations, and returns a growth verdict with a slope in bytes per operation and its confidence interval.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Supplies stack, PID or start command, environment and metric.
- `load_recipe` (object, required): From `leak-intake-load-recipe`. Fixed load command, warmup count and op counter source.
- `sample_interval_s` (number, optional): Seconds between samples. When absent, use the Prometheus default `scrape_interval` of 1m if the team reads memory from Prometheus, otherwise ask the user. Do not pick a value yourself.

---

## Outputs

- `growth_series` (string): Path to a CSV with columns `ts,ops,rss_kb,heap_bytes,gc_marker`, one row per sample.
- `growth_verdict` (string): One of `growing`, `flat`, `bounded_plateau`, `inconclusive`.
- `bytes_per_op` (object): Slope of the post-GC floor in bytes per operation, its standard error, the 95 percent confidence interval, and the number of floor points used.

---

## Phase 1: Set Up Samplers

### Entry Criteria
- The target process is running, or can be started from `leak_brief`.
- `load_recipe` smoke run has passed.

### Actions
1. Get the PID. Linux: `pgrep -f "<unique part of command>"`. Windows: `Get-Process <name> | Select-Object Id`. For gunicorn, uWSGI, Node cluster or PM2, sample the worker PID, not the master, and use a single worker for the hunt.
2. Pick the RSS sampler for the platform. Use one row; do not mix sources in one series.

   | Platform | Command for one sample (prints KB unless noted) |
   |---|---|
   | Linux process | `awk '/^VmRSS/{print $2}' /proc/<pid>/status` |
   | Linux, shared pages matter (forked workers) | `smem -c "pid pss" -P <name>` or `grep -E '^Pss:' /proc/<pid>/smaps_rollup` |
   | Container, cgroup v2 | `cat /sys/fs/cgroup/memory.current` (bytes) and `grep -E '^(anon\|file) ' /sys/fs/cgroup/memory.stat` |
   | macOS | `ps -o rss= -p <pid>` |
   | Windows | `(Get-Process -Id <pid>).PrivateMemorySize64` (bytes) |

3. Pick the runtime heap metric for `stack`. This is what lets you see the post-GC floor.

   | Stack | Heap metric | How to read it |
   |---|---|---|
   | python | `tracemalloc.get_traced_memory()[0]` and `gc.get_count()` | expose through a debug endpoint or log line; tracemalloc must be started first |
   | node | `process.memoryUsage().heapUsed` plus `external` and `arrayBuffers` | log every interval from inside the process |
   | browser | `performance.memory.usedJSHeapSize` (Chrome only, non-standard) and DOM node count from DevTools Performance monitor | read from the Playwright or Puppeteer script |
   | jvm | `jstat -gc <pid> <ms>` columns `OU` (old used, KB) and `FGC` (full GC count) | a sample right after `FGC` increments is a floor point |
   | go | `runtime.ReadMemStats` fields `HeapInuse`, `HeapAlloc`, `NumGC`, or `GODEBUG=gctrace=1` lines | gctrace prints live heap after each GC |
   | cpp | none from the runtime; use RSS, optionally `mallinfo2()` `uordblks` on glibc 2.33 and later | log it from a debug hook |

4. Write a sampler loop that appends one CSV row per interval. Linux example:
   `while sleep <sample_interval_s>; do echo "$(date +%s),$(curl -s localhost:9100/ops),$(awk '/^VmRSS/{print $2}' /proc/<pid>/status)" >> rss.csv; done`
   Replace the ops source with the one in `load_recipe.op_counter_source`.

### Output
Running samplers writing to one CSV.

### Quality Gate
- `head -3 rss.csv` shows three rows with a timestamp, an op count and a nonzero RSS.
- The heap metric column is filled for every stack except `cpp`.

---

## Phase 2: Run the Fixed Load

### Entry Criteria
- Samplers are running.

### Actions
1. Start the load with `load_recipe.command`. Do not change rate, payload or duration between runs.
2. Leave samplers running for the whole load and for a quiet tail after `load_recipe.stop_command`, so you can see whether memory returns once work stops.
3. Mark GC events in `gc_marker`:
   - jvm: a row where `FGC` increased.
   - go: a row where `NumGC` increased.
   - node: run with `--expose-gc` and call `global.gc()` just before each sample during the hunt only; mark every row.
   - python: call `gc.collect()` before each heap sample from the debug endpoint; mark every row.
4. Do not restart the process mid-run. Do not change heap limits (`-Xmx`, `--max-old-space-size`, `GOMEMLIMIT`) during the run; they change GC behavior and the floor.

### Output
Complete `growth_series` CSV.

### Quality Gate
- The CSV covers from before warmup to after the quiet tail (first `ops` value is 0 or the pre-load value, last rows show `ops` no longer increasing).
- The number of rows with `gc_marker` set is printed and is at least 3; otherwise the fit in Phase 3 is not possible.

---

## Phase 3: Fit the Floor and Decide

### Entry Criteria
- `growth_series` exists.

### Actions
1. Drop rows with `ops` below `load_recipe.warmup_ops`. If warmup is "provisional", set it now to the op count where the heap metric stopped its initial steep rise, and write that number back into the recipe notes.
2. Keep only the floor points: rows with `gc_marker` set. For `cpp`, take the minimum RSS in each window of equal op count instead.
3. Fit the floor against `ops` with ordinary least squares and get the standard error:
   `python -c "import csv,scipy.stats as s; r=[x for x in csv.DictReader(open('rss.csv')) if x['gc_marker']]; f=s.linregress([float(x['ops']) for x in r],[float(x['heap_bytes'] or 0) or float(x['rss_kb'])*1024 for x in r]); print(f.slope, f.stderr, f.pvalue, len(r))"`
   Compute the 95 percent interval as `slope +/- t(0.975, n-2) * stderr` using `scipy.stats.t.ppf(0.975, n-2)`.
4. Decide with this table:

   | Condition | `growth_verdict` |
   |---|---|
   | interval lower bound above 0 | `growing` |
   | interval contains 0 | `flat` |
   | floor rises, then the last third of points has an interval containing 0 | `bounded_plateau` (a cache filling to a cap; record the plateau level) |
   | fewer than 3 floor points, or the load did not finish | `inconclusive` |

5. Fill `bytes_per_op` with slope, stderr, interval and n. Report it per 1,000 or per 1,000,000 operations if that makes the number readable, and say which.

### Output
`growth_series`, `growth_verdict`, `bytes_per_op`.

### Quality Gate
- The `linregress` command ran and its printed slope and stderr are copied into `bytes_per_op` unchanged.
- The verdict row in the table is cited by its condition.

---

## Worked Example

Illustrative only.

Input: `leak_brief.stack` = `jvm`, PID 4127, `sample_interval_s` = 15.

Phase 1: `jstat -gc 4127 15000` prints columns `S0C S1C S0U S1U EC EU OC OU MC MU ... YGC YGCT FGC FGCT`; RSS from `/proc/4127/status`.

Phase 2: `k6 run quote.js` at 50/s for 20 minutes. 81 rows; `FGC` increased 9 times. Output: `grep -c ',1$' rss.csv` prints `9`.

Phase 3: warmup set to 6,000 ops (old gen stopped jumping there). `linregress` on 8 floor points prints `412.7 31.2 3.1e-06 8`. t(0.975, 6) = 2.447, interval 336.4 to 489.0 bytes/op. Verdict `growing`: roughly 20 MB per 50,000 requests.

---

## Exit Criteria

DONE when `growth_series` exists, the floor fit ran, and `growth_verdict` plus `bytes_per_op` are backed by printed numbers. A `flat` verdict ends the hunt for this load: report it and do not proceed to tool flows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | PID belongs to a master process that forks workers | **Adjust**: sample the worker; set worker count to 1 for the hunt. |
| Phase 1 | No way to read the heap metric without a code change | **Adjust**: add a debug-only log line on a branch; do not ship it. |
| Phase 2 | Process OOM-killed before the run ends | **Adjust**: keep the rows you have; reduce the run length in the recipe, not the rate, and rerun. |
| Phase 3 | Verdict `inconclusive` | **Retry**: rerun with a longer run or forced GC markers; never call it a leak without a fit. |
| Phase 3 | Verdict `flat` but production still grows | **Return**: to `leak-intake-load-recipe`; the recipe does not exercise the leaking path. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
