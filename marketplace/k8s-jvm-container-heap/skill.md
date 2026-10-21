# JVM Heap, Native Memory and CPU Ergonomics for Container Limits

**One-line description:** Reads what the JVM detected from the container (memory limit, active processor count, chosen GC), measures non-heap memory with Native Memory Tracking, sets `-XX:MaxRAMPercentage` from that measurement instead of the 25 percent default, pins `-XX:ActiveProcessorCount` when there is no CPU limit, and adds OOM diagnostics on a writable path.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Project root (Dockerfile or Jib/buildpack config).
- `resourced_deployment` (string, required): Deployment path from `k8s-requests-limits-from-usage`.
- `usage_report` (object, required): Output of `k8s-resource-usage-measure`.

---

## Outputs

- `jvm_runtime_settings` (object): `java_version`, `detected_memory_limit`, `detected_processors`, `gc_before`, `max_heap_before_mib`, `non_heap_committed_peak_mib` (measured), `max_ram_percentage`, `active_processor_count` (or empty), `gc_after`, `java_tool_options`, `writable_paths`.

---

## Phase 1: Read the JVM's Container Detection

### Entry Criteria
- `stack` == `java`, a pod is running with the memory limit from `resourced_deployment`.

### Actions
1. Run inside the pod (a new JVM in the same container sees the same cgroup):
```bash
kubectl exec -n NS POD -- java -Xlog:os+container=info -version 2>&1 | grep -E "Memory Limit|CPU|Active"
kubectl exec -n NS POD -- java -XX:+PrintFlagsFinal -version 2>/dev/null | grep -E " (MaxHeapSize|MaxRAMPercentage|InitialRAMPercentage|UseContainerSupport|ActiveProcessorCount|UseSerialGC|UseG1GC|UseParallelGC|UseZGC) "
kubectl exec -n NS POD -- jcmd 1 VM.flags
```
   `jcmd 1 VM.flags` shows the flags of the RUNNING application (PID 1), including any from `JAVA_TOOL_OPTIONS`. If `jcmd` is missing (JRE-only or distroless image), use `kubectl debug` with a JDK image and `--target=<container>` and record it.
2. Record: memory limit seen, processor count, GC in use (the flag printed `true`), `MaxHeapSize` in MiB (bytes / 1048576).
3. Know the defaults you are reading:
   - `UseContainerSupport` is on by default since JDK 10 and 8u191.
   - `MaxRAMPercentage` defaults to 25.0, so the heap is a quarter of the container limit.
   - Since JDK 19 (backported to 17.0.5 and 11.0.17) the JVM ignores CPU shares (requests) and uses only the CPU limit (quota) to size processor count; with no CPU limit it sees every node CPU.
   - JVM ergonomics selects SerialGC when the machine is not "server class" (fewer than 2 processors or less than about 1792 MB of memory); check which GC printed `true`.

### Output
Detection results.

### Quality Gate
- Every value is copied from the command output.

---

## Phase 2: Measure Non-Heap Memory with NMT

### Entry Criteria
- A non-production namespace where the Deployment can be restarted with extra flags.

### Actions
1. Add `-XX:NativeMemoryTracking=summary` to `JAVA_TOOL_OPTIONS` in the test namespace only (NMT adds overhead; do not ship it to production by default).
2. Drive representative load, then: `kubectl exec -n NS POD -- jcmd 1 VM.native_memory summary`.
3. Read the `committed=` value of each category: `Java Heap`, `Class` (metaspace), `Thread` (stacks; count of threads times `-Xss`, default 1 MiB reserved on Linux x64), `Code` (code cache), `GC`, `Internal`, `Other` (direct ByteBuffers), `Symbol`, `Arena Chunk`.
4. `non_heap_committed_peak_mib` = Total committed minus Java Heap committed, at the highest observed point. Also compare total committed with `container_memory_working_set_bytes` from `usage_report`; the working set can exceed NMT total by memory NMT does not track (native libraries using malloc outside the JVM, such as some JNI code). Record that difference too and add it to non-heap.
5. Remove the NMT flag afterwards.

### Output
`non_heap_committed_peak_mib`.

### Quality Gate
- The NMT summary output is saved, and the arithmetic for non-heap is written out.

---

## Phase 3: Compute and Apply Settings

### Entry Criteria
- Non-heap measured.

### Actions
1. `max_ram_percentage = floor(100 * (memory_limit_mib - non_heap_committed_peak_mib) / memory_limit_mib)`, written as a decimal flag value, for example `-XX:MaxRAMPercentage=72.0`. If the result gives a heap smaller than the live heap the app needs (GC logs or `jcmd 1 GC.heap_info` after a full GC), **Return** to `k8s-requests-limits-from-usage`.
2. Set `-XX:InitialRAMPercentage` equal to MaxRAMPercentage only if startup heap growth pauses are measured as a problem; otherwise leave the default and record that.
3. Processors:

| CPU limit | Action |
|---|---|
| Set | JVM uses it; no flag |
| Not set | Add `-XX:ActiveProcessorCount=<ceil(requests.cpu)>` so GC threads and the ForkJoin common pool match the request instead of every node CPU |

4. GC: if Phase 1 showed SerialGC and the service is latency-sensitive, set the GC explicitly (`-XX:+UseG1GC`) and record the reason; otherwise keep ergonomics and record what it chose.
5. OOM behavior: add `-XX:+ExitOnOutOfMemoryError` (the JVM exits on the first `OutOfMemoryError` so Kubernetes restarts it instead of leaving a half-working process) and `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps`. `/dumps` needs an `emptyDir` with a `sizeLimit` at least the max heap size; add it to `writable_paths`. Also add `/tmp` (JVM perf data and framework temp directories).
6. Put all flags in `JAVA_TOOL_OPTIONS` in the Deployment `env`. The JVM prints `Picked up JAVA_TOOL_OPTIONS: ...` to stderr at start, which proves they applied. Do not also put `-Xmx` anywhere: an explicit `-Xmx` overrides MaxRAMPercentage.
7. Roll out to the test namespace and re-run Phase 1 command 1; `MaxHeapSize` must match the computed percentage of the limit.

### Output
`jvm_runtime_settings`.

### Quality Gate
- `kubectl logs -n NS POD | grep "Picked up JAVA_TOOL_OPTIONS"` prints the flags.
- `grep -rn -- "-Xmx" Dockerfile deployment.yaml` prints nothing.
- After a load test, the pod has 0 restarts and `Reason: OOMKilled` does not appear in `kubectl describe pod`.

---

## Worked Example

Illustrative only. Spring Boot on JDK 21, memory limit `1Gi`, CPU request `1`, no CPU limit, node with 16 CPUs.

Phase 1:
```
[0.003s][info][os,container] Memory Limit is: 1073741824
   size_t MaxHeapSize      = 268435456   {product} {ergonomic}
   double MaxRAMPercentage = 25.000000   {product} {default}
     bool UseG1GC          = true        {product} {ergonomic}
```
Heap 256 MiB, processors seen 16.

Phase 2 NMT under load: Total committed 731 MiB, Java Heap committed 256 MiB, so non-heap 475 MiB; working set exceeded NMT total by 12 MiB, so non-heap 487 MiB.

Phase 3: `floor(100 * (1024 - 487) / 1024) = 52`, so `-XX:MaxRAMPercentage=52.0` (heap about 532 MiB). No CPU limit, so `-XX:ActiveProcessorCount=1`; ergonomics then picks SerialGC, the service is latency-sensitive, so `-XX:+UseG1GC` is set explicitly.
```
JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=52.0 -XX:ActiveProcessorCount=1 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps
```

---

## Exit Criteria

DONE when the heap percentage is derived from measured non-heap memory, processor count matches the CPU allotment, OOM diagnostics write to a mounted path, and the running JVM confirms the flags.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Memory Limit is: Unlimited` | **Return**: no memory limit in the pod; finish `k8s-requests-limits-from-usage`. |
| Phase 1 | `jcmd` not in image | **Adjust**: `kubectl debug -it POD --image=eclipse-temurin:<same major>-jdk --target=<container>` and run `jcmd` there. |
| Phase 2 | Non-heap larger than half the limit | **Adjust**: look at the largest NMT category (often Thread from a huge pool, or direct buffers) before raising the limit. |
| Phase 3 | `-Xmx` set by a base image or start script | **Adjust**: remove it so MaxRAMPercentage applies; record the file changed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
