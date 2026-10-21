# JVM Allocation Profile with async-profiler, JFR and JMH -prof gc

**One-line description:** Measures normalized allocation per operation with JMH `-prof gc`, finds allocation sites with async-profiler `-e alloc` or JFR `ObjectAllocationSample` events, and records GC behavior from unified GC logs, so JVM allocation fixes target measured call sites.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `classified_hotspots` (object[], required): From `perf-hotspot-classify`.
- `workload_spec` (object, required): Start command, load and duration.
- `repo_path` (string, required): Project root.

---

## Outputs

- `jvm_alloc_profile` (object): `gc.alloc.rate.norm` (B/op) per size if JMH exists, path to the allocation flame graph or JFR file, top allocated types with their allocating frames, GC pause count and total pause time from the GC log, and the commands used.

---

## Phase 1: Per-Operation Allocation

### Entry Criteria
- At least one hotspot has class `allocation`.

### Actions
1. If a JMH benchmark exists (from `perf-jvm-jmh-harness`), run it with the GC profiler: `java -jar benchmarks/target/benchmarks.jar BuildReportBench -prof gc`. Record `·gc.alloc.rate.norm` (bytes allocated per benchmark operation) and `·gc.count`.
2. If no JMH benchmark exists, start the application with a GC log: add `-Xlog:gc*:file=perf/profiles/gc.log:time,uptime,level,tags` (unified logging, JDK 9+). Run the load from `workload_spec`.
3. From `gc.log`, record the number of pauses and the sum of pause times. Count lines with `Pause` (for example `grep -c "Pause" perf/profiles/gc.log`) and read the durations at the end of those lines.

### Output
B/op or GC pause summary.

### Quality Gate
- Either `gc.alloc.rate.norm` per size or a GC pause count and total from `gc.log` is recorded.

---

## Phase 2: Find Allocation Sites

### Entry Criteria
- Per-op or GC numbers recorded.

### Actions
1. Choose the tool:

   | Situation | Tool and command |
   |---|---|
   | Linux or macOS, async-profiler available | `asprof -e alloc -d <seconds> -f perf/profiles/jvm_alloc.html <pid>` |
   | Any OS, JDK 11+ | `jcmd <pid> JFR.start name=alloc settings=profile duration=<seconds>s filename=perf/profiles/alloc.jfr` |

2. For JFR, read sampled allocation events (JDK 16+ event name): `jfr print --events jdk.ObjectAllocationSample perf/profiles/alloc.jfr > perf/profiles/alloc_events.txt`. On JDK 11 to 15 the events are `jdk.ObjectAllocationInNewTLAB` and `jdk.ObjectAllocationOutsideTLAB`. Run `jfr summary perf/profiles/alloc.jfr` first to see which event types the file contains. JDK Mission Control's "Memory" page shows the same data graphically.
3. In the async-profiler allocation flame graph, the top frame of each tower is the allocated class (for example `byte[]`, `java.lang.String`, `java.util.HashMap$Node`), and the frames below are the allocating call stack. Width is the sampled bytes.
4. For the top 5 allocated types, record the type, the share, and the first project frame below it.

### Output
Allocation sites with types and project frames.

### Quality Gate
- Top 5 types are recorded with shares and project frames copied from the flame graph tooltip or JFR stack traces.

---

## Phase 3: Identify Allocation Causes

### Entry Criteria
- Sites recorded.

### Actions
1. Match each site to a cause:

   | Allocated type and frame | Cause |
   |---|---|
   | `java.lang.Integer`, `Long`, `Double` under collection or stream code | autoboxing of primitives |
   | `java.util.HashMap$Node`, `Object[]` from `ArrayList.grow` | collections resized while filling |
   | `byte[]`, `char[]`, `String` under `StringBuilder` or `+` in a loop | string building or repeated `substring`/`split` |
   | lambda or `$$Lambda` classes, `Spliterator`, `ReferencePipeline` | stream pipelines created per element in a hot loop |
   | iterator objects (`ArrayList$Itr`) | iteration that escape analysis did not eliminate |
   | DTO or record types per row | per-row object creation that might be reused or avoided |

2. Write the cause next to each site and fill `jvm_alloc_profile`.

### Output
`jvm_alloc_profile`.

### Quality Gate
- Each site has a cause from the table or "unmatched" with the type and frame.

---

## Worked Example

Illustrative. JDK 21, JMH available.

- Phase 1: `BuildReportBench.buildReport:·gc.alloc.rate.norm  30000  avgt  15  1210441922 ± 2102 B/op`.
- Phase 2: `asprof -e alloc -d 60 -f perf/profiles/jvm_alloc.html 41822`. Top types: `java.lang.Long` 31% under `ReportService.totals (ReportService.java:118)`; `java.util.HashMap$Node` 22% under `ReportService.index (ReportService.java:77)`; `Object[]` from `ArrayList.grow` 14% under `ReportService.collect (ReportService.java:95)`.
- Phase 3: autoboxing in a `Map<Long, Long>` accumulator; HashMap resized repeatedly; ArrayList grown from default capacity.

---

## Exit Criteria

DONE when per-op allocation or GC pause totals are recorded, the top allocated types are attributed to project frames, and each has a cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `-prof gc` shows `≈ 0` B/op | **Return**: allocation is not the bottleneck; go back to `perf-hotspot-classify`. |
| Phase 2 | `jfr` tool not found | **Adjust**: use `$JAVA_HOME/bin/jfr`; it ships with the JDK since 14 (record the path). |
| Phase 2 | Event type missing from `jfr summary` | **Adjust**: use the TLAB event names for older JDKs or the async-profiler path. |
| Phase 3 | Top type is from a framework (Jackson, Hibernate) | **Adjust**: record the project call site that drives it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
