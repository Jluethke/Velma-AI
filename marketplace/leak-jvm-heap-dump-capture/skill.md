# JVM Class Histograms and Heap Dumps With jcmd

**One-line description:** Captures paired `jcmd GC.class_histogram` outputs and `jcmd GC.heap_dump` files from a running JVM at two load checkpoints, diffs the histograms to find classes whose live instance count grows per operation, and stores the dumps for dominator analysis.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `leak_brief` (object, required): From `leak-intake-load-recipe`. Host, container, and the JVM's PID or main class.
- `load_recipe` (object, required): From `leak-intake-load-recipe`.
- `cause_hypotheses` (object[], required): From `leak-classic-causes-triage`. Growing classes in the histogram diff are matched to these ids (for example a growing class stored in a C1 static map).

---

## Outputs

- `jvm_heap_dumps` (string[]): Paths to two `.hprof` files (checkpoint 1 and checkpoint 2) on a machine where Eclipse MAT can open them.
- `jvm_histograms` (object[]): Classes whose `#instances` and `#bytes` grew between the two histograms, with both values and growth per operation.

---

## Phase 1: Attach Safely

### Entry Criteria
- A JDK (not only a JRE) of the same major version as the target JVM is on the host: `jcmd -h` works.
- Free disk at the dump path at least as large as the current heap used (`jcmd <pid> GC.heap_info` prints it).

### Actions
1. List JVMs: `jcmd -l`. Pick the PID of the application main class.
2. Run `jcmd` as the same OS user as the target JVM. Attach uses a socket file in the JVM's temp directory; a different user, or a container with a separate `/tmp`, fails with "Unable to open socket file". In a container run it inside: `kubectl exec <pod> -- jcmd 1 GC.heap_info`. If the image has no JDK tools, use an ephemeral debug container that shares the process namespace (`kubectl debug -it <pod> --image=<jdk image> --target=<container>`).
3. Check which options your JDK supports before using them: `jcmd <pid> help GC.heap_dump` and `jcmd <pid> help GC.class_histogram`. Options such as `-all`, `-gz` and `-parallel` vary by JDK version.
4. For future crashes, confirm or add `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/` to the JVM options (needs a restart).

### Output
Verified attach and the option list for this JDK.

### Quality Gate
- `jcmd <pid> GC.heap_info` prints heap regions and used bytes.
- `jcmd <pid> help GC.heap_dump` output is saved.

---

## Phase 2: Histogram at Two Checkpoints

### Entry Criteria
- Attach works.

### Actions
1. Warm up with `load_recipe` to `warmup_ops`. Run `jcmd <pid> GC.class_histogram > histo1.txt`. Without `-all`, this triggers a full GC and counts only live objects. Note: the full GC pauses the application.
2. Run N operations. Run `jcmd <pid> GC.class_histogram > histo2.txt`.
3. Diff the two by class name. Columns are `num  #instances  #bytes  class name (module)`:
   `join -1 4 -2 4 <(awk 'NR>2 && NF>=4 {print $1,$2,$3,$4}' histo1.txt | sort -k4) <(awk 'NR>2 && NF>=4 {print $1,$2,$3,$4}' histo2.txt | sort -k4) | awk '{d=$7-$4; if (d>0) print d, $6-$3, $1}' | sort -rn | head -30`
   (Fields after join: class, num1, inst1, bytes1, num2, inst2, bytes2.)
4. Read the top rows. `[B` (byte arrays), `[C`, `java.lang.String`, `java.util.HashMap$Node`, `[Ljava.lang.Object;` are almost always contents of a leaking container, not the cause. Look for the first application class or framework class with growth close to a multiple of N.

### Output
`jvm_histograms`.

### Quality Gate
- `histo1.txt` and `histo2.txt` exist, and the top 30 diff lines are saved.
- At least one class with growth per operation is identified, or the result "no class grows" is recorded.

---

## Phase 3: Dump the Heap at Two Checkpoints

### Entry Criteria
- Histogram diff done.

### Actions
1. At the same two kinds of checkpoint (after another N operations if the process kept running), run:
   `jcmd <pid> GC.heap_dump /dumps/h1.hprof`, then after N more operations `jcmd <pid> GC.heap_dump /dumps/h2.hprof`.
   By default only live objects are dumped (a full GC runs first). The path is written on the target host, relative paths resolve against the JVM's working directory, and an existing file is not overwritten.
2. Each dump pauses the JVM for its whole duration. Take dumps from a test instance or a production instance already removed from the load balancer.
3. Copy dumps off the host: `kubectl cp <pod>:/dumps/h2.hprof ./h2.hprof`. Compress for transfer with `gzip`; MAT needs the uncompressed `.hprof` (or a gzip-compressed one if your MAT version supports it; check its release notes).
4. Heap dumps contain every string in memory, including tokens, passwords and personal data. Store them like production secrets and delete them when the hunt ends.

### Output
`jvm_heap_dumps`.

### Quality Gate
- `ls -la h1.hprof h2.hprof` shows two files on the analysis machine, and `h2.hprof` is larger than `h1.hprof`.

---

## Worked Example

Illustrative only.

Input: Spring Boot service, PID 1 in a pod, `load_recipe` 50/s.

Phase 1: `kubectl exec orders-6f7 -- jcmd 1 GC.heap_info` prints `garbage-first heap total 1048576K, used 412331K`. `help GC.heap_dump` lists `-all`, `-gz`.

Phase 2: histograms at 6,000 and 36,000 requests. Diff top lines:
```
29884224 30000 com.example.orders.QuoteResponse
24000000 30000 java.util.concurrent.ConcurrentHashMap$Node
15360000 60000 [B
```
`QuoteResponse` grows one per request.

Phase 3: `jcmd 1 GC.heap_dump /dumps/h1.hprof` (prints `Heap dump file created [438211043 bytes in 2.104 secs]`), then h2 after 30,000 more requests (`498877120 bytes`). Copied to the laptop.

---

## Exit Criteria

DONE when two histograms are diffed with growing classes recorded and two live-object heap dumps are on the analysis machine.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Unable to open socket file" or "AttachNotSupportedException" | **Adjust**: run as the JVM's user and in its container or PID namespace; check `-XX:+DisableAttachMechanism` is not set. |
| Phase 1 | Not enough disk for the dump | **Stop**: free space or mount a volume; a partial dump is unreadable. |
| Phase 2 | No class grows between histograms | **Return**: to `leak-managed-vs-native-split`; the growth is likely native (run `leak-jvm-native-memory-tracking`). |
| Phase 3 | Dump pause causes health-check failure and restart | **Adjust**: remove the instance from rotation and extend the liveness probe on the test instance before dumping. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
