# JVM CPU Flame Graph with async-profiler

**One-line description:** Profiles a running JVM (or a JMH benchmark) with async-profiler in CPU or wall-clock mode, avoids safepoint bias with `DebugNonSafepoints`, writes an interactive HTML flame graph, and reads the hot Java frames, JIT, GC and native frames.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workload_spec` (object, required): Start command, inputs, load and duration.
- `repo_path` (string, required): Project root.

---

## Outputs

- `jvm_cpu_profile` (object): Path to `perf/profiles/jvm_cpu.html` (and `.collapsed` if written), the event used (`cpu`, `itimer` or `wall`), the command, async-profiler and JDK versions, and the top frames with self and total percentages.

---

## Phase 1: Install and Prepare the JVM

### Entry Criteria
- Linux or macOS (async-profiler does not support Windows). JDK 8 or newer (check the async-profiler README for the supported range of your release).

### Actions
1. Download the release archive for your OS and CPU from the async-profiler GitHub releases page and extract it to `perf/tools/async-profiler/`. Record the version.
2. Find the launcher: version 3 and later ship `bin/asprof`; older versions ship `profiler.sh`. Run `perf/tools/async-profiler/bin/asprof --help` (or `profiler.sh --help`) and use only flags it lists.
3. Start the application with these JVM flags so frames between safepoints are attributed accurately: `-XX:+UnlockDiagnosticVMOptions -XX:+DebugNonSafepoints`. Without them, profiles lean toward safepoint locations (safepoint bias), a known problem of JVMTI-based profilers.
4. On Linux check `cat /proc/sys/kernel/perf_event_paranoid` and `cat /proc/sys/kernel/kptr_restrict`. The async-profiler README documents the values needed for the `cpu` event with kernel stacks. If you cannot change them, use `-e itimer`, which needs no perf_events access.

### Output
Profiler installed; JVM running with the flags.

### Quality Gate
- `asprof --version` (or `profiler.sh --version`) prints a version.
- `jcmd <pid> VM.flags | grep DebugNonSafepoints` shows the flag enabled.

---

## Phase 2: Record

### Entry Criteria
- JVM running and under the load from `workload_spec`.

### Actions
1. Choose the event:

   | Situation | Event |
   |---|---|
   | CPU-bound work, perf_events allowed | `-e cpu` |
   | CPU-bound work, perf_events blocked (container, restricted host) | `-e itimer` |
   | Requests slow but CPU low (waiting on I/O, locks, sleeps) | `-e wall` with `-t` (split by thread) |
   | Allocation hotspots | use `perf-jvm-alloc-profile` instead |

2. Attach to the running JVM for the configured duration:

```bash
perf/tools/async-profiler/bin/asprof -e cpu -d <seconds> -f perf/profiles/jvm_cpu.html <pid>
```

   Find the PID with `jps -l` or `jcmd`. The `.html` extension selects the interactive flame graph format; `.collapsed` writes folded stacks; `.jfr` writes JFR.
3. For a JMH benchmark instead of a live app, use the JMH integration: `java -jar benchmarks.jar BuildReportBench -prof async:libPath=<path to libasyncProfiler.so>;output=flamegraph;dir=perf/profiles` (check `-prof async:help` for the option names on your JMH version).
4. Do not profile during JVM startup unless startup is the metric; warm the application first (run the load for a while before attaching).

### Output
HTML flame graph.

### Quality Gate
- `perf/profiles/jvm_cpu.html` exists and is non-empty.
- The command printed no `Failed to open perf_events` error, or the event was switched to `itimer` and recorded.

---

## Phase 3: Read the Flame Graph

### Entry Criteria
- HTML exists.

### Actions
1. Open the HTML in a browser. Width is share of samples; the root is at the bottom and callees stack upward (the HTML has a toggle to invert). Colors separate frame types (Java, inlined, native, C++ VM code, kernel); read the legend in the async-profiler README for your version rather than guessing.
2. Use the search box (top right) with your package name, for example `com.example.report`. The percentage matched appears at the bottom.
3. Find wide frames in your package with little above them (self time). Record class, method and percentages from the tooltip.
4. Note non-application towers:

   | Tower root or frame | Meaning |
   |---|---|
   | `GC Thread`, `G1 ...`, `ZGC ...` threads | garbage collection CPU: allocation pressure |
   | `C2 CompilerThread`, `C1 CompilerThread` | JIT compilation: the app was not warm |
   | `Unsafe.park`, `Object.wait` (wall mode) | threads waiting |
   | `java.util.HashMap.get` under a loop | data structure or algorithm cost |

5. Fill `jvm_cpu_profile`.

### Output
`jvm_cpu_profile`.

### Quality Gate
- Top frames are recorded with percentages copied from the tooltip.
- The share of GC and compiler threads is recorded or marked "absent".

---

## Worked Example

Illustrative. Spring Boot service on JDK 21, async-profiler 3.0, `-e cpu -d 60` under load.

- Phase 1: `jcmd 41822 VM.flags` shows `-XX:+DebugNonSafepoints`.
- Phase 2: `asprof -e cpu -d 60 -f perf/profiles/jvm_cpu.html 41822` prints `Profiling for 60 seconds` then `Done`.
- Phase 3: search `com.example.report` matched 88.4%. `ReportService.findCustomer` self 69.0% inside `ArrayList.indexOf` frames; `G1 Conc#0` threads 7.2%; compiler threads 0.6%.

---

## Exit Criteria

DONE when a warm JVM was profiled with the event chosen from the table, an HTML flame graph exists, and top application frames plus GC and JIT shares are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Windows host | **Stop**: async-profiler does not run on Windows; use JFR (`jcmd <pid> JFR.start`) and JDK Mission Control. |
| Phase 1 | Cannot add JVM flags in production | **Adjust**: profile without `DebugNonSafepoints` and record the accuracy limitation. |
| Phase 2 | `Failed to open perf_events` | **Retry**: with `-e itimer`. |
| Phase 2 | `Could not attach` | **Adjust**: run as the same user as the JVM; in containers start with `-agentpath:<lib>=start,event=cpu,file=<out>.html`. |
| Phase 3 | Flame graph dominated by compiler threads | **Retry**: warm the application longer before attaching. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
