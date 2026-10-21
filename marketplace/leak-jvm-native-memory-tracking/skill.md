# JVM Native Memory Tracking Diff

**One-line description:** Enables HotSpot Native Memory Tracking, takes a `VM.native_memory baseline` after warmup and a `summary.diff` after a fixed load, and reads the per-category deltas (Class, Thread, Code, GC, Internal, Other, Symbol, Arena) to locate JVM growth outside the Java heap.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. JVM start command and environment.
- `load_recipe` (object, required): From `leak-intake-load-recipe`. Fixed load and warmup count.
- `split_evidence` (object, required): From `leak-managed-vs-native-split`. Shows RSS growing faster than the Java heap floor.

---

## Outputs

- `jvm_native_report` (object[]): Each NMT category with committed KB at baseline and after load, the delta, the delta per operation, and the follow-up command result for growing categories (thread dump counts, classloader stats, direct buffer counts).

---

## Phase 1: Enable NMT and Baseline

### Entry Criteria
- HotSpot-based JDK 8 or later (OpenJDK, Temurin, Corretto, Zulu). NMT is a HotSpot feature; OpenJ9 does not have it.
- A test instance can be restarted with new JVM flags.

### Actions
1. Add `-XX:NativeMemoryTracking=summary` to the JVM options and restart. NMT cannot be enabled on a running JVM. Use `detail` instead of `summary` only if you need allocation call sites; it costs more overhead (the JDK docs describe a performance cost for both modes).
2. Run `load_recipe` to `warmup_ops`.
3. Take the baseline: `jcmd <pid> VM.native_memory baseline`. It prints `Baseline taken` (wording may vary by version).
4. Save a full summary too: `jcmd <pid> VM.native_memory summary > nmt_base.txt`.

### Output
NMT baseline recorded.

### Quality Gate
- `nmt_base.txt` contains `Native Memory Tracking:` and a `Total: reserved=... committed=...` line.

---

## Phase 2: Diff After Load

### Entry Criteria
- Baseline taken.

### Actions
1. Run N operations with `load_recipe`.
2. `jcmd <pid> VM.native_memory summary.diff > nmt_diff.txt`. Each category shows `committed=<now>KB <sign><delta>KB`.
3. Read only `committed`, not `reserved`. Reserved is address space; committed is memory that can count toward RSS.
4. Rank categories by committed delta. Compute delta per operation by dividing by N.
5. Remember what NMT does not see: memory allocated by native libraries through their own `malloc` (JNI code, some compression or crypto libraries, glibc arenas used by those threads) is outside NMT. If RSS growth is much larger than the NMT total delta, the remainder is untracked native memory; continue with `leak-native-malloc-fragmentation`.

### Output
Ranked category deltas.

### Quality Gate
- `nmt_diff.txt` is saved, and the `Total` committed delta and the RSS delta over the same window are both recorded side by side.

---

## Phase 3: Drill Into Growing Categories

### Entry Criteria
- At least one category has a positive committed delta.

### Actions
1. Use the follow-up for each growing category:

   | Category | Follow-up command | Leak pattern |
   |---|---|---|
   | `Thread` | `jcmd <pid> Thread.print > threads.txt`; count with `grep -c '^"' threads.txt` at two checkpoints | thread count grows: executors created per request and never shut down; group thread names to find the pool |
   | `Class` (metaspace) | `jcmd <pid> VM.classloader_stats` and `jcmd <pid> GC.class_histogram \| grep -i classloader` | loader count grows: redeploy or dynamic proxies or scripting engines creating classes per call |
   | `Other` | direct buffers: read `java.nio:type=BufferPool,name=direct` MBean `MemoryUsed` and `Count` via JConsole or JMX | `ByteBuffer.allocateDirect` per request kept referenced, or Netty pooled buffers not released (enable Netty's `-Dio.netty.leakDetection.level=paranoid` on a test instance) |
   | `Code` | `jcmd <pid> Compiler.codecache` | code cache grows to its limit then stops; usually not a leak |
   | `Symbol` | `jcmd <pid> VM.stringtable` and `VM.symboltable` | `String.intern()` on unbounded input |
   | `Internal`, `Arena`, `GC` | rerun with `-XX:NativeMemoryTracking=detail` and `jcmd <pid> VM.native_memory detail.diff` | read the call sites listed under the category |

2. Take each follow-up at two checkpoints N operations apart and record both values.
3. Direct memory has its own cap: `-XX:MaxDirectMemorySize`. Raising it is not a fix.

### Output
`jvm_native_report`.

### Quality Gate
- Every growing category has a follow-up command output at two checkpoints with the two numbers recorded.

---

## Worked Example

Illustrative only.

Input: RSS grows 1.4 KB/op; Java heap floor flat.

Phase 1: `-XX:NativeMemoryTracking=summary`; baseline after 10,000 requests.

Phase 2: after 50,000 more requests, `nmt_diff.txt`:
```
-  Thread (reserved=412311KB +306201KB, committed=31804KB +23620KB)
            (thread #400 +297)
-  Class (reserved=1056123KB +12KB, committed=10811KB +12KB)
```
Total committed delta +24.1 MB; RSS delta +27 MB. Thread dominates.

Phase 3: `grep -c '^"' threads.txt` gives 103 then 400. Thread names `pool-NNN-thread-1` with increasing NNN: a new `Executors.newSingleThreadExecutor()` per request, never `shutdown()`.

---

## Exit Criteria

DONE when NMT category deltas are recorded against the RSS delta and each growing category has a two-checkpoint follow-up showing the pattern.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Native memory tracking is not enabled` | **Retry**: restart with the flag; it cannot be turned on at runtime. |
| Phase 1 | JVM is OpenJ9 | **Adjust**: use OpenJ9's `-Xdump` and `jcmd`-equivalent tools per its docs; NMT is unavailable. |
| Phase 2 | NMT total delta far below RSS delta | **Return**: to `leak-native-malloc-fragmentation` for untracked native memory. |
| Phase 3 | `VM.classloader_stats` not recognized | **Adjust**: run `jcmd <pid> help` to list the commands your JDK has and use the classloader one listed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
