# Java Thread Dump Deadlock Analysis

**One-line description:** Takes repeated thread dumps of a hung JVM with `jcmd Thread.print -l` or `jstack -l`, reads the JVM's own `Found one Java-level deadlock` section, and for cases the JVM does not detect (ReentrantLock without owner, thread pool starvation, virtual thread pinning) builds the wait-for graph by hand.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the project root.
- `stress_command` (string, required): From `race-stress-harness`; starts the JVM that hangs.
- `failure_class` (string, required): From `race-symptom-triage`; this flow applies to `deadlock`, `livelock` and `goroutine-or-thread-leak`.

---

## Outputs

- `java_thread_dump_report` (object): `dump_files`, `jvm_detected_deadlock` (the verbatim `Found one Java-level deadlock` block or `none`), `wait_for_graph` (thread, holds, waits for), `classification` (`monitor-deadlock`, `juc-lock-deadlock`, `pool-starvation`, `virtual-thread-pinning`, `livelock`, `thread-leak`), `in_repo_frames`.

---

## Phase 1: Capture Dumps

### Entry Criteria
- `failure_class` is a hang class.
- The JDK tools are on PATH (`jcmd -h` prints usage). A JRE without `jcmd` cannot take dumps; install the matching JDK.

### Actions
1. Start the hang with `stress_command`. Find the JVM pid: `jcmd -l` (lists Java processes) or `jps -l`.
2. Take a dump with lock information. Use one of these real commands:
   - `jcmd <pid> Thread.print -l > /tmp/dump1.txt`
   - `jstack -l <pid> > /tmp/dump1.txt`
   - `kill -3 <pid>` (Linux/macOS): the dump goes to the JVM's stdout, not your terminal. Find it in the application log.
3. Wait longer than the slowest normal duration of the operation, then take a second dump `/tmp/dump2.txt`. Two dumps are the minimum to tell a stuck thread (same frame in both) from a slow one.
4. Virtual threads (Java 21 and later) are not all listed by `Thread.print`. Take `jcmd <pid> Thread.dump_to_file -format=json /tmp/vthreads.json` as well when the code uses `Executors.newVirtualThreadPerTaskExecutor()` or `Thread.ofVirtual()`.
5. In a test, you can get the same detection programmatically with `ManagementFactory.getThreadMXBean().findDeadlockedThreads()`, which returns thread ids in a deadlock on monitors or ownable synchronizers, or `null`.

### Output
At least two dump files with timestamps.

### Quality Gate
- Each dump file contains `Full thread dump` (`grep -c "Full thread dump" /tmp/dump1.txt` prints 1).
- The `-l` option or `jcmd Thread.print -l` was used, so `Locked ownable synchronizers` sections are present.

---

## Phase 2: Read the JVM Deadlock Section

### Entry Criteria
- Dumps exist.

### Actions
1. Search: `grep -n "Found one Java-level deadlock\|Found [0-9]* Java-level deadlocks" /tmp/dump*.txt`.
2. If present, copy the block verbatim into `jvm_detected_deadlock`. It has the shape:
   ```
   "worker-2":
     waiting to lock monitor 0x00007f..., (object 0x000000071a2b, a com.shop.Account),
     which is held by "worker-1"
   "worker-1":
     waiting for ownable synchronizer 0x000000071c3d, (a java.util.concurrent.locks.ReentrantLock$NonfairSync),
     which is held by "worker-2"
   ```
   followed by `Java stack information for the threads listed above:`.
3. From the stack section, record for each thread the frame that acquired the held lock (`- locked <0x...> (a com.shop.Account)`) and the frame that waits (`- waiting to lock <0x...>` or `- parking to wait for <0x...>`). These are the two in-repo lines per thread.
4. Classify: monitor objects only gives `monitor-deadlock`; any `ReentrantLock` or `ReentrantReadWriteLock` gives `juc-lock-deadlock`.

### Output
JVM-detected deadlock block, or `none`.

### Quality Gate
- If the grep in step 1 matched, `jvm_detected_deadlock` is a verbatim copy (it can be found with `grep -F` in a dump).
- Each deadlocked thread has a lock-acquire frame and a lock-wait frame recorded.

---

## Phase 3: Hand-Build the Graph When the JVM Says Nothing

### Entry Criteria
- No JVM-detected deadlock, but threads are stuck in both dumps.

### Actions
1. List thread states: `grep -E "java.lang.Thread.State" /tmp/dump2.txt | sort | uniq -c`.
2. Use this table on the stuck threads:

| Pattern in stack | Classification |
|---|---|
| Many pool threads `WAITING (parking)` in `FutureTask.get` or `CompletableFuture.join`, all in the same pool that should run the awaited tasks | `pool-starvation`: tasks wait on tasks queued behind them in a bounded pool |
| Threads `BLOCKED (on object monitor)` waiting for a monitor whose holder is `RUNNABLE` in the same frame in both dumps | Holder is doing long work or I/O inside `synchronized` |
| `parking to wait for <0x...> (a ...ReentrantLock$NonfairSync)` with no thread listing that address under `Locked ownable synchronizers` | Lock never released: missing `unlock()` in a `finally` |
| Threads `RUNNABLE` with changing frames in a retry loop, no progress | `livelock` |
| Thread count much higher in dump 2 than dump 1, same creation pattern | `thread-leak` |
| Virtual thread pinned (carrier thread blocked inside `synchronized` or a native frame) | `virtual-thread-pinning` |

3. For pinning on Java 21 to 23, rerun with `-Djdk.tracePinnedThreads=full` to print the pinned stack. JDK 24 (JEP 491) removed most monitor pinning and that property; check your JDK release notes before using it.
4. Record `wait_for_graph` edges and the in-repo frames.

### Output
`java_thread_dump_report`.

### Quality Gate
- Every graph edge cites a lock address that appears in a dump.
- The classification matches one table row or the Phase 2 result.

---

## Worked Example

Illustrative only.

`jcmd -l` prints `48211 com.shop.TransferStressTest`. `jcmd 48211 Thread.print -l > /tmp/dump1.txt`; 10 seconds later `/tmp/dump2.txt`.

`grep -n "Found one Java-level deadlock" /tmp/dump2.txt` prints line 212. Block: `"pool-1-thread-2": waiting to lock monitor ... (a com.shop.Account), which is held by "pool-1-thread-1"` and the reverse. Stacks: thread-1 `- locked <0x71a2b> (a com.shop.Account)` at `TransferService.java:27` then `- waiting to lock <0x71a40>` at `TransferService.java:28`; thread-2 holds `0x71a40` at line 27 and waits for `0x71a2b` at line 28. Classification `monitor-deadlock`: `synchronized (from) { synchronized (to) { ... } }` with opposite argument order.

---

## Exit Criteria

DONE when two or more dumps with lock info are saved, the JVM deadlock section is copied or ruled absent, and the hang is classified with in-repo frames and graph edges.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `failure_class` is not a hang class | **Return**: emit classification `not-applicable`. |
| Phase 1 | `jcmd` fails with `AttachNotSupportedException` or permission error | **Adjust**: run `jcmd` as the same OS user as the JVM; in containers run it inside the container (`docker exec <id> jcmd <pid> Thread.print -l`). |
| Phase 1 | JVM started with `-XX:+DisableAttachMechanism` | **Adjust**: use `kill -3` and read the dump from stdout. |
| Phase 3 | No stuck threads in two dumps | **Return**: the hang is outside the JVM (database lock, external call); hand to the database isolation flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
