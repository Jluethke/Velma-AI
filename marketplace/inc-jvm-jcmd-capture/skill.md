# Incident JVM Thread Dumps and JFR With jcmd

**One-line description:** Uses `jcmd` against a live JVM to take spaced thread dumps, read GC and heap state, and record a short Java Flight Recorder capture, then classifies request threads as blocked on a monitor, parked on a pool, waiting on I/O or burning CPU, and detects deadlocks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `debug_access` (object, required): From `inc-k8s-safe-debug-access`; shell location, pid_of_app, and the debug image (a JDK with the same major version as the app).
- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; rows needing JVM evidence.

---

## Outputs

- `jvm_runtime_evidence` (object): {java_version, thread_dump_files, request_thread_states, deadlock_found, pool_wait_frames, gc_state, jfr_file, hot_methods, hypotheses_affected}.

---

## Phase 1: Attach

### Entry Criteria
- A shell sees the JVM process and has a JDK (`jcmd -h` works).

### Actions
1. List JVMs: `jcmd -l`. If the list is empty from a debug container, attach by PID anyway: `jcmd <pid> VM.version`. HotSpot (JDK 10 and later) can attach across container namespaces when the debug container runs as the same user ID as the JVM. Check the JVM's user with `ps -o user,pid,cmd -p <pid>` and run the debug container as that UID if needed.
2. Record `jcmd <pid> VM.version` and `jcmd <pid> VM.flags` (heap size flags such as `-XX:MaxHeapSize`, GC type).
3. Use a JDK in the debug container with the same major version as the target; a mismatched `jcmd` can fail to attach or print misleading output.

### Output
Attached JVM with version and flags.

### Quality Gate
- `VM.version` output is pasted.

---

## Phase 2: Spaced Thread Dumps

### Entry Criteria
- Attach works.

### Actions
1. Take three dumps a few seconds apart:
   ```
   for i in 1 2 3; do jcmd <pid> Thread.print -l > threads-$i.txt; sleep 5; done
   ```
   `-l` adds owned `java.util.concurrent` locks. Each dump is a short safepoint pause; do not loop it continuously.
2. On JDK 21 and later with virtual threads, `Thread.print` omits virtual threads. Use `jcmd <pid> Thread.dump_to_file -format=json threads-virtual.json` as well.
3. Check the end of each dump for `Found one Java-level deadlock:`. If present, record both threads and the locks.
4. Classify request threads (Tomcat `http-nio-<port>-exec-*`, Jetty `qtp*`, Netty `*EventLoop*`, or the app's pool names):

| Thread state and frames | Classification |
|---|---|
| `BLOCKED (on object monitor)` with `- waiting to lock <0x...>` | monitor contention; find the thread that holds `<0x...>` (`- locked <0x...>`) |
| `TIMED_WAITING (parking)` in `com.zaxxer.hikari.pool.HikariPool.getConnection` or `ConcurrentBag.borrow` | waiting for a database connection: pool exhausted |
| `RUNNABLE` in `java.net.SocketInputStream.read`, `sun.nio.ch.SocketDispatcher.read` or `NioSocketImpl.read` | waiting on network I/O (shows as RUNNABLE) |
| `RUNNABLE` in app frames that change across the three dumps | CPU work |
| `WAITING (parking)` in a thread pool's `take` or `poll` | idle worker |

5. Count each class per dump; a class that holds the same threads in all three dumps is stuck.

### Output
Dump files and class counts.

### Quality Gate
- Three dump files exist and the deadlock check result (found or not) is recorded.
- Every request thread falls into one class.

---

## Phase 3: GC State and Flight Recording

### Entry Criteria
- Thread classification is done.

### Actions
1. Heap and GC state: `jcmd <pid> GC.heap_info` and `jstat -gcutil <pid> <interval_ms> <count>` with interval and count chosen by the ops lead. In `jstat -gcutil`, `O` is old generation percent used, `FGC` and `FGCT` are full GC count and time; rising FGC with O staying high means the heap cannot be reclaimed.
2. Start a bounded flight recording (JFR is designed for production use; the `profile` settings add more overhead than `default`):
   `jcmd <pid> JFR.start name=inc settings=default duration=<seconds>s filename=/tmp/inc.jfr`
   Check status with `jcmd <pid> JFR.check`. After it finishes, copy the file out.
3. Read it: `jfr summary inc.jfr`; on JDK 21 and later `jfr view hot-methods inc.jfr` and `jfr view gc-pauses inc.jfr`; on older JDKs `jfr print --events jdk.ExecutionSample inc.jfr | head -200` or open in JDK Mission Control.
4. Do NOT run `GC.heap_dump` on a serving instance without IC approval: it pauses the JVM for the whole dump and writes a file as large as the live heap.
5. Map evidence to hypothesis rows with quoted frames or numbers.

### Output
`jvm_runtime_evidence`.

### Quality Gate
- `GC.heap_info` output is pasted.
- The JFR file exists and `jfr summary` output is attached, or the reason it was skipped is recorded.

---

## Worked Example

Illustrative only. Spring Boot on JDK 21, Tomcat, HikariCP pool size 10.

- Phase 1: `jcmd 1 VM.version` prints `OpenJDK 64-Bit Server VM version 21.0.4+7`. Debug container runs as UID 1000 like the app.
- Phase 2: 200 `http-nio-8080-exec-*` threads; 190 are `TIMED_WAITING (parking)` at `com.zaxxer.hikari.pool.HikariPool.getConnection`, in all three dumps. 10 are `RUNNABLE` in `NioSocketImpl.read` under `org.postgresql.core.v3.QueryExecutorImpl.execute`. No deadlock.
- Phase 3: `GC.heap_info` shows normal occupancy. JFR `default` for 60 s; `jfr view hot-methods` is dominated by idle parking. Reading: all 10 pool connections are busy in slow PostgreSQL queries; the rest wait for the pool. Hypothesis "database lock or slow query" supported: run `inc-pg-blocking-queries`.

---

## Exit Criteria

DONE when three thread dumps are classified, deadlock status is known, GC state is captured, a bounded JFR (or a skip reason) is recorded, and each JVM hypothesis row is decided.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Unable to open socket file" or AttachNotSupportedException | **Adjust**: run as the JVM's UID; if still failing, use `kubectl exec` into the app container when it has a JDK. |
| Phase 1 | App image has only a JRE and no debug container is allowed | **Adjust**: send `kill -3 <pid>` (SIGQUIT), which makes HotSpot print a thread dump to stdout without exiting; read it with `kubectl logs`. |
| Phase 3 | JFR.start fails with "disk full" | **Adjust**: point `filename=` at a writable volume with space, or shorten the duration. |
| Phase 3 | Pause from a heap dump would hurt customers | **Stop**: skip the heap dump; use `GC.class_histogram` only if approved, since it also triggers a full GC by default. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
